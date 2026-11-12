import * as chai from "../lib/chai/index.js";
import sinon from "../lib/sinon/sinon-esm.js";
import "../../../src/js/boundary/cafefe_app.js";
import { sesion } from "../../../src/js/control/sesion.js";
import { montar, limpiar, esperar } from "./utilidades.js";

function paginaActual(app) {
    return app.shadowRoot.querySelector("main").firstElementChild.localName;
}

suite("<cafefe-app> navegacion SPA", function () {
    let stubFetch;
    let tituloOriginal;

    suiteSetup(function () {
        tituloOriginal = document.title;
    });

    suiteTeardown(function () {
        document.title = tituloOriginal;
    });

    setup(function () {
        sesion.cerrar();
        // pagina-orden pide las categorias al conectarse
        stubFetch = sinon.stub(window, "fetch").callsFake(() =>
            Promise.resolve(new Response("[]", { status: 200, headers: { "Total-Registros": "0" } })));
    });

    teardown(function () {
        limpiar();
        stubFetch.restore();
        sesion.cerrar();
        history.replaceState(null, "", location.pathname + location.search);
    });

    test("sin hash deberia mostrar la pagina para ordenar", function () {
        history.replaceState(null, "", location.pathname + location.search);
        let app = montar("cafefe-app");
        chai.expect(paginaActual(app)).to.equal("pagina-orden");
        chai.expect(document.title).to.contain("Ordenar");
    });

    test("cambiar el hash deberia cambiar la pagina sin recargar", async function () {
        let app = montar("cafefe-app");
        location.hash = "#/login";
        await esperar(20);
        chai.expect(paginaActual(app)).to.equal("pagina-login");
    });

    test("una pantalla con rol deberia redirigir al login si no hay sesion", function () {
        history.replaceState(null, "", "#/pago");
        let app = montar("cafefe-app");
        chai.expect(paginaActual(app)).to.equal("pagina-login");
        chai.expect(location.hash).to.equal("#/login");
        chai.expect(app.shadowRoot.querySelector("pagina-login").getAttribute("destino")).to.equal("/pago");
    });

    test("con sesion de cajero deberia mostrar la pantalla de pago", function () {
        sesion.iniciar({ empleado: { nombre: "Laura" }, rol: { nombre: "Cajero" }, idEmpleadoRol: "er1" });
        history.replaceState(null, "", "#/pago");
        let app = montar("cafefe-app");
        chai.expect(paginaActual(app)).to.equal("pagina-pago");
    });

    test("el evento cafefe:navegar de una pagina deberia cambiar la ruta", async function () {
        let app = montar("cafefe-app");
        app.shadowRoot.querySelector("main").firstElementChild.dispatchEvent(
            new CustomEvent("cafefe:navegar", { detail: { ruta: "/no-existe" }, bubbles: true, composed: true }));
        await esperar(20);
        chai.expect(paginaActual(app)).to.equal("pagina-no-encontrada");
    });
});
