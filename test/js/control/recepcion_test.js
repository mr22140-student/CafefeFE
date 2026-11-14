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
    test("deberia avanzar recibida, preparando, en camino y entregada", function () {
        chai.expect(siguienteEstado(ESTADOS.RECIBIDA)).to.equal(ESTADOS.PREPARANDO);
        chai.expect(siguienteEstado(ESTADOS.PREPARANDO)).to.equal(ESTADOS.EN_CAMINO);
        chai.expect(siguienteEstado(ESTADOS.EN_CAMINO)).to.equal(ESTADOS.ENTREGADA);
    });

    test("una orden entregada deberia quedarse entregada", function () {
        chai.expect(siguienteEstado(ESTADOS.ENTREGADA)).to.equal(ESTADOS.ENTREGADA);
    });

    test("un estado desconocido deberia tratarse como recibida", function () {
        chai.expect(siguienteEstado(undefined)).to.equal(ESTADOS.PREPARANDO);
    });
});