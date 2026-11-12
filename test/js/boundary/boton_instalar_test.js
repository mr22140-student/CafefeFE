import * as chai from "../lib/chai/index.js";
import sinon from "../lib/sinon/sinon-esm.js";
import "../../../src/js/boundary/boton_instalar.js";
import { Instalador } from "../../../src/js/control/instalador.js";
import { montar, limpiar, esperar } from "./utilidades.js";

function avisoFalso(outcome) {
    let evento = new Event("beforeinstallprompt", { cancelable: true });
    evento.prompt = sinon.spy();
    evento.userChoice = Promise.resolve({ outcome });
    return evento;
}

suite("<boton-instalar>", function () {
    let ventana;
    let instalador;

    setup(function () {
        ventana = new EventTarget();
        instalador = new Instalador(ventana);
    });

    teardown(limpiar);

    test("deberia estar oculto mientras el navegador no permita instalar", function () {
        let boton = montar("boton-instalar", { instalador });
        chai.expect(boton.hidden).to.equal(true);
    });

    test("deberia aparecer cuando llega beforeinstallprompt", function () {
        let boton = montar("boton-instalar", { instalador });
        ventana.dispatchEvent(avisoFalso("accepted"));
        chai.expect(boton.hidden).to.equal(false);
    });

    test("al hacer clic deberia mostrar el dialogo, avisar el resultado y ocultarse", async function () {
        let boton = montar("boton-instalar", { instalador });
        let aviso = avisoFalso("accepted");
        ventana.dispatchEvent(aviso);
        let resultado = null;
        boton.addEventListener("cafefe:instalacion", e => { resultado = e.detail.aceptada; });

        boton.shadowRoot.querySelector("button").click();
        await esperar();

        chai.expect(aviso.prompt.calledOnce).to.equal(true);
        chai.expect(resultado).to.equal(true);
        chai.expect(boton.hidden).to.equal(true);
    });
});
