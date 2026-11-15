import * as chai from "../lib/chai/index.js";
import "../../../src/js/boundary/pagina_no_encontrada.js";
import { montar, limpiar } from "./utilidades.js";

suite("<pagina-no-encontrada>", function () {
    teardown(limpiar);

    test("deberia explicar que la direccion no existe con un titulo", function () {
        let pagina = montar("pagina-no-encontrada");
        chai.expect(pagina.shadowRoot.querySelector("h1").textContent).to.equal("Página no encontrada");
        chai.expect(pagina.shadowRoot.textContent).to.contain("no existe");
    });

    test("deberia ofrecer un enlace para volver al inicio", function () {
        let pagina = montar("pagina-no-encontrada");
        let enlace = pagina.shadowRoot.querySelector("a");
        chai.expect(enlace.getAttribute("href")).to.equal("#/orden");
        chai.expect(enlace.textContent).to.contain("inicio");
    });
});
