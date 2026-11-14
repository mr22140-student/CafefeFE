import { ESTILOS } from "./estilos.js";
import { escapar, moneda, esNombreValido, NOMBRE_INVALIDO } from "../control/texto.js";

/**
 * <carrito-orden>
La orden que arma el cliente: productos con su cantidad, el total y el nombre del cliente. No habla con el servidor: al confirmar dispara
"cafefe:confirmar-orden" con { cliente, items } y la pagina crea la orden.
carrito.agregar(producto)   suma 1 (o agrega el producto)
carrito.vaciar()            deja la orden en blanco
carrito.ocupado = true      deshabilita mientras se envia
carrito.mostrarError(texto) muestra un error (role="alert")
 */
class CarritoOrden extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.items = [];
        this.cliente = "";
        this._ocupado = false;
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            ${ESTILOS}
            <style>
                ul { list-style: none; margin: 0 0 var(--esp-4); padding: 0; }
                li {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) auto;
                    gap: var(--esp-2);
                    align-items: center;
                    padding: var(--esp-3) 0;
                    border-bottom: 1px solid var(--color-borde);
                }
                .nombre { font-weight: 600; }
                .subtotal { font-size: var(--texto-sm); color: var(--color-texto-suave); }
                .controles { display: flex; align-items: center; gap: var(--esp-1); }
                .controles .boton { min-width: var(--altura-toque); padding: 0; }
                .cantidad { min-width: 2ch; text-align: center; font-weight: 700; }
                .total {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: var(--esp-4);
                    font-family: var(--fuente-titulos);
                    font-size: var(--texto-xl);
                    font-weight: 700;
                }
            </style>
            <div class="tarjeta">
                <h2 id="titulo-carrito">Su orden</h2>
                <div id="contenido" aria-live="polite"></div>
                <form id="formulario" novalidate>
                    <div class="campo">
                        <label for="cliente">Nombre del cliente</label>
                        <input id="cliente" name="cliente" autocomplete="given-name" maxlength="100"
                               aria-describedby="ayuda-cliente" required>
                        <span class="ayuda" id="ayuda-cliente">Así le llamaremos cuando su orden esté lista.</span>
                    </div>
                    <p class="alerta alerta--error" role="alert" id="error"></p>
                    <button type="submit" class="boton boton--acento boton--bloque" id="confirmar">Confirmar orden</button>
                </form>
            </div>`;
        let entrada = this.shadowRoot.querySelector("#cliente");
        entrada.value = this.cliente;
        entrada.addEventListener("input", () => {
            this.cliente = entrada.value;
            entrada.removeAttribute("aria-invalid");
        });
        this.shadowRoot.querySelector("#formulario").addEventListener("submit", e => {
            e.preventDefault();
            this.confirmar();
        });
        this.dibujar();
    }

    get total() {
        return this.items.reduce((suma, item) => suma + Number(item.producto.precioSugerido ?? 0) * item.cantidad, 0);
    }

    get ocupado() {
        return this._ocupado;
    }

    set ocupado(valor) {
        this._ocupado = Boolean(valor);
        this.dibujar();
    }

    agregar(producto) {
        let item = this.items.find(i => i.producto.idProducto === producto.idProducto);
        if (item) {
            item.cantidad++;
        } else {
            this.items.push({ producto, cantidad: 1 });
        }
        this.mostrarError("");
        this.dibujar();
    }

    cambiarCantidad(idProducto, cambio) {
        let item = this.items.find(i => i.producto.idProducto === idProducto);
        if (!item) {
            return;
        }
        item.cantidad += cambio;
        if (item.cantidad < 1) {
            this.items = this.items.filter(i => i !== item);
        }
        this.dibujar();
    }

    vaciar() {
        this.items = [];
        this.cliente = "";
        let entrada = this.shadowRoot.querySelector("#cliente");
        if (entrada) {
            entrada.value = "";
        }
        this.mostrarError("");
        this.dibujar();
    }

    mostrarError(texto) {
        let error = this.shadowRoot.querySelector("#error");
        if (error) {
            error.textContent = texto;
        }
    }

    confirmar() {
        if (this._ocupado) {
            return;
        }
        let entrada = this.shadowRoot.querySelector("#cliente");
        let cliente = this.cliente.trim();
        if (this.items.length === 0) {
            this.mostrarError("Agregue al menos un producto a su orden.");
            return;
        }
        if (!cliente) {
            entrada.setAttribute("aria-invalid", "true");
            this.mostrarError("Escriba su nombre para que le podamos llamar.");
            entrada.focus();
            return;
        }
        if (!esNombreValido(cliente)) {
            entrada.setAttribute("aria-invalid", "true");
            this.mostrarError(NOMBRE_INVALIDO);
            entrada.focus();
            return;
        }
        this.mostrarError("");
        this.dispatchEvent(new CustomEvent("cafefe:confirmar-orden", {
            detail: { cliente, items: this.items.map(i => ({ producto: i.producto, cantidad: i.cantidad })) },
            bubbles: true,
            composed: true
        }));
    }

    dibujar() {
        let contenido = this.shadowRoot.querySelector("#contenido");
        if (!contenido) {
            return;
        }
        this.shadowRoot.querySelector("#confirmar").disabled = this._ocupado;
        this.shadowRoot.querySelector("#confirmar").textContent = this._ocupado ? "Enviando orden…" : "Confirmar orden";
        if (this.items.length === 0) {
            contenido.innerHTML = `<p class="vacio">Todavía no ha agregado productos.</p>`;
            return;
        }
        contenido.innerHTML = `
            <ul aria-labelledby="titulo-carrito">
                ${this.items.map(i => `
                <li data-id="${escapar(i.producto.idProducto)}">
                    <div>
                        <div class="nombre">${escapar(i.producto.nombre)}</div>
                        <div class="subtotal">${i.cantidad} × ${moneda(i.producto.precioSugerido)} = ${moneda(i.producto.precioSugerido * i.cantidad)}</div>
                    </div>
                    <div class="controles">
                        <button type="button" class="boton boton--secundario menos" aria-label="Quitar uno de ${escapar(i.producto.nombre)}" ${this._ocupado ? "disabled" : ""}>−</button>
                        <span class="cantidad" aria-label="Cantidad">${i.cantidad}</span>
                        <button type="button" class="boton boton--secundario mas" aria-label="Agregar otro ${escapar(i.producto.nombre)}" ${this._ocupado ? "disabled" : ""}>+</button>
                    </div>
                </li>`).join("")}
            </ul>
            <p class="total"><span>Total</span><span id="total">${moneda(this.total)}</span></p>`;
        contenido.querySelectorAll("li").forEach(fila => {
            fila.querySelector(".menos").addEventListener("click", () => this.cambiarCantidad(fila.dataset.id, -1));
            fila.querySelector(".mas").addEventListener("click", () => this.cambiarCantidad(fila.dataset.id, 1));
        });
    }
}
customElements.define("carrito-orden", CarritoOrden);
export default CarritoOrden;