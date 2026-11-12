import * as chai from "../lib/chai/index.js";
import sinon from "../lib/sinon/sinon-esm.js";
import "../../../src/js/boundary/lista_ordenes_pendientes.js";
import DefaultError from "../../../src/js/entity/default_error.js";
import { montar, limpiar, esperar, respuesta } from "./utilidades.js";

const ORDENES = [
    { idOrden: "o1", fechaCreacion: "2026-11-12T15:00:00.000Z" },
    { idOrden: "o2", fechaCreacion: "2026-11-12T16:00:00.000Z" }
];

suite("<lista-ordenes-pendientes>", function () {
    let ordenService, ordenProductoService;

    setup(function () {
        ordenService = { findPendientes: sinon.stub().resolves(respuesta(ORDENES)) };
        ordenProductoService = { findByOrden: sinon.stub() };
        ordenProductoService.findByOrden.withArgs("o1").resolves(respuesta([
            { idOrdenProducto: "a", precio: 3.5, observaciones: "Cliente: Ana" }, { idOrdenProducto: "b", precio: 5, observaciones: "" }]));
        ordenProductoService.findByOrden.withArgs("o2").resolves(respuesta([{ idOrdenProducto: "c", precio: 2, observaciones: "" }]));
    });

    teardown(limpiar);

    test("deberia mostrar cada orden pendiente con cliente, cantidad de productos y total", async function () {
        let lista = montar("lista-ordenes-pendientes", { ordenService, ordenProductoService });
        await esperar();
        let botones = lista.shadowRoot.querySelectorAll(".orden");
        chai.expect(botones).to.have.lengthOf(2);
        chai.expect(botones[0].textContent).to.contain("Ana").and.contain("$8.50").and.contain("2 productos");
        chai.expect(botones[1].textContent).to.contain("Cliente sin nombre").and.contain("1 producto");
    });

    test("al elegir una orden deberia marcarla y avisar con sus productos y total", async function () {
        let lista = montar("lista-ordenes-pendientes", { ordenService, ordenProductoService });
        await esperar();
        let elegida = null;
        lista.addEventListener("cafefe:orden-seleccionada", e => { elegida = e.detail; });
        lista.shadowRoot.querySelector('[data-id="o1"]').click();
        chai.expect(elegida.total).to.equal(850);
        chai.expect(elegida.productos).to.have.lengthOf(2);
        chai.expect(lista.shadowRoot.querySelector('[data-id="o1"]').getAttribute("aria-pressed")).to.equal("true");
    });

    test("sin ordenes pendientes deberia decirlo", async function () {
        ordenService.findPendientes.resolves(respuesta([]));
        let lista = montar("lista-ordenes-pendientes", { ordenService, ordenProductoService });
        await esperar();
        chai.expect(lista.shadowRoot.textContent).to.contain("No hay órdenes pendientes");
    });

    test("sin conexion con el servidor deberia explicarlo", async function () {
        let error = new DefaultError();
        error.estado = 0;
        ordenService.findPendientes.rejects(error);
        let lista = montar("lista-ordenes-pendientes", { ordenService, ordenProductoService });
        await esperar();
        chai.expect(lista.shadowRoot.querySelector("#error").textContent).to.contain("no hay conexión");
    });
});
