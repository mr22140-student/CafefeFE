import * as chai from "../lib/chai/index.js";
import sinon from "../lib/sinon/sinon-esm.js";
import "../../../src/js/boundary/cafefe_encabezado.js";
import { Sesion, EVENTO_SESION } from "../../../src/js/control/sesion.js";
import { montar, limpiar } from "./utilidades.js";

const BARISTA = { empleado: { nombre: "Laura", apellido: "Barista" }, rol: { nombre: "Barista" }, idEmpleadoRol: "er-barista" };

/** Sesion que no toca el localStorage real; avisa en "objetivo" (window para probar que el encabezado reacciona). */
function sesionDePrueba(datos = null, objetivo = new EventTarget()) {
    let s = new Sesion(null, objetivo);
    if (datos) {
        s.iniciar(datos);
    }
    return s;
}

function enlacesDelMenu(encabezado) {
    return [...encabezado.shadowRoot.querySelectorAll("nav a")].map(a => a.getAttribute("href"));
}

suite("<cafefe-encabezado>", function () {
    teardown(function () {
        limpiar();
        history.replaceState(null, "", location.pathname + location.search);
    });

    test("sin sesion deberia mostrar solo Ordenar y el enlace Soy empleado", function () {
        let encabezado = montar("cafefe-encabezado", { sesion: sesionDePrueba() });
        chai.expect(enlacesDelMenu(encabezado)).to.deep.equal(["#/orden"]);
        let empleado = [...encabezado.shadowRoot.querySelectorAll(".cuenta a")].find(a => a.textContent.includes("Soy empleado"));
        chai.expect(empleado.getAttribute("href")).to.equal("#/login");
        chai.expect(encabezado.shadowRoot.querySelector("#salir")).to.equal(null);
    });

    test("con sesion de barista deberia saludar con su nombre y rol y mostrar solo sus pantallas", function () {
        let encabezado = montar("cafefe-encabezado", { sesion: sesionDePrueba(BARISTA) });
        let saludo = encabezado.shadowRoot.querySelector(".saludo").textContent;
        chai.expect(saludo).to.contain("Laura");
        chai.expect(saludo).to.contain("Barista");
        chai.expect(enlacesDelMenu(encabezado)).to.deep.equal(["#/orden", "#/recepcion"]);
        chai.expect(enlacesDelMenu(encabezado)).to.not.include("#/pago");
    });

    test("deberia marcar como actual el enlace de la pantalla abierta", function () {
        history.replaceState(null, "", "#/recepcion");
        let encabezado = montar("cafefe-encabezado", { sesion: sesionDePrueba(BARISTA) });
        let actual = encabezado.shadowRoot.querySelector('nav a[aria-current="page"]');
        chai.expect(actual.getAttribute("href")).to.equal("#/recepcion");
    });

    test("Cerrar sesion deberia cerrarla y mandar a la pagina para ordenar", function () {
        let sesion = sesionDePrueba(BARISTA);
        let encabezado = montar("cafefe-encabezado", { sesion });
        let destino = null;
        encabezado.addEventListener("cafefe:navegar", e => { destino = e.detail.ruta; });
        encabezado.shadowRoot.querySelector("#salir").click();
        chai.expect(sesion.estaIniciada()).to.equal(false);
        chai.expect(destino).to.equal("/orden");
    });

    test("deberia volver a dibujarse solo cuando alguien inicia sesion", function () {
        let sesion = sesionDePrueba(null, window);
        let encabezado = montar("cafefe-encabezado", { sesion });
        chai.expect(encabezado.shadowRoot.querySelector("#salir")).to.equal(null);
        sesion.iniciar(BARISTA);
        chai.expect(encabezado.shadowRoot.querySelector(".saludo").textContent).to.contain("Laura");
    });

    test("al quitarlo de la pagina deberia dejar de escuchar los cambios", function () {
        let encabezado = montar("cafefe-encabezado", { sesion: sesionDePrueba() });
        let dibujar = sinon.spy(encabezado, "dibujar");
        encabezado.remove();
        window.dispatchEvent(new CustomEvent(EVENTO_SESION));
        window.dispatchEvent(new HashChangeEvent("hashchange"));
        chai.expect(dibujar.called).to.equal(false);
    });
});
