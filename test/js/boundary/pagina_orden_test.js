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
    let productoTipoProductoService;

    setup(function () {
        tipoProductoService = { findRange: sinon.stub().resolves(respuesta(CATEGORIAS)) };
        productoTipoProductoService = { findByTipoProducto: sinon.stub().resolves(respuesta([])) };
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
        chai.expect(img.getAttribute("src")).to.contain("default.png");
    });

    test("una categoria inactiva no deberia poder seleccionarse", async function () {
        let pagina = montar("pagina-orden", { tipoProductoService });
        await esperar();
        let inactiva = pagina.shadowRoot.querySelector('[data-id="t2"]');
        chai.expect(inactiva.disabled).to.equal(true);
    });

    test("al elegir una categoria activa deberia marcarla y avisar con un evento", async function () {
                let pagina = montar("pagina-orden", { tipoProductoService, productoTipoProductoService });
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
    
    test("al elegir una categoria deberia mostrar sus productos", async function () {
        let pagina = montar("pagina-orden", { tipoProductoService, productoTipoProductoService });
        await esperar();
        pagina.shadowRoot.querySelector('[data-id="t1"]').click();
        await esperar();
        chai.expect(pagina.shadowRoot.querySelector("lista-productos").getAttribute("categoria")).to.equal("t1");
        chai.expect(productoTipoProductoService.findByTipoProducto.calledOnceWith("t1")).to.equal(true);
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

const AMERICANO = { idProducto: "p1", nombre: "Café Americano", precioSugerido: 3.5, activo: true };

suite("<pagina-orden> crear la orden", function () {
    let tipoProductoService;
    let ordenCliente;

    setup(function () {
        tipoProductoService = { findRange: sinon.stub().resolves(respuesta(CATEGORIAS)) };
        ordenCliente = { crear: sinon.stub().resolves({ orden: { idOrden: "abcdef12-3456" }, detalles: [{}, {}] }) };
    });

    teardown(limpiar);

    function prepararCarrito(pagina) {
        let lista = pagina.shadowRoot.querySelector("lista-productos");
        let producto = new CustomEvent("cafefe:producto-agregado", { detail: AMERICANO, bubbles: true, composed: true });
        lista.dispatchEvent(producto);
        lista.dispatchEvent(producto);
        let carrito = pagina.shadowRoot.querySelector("carrito-orden");
        let entrada = carrito.shadowRoot.querySelector("#cliente");
        entrada.value = "Marta";
        entrada.dispatchEvent(new Event("input"));
        return carrito;
    }

    test("un producto agregado en la lista deberia llegar al carrito", async function () {
        let pagina = montar("pagina-orden", { tipoProductoService, ordenCliente });
        await esperar();
        let carrito = prepararCarrito(pagina);
        chai.expect(carrito.items).to.deep.equal([{ producto: AMERICANO, cantidad: 2 }]);
    });

    test("al confirmar deberia crear la orden y mostrar la confirmacion", async function () {
        let pagina = montar("pagina-orden", { tipoProductoService, ordenCliente });
        await esperar();
        let creada = null;
        pagina.addEventListener("cafefe:orden-creada", e => { creada = e.detail; });
        let carrito = prepararCarrito(pagina);
        carrito.shadowRoot.querySelector("#formulario").requestSubmit();
        await esperar();
        chai.expect(ordenCliente.crear.calledOnceWith("Marta", [{ producto: AMERICANO, cantidad: 2 }])).to.equal(true);
        let confirmacion = pagina.shadowRoot.querySelector("#confirmacion");
        chai.expect(confirmacion.hidden).to.equal(false);
        chai.expect(confirmacion.textContent).to.contain("Marta");
        chai.expect(confirmacion.textContent).to.contain("$7.00");
        chai.expect(confirmacion.textContent).to.contain("ABCDEF12");
        chai.expect(carrito.items).to.have.lengthOf(0);
        chai.expect(creada.orden.idOrden).to.equal("abcdef12-3456");
    });

    test("hacer otra orden deberia volver a las categorias", async function () {
        let pagina = montar("pagina-orden", { tipoProductoService, ordenCliente });
        await esperar();
        prepararCarrito(pagina).shadowRoot.querySelector("#formulario").requestSubmit();
        await esperar();
        pagina.shadowRoot.querySelector("#otra").click();
        chai.expect(pagina.shadowRoot.querySelector("#confirmacion").hidden).to.equal(true);
        chai.expect(pagina.shadowRoot.querySelector("#armar").hidden).to.equal(false);
    });

    test("si falla la creacion deberia mostrar el error en el carrito y no perder la orden", async function () {
        let error = new DefaultError();
        error.estado = 0;
        ordenCliente.crear.rejects(error);
        let pagina = montar("pagina-orden", { tipoProductoService, ordenCliente });
        await esperar();
        let carrito = prepararCarrito(pagina);
        carrito.shadowRoot.querySelector("#formulario").requestSubmit();
        await esperar();
        chai.expect(carrito.shadowRoot.querySelector("#error").textContent).to.contain("no hay conexión");
        chai.expect(carrito.items).to.have.lengthOf(1);
        chai.expect(carrito.ocupado).to.equal(false);
        chai.expect(pagina.shadowRoot.querySelector("#confirmacion").hidden).to.equal(true);
    });
});
