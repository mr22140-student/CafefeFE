import * as chai from "../lib/chai/index.js";
import sinon from "../lib/sinon/sinon-esm.js";
import "../../../src/js/boundary/pagina_orden.js";
import DefaultError from "../../../src/js/entity/default_error.js";
import { montar, limpiar, esperar, respuesta } from "./utilidades.js";

const CATEGORIAS = [
    { idTipoProducto: "t1", nombre: "Cafés", activo: true },
    { idTipoProducto: "t2", nombre: "Tés", activo: false }
];

suite("<pagina-orden> categorias", function () {
    let tipoProductoService;

    setup(function () {
        tipoProductoService = { findRange: sinon.stub().resolves(respuesta(CATEGORIAS)) };
    });

    teardown(limpiar);

    test("deberia mostrar una tarjeta con imagen por cada categoria", async function () {
        let pagina = montar("pagina-orden", { tipoProductoService });
        await esperar();
        let botones = pagina.shadowRoot.querySelectorAll(".categoria");
        chai.expect(botones).to.have.lengthOf(2);
        chai.expect(botones[0].dataset.id).to.equal("t1");
        chai.expect(botones[0].querySelector("img")).to.not.equal(null);
    });

    test("si la categoria no tiene imagen propia deberia usar la imagen por defecto", async function () {
        let pagina = montar("pagina-orden", { tipoProductoService });
        await esperar(300);
        let img = pagina.shadowRoot.querySelector('[data-id="t1"] img');
        chai.expect(img.getAttribute("src")).to.contain("default.svg");
    });

    test("una categoria inactiva no deberia poder seleccionarse", async function () {
        let pagina = montar("pagina-orden", { tipoProductoService });
        await esperar();
        let inactiva = pagina.shadowRoot.querySelector('[data-id="t2"]');
        chai.expect(inactiva.disabled).to.equal(true);
    });

    test("al elegir una categoria activa deberia marcarla y avisar con un evento", async function () {
        let pagina = montar("pagina-orden", { tipoProductoService });
        await esperar();
        let elegida = null;
        pagina.addEventListener("cafefe:categoria-seleccionada", e => { elegida = e.detail; });
        pagina.shadowRoot.querySelector('[data-id="t1"]').click();
        chai.expect(elegida.nombre).to.equal("Cafés");
        chai.expect(pagina.shadowRoot.querySelector('[data-id="t1"]').getAttribute("aria-pressed")).to.equal("true");
    });

    test("si el servidor falla deberia mostrar el error", async function () {
        let error = new DefaultError();
        error.mensaje = "Dato invalido"; error.estado = 422;
        tipoProductoService.findRange.rejects(error);
        let pagina = montar("pagina-orden", { tipoProductoService });
        await esperar();
        chai.expect(pagina.shadowRoot.querySelector("#error").textContent).to.equal("Dato invalido");
    });
});

suite("<pagina-orden> sin conexion", function () {
    teardown(limpiar);

    test("si no hay conexion con el servidor deberia explicarlo", async function () {
        let error = new DefaultError();
        error.estado = 0;
        let tipoProductoService = { findRange: sinon.stub().rejects(error) };
        let pagina = montar("pagina-orden", { tipoProductoService });
        await esperar();
        chai.expect(pagina.shadowRoot.querySelector("#error").textContent).to.contain("no hay conexión");
    });
});
