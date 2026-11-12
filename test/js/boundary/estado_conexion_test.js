import * as chai from "../lib/chai/index.js";
import "../../../src/js/boundary/estado_conexion.js";
import { montar, limpiar } from "./utilidades.js";

/** Monta el componente con un estado de red controlado por la prueba. */
function montarCon(estado) {
    let elemento = document.createElement("estado-conexion");
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
});
