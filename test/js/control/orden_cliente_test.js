import * as chai from "../lib/chai/index.js";
import sinon from "../lib/sinon/sinon-esm.js";
import OrdenCliente from "../../../src/js/control/orden_cliente.js";
import DefaultResponse from "../../../src/js/entity/default_response.js";
import DefaultError from "../../../src/js/entity/default_error.js";
import { esperarRechazo } from "./pruebas_comunes.js";

function respuesta(datos) {
    let r = new DefaultResponse();
    r.datos = datos;
    return r;
}

const AMERICANO = { idProducto: "p1", nombre: "Café Americano", precioSugerido: 3.5 };
const LATTE = { idProducto: "p2", nombre: "Caffe Latte", precioSugerido: 5 };

suite("OrdenCliente", function () {
    let ordenService;
    let ordenProductoService;
    let meseroVirtual;
    let ordenCliente;

    setup(function () {
        ordenService = { create: sinon.stub().resolves(respuesta({ idOrden: "o1" })) };
        ordenProductoService = { create: sinon.stub().callsFake(registro => Promise.resolve(respuesta(registro))) };
        meseroVirtual = { obtenerIdEmpleadoRol: sinon.stub().resolves("er-mesero") };
        ordenCliente = new OrdenCliente(ordenService, ordenProductoService, meseroVirtual);
    });

    test("deberia crear la orden asignada al mesero virtual", async function () {
        let resultado = await ordenCliente.crear("Marta", [{ producto: AMERICANO, cantidad: 1 }]);
        chai.expect(ordenService.create.calledOnceWith({ idEmpleadoRol: { idEmpleadoRol: "er-mesero" } })).to.equal(true);
        chai.expect(resultado.orden.idOrden).to.equal("o1");
    });

    test("deberia crear un producto de orden por cada unidad con el nombre del cliente", async function () {
        let resultado = await ordenCliente.crear("  Marta ", [
            { producto: AMERICANO, cantidad: 2 },
            { producto: LATTE, cantidad: 1 }
        ]);
        chai.expect(ordenProductoService.create.callCount).to.equal(3);
        chai.expect(ordenProductoService.create.firstCall.args[0]).to.deep.equal({
            idOrden: { idOrden: "o1" },
            idProducto: { idProducto: "p1" },
            precio: 3.5,
            observaciones: "Marta"
        });
        chai.expect(resultado.detalles).to.have.lengthOf(3);
    });

    test("sin nombre del cliente no deberia crear nada", async function () {
        let err = await esperarRechazo(ordenCliente.crear(" ", [{ producto: AMERICANO, cantidad: 1 }]));
        chai.expect(err.mensaje).to.contain("nombre");
        chai.expect(ordenService.create.called).to.equal(false);
    });

    test("sin productos no deberia crear nada", async function () {
        let err = await esperarRechazo(ordenCliente.crear("Marta", []));
        chai.expect(err.mensaje).to.contain("al menos un producto");
        chai.expect(ordenService.create.called).to.equal(false);
    });

    test("si no hay mesero virtual deberia rechazar sin crear la orden", async function () {
        let sinMesero = new DefaultError();
        sinMesero.mensaje = "No está configurado el mesero virtual";
        meseroVirtual.obtenerIdEmpleadoRol.rejects(sinMesero);
        let err = await esperarRechazo(ordenCliente.crear("Marta", [{ producto: AMERICANO, cantidad: 1 }]));
        chai.expect(err.mensaje).to.contain("mesero virtual");
        chai.expect(ordenService.create.called).to.equal(false);
    });

    test("si el servidor rechaza un producto deberia pasar el error", async function () {
        let rechazo = new DefaultError();
        rechazo.mensaje = "El producto no está activo.";
        rechazo.estado = 422;
        ordenProductoService.create.rejects(rechazo);
        let err = await esperarRechazo(ordenCliente.crear("Marta", [{ producto: AMERICANO, cantidad: 1 }]));
        chai.expect(err.mensaje).to.equal("El producto no está activo.");
    });
});