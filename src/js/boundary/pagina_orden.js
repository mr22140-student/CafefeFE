import { ESTILOS } from "./estilos.js";
import TipoProductoService from "../control/tipo_producto_service.js";
import ProductoTipoProductoService from "../control/producto_tipo_producto_service.js";
import OrdenCliente from "../control/orden_cliente.js";
import { escapar, moneda } from "../control/texto.js";
import "./tarjeta_simple.js";
import "./lista_productos.js";
import "./carrito_orden.js";

/**Imagen de cada categoria: recursos/imagenes/tipo_producto/{idTipoProducto}.png (si no existe, se usa default.png).

/**
 * <pagina-orden>
1. Muestra las categorias (tipo_producto) con su imagen; las inactivas se ven atenuadas y no se pueden elegir. Al elegir una dispara "cafefe:categoria-seleccionada" y <lista-productos> muestra sus productos.
2. "cafefe:producto-agregado" (de <lista-productos>) suma el producto a <carrito-orden>.
3. "cafefe:confirmar-orden" (de <carrito-orden>) crea la orden con el mesero
    virtual (OrdenCliente), muestra la confirmacion y dispara "cafefe:orden-creada".
Imagen de cada categoria: recursos/imagenes/tipo_producto/{idTipoProducto}.svg
(si no existe, se usa default.svg).
 */
class PaginaOrden extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.tipoProductoService = new TipoProductoService();
        this.productoTipoProductoService = new ProductoTipoProductoService();
        this.ordenCliente = new OrdenCliente();
        this.categorias = [];
        this.seleccionada = null;
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            ${ESTILOS}
            <style>
                .categoria {
                    display: block;
                    width: 100%;
                    padding: 0;
                    border: 0;
                    border-radius: var(--radio);
                    font: inherit;
                    text-align: center;
                    color: var(--color-texto);
                    background: none;
                    cursor: pointer;
                }
                .categoria:disabled { cursor: not-allowed; }
                .categoria img { width: 100%; height: 7rem; object-fit: contain; }
                .estado { font-size: var(--texto-xs); color: var(--color-texto-suave); }
                .pedido {
                    display: grid;
                    gap: var(--esp-5);
                    margin-top: var(--esp-6);
                }
                @media (min-width: 56rem) {
                    .pedido { grid-template-columns: minmax(0, 2fr) minmax(18rem, 1fr); align-items: start; }
                    carrito-orden { position: sticky; top: var(--esp-4); }
                }
                .confirmacion { text-align: center; }
                .confirmacion .numero { font-family: var(--fuente-titulos); font-size: var(--texto-2xl); color: var(--color-primario); }
            </style>
            <section class="portada">
                <h1>¡Bienvenido a Cafefe!</h1>
                <p>Elija una categoría, agregue sus productos y confirme su orden.</p>
            </section>
            <div id="armar">
                <p class="alerta alerta--error" role="alert" id="error"></p>
                <section aria-label="Categorías" aria-busy="true" id="seccion-categorias">
                    <div class="rejilla" id="categorias"><p class="vacio">Cargando categorías…</p></div>
                </section>
                <div class="pedido">
                    <lista-productos></lista-productos>
                    <carrito-orden></carrito-orden>
                </div>
            </div>
            <section class="tarjeta confirmacion" id="confirmacion" tabindex="-1" hidden></section>`;

        this.shadowRoot.querySelector("lista-productos").productoTipoProductoService = this.productoTipoProductoService;
        this.shadowRoot.addEventListener("cafefe:producto-agregado", e => {
            this.shadowRoot.querySelector("carrito-orden").agregar(e.detail);
        });
        this.shadowRoot.addEventListener("cafefe:confirmar-orden", e => this.crearOrden(e.detail));
        this.cargar();
    }

    async cargar() {
        let contenedor = this.shadowRoot.querySelector("#categorias");
        try {
            let resp = await this.tipoProductoService.findRange(0, 100);
            this.categorias = resp.datos;
            this.dibujar();
        } catch (e) {
            contenedor.innerHTML = "";
            this.shadowRoot.querySelector("#error").textContent = e.estado === 0
                ? "No se pudieron cargar las categorías: no hay conexión con el servidor."
                : (e.mensaje || "No se pudieron cargar las categorías.");
        } finally {
            this.shadowRoot.querySelector("#seccion-categorias").setAttribute("aria-busy", "false");
        }
    }

    dibujar() {
        let contenedor = this.shadowRoot.querySelector("#categorias");
        if (this.categorias.length === 0) {
            contenedor.innerHTML = `<p class="vacio">Todavía no hay categorías.</p>`;
            return;
        }
        contenedor.innerHTML = this.categorias.map(c => `
            <button type="button" class="categoria" data-id="${escapar(c.idTipoProducto)}"
                    ${c.activo ? "" : "disabled"} aria-pressed="${this.seleccionada === c.idTipoProducto}">
                <tarjeta-simple ${c.activo ? "" : "inactiva"} ${this.seleccionada === c.idTipoProducto ? "seleccionada" : ""}>
                    <span slot="titulo">${escapar(c.nombre)}</span>
                    <img slot="contenido" alt="" src="recursos/imagenes/tipo_producto/${escapar(c.idTipoProducto)}.png">
                    <span slot="pie" class="estado">${c.activo ? "" : "No disponible"}</span>
                </tarjeta-simple>
            </button>`).join("");

        contenedor.querySelectorAll("img").forEach(img => {
            img.addEventListener("error", () => { img.src = IMAGEN_POR_DEFECTO; }, { once: true });
        });
        contenedor.querySelectorAll(".categoria").forEach(boton => {
            boton.addEventListener("click", () => this.seleccionar(boton.dataset.id));
        });
    }

    seleccionar(id) {
        let categoria = this.categorias.find(c => c.idTipoProducto === id);
        if (!categoria || !categoria.activo) {
            return;
        }
        this.seleccionada = id;
        this.dibujar();
        this.shadowRoot.querySelector(`[data-id="${id}"]`)?.focus();
        this.shadowRoot.querySelector("lista-productos").setAttribute("categoria", id);
        this.dispatchEvent(new CustomEvent("cafefe:categoria-seleccionada", { detail: categoria, bubbles: true, composed: true }));
    }

    async crearOrden({ cliente, items }) {
        let carrito = this.shadowRoot.querySelector("carrito-orden");
        let total = carrito.total;
        carrito.ocupado = true;
        try {
            let resultado = await this.ordenCliente.crear(cliente, items);
            this.mostrarConfirmacion(cliente, resultado.orden, total);
            carrito.vaciar();
            this.dispatchEvent(new CustomEvent("cafefe:orden-creada", { detail: resultado, bubbles: true, composed: true }));
        } catch (e) {
            carrito.mostrarError(e.estado === 0
                ? "No se pudo enviar la orden: no hay conexión con el servidor."
                : (e.mensaje || "No se pudo crear la orden."));
        } finally {
            carrito.ocupado = false;
        }
    }

    mostrarConfirmacion(cliente, orden, total) {
        let confirmacion = this.shadowRoot.querySelector("#confirmacion");
        confirmacion.innerHTML = `
            <h2>¡Gracias, ${escapar(cliente)}!</h2>
            <p>Su orden fue recibida y ya la estamos preparando.</p>
            <p class="numero">Orden #${escapar(String(orden.idOrden).slice(0, 8).toUpperCase())}</p>
            <p>Total a pagar en caja: <strong>${moneda(total)}</strong></p>
            <button type="button" class="boton" id="otra">Hacer otra orden</button>`;
        confirmacion.querySelector("#otra").addEventListener("click", () => this.nuevaOrden());
        this.shadowRoot.querySelector("#armar").hidden = true;
        confirmacion.hidden = false;
        confirmacion.focus();
    }

    nuevaOrden() {
        this.shadowRoot.querySelector("#confirmacion").hidden = true;
        this.shadowRoot.querySelector("#armar").hidden = false;
        this.shadowRoot.querySelector(".categoria:not(:disabled)")?.focus();
    }
}
customElements.define("pagina-orden", PaginaOrden);
export default PaginaOrden;