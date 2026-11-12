import * as chai from "../lib/chai/index.js";
import sinon from "../lib/sinon/sinon-esm.js";
import Cobro, { aCentavos, deCentavos, calcularResumen, prepararPagos, clienteDeOrden } from "../../../src/js/control/cobro.js";
import DefaultResponse from "../../../src/js/entity/default_response.js";
import { esperarRechazo } from "./pruebas_comunes.js";

function respuesta(datos) {
    let r = new DefaultResponse();
    r.datos = datos;
    return r;
}

const P1 = { idOrdenProducto: "op1", precio: 3.5, observaciones: "Cliente: Ana", idProducto: { nombre: "Cafe Americano" } };
const P2 = { idOrdenProducto: "op2", precio: 5, observaciones: "", idProducto: { nombre: "Caffe Latte" } };

suite("cobro: calculos", function () {
    test("aCentavos y deCentavos deberian evitar errores de decimales", function () {
        chai.expect(aCentavos(0.1) + aCentavos(0.2)).to.equal(30);
        chai.expect(aCentavos("3.50")).to.equal(350);
        chai.expect(deCentavos(850)).to.equal(8.5);
    });

    test("calcularResumen deberia restar lo pagado y mostrar el cambio del efectivo", function () {
        let r = calcularResumen(850, 0, [{ tipoPago: "TARJETA", monto: 500 }, { tipoPago: "EFECTIVO", monto: 1000 }]);
        chai.expect(r.saldo).to.equal(0);
        chai.expect(r.pagado).to.equal(850);
        chai.expect(r.cambio).to.equal(650);
    });

    test("calcularResumen deberia contar los montos que ya estaban registrados", function () {
        let r = calcularResumen(850, 300, []);
        chai.expect(r.saldo).to.equal(550);
    });

    test("prepararPagos deberia registrar el efectivo solo hasta el saldo y devolver el cambio", function () {
        let { registrar, cambio } = prepararPagos(850, [{ tipoPago: "EFECTIVO", monto: 1000 }]);
        chai.expect(registrar).to.deep.equal([{ tipoPago: "EFECTIVO", monto: 850 }]);
        chai.expect(cambio).to.equal(150);
    });

    test("prepararPagos deberia rechazar una tarjeta mayor que el saldo", function () {
        chai.expect(() => prepararPagos(850, [{ tipoPago: "TARJETA", monto: 900 }])).to.throw();
    });

    test("clienteDeOrden deberia tomar el nombre de las observaciones sin el prefijo", function () {
        chai.expect(clienteDeOrden([P2, P1])).to.equal("Ana");
        chai.expect(clienteDeOrden([{ observaciones: "Luis" }])).to.equal("Luis");
        chai.expect(clienteDeOrden([P2])).to.equal("");
    });
});

suite("Cobro: cargarOrden y cobrar", function () {
    let facturaService, fopService, pagoService, detalleService, cobro;

    setup(function () {
        facturaService = { findRange: sinon.stub().resolves(respuesta([])), create: sinon.stub(), update: sinon.stub() };
        fopService = { findDisponibles: sinon.stub(), findByFactura: sinon.stub(), create: sinon.stub().resolves(respuesta({})) };
        pagoService = { findRange: sinon.stub().resolves(respuesta([])), create: sinon.stub(), update: sinon.stub() };
        detalleService = { findByPago: sinon.stub().resolves(respuesta([])), create: sinon.stub() };
        cobro = new Cobro(facturaService, fopService, pagoService, detalleService);

        facturaService.create.resolves(respuesta({ idFactura: "f1", cliente: "Ana", estado: "PENDIENTE" }));
        pagoService.create.resolves(respuesta({ idPago: "p1", estado: "PENDIENTE", observaciones: "" }));
        pagoService.update.resolves(respuesta({ idPago: "p1", estado: "COMPLETADO" }));
        detalleService.create.callsFake(d => Promise.resolve(respuesta({ ...d.idPago, ...d })));
    });

    test("cargarOrden de una orden nueva deberia dejar todos los productos por facturar", async function () {
        fopService.findDisponibles.resolves(respuesta([P1, P2]));
        let estado = await cobro.cargarOrden([P1, P2]);
        chai.expect(estado.porFacturar).to.have.lengthOf(2);
        chai.expect(estado.factura).to.equal(null);
        chai.expect(estado.total).to.equal(850);
    });

    test("cargarOrden deberia retomar una factura PENDIENTE de un intento anterior", async function () {
        fopService.findDisponibles.resolves(respuesta([P2]));
        facturaService.findRange.resolves(respuesta([
            { idFactura: "f-pagada", estado: "PAGADA" },
            { idFactura: "f-pend", estado: "PENDIENTE", cliente: "Ana" }
        ]));
        fopService.findByFactura.withArgs("f-pend").resolves(respuesta([{ idOrdenProducto: { idOrdenProducto: "op1" } }]));
        pagoService.findRange.resolves(respuesta([{ idPago: "p-viejo", estado: "PENDIENTE", idFactura: { idFactura: "f-pend" } }]));
        detalleService.findByPago.resolves(respuesta([{ monto: 2 }]));

        let estado = await cobro.cargarOrden([P1, P2]);
        chai.expect(estado.factura.idFactura).to.equal("f-pend");
        chai.expect(estado.enFactura.map(p => p.idOrdenProducto)).to.deep.equal(["op1"]);
        chai.expect(estado.porFacturar.map(p => p.idOrdenProducto)).to.deep.equal(["op2"]);
        chai.expect(estado.pago.idPago).to.equal("p-viejo");
        chai.expect(estado.yaPagado).to.equal(200);
        chai.expect(estado.total).to.equal(850);
    });

    test("cobrar deberia crear factura, productos facturados, pago, detalles y completar el pago, en ese orden", async function () {
        fopService.findDisponibles.resolves(respuesta([P1, P2]));
        let estado = await cobro.cargarOrden([P1, P2]);
        let resultado = await cobro.cobrar(estado, {
            cliente: "Ana", idCaja: "c1", idEmpleadoRol: "er-cajero",
            pagos: [{ tipoPago: "TARJETA", monto: 500, referenciaExterna: "A123" }, { tipoPago: "EFECTIVO", monto: 500, referenciaExterna: "" }]
        });

        let factura = facturaService.create.firstCall.args[0];
        chai.expect(factura.idCaja).to.deep.equal({ idCaja: "c1" });
        chai.expect(factura.idEmpleadoRol).to.deep.equal({ idEmpleadoRol: "er-cajero" });
        chai.expect(fopService.create.callCount).to.equal(2);
        chai.expect(fopService.create.firstCall.args[0].idFactura).to.deep.equal({ idFactura: "f1" });
        chai.expect(detalleService.create.callCount).to.equal(2);
        chai.expect(detalleService.create.secondCall.args[0].monto).to.equal(3.5);
        chai.expect(pagoService.update.firstCall.args[1].estado).to.equal("COMPLETADO");
        sinon.assert.callOrder(facturaService.create, fopService.create, pagoService.create, detalleService.create, pagoService.update);
        chai.expect(resultado.cambio).to.equal(150);
    });

    test("cobrar deberia negarse si los pagos no cubren el saldo, sin crear nada", async function () {
        fopService.findDisponibles.resolves(respuesta([P1, P2]));
        let estado = await cobro.cargarOrden([P1, P2]);
        let err = await esperarRechazo(cobro.cobrar(estado, { cliente: "", idCaja: "c1", idEmpleadoRol: "e", pagos: [{ tipoPago: "EFECTIVO", monto: 100 }] }));
        chai.expect(err.mensaje).to.contain("saldo");
        chai.expect(facturaService.create.called).to.equal(false);
    });

    test("cobrar al retomar deberia usar la factura y el pago existentes", async function () {
        let estado = {
            porFacturar: [], enFactura: [P1], yaPagados: [], total: 350, yaPagado: 0,
            factura: { idFactura: "f-pend", cliente: "Ana" }, pago: { idPago: "p-viejo", observaciones: "" }, detallesPrevios: []
        };
        await cobro.cobrar(estado, { cliente: "Ana", idCaja: "c1", idEmpleadoRol: "e", pagos: [{ tipoPago: "EFECTIVO", monto: 350 }] });
        chai.expect(facturaService.create.called).to.equal(false);
        chai.expect(pagoService.create.called).to.equal(false);
        chai.expect(detalleService.create.firstCall.args[0].idPago).to.deep.equal({ idPago: "p-viejo" });
        chai.expect(pagoService.update.firstCall.args[0]).to.equal("p-viejo");
    });
});
