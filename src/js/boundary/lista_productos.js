import { ESTILOS } from "./estilos.js";
import ProductoTipoProductoService from "../control/producto_tipo_producto_service.js";
import { escapar, moneda } from "../control/texto.js";
import "./tarjeta_simple.js";

/**
 * <lista-productos categoria="{idTipoProducto}"> (HU2)
 * Muestra los productos ACTIVOS de una categoria, con su precio y un boton para
 * agregarlo a la orden. Al cambiar el atributo "categoria" vuelve a cargar.
 * Al agregar uno dispara "cafefe:producto-agregado" con el producto en detail.
 */
class ListaProductos extends HTMLElement {
    static get observedAttributes() {
        return ["categoria"];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.productoTipoProductoService = new ProductoTipoProductoService();
        this.productos = [];
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            ${ESTILOS}
            <style>
                .precio { font-size: var(--texto-lg); font-weight: 700; color: var(--color-primario); }
                .comentario { font-size: var(--texto-sm); color: var(--color-texto-suave); }
            </style>
            <h2 id="titulo">Productos</h2>
            <p class="alerta alerta--error" role="alert" id="error"></p>
            <section aria-labelledby="titulo" aria-busy="false">
                <div class="rejilla" id="productos"><p class="vacio">Elija una categoría para ver sus productos.</p></div>
            </section>`;
        if (this.getAttribute("categoria")) {
            this.cargar();
        }
    }

    attributeChangedCallback(nombre, anterior, nuevo) {
        if (this.shadowRoot.innerHTML && anterior !== nuevo && nuevo) {
            this.cargar();
        }
    }

    async cargar() {
        let contenedor = this.shadowRoot.querySelector("#productos");
        let seccion = this.shadowRoot.querySelector("section");
        this.shadowRoot.querySelector("#error").textContent = "";
        contenedor.innerHTML = `<p class="vacio">Cargando productos…</p>`;
        seccion.setAttribute("aria-busy", "true");
        try {
            let resp = await this.productoTipoProductoService.findByTipoProducto(this.getAttribute("categoria"));
            this.productos = resp.datos
                .map(asignacion => asignacion.producto)
                .filter(producto => producto && producto.activo);
            this.dibujar();
        } catch (e) {
            contenedor.innerHTML = "";
            this.shadowRoot.querySelector("#error").textContent = e.estado === 0
                ? "No se pudieron cargar los productos: no hay conexión y esta categoría no está en el menú guardado."                : (e.mensaje || "No se pudieron cargar los productos.");
        } finally {
            seccion.setAttribute("aria-busy", "false");
        }
    }

    dibujar() {
        let contenedor = this.shadowRoot.querySelector("#productos");
        if (this.productos.length === 0) {
            contenedor.innerHTML = `<p class="vacio">Esta categoría no tiene productos disponibles.</p>`;
            return;
        }
        contenedor.innerHTML = this.productos.map(p => `
            <tarjeta-simple>
                <span slot="titulo">${escapar(p.nombre)}</span>
                <div slot="contenido">
                    <p class="precio">${moneda(p.precioSugerido)}</p>
                    ${p.comentarios ? `<p class="comentario">${escapar(p.comentarios)}</p>` : ""}
                </div>
                <button slot="pie" type="button" class="boton boton--bloque agregar" data-id="${escapar(p.idProducto)}"
                        aria-label="Agregar ${escapar(p.nombre)} a la orden">Agregar</button>
            </tarjeta-simple>`).join("");
        contenedor.querySelectorAll(".agregar").forEach(boton => {
            boton.addEventListener("click", () => this.agregar(boton.dataset.id));
        });
    }

    agregar(idProducto) {
        let producto = this.productos.find(p => p.idProducto === idProducto);
        if (!producto) {
            return;
        }
        this.dispatchEvent(new CustomEvent("cafefe:producto-agregado", { detail: producto, bubbles: true, composed: true }));
    }
}
customElements.define("lista-productos", ListaProductos);
export default ListaProductos;