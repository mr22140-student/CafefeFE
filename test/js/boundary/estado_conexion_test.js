import * as chai from "../lib/chai/index.js";
import "../../../src/js/boundary/estado_conexion.js";
import { montar, limpiar } from "./utilidades.js";
import { EVENTO_COLA } from "../../../src/js/control/cola_ordenes.js";

/** Cola falsa: un EventTarget con cierta cantidad de ordenes guardadas. */
function colaFalsa(pendientes = 0) {
    let cola = new EventTarget();
    cola.pendientes = () => new Array(pendientes).fill({});
    return cola;
}

function avisarCola(cola, detalle) {
    cola.dispatchEvent(new CustomEvent(EVENTO_COLA, { detail: { pendientes: 0, enviadas: [], rechazadas: [], ...detalle } }));
}

/** Monta el componente con un estado de red controlado por la prueba. */
function montarCon(estado, cola = colaFalsa()) {
    let elemento = document.createElement("estado-conexion");
    elemento.cola = cola;
    Object.defineProperty(elemento, "enLinea", { get: () => estado.enLinea });
    montar("div").appendChild(elemento);
    return elemento;
}

suite("<estado-conexion>", function () {
    teardown(limpiar);

    test("en linea no deberia mostrar nada", function () {
        let aviso = montarCon({ enLinea: true }).shadowRoot.querySelector("p");
        chai.expect(aviso.hidden).to.equal(true);
    });

    test("al perder la conexion deberia avisar con un mensaje anunciable", function () {
        let estado = { enLinea: true };
        let aviso = montarCon(estado).shadowRoot.querySelector("p");
        estado.enLinea = false;
        window.dispatchEvent(new Event("offline"));
        chai.expect(aviso.hidden).to.equal(false);
        chai.expect(aviso.getAttribute("role")).to.equal("status");
        chai.expect(aviso.textContent).to.contain("Sin conexión");
    });

    test("al volver la conexion deberia avisar que se restablecio", function () {
        let estado = { enLinea: false };
        let aviso = montarCon(estado).shadowRoot.querySelector("p");
        estado.enLinea = true;
        window.dispatchEvent(new Event("online"));
        chai.expect(aviso.textContent).to.contain("restablecida");
    });

     test("sin conexion deberia decir cuantas ordenes hay guardadas por enviar", function () {
        let aviso = montarCon({ enLinea: false }, colaFalsa(2)).shadowRoot.querySelector("p");
        chai.expect(aviso.textContent).to.contain("Órdenes guardadas por enviar: 2");
    });

    test("al enviarse las ordenes guardadas deberia avisarlo", function () {
        let cola = colaFalsa();
        let aviso = montarCon({ enLinea: true }, cola).shadowRoot.querySelector("p");
        avisarCola(cola, { enviadas: [{}, {}] });
        chai.expect(aviso.hidden).to.equal(false);
        chai.expect(aviso.textContent).to.contain("Se enviaron 2 órdenes");
    });

    test("si el servidor rechaza una orden guardada deberia decir por que", function () {
        let cola = colaFalsa();
        let aviso = montarCon({ enLinea: true }, cola).shadowRoot.querySelector("p");
        avisarCola(cola, { rechazadas: [{ mensaje: "El producto no existe" }] });
        chai.expect(aviso.textContent).to.contain("no se pudo enviar").and.contain("El producto no existe");
    });
});
