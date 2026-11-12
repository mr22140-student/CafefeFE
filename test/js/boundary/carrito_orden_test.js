import * as chai from "../lib/chai/index.js";
import "../../../src/js/boundary/carrito_orden.js";
import { montar, limpiar } from "./utilidades.js";

const AMERICANO = { idProducto: "p1", nombre: "Café Americano", precioSugerido: 3.5 };
const LATTE = { idProducto: "p2", nombre: "Caffe Latte", precioSugerido: 5 };

function escribirCliente(carrito, nombre) {
    let entrada = carrito.shadowRoot.querySelector("#cliente");
    entrada.value = nombre;
    entrada.dispatchEvent(new Event("input"));
}

function enviar(carrito) {
    carrito.shadowRoot.querySelector("#formulario").requestSubmit();
}

suite("<carrito-orden>", function () {
    teardown(limpiar);

    test("vacio deberia decir que no hay productos", function () {
        let carrito = montar("carrito-orden");
        chai.expect(carrito.shadowRoot.querySelector(".vacio").textContent).to.contain("no ha agregado");
    });

    test("agregar el mismo producto dos veces deberia sumar la cantidad y el total", function () {
        let carrito = montar("carrito-orden");
        carrito.agregar(AMERICANO);
        carrito.agregar(AMERICANO);
        carrito.agregar(LATTE);
        chai.expect(carrito.items).to.have.lengthOf(2);
        chai.expect(carrito.shadowRoot.querySelector('[data-id="p1"] .cantidad').textContent).to.equal("2");
        chai.expect(carrito.shadowRoot.querySelector("#total").textContent).to.equal("$12.00");
    });

    test("los botones mas y menos deberian cambiar la cantidad", function () {
        let carrito = montar("carrito-orden");
        carrito.agregar(LATTE);
        carrito.shadowRoot.querySelector('[data-id="p2"] .mas').click();
        chai.expect(carrito.items[0].cantidad).to.equal(2);
        carrito.shadowRoot.querySelector('[data-id="p2"] .menos').click();
        chai.expect(carrito.items[0].cantidad).to.equal(1);
    });

    test("bajar la cantidad a cero deberia quitar el producto", function () {
        let carrito = montar("carrito-orden");
        carrito.agregar(LATTE);
        carrito.shadowRoot.querySelector('[data-id="p2"] .menos').click();
        chai.expect(carrito.items).to.have.lengthOf(0);
        chai.expect(carrito.shadowRoot.querySelector(".vacio")).to.not.equal(null);
    });

    test("no deberia confirmar una orden sin productos", function () {
        let carrito = montar("carrito-orden");
        let confirmada = false;
        carrito.addEventListener("cafefe:confirmar-orden", () => { confirmada = true; });
        escribirCliente(carrito, "Marta");
        enviar(carrito);
        chai.expect(confirmada).to.equal(false);
        chai.expect(carrito.shadowRoot.querySelector("#error").textContent).to.contain("al menos un producto");
    });

    test("no deberia confirmar sin el nombre del cliente", function () {
        let carrito = montar("carrito-orden");
        let confirmada = false;
        carrito.addEventListener("cafefe:confirmar-orden", () => { confirmada = true; });
        carrito.agregar(AMERICANO);
        escribirCliente(carrito, "   ");
        enviar(carrito);
        chai.expect(confirmada).to.equal(false);
        chai.expect(carrito.shadowRoot.querySelector("#cliente").getAttribute("aria-invalid")).to.equal("true");
    });

    test("al confirmar deberia avisar con el cliente y los productos", function () {
        let carrito = montar("carrito-orden");
        let detalle = null;
        carrito.addEventListener("cafefe:confirmar-orden", e => { detalle = e.detail; });
        carrito.agregar(AMERICANO);
        carrito.agregar(AMERICANO);
        escribirCliente(carrito, "  Marta ");
        enviar(carrito);
        chai.expect(detalle.cliente).to.equal("Marta");
        chai.expect(detalle.items).to.deep.equal([{ producto: AMERICANO, cantidad: 2 }]);
    });

    test("mientras esta ocupado no deberia volver a confirmar", function () {
        let carrito = montar("carrito-orden");
        let veces = 0;
        carrito.addEventListener("cafefe:confirmar-orden", () => { veces++; });
        carrito.agregar(AMERICANO);
        escribirCliente(carrito, "Marta");
        carrito.ocupado = true;
        enviar(carrito);
        chai.expect(veces).to.equal(0);
        chai.expect(carrito.shadowRoot.querySelector("#confirmar").disabled).to.equal(true);
    });

    test("vaciar deberia borrar los productos y el nombre", function () {
        let carrito = montar("carrito-orden");
        carrito.agregar(AMERICANO);
        escribirCliente(carrito, "Marta");
        carrito.vaciar();
        chai.expect(carrito.items).to.have.lengthOf(0);
        chai.expect(carrito.shadowRoot.querySelector("#cliente").value).to.equal("");
    });
});