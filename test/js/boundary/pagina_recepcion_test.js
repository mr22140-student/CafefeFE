import * as chai from "../lib/chai/index.js";
import sinon from "../lib/sinon/sinon-esm.js";
import "../../../src/js/boundary/pagina_recepcion.js";
import { Sesion } from "../../../src/js/control/sesion.js";
import { montar, limpiar, esperar } from "./utilidades.js";

const PRODUCTOS = [
    { idOrdenProducto: "op1", precio: 3.5, observaciones: "Ana", idProducto: { idProducto: "p1", nombre: "Café Americano" } },
    { idOrdenProducto: "op2", precio: 3.5, observaciones: "Ana", idProducto: { idProducto: "p1", nombre: "Café Americano" } },
    { idOrdenProducto: "op3", precio: 5, observaciones: "Ana", idProducto: { idProducto: "p2", nombre: "Caffe Latte" } }
];
const SELECCION = { orden: { idOrden: "abcdef12-3456" }, productos: PRODUCTOS, total: 1200, cliente: "Ana" };

function sesionBarista() {
    let s = new Sesion(null, new EventTarget());
    s.iniciar({ empleado: { nombre: "Luis", apellido: "Pérez" }, rol: { nombre: "Barista" }, idEmpleadoRol: "er-barista" });
    return s;
}

/** Simula que el barista eligio la orden en la lista. */
function elegir(pagina, seleccion = SELECCION) {
    let lista = pagina.shadowRoot.querySelector("lista-ordenes-pendientes");
    lista.dispatchEvent(new CustomEvent("cafefe:orden-seleccionada", { detail: seleccion, bubbles: true, composed: true }));
}

suite("<pagina-recepcion> (HU3)", function () {
    let stubFetch;

    setup(function () {
        // la lista interna pide las ordenes pendientes: se responde vacio
        stubFetch = sinon.stub(window, "fetch").callsFake(() => Promise.resolve(new Response("[]", { status: 200 })));
    });

    teardown(function () {
        limpiar();
        stubFetch.restore();
    });

    test("deberia saludar con el rol y el nombre y pedir que elija una orden", async function () {
        let pagina = montar("pagina-recepcion", { sesion: sesionBarista() });
        await esperar();
        chai.expect(pagina.shadowRoot.querySelector("h1").textContent).to.contain("Barista Luis");
        chai.expect(pagina.shadowRoot.querySelector("#panel").textContent).to.contain("Seleccione una orden");
    });

    test("al elegir una orden deberia mostrar el cliente y los productos agrupados", async function () {
        let pagina = montar("pagina-recepcion", { sesion: sesionBarista() });
        await esperar();
        elegir(pagina);
        let panel = pagina.shadowRoot.querySelector("#panel");
        chai.expect(panel.querySelector("h2").textContent).to.contain("Ana");
        chai.expect(panel.textContent).to.contain("Orden #ABCDEF12");
        let filas = [...panel.querySelectorAll(".productos li")].map(li => [...li.children].map(s => s.textContent).join(" "));
        chai.expect(filas).to.deep.equal(["2 × Café Americano", "1 × Caffe Latte"]);
        chai.expect(panel.querySelector("#estado").textContent).to.equal("Nueva");
    });

    test("empezar a preparar deberia cambiar el estado y avisar con un evento", async function () {
        let pagina = montar("pagina-recepcion", { sesion: sesionBarista() });
        await esperar();
        let aviso = null;
        pagina.addEventListener("cafefe:estado-orden", e => { aviso = e.detail; });
        elegir(pagina);
        pagina.shadowRoot.querySelector("#avanzar").click();
        chai.expect(pagina.shadowRoot.querySelector("#estado").textContent).to.equal("En preparación");
        chai.expect(pagina.shadowRoot.querySelector("#avanzar").textContent).to.equal("Marcar como lista");
        chai.expect(aviso).to.deep.equal({ idOrden: "abcdef12-3456", estado: "PREPARANDO" });
    });

    test("al marcarla como lista deberia pedir que llamen al cliente", async function () {
        let pagina = montar("pagina-recepcion", { sesion: sesionBarista() });
        await esperar();
        elegir(pagina);
        pagina.shadowRoot.querySelector("#avanzar").click();
        pagina.shadowRoot.querySelector("#avanzar").click();
        chai.expect(pagina.shadowRoot.querySelector("#estado").textContent).to.equal("Lista para entregar");
        chai.expect(pagina.shadowRoot.querySelector("#aviso").textContent).to.contain("Llame a Ana");
        chai.expect(pagina.shadowRoot.querySelector("#avanzar")).to.equal(null);
    });

    test("deberia recordar el estado de cada orden al cambiar de una a otra", async function () {
        let pagina = montar("pagina-recepcion", { sesion: sesionBarista() });
        await esperar();
        elegir(pagina);
        pagina.shadowRoot.querySelector("#avanzar").click();
        elegir(pagina, { orden: { idOrden: "o2" }, productos: PRODUCTOS, total: 1200, cliente: "Beto" });
        chai.expect(pagina.shadowRoot.querySelector("#estado").textContent).to.equal("Nueva");
        elegir(pagina);
        chai.expect(pagina.shadowRoot.querySelector("#estado").textContent).to.equal("En preparación");
    });
});