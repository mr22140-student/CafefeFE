import * as chai from "../lib/chai/index.js";
import "../../../src/js/boundary/formulario_pago.js";
import { montar, limpiar } from "./utilidades.js";

function agregar(formulario, tipo, monto, referencia = "") {
    let raiz = formulario.shadowRoot;
    raiz.querySelector("#tipo").value = tipo;
    raiz.querySelector("#tipo").dispatchEvent(new Event("change"));
    raiz.querySelector("#monto").value = monto;
    raiz.querySelector("#referencia").value = referencia;
    raiz.querySelector("form").requestSubmit();
}

suite("<formulario-pago>", function () {
    let formulario;

    setup(function () {
        formulario = montar("formulario-pago");
        formulario.establecer(850, 0);
    });

    teardown(limpiar);

    test("deberia mostrar el total y el saldo inicial", function () {
        chai.expect(formulario.shadowRoot.querySelector("#total").textContent).to.equal("$8.50");
        chai.expect(formulario.shadowRoot.querySelector("#saldo").textContent).to.equal("$8.50");
    });

    test("la referencia solo deberia pedirse para tarjeta y transferencia", function () {
        let campo = formulario.shadowRoot.querySelector("#campo-referencia");
        chai.expect(campo.hidden).to.equal(true);
        formulario.shadowRoot.querySelector("#tipo").value = "TARJETA";
        formulario.shadowRoot.querySelector("#tipo").dispatchEvent(new Event("change"));
        chai.expect(campo.hidden).to.equal(false);
    });

    test("deberia aceptar varias formas de pago hasta cubrir el total y avisar el resumen", function () {
        let ultimo = null;
        formulario.addEventListener("cafefe:pagos-cambiaron", e => { ultimo = e.detail; });
        agregar(formulario, "TARJETA", "5", "AUT-1");
        agregar(formulario, "EFECTIVO", "3.50");
        chai.expect(formulario.pagos).to.have.lengthOf(2);
        chai.expect(ultimo.resumen.saldo).to.equal(0);
        chai.expect(formulario.shadowRoot.querySelectorAll("#pagos li")).to.have.lengthOf(2);
    });

    test("tarjeta sin referencia deberia mostrar un error y no agregarse", function () {
        agregar(formulario, "TARJETA", "5", "");
        chai.expect(formulario.pagos).to.have.lengthOf(0);
        chai.expect(formulario.shadowRoot.querySelector("#error").textContent).to.contain("referencia");
    });

    test("tarjeta mayor que el saldo deberia rechazarse", function () {
        agregar(formulario, "TARJETA", "9", "AUT-1");
        chai.expect(formulario.pagos).to.have.lengthOf(0);
    });

    test("efectivo mayor que el saldo deberia mostrar el cambio", function () {
        agregar(formulario, "EFECTIVO", "10");
        let raiz = formulario.shadowRoot;
        chai.expect(raiz.querySelector("#cambio").hidden).to.equal(false);
        chai.expect(raiz.querySelector("#cambio").textContent).to.equal("$1.50");
    });

    test("Quitar deberia eliminar el pago y volver a subir el saldo", function () {
        agregar(formulario, "EFECTIVO", "5");
        formulario.shadowRoot.querySelector("#pagos button").click();
        chai.expect(formulario.pagos).to.have.lengthOf(0);
        chai.expect(formulario.shadowRoot.querySelector("#saldo").textContent).to.equal("$8.50");
    });

    test("Completar saldo deberia escribir lo que falta en el monto", function () {
        agregar(formulario, "EFECTIVO", "5");
        formulario.shadowRoot.querySelector("#completar").click();
        chai.expect(formulario.shadowRoot.querySelector("#monto").value).to.equal("3.50");
    });
});
