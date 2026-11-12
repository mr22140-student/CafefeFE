import { ESTILOS } from "./estilos.js";
import TipoProductoService from "../control/tipo_producto_service.js";
import { escapar } from "../control/texto.js";
import "./tarjeta_simple.js";

const IMAGEN_POR_DEFECTO = "recursos/imagenes/tipo_producto/default.svg";

/**
 * <pagina-orden> (HU2) — PUNTO DE PARTIDA.
 * Ya hace: cargar las categorias (tipo_producto) y mostrarlas con su imagen;
 * las inactivas se ven atenuadas y no se pueden elegir.
 * Al elegir una, dispara "cafefe:categoria-seleccionada" con la categoria.
 * FALTA (HU2): productos de la categoria (ProductoTipoProductoService.findByTipoProducto),
 * carrito, nombre del cliente y crear orden + orden_producto con el mesero virtual.
 *
 * Imagen de cada categoria: recursos/imagenes/tipo_producto/{idTipoProducto}.svg
 * (si no existe, se usa default.svg).
 */
class PaginaOrden extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.tipoProductoService = new TipoProductoService();
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
            </style>
            <h1>¡Bienvenido a Cafefe!</h1>
            <p>Elija una categoría para ver sus productos.</p>
            <p class="alerta alerta--error" role="alert" id="error"></p>
            <section aria-label="Categorías" aria-busy="true">
                <div class="rejilla" id="categorias"><p class="vacio">Cargando categorías…</p></div>
            </section>`;
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
            this.shadowRoot.querySelector("section").setAttribute("aria-busy", "false");
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
                    <img slot="contenido" alt="" src="recursos/imagenes/tipo_producto/${escapar(c.idTipoProducto)}.svg">
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
        this.dispatchEvent(new CustomEvent("cafefe:categoria-seleccionada", { detail: categoria, bubbles: true, composed: true }));
    }
}
customElements.define("pagina-orden", PaginaOrden);
export default PaginaOrden;
