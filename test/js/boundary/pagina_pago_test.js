import * as chai from "../lib/chai/index.js";
import sinon from "../lib/sinon/sinon-esm.js";
import "../../../src/js/boundary/pagina_pago.js";
import { Sesion } from "../../../src/js/control/sesion.js";
import DefaultError from "../../../src/js/entity/default_error.js";
import { montar, limpiar, esperar, respuesta } from "./utilidades.js";

const PRODUCTOS = [
    { idOrdenProducto: "op1", precio: 3.5, observaciones: "Cliente: Ana", idProducto: { nombre: "Cafe Americano" } },
    { idOrdenProducto: "op2", precio: 5, observaciones: "", idProducto: { nombre: "Caffe Latte" } }
];
const SELECCION = { orden: { idOrden: "o1" }, productos: PRODUCTOS, total: 850, cliente: "Ana" };
const ESTADO_NUEVO = { porFacturar: PRODUCTOS, enFactura: [], yaPagados: [], factura: null, pago: null, detallesPrevios: [], total: 850, yaPagado: 0 };

function sesionCajero() {
    let s = new Sesion(null, new EventTarget());
    s.iniciar({ empleado: { nombre: "Carlos", apellido: "Montano" }, rol: { nombre: "Cajero" }, idEmpleadoRol: "er-cajero" });
    return s;
}

/** Simula que el cajero eligio la orden en la lista. */
function elegir(pagina) {
    let lista = pagina.shadowRoot.querySelector("lista-ordenes-pendientes");
    lista.dispatchEvent(new CustomEvent("cafefe:orden-seleccionada", { detail: SELECCION, bubbles: true, composed: true }));
}

function pagarEnEfectivo(pagina, monto) {
    let formulario = pagina.shadowRoot.querySelector("formulario-pago");
    formulario.shadowRoot.querySelector("#monto").value = monto;
    formulario.shadowRoot.querySelector("form").requestSubmit();
}

suite("<pagina-pago> (HU4)", function () {
    let cobro, cajaService, stubFetch;

    setup(function () {
        // la lista interna pide las ordenes pendientes: se responde vacio
        stubFetch = sinon.stub(window, "fetch").callsFake(() => Promise.resolve(new Response("[]", { status: 200 })));
        cajaService = { findRange: sinon.stub().resolves(respuesta([{ idCaja: "c1", nombre: "caja1", activo: true }])) };
        cobro = { cargarOrden: sinon.stub().resolves(ESTADO_NUEVO), cobrar: sinon.stub() };
    });

    teardown(function () {
        limpiar();
        stubFetch.restore();
    });

    function montarPagina() {
        return montar("pagina-pago", { sesion: sesionCajero(), cajaService, cobro });
    }

    test("deberia saludar al cajero y cargar las cajas activas", async function () {
        let pagina = montarPagina();
        await esperar();
        chai.expect(pagina.shadowRoot.querySelector("h1").textContent).to.contain("Carlos");
        chai.expect(pagina.shadowRoot.querySelector("#caja").value).to.equal("c1");
    });

    test("al elegir una orden deberia mostrar sus productos, el cliente y el boton deshabilitado con el saldo", async function () {
        let pagina = montarPagina();
        await esperar();
        elegir(pagina);
        await esperar();
        let raiz = pagina.shadowRoot;
        chai.expect(raiz.querySelector("detalle-orden").shadowRoot.textContent).to.contain("Caffe Latte").and.contain("$8.50");
        chai.expect(raiz.querySelector("#cliente").value).to.equal("Ana");
        chai.expect(raiz.querySelector("#cobrar").disabled).to.equal(true);
        chai.expect(raiz.querySelector("#cobrar").textContent).to.contain("Falta $8.50");
    });

    test("cuando los pagos cubren el total deberia habilitar Cobrar", async function () {
        let pagina = montarPagina();
        await esperar();
        elegir(pagina);
        await esperar();
        pagarEnEfectivo(pagina, "10");
        let boton = pagina.shadowRoot.querySelector("#cobrar");
        chai.expect(boton.disabled).to.equal(false);
        chai.expect(boton.textContent).to.contain("Cobrar $8.50");
    });

    test("Cobrar deberia enviar caja, cajero, cliente y pagos, y mostrar el ticket", async function () {
        cobro.cobrar.resolves({
            factura: { idFactura: "f1234567-aaaa", cliente: "Ana" }, pago: {},
            detalles: [{ tipoPago: "EFECTIVO", monto: 8.5 }], cambio: 150
        });
        let pagina = montarPagina();
        await esperar();
        elegir(pagina);
        await esperar();
        pagarEnEfectivo(pagina, "10");
        pagina.shadowRoot.querySelector("#cobrar").click();
        await esperar();

        let datos = cobro.cobrar.firstCall.args[1];
        chai.expect(datos.idCaja).to.equal("c1");
        chai.expect(datos.idEmpleadoRol).to.equal("er-cajero");
        chai.expect(datos.cliente).to.equal("Ana");
        chai.expect(datos.pagos[0].monto).to.equal(1000);
        let ticket = pagina.shadowRoot.querySelector("ticket-factura");
        chai.expect(ticket).to.not.equal(null);
        chai.expect(ticket.shadowRoot.textContent).to.contain("Carlos Montano").and.contain("Cambio");
    });

    test("si el backend rechaza el cobro deberia mostrar el mensaje y permitir intentarlo de nuevo", async function () {
        let error = new DefaultError();
        error.mensaje = "El monto supera lo que falta por pagar ($8.50).";
        cobro.cobrar.rejects(error);
        let pagina = montarPagina();
        await esperar();
        elegir(pagina);
        await esperar();
        pagarEnEfectivo(pagina, "8.50");
        pagina.shadowRoot.querySelector("#cobrar").click();
        await esperar();
        chai.expect(pagina.shadowRoot.querySelector("#error-cobro").textContent).to.contain("supera");
        chai.expect(pagina.shadowRoot.querySelector("#cobrar").disabled).to.equal(false);
    });

    test("sin cajas activas deberia avisar y no dejar cobrar", async function () {
        cajaService.findRange.resolves(respuesta([]));
        let pagina = montarPagina();
        await esperar();
        elegir(pagina);
        await esperar();
        pagarEnEfectivo(pagina, "8.50");
        chai.expect(pagina.shadowRoot.querySelector("#error-caja").textContent).to.contain("No hay cajas");
        chai.expect(pagina.shadowRoot.querySelector("#cobrar").disabled).to.equal(true);
    });

    test("una orden que ya tenia factura pendiente deberia avisar que se continua con ella", async function () {
        cobro.cargarOrden.resolves({ ...ESTADO_NUEVO, factura: { idFactura: "f-pend", cliente: "Consumidor final" } });
        let pagina = montarPagina();
        await esperar();
        elegir(pagina);
        await esperar();
        chai.expect(pagina.shadowRoot.querySelector("#panel").textContent).to.contain("ya tenía una factura pendiente");
    });
});
