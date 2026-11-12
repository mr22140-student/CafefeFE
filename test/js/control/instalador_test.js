import * as chai from "../lib/chai/index.js";
import sinon from "../lib/sinon/sinon-esm.js";
import { Instalador, EVENTO_INSTALADOR } from "../../../src/js/control/instalador.js";

/** Evento beforeinstallprompt falso: el usuario responde con "outcome". */
function avisoFalso(outcome) {
    let evento = new Event("beforeinstallprompt", { cancelable: true });
    evento.prompt = sinon.spy();
    evento.userChoice = Promise.resolve({ outcome });
    return evento;
}

suite("Instalador", function () {
    let ventana;
    let instalador;

    setup(function () {
        ventana = new EventTarget();
        instalador = new Instalador(ventana);
    });

    test("al inicio no deberia estar disponible", function () {
        chai.expect(instalador.disponible).to.equal(false);
    });

    test("beforeinstallprompt deberia cancelarse, guardarse y avisar que se puede instalar", function () {
        let avisos = [];
        instalador.addEventListener(EVENTO_INSTALADOR, e => avisos.push(e.detail));
        let evento = avisoFalso("accepted");
        ventana.dispatchEvent(evento);
        chai.expect(evento.defaultPrevented).to.equal(true);
        chai.expect(instalador.disponible).to.equal(true);
        chai.expect(avisos[0].disponible).to.equal(true);
    });

    test("instalar deberia mostrar el dialogo y resolver true si el usuario acepta", async function () {
        let evento = avisoFalso("accepted");
        ventana.dispatchEvent(evento);
        let aceptada = await instalador.instalar();
        chai.expect(evento.prompt.calledOnce).to.equal(true);
        chai.expect(aceptada).to.equal(true);
        chai.expect(instalador.disponible).to.equal(false);
    });

    test("instalar deberia resolver false si el usuario cancela", async function () {
        ventana.dispatchEvent(avisoFalso("dismissed"));
        chai.expect(await instalador.instalar()).to.equal(false);
    });

    test("instalar sin aviso del navegador deberia resolver false", async function () {
        chai.expect(await instalador.instalar()).to.equal(false);
    });

    test("appinstalled deberia marcar la app como instalada", function () {
        ventana.dispatchEvent(avisoFalso("accepted"));
        ventana.dispatchEvent(new Event("appinstalled"));
        chai.expect(instalador.instalada).to.equal(true);
        chai.expect(instalador.disponible).to.equal(false);
    });
});
