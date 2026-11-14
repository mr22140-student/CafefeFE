import * as chai from "../lib/chai/index.js";
import sinon from "../lib/sinon/sinon-esm.js";
import "../../../src/js/boundary/pagina_recepcion.js";
import { Sesion } from "../../../src/js/control/sesion.js";
import DefaultError from "../../../src/js/entity/default_error.js";
import { montar, limpiar, esperar, respuesta } from "./utilidades.js";

const PRODUCTOS = [
    { idOrdenProducto: "op1", precio: 3.5, observaciones: "Cliente: Ana", idProducto: { idProducto: "p1", nombre: "Café Americano" } },
    { idOrdenProducto: "op2", precio: 3.5, observaciones: "Cliente: Ana", idProducto: { idProducto: "p1", nombre: "Café Americano" } },
    { idOrdenProducto: "op3", precio: 5, observaciones: "Cliente: Ana", idProducto: { idProducto: "p2", nombre: "Caffe Latte" } }
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

function conEstado(estado, idOrden = "abcdef12-3456") {
    return respuesta({ idOrden, estado });
}

suite("<pagina-recepcion> (HU3)", function () {
    let stubFetch, ordenService;

    setup(function () {
        // la lista interna pide las ordenes pendientes: se responde vacio
        stubFetch = sinon.stub(window, "fetch").callsFake(() => Promise.resolve(new Response("[]", { status: 200 })));
        ordenService = {
            findEstado: sinon.stub().resolves(conEstado("RECIBIDA")),
            cambiarEstado: sinon.stub().callsFake((id, estado) => Promise.resolve(conEstado(estado, id)))
        };
    });

    teardown(function () {
        limpiar();
        stubFetch.restore();
    });

    async function montarPagina() {
        let pagina = montar("pagina-recepcion", { sesion: sesionBarista(), ordenService });
        await esperar();
        return pagina;
    }

    function texto(pagina, selector) {
        return pagina.shadowRoot.querySelector(selector).textContent.trim();
    }

    test("deberia saludar con el rol y el nombre y pedir que elija una orden", async function () {
        let pagina = await montarPagina();
        chai.expect(texto(pagina, "h1")).to.contain("Barista Luis");
        chai.expect(texto(pagina, "#panel")).to.contain("Seleccione una orden");
    });

    test("al elegir una orden deberia mostrar el cliente, los productos agrupados y su estado", async function () {
        ordenService.findEstado.resolves(conEstado("PREPARANDO"));
        let pagina = await montarPagina();
        elegir(pagina);
        await esperar();
        let panel = pagina.shadowRoot.querySelector("#panel");
        chai.expect(panel.querySelector("h2").textContent).to.contain("Ana");
        chai.expect(panel.textContent).to.contain("Orden #ABCDEF12");
        let filas = [...panel.querySelectorAll(".productos li")].map(li => [...li.children].map(s => s.textContent).join(" "));
        chai.expect(filas).to.deep.equal(["2 × Café Americano", "1 × Caffe Latte"]);
        chai.expect(ordenService.findEstado.calledWith("abcdef12-3456")).to.equal(true);
        chai.expect(texto(pagina, "#estado")).to.equal("En preparación");
        chai.expect(texto(pagina, "#avanzar")).to.equal("Enviar a la mesa");
    });

    test("empezar a preparar deberia guardar el estado en el servidor y avisar con un evento", async function () {
        let pagina = await montarPagina();
        let aviso = null;
        pagina.addEventListener("cafefe:estado-orden", e => { aviso = e.detail; });
        elegir(pagina);
        await esperar();
        pagina.shadowRoot.querySelector("#avanzar").click();
        await esperar();
        chai.expect(ordenService.cambiarEstado.calledOnceWith("abcdef12-3456", "PREPARANDO")).to.equal(true);
        chai.expect(texto(pagina, "#estado")).to.equal("En preparación");
        chai.expect(aviso).to.deep.equal({ idOrden: "abcdef12-3456", estado: "PREPARANDO" });
    });

    test("deberia avanzar hasta entregada y ya no mostrar el boton", async function () {
        let pagina = await montarPagina();
        elegir(pagina);
        await esperar();
        for (let i = 0; i < 3; i++) {
            pagina.shadowRoot.querySelector("#avanzar").click();
            await esperar();
        }
        chai.expect(ordenService.cambiarEstado.args.map(a => a[1])).to.deep.equal(["PREPARANDO", "EN_CAMINO", "ENTREGADA"]);
        chai.expect(texto(pagina, "#estado")).to.equal("Entregada");
        chai.expect(texto(pagina, "#aviso")).to.contain("entregada a Ana");
        chai.expect(pagina.shadowRoot.querySelector("#avanzar")).to.equal(null);
    });

    test("si el servidor no guarda el estado deberia mostrar el error y dejar la orden como estaba", async function () {
        let error = new DefaultError();
        error.estado = 0;
        ordenService.cambiarEstado.rejects(error);
        let pagina = await montarPagina();
        elegir(pagina);
        await esperar();
        pagina.shadowRoot.querySelector("#avanzar").click();
        await esperar();
        chai.expect(texto(pagina, "#error")).to.contain("no hay conexión");
        chai.expect(texto(pagina, "#estado")).to.equal("Recibida");
        chai.expect(pagina.shadowRoot.querySelector("#avanzar").disabled).to.equal(false);
    });

    test("deberia mostrar el estado de cada orden al cambiar de una a otra", async function () {
        let pagina = await montarPagina();
        elegir(pagina);
        await esperar();
        pagina.shadowRoot.querySelector("#avanzar").click();
        await esperar();
        elegir(pagina, { orden: { idOrden: "o2" }, productos: PRODUCTOS, total: 1200, cliente: "Beto" });
        await esperar();
        chai.expect(texto(pagina, "#estado")).to.equal("Recibida");
        ordenService.findEstado.resolves(conEstado("PREPARANDO"));
        elegir(pagina);
        await esperar();
        chai.expect(texto(pagina, "#estado")).to.equal("En preparación");
    });
});