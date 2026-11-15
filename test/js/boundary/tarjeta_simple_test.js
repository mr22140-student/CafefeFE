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

    test("sin atributos deberia verse normal", function () {
        let tarjeta = montar("tarjeta-simple");
        chai.expect(getComputedStyle(tarjeta.shadowRoot.querySelector("article")).opacity).to.equal("1");
    });

    test("con el atributo inactiva deberia verse atenuada", function () {
        let tarjeta = montar("tarjeta-simple", {}, { inactiva: "" });
        chai.expect(getComputedStyle(tarjeta.shadowRoot.querySelector("article")).opacity).to.equal("0.55");
    });

    test("con el atributo seleccionada deberia resaltar el borde con el color de acento", function () {
        // en la pagina de pruebas no se cargan los colores de la app: se le da uno conocido
        let colores = { style: "--color-acento: rgb(1, 2, 3); --color-borde: rgb(200, 200, 200)" };
        let normal = montar("tarjeta-simple", {}, colores);
        let elegida = montar("tarjeta-simple", {}, { ...colores, seleccionada: "" });
        let borde = t => getComputedStyle(t.shadowRoot.querySelector("article")).borderTopColor;
        chai.expect(borde(elegida)).to.equal("rgb(1, 2, 3)");
        chai.expect(borde(normal)).to.equal("rgb(200, 200, 200)");
    });
});
