import * as chai from "../lib/chai/index.js";
import { ESTADOS, agruparProductos, siguienteEstado } from "../../../src/js/control/recepcion.js";

suite("recepcion: agruparProductos", function () {
    test("deberia juntar las unidades del mismo producto", function () {
        let grupos = agruparProductos([
            { idProducto: { idProducto: "p1", nombre: "Café Americano" } },
            { idProducto: { idProducto: "p2", nombre: "Caffe Latte" } },
            { idProducto: { idProducto: "p1", nombre: "Café Americano" } }
        ]);
        chai.expect(grupos).to.deep.equal([
            { nombre: "Café Americano", cantidad: 2 },
            { nombre: "Caffe Latte", cantidad: 1 }
        ]);
    });

    test("sin productos deberia devolver una lista vacia", function () {
        chai.expect(agruparProductos(null)).to.deep.equal([]);
    });
});

suite("recepcion: siguienteEstado", function () {
    test("deberia avanzar de nueva a preparando y de preparando a lista", function () {
        chai.expect(siguienteEstado(ESTADOS.NUEVA)).to.equal(ESTADOS.PREPARANDO);
        chai.expect(siguienteEstado(ESTADOS.PREPARANDO)).to.equal(ESTADOS.LISTA);
    });

    test("una orden lista deberia quedarse lista", function () {
        chai.expect(siguienteEstado(ESTADOS.LISTA)).to.equal(ESTADOS.LISTA);
    });
});