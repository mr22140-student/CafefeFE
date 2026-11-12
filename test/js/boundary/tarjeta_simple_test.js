import * as chai from "../lib/chai/index.js";
import "../../../src/js/boundary/tarjeta_simple.js";
import { montar, limpiar } from "./utilidades.js";

suite("<tarjeta-simple>", function () {
    teardown(limpiar);

    test("deberia usar Shadow DOM con los slots titulo, contenido y pie", function () {
        let tarjeta = montar("tarjeta-simple");
        let slots = [...tarjeta.shadowRoot.querySelectorAll("slot")].map(s => s.name);
        chai.expect(slots).to.deep.equal(["titulo", "contenido", "pie"]);
    });

    test("deberia mostrar en cada slot el contenido que recibe", function () {
        let tarjeta = document.createElement("tarjeta-simple");
        tarjeta.innerHTML = `<span slot="titulo">Cafés</span>`;
        montar("div").appendChild(tarjeta);
        let asignados = tarjeta.shadowRoot.querySelector("slot[name=titulo]").assignedNodes();
        chai.expect(asignados[0].textContent).to.equal("Cafés");
    });
});
