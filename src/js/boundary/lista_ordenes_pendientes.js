import { ESTILOS } from "./estilos.js";
import OrdenService from "../control/orden_service.js";
import OrdenProductoService from "../control/orden_producto_service.js";
import { aCentavos, deCentavos, clienteDeOrden } from "../control/cobro.js";
import { escapar, moneda } from "../control/texto.js";

/**
 * <lista-ordenes-pendientes>: las ordenes que todavia no se han pagado
 * (GET orden/pendientes), con su cliente, cantidad de productos y total.
 * Al elegir una dispara "cafefe:orden-seleccionada" con
 * { orden, productos, total (centavos), cliente }.
 * Sirve para la HU4 (Pago) y tambien se puede usar en la HU3 (Recepcion).
 * Atributo opcional "titulo".
 */
class ListaOrdenesPendientes extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.ordenService = new OrdenService();
        this.ordenProductoService = new OrdenProductoService();
        this.ordenes = [];
        this.seleccionada = null;
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            ${ESTILOS}
            <style>
                .cabecera { display: flex; align-items: center; justify-content: space-between; gap: var(--esp-2); margin-bottom: var(--esp-3); }
                .cabecera h2 { margin: 0; font-size: var(--texto-lg); }
                .cabecera .boton { min-height: 2.25rem; padding-block: var(--esp-1); }
                ul { display: grid; gap: var(--esp-3); margin: 0; padding: 0; list-style: none; }
                .orden {
                    display: grid;
                    grid-template-columns: 1fr auto;
                    gap: var(--esp-1) var(--esp-3);
                    width: 100%;
                    padding: var(--esp-3) var(--esp-4);
                    border: 2px solid var(--color-borde);
                    border-radius: var(--radio);
                    font: inherit;
                    text-align: left;
                    color: var(--color-texto);
                    background: var(--color-superficie);
                    cursor: pointer;
                    transition: border-color var(--transicion), box-shadow var(--transicion);
                }
                .orden:hover { border-color: var(--color-primario-claro); box-shadow: var(--sombra); }
                .orden[aria-pressed="true"] { border-color: var(--color-acento); box-shadow: var(--sombra-elevada); }
                .cliente { font-weight: 700; }
                .total { font-weight: 700; color: var(--color-primario); text-align: right; }
                .detalle { grid-column: 1 / -1; font-size: var(--texto-sm); color: var(--color-texto-suave); }
            </style>
            <div class="cabecera">
                <h2 id="titulo">${escapar(this.getAttribute("titulo") || "Órdenes pendientes")}</h2>
                <button type="button" class="boton boton--secundario" id="actualizar">Actualizar</button>
            </div>
            <p class="alerta alerta--error" role="alert" id="error"></p>
            <div aria-live="polite" aria-busy="true" id="contenido"><p class="vacio">Cargando órdenes…</p></div>`;
        this.shadowRoot.querySelector("#actualizar").addEventListener("click", () => this.cargar());
        this.cargar();
    }

    async cargar() {
        let contenido = this.shadowRoot.querySelector("#contenido");
        let error = this.shadowRoot.querySelector("#error");
        error.textContent = "";
        contenido.setAttribute("aria-busy", "true");
        try {
            let ordenes = (await this.ordenService.findPendientes()).datos;
            // los productos de todas las ordenes se piden al mismo tiempo
            this.ordenes = await Promise.all(ordenes.map(async orden => {
                let productos = (await this.ordenProductoService.findByOrden(orden.idOrden)).datos;
                let total = productos.reduce((suma, p) => suma + aCentavos(p.precio), 0);
                return { orden, productos, total, cliente: clienteDeOrden(productos) };
            }));
            if (this.seleccionada && !this.ordenes.some(o => o.orden.idOrden === this.seleccionada)) {
                this.seleccionada = null;
            }
            this.dibujar();
        } catch (e) {
            contenido.innerHTML = "";
            error.textContent = e.estado === 0
                ? "No se pudieron cargar las órdenes: no hay conexión con el servidor."
                : (e.mensaje || "No se pudieron cargar las órdenes.");
        } finally {
            contenido.setAttribute("aria-busy", "false");
        }
    }

    dibujar() {
        let contenido = this.shadowRoot.querySelector("#contenido");
        if (this.ordenes.length === 0) {
            contenido.innerHTML = `<p class="vacio">No hay órdenes pendientes.</p>`;
            return;
        }
        contenido.innerHTML = `<ul aria-labelledby="titulo">${this.ordenes.map(o => `
            <li>
                <button type="button" class="orden" data-id="${escapar(o.orden.idOrden)}"
                        aria-pressed="${this.seleccionada === o.orden.idOrden}">
                    <span class="cliente">${escapar(o.cliente || "Cliente sin nombre")}</span>
                    <span class="total">${moneda(deCentavos(o.total))}</span>
                    <span class="detalle">${formatearFecha(o.orden.fechaCreacion)} · ${o.productos.length} producto${o.productos.length === 1 ? "" : "s"}</span>
                </button>
            </li>`).join("")}</ul>`;
        contenido.querySelectorAll(".orden").forEach(boton => {
            boton.addEventListener("click", () => this.seleccionar(boton.dataset.id));
        });
    }

    seleccionar(id) {
        let elegida = this.ordenes.find(o => o.orden.idOrden === id);
        if (!elegida) {
            return;
        }
        this.seleccionada = id;
        this.dibujar();
        this.shadowRoot.querySelector(`[data-id="${id}"]`)?.focus();
        this.dispatchEvent(new CustomEvent("cafefe:orden-seleccionada", { detail: elegida, bubbles: true, composed: true }));
    }
}

export function formatearFecha(texto) {
    let fecha = new Date(texto);
    return isNaN(fecha) ? "" : fecha.toLocaleString("es-SV", { dateStyle: "short", timeStyle: "short" });
}

customElements.define("lista-ordenes-pendientes", ListaOrdenesPendientes);
export default ListaOrdenesPendientes;
