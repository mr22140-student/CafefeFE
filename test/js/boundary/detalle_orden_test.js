import * as chai from "../lib/chai/index.js";
import "../../../src/js/boundary/detalle_orden.js";
import { montar, limpiar } from "./utilidades.js";

const PRODUCTOS = [
    { idOrdenProducto: "op1", precio: 3.5, idProducto: { nombre: "Café Americano" } },
    { idOrdenProducto: "op2", precio: 5, idProducto: { nombre: "Caffe Latte" } },
    { idOrdenProducto: "op3", precio: 0.1, idProducto: { nombre: "Galleta" } }
];

function filas(detalle) {
    return [...detalle.shadowRoot.querySelectorAll("tbody tr")];
}

suite("<detalle-orden>", function () {
    teardown(limpiar);

    test("deberia mostrar cada producto con su precio y el total sin errores de decimales", function () {
        let detalle = montar("detalle-orden", { productos: PRODUCTOS });
        chai.expect(filas(detalle)).to.have.lengthOf(3);
        chai.expect(filas(detalle)[0].textContent).to.contain("Café Americano");
        chai.expect(filas(detalle)[0].textContent).to.contain("$3.50");
        chai.expect(detalle.shadowRoot.querySelector("#total").textContent).to.equal("$8.60");
    });

    test("al cambiar los productos deberia volver a dibujarse", function () {
        let detalle = montar("detalle-orden", { productos: PRODUCTOS });
        detalle.productos = [PRODUCTOS[1]];
        chai.expect(filas(detalle)).to.have.lengthOf(1);
        chai.expect(detalle.shadowRoot.querySelector("#total").textContent).to.equal("$5.00");
    });

    test("un producto con nota deberia mostrarla y no sumarse al total", function () {
        let detalle = montar("detalle-orden", { productos: PRODUCTOS, notas: { op1: "Ya pagado" } });
        chai.expect(filas(detalle)[0].querySelector(".nota").textContent).to.equal("Ya pagado");
        chai.expect(detalle.shadowRoot.querySelector("#total").textContent).to.equal("$5.10");
    });

    test("sin productos o con datos incompletos no deberia romperse", function () {
        let detalle = montar("detalle-orden", { productos: null });
        chai.expect(filas(detalle)).to.have.lengthOf(0);
        chai.expect(detalle.shadowRoot.querySelector("#total").textContent).to.equal("$0.00");
        detalle.productos = [{ idOrdenProducto: "op9", precio: 2 }];
        chai.expect(filas(detalle)[0].textContent).to.contain("Producto");
    });

    test("deberia escapar el nombre que viene del servidor", function () {
        let detalle = montar("detalle-orden", { productos: [{ idOrdenProducto: "x", precio: 1, idProducto: { nombre: "<img src=x onerror=alert(1)>" } }] });
        chai.expect(detalle.shadowRoot.querySelector("tbody img")).to.equal(null);
        chai.expect(filas(detalle)[0].textContent).to.contain("<img");
    });
});
