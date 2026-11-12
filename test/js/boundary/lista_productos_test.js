import * as chai from "../lib/chai/index.js";
import sinon from "../lib/sinon/sinon-esm.js";
import "../../../src/js/boundary/lista_productos.js";
import DefaultError from "../../../src/js/entity/default_error.js";
import { montar, limpiar, esperar, respuesta } from "./utilidades.js";

const ASIGNACIONES = [
    { idProductoTipoProducto: "a1", producto: { idProducto: "p1", nombre: "Café Americano", precioSugerido: 3.5, activo: true, comentarios: "" } },
    { idProductoTipoProducto: "a2", producto: { idProducto: "p2", nombre: "Caffe Latte", precioSugerido: 5, activo: true, comentarios: "Con leche" } },
    { idProductoTipoProducto: "a3", producto: { idProducto: "p3", nombre: "Mocca", precioSugerido: 4, activo: false, comentarios: "" } }
];

suite("<lista-productos>", function () {
    let productoTipoProductoService;

    setup(function () {
        productoTipoProductoService = { findByTipoProducto: sinon.stub().resolves(respuesta(ASIGNACIONES)) };
    });

    teardown(limpiar);

    test("sin categoria no deberia consultar y deberia pedir que se elija una", async function () {
        let lista = montar("lista-productos", { productoTipoProductoService });
        await esperar();
        chai.expect(productoTipoProductoService.findByTipoProducto.called).to.equal(false);
        chai.expect(lista.shadowRoot.querySelector(".vacio").textContent).to.contain("Elija una categoría");
    });

    test("deberia mostrar solo los productos activos de la categoria con su precio", async function () {
        let lista = montar("lista-productos", { productoTipoProductoService }, { categoria: "t1" });
        await esperar();
        chai.expect(productoTipoProductoService.findByTipoProducto.calledOnceWith("t1")).to.equal(true);
        let botones = lista.shadowRoot.querySelectorAll(".agregar");
        chai.expect(botones).to.have.lengthOf(2);
        chai.expect(lista.shadowRoot.querySelector(".precio").textContent).to.equal("$3.50");
    });

    test("al cambiar la categoria deberia volver a cargar", async function () {
        let lista = montar("lista-productos", { productoTipoProductoService }, { categoria: "t1" });
        await esperar();
        lista.setAttribute("categoria", "t2");
        await esperar();
        chai.expect(productoTipoProductoService.findByTipoProducto.secondCall.args[0]).to.equal("t2");
    });

    test("al agregar un producto deberia avisar con un evento", async function () {
        let lista = montar("lista-productos", { productoTipoProductoService }, { categoria: "t1" });
        await esperar();
        let agregado = null;
        lista.addEventListener("cafefe:producto-agregado", e => { agregado = e.detail; });
        lista.shadowRoot.querySelector('[data-id="p2"]').click();
        chai.expect(agregado.nombre).to.equal("Caffe Latte");
    });

    test("si la categoria no tiene productos activos deberia decirlo", async function () {
        productoTipoProductoService.findByTipoProducto.resolves(respuesta([ASIGNACIONES[2]]));
        let lista = montar("lista-productos", { productoTipoProductoService }, { categoria: "t1" });
        await esperar();
        chai.expect(lista.shadowRoot.querySelector(".vacio").textContent).to.contain("no tiene productos");
    });

    test("si no hay conexion deberia explicarlo", async function () {
        let error = new DefaultError();
        error.estado = 0;
        productoTipoProductoService.findByTipoProducto.rejects(error);
        let lista = montar("lista-productos", { productoTipoProductoService }, { categoria: "t1" });
        await esperar();
        chai.expect(lista.shadowRoot.querySelector("#error").textContent).to.contain("no hay conexión");
    });
});