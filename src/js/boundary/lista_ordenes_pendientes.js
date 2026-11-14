import { ESTILOS } from "./estilos.js";
import OrdenService from "../control/orden_service.js";
import OrdenProductoService from "../control/orden_producto_service.js";
import { aCentavos, deCentavos, clienteDeOrden } from "../control/cobro.js";
import { escapar, moneda } from "../control/texto.js";
import { TEXTO_ESTADO } from "../control/recepcion.js";

/**
 * <lista-ordenes-pendientes>: las ordenes que todavia no se han pagado
 * (GET orden/pendientes), con su cliente, cantidad de productos y total.
 * Al elegir una dispara "cafefe:orden-seleccionada" con
 * { orden, productos, total (centavos), cliente }.
 * Sirve para la HU4 (Pago) y tambien se puede usar en la HU3 (Recepcion).
 * Atributo opcional "titulo".
 * Atributo opcional "con-estado": tambien consulta el estado de preparacion de cada
 *  orden (GET orden/{id}/estado), lo muestra y lo manda en el evento como "estado".
 * Al actualizar la lista, si la orden elegida cambio (productos, precios o estado) vuelve
 * a disparar "cafefe:orden-seleccionada" con actualizada: true; si ya no esta pendiente,
 * dispara "cafefe:orden-ya-no-pendiente" con { idOrden }.
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
                .estado {
                    display: inline-block;
                    margin-left: var(--esp-1);
                    padding: 0 var(--esp-2);
                    border-radius: 999px;
                    font-size: var(--texto-xs);
                    font-weight: 700;
                    color: var(--color-texto-suave);
                    background: var(--color-primario-claro);
                }
                .estado[data-estado="RECIBIDA"] { color: var(--color-aviso); background: var(--color-aviso-fondo); }
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
            let conEstado = this.hasAttribute("con-estado");
            let antes = this.ordenes.find(o => o.orden.idOrden === this.seleccionada);
            // los productos (y el estado) de todas las ordenes se piden al mismo tiempo
            this.ordenes = await Promise.all(ordenes.map(async orden => {
                let productos = (await this.ordenProductoService.findByOrden(orden.idOrden)).datos;
                let total = productos.reduce((suma, p) => suma + aCentavos(p.precio), 0);
                let estado = conEstado ? await this.consultarEstado(orden.idOrden) : undefined;
                return { orden, productos, total, cliente: clienteDeOrden(productos), estado };
            }));
            this.dibujar();
            this.avisarCambiosDeLaSeleccionada(antes);
        } catch (e) {
            contenido.innerHTML = "";
            error.textContent = e.estado === 0
                ? "No se pudieron cargar las órdenes: no hay conexión con el servidor."
                : (e.mensaje || "No se pudieron cargar las órdenes.");
        } finally {
            contenido.setAttribute("aria-busy", "false");
        }
    }

        /** Estado de preparacion de la orden; null si no se pudo consultar. */
    async consultarEstado(idOrden) {
        try {
            return (await this.ordenService.findEstado(idOrden)).datos.estado;
        } catch (e) {
            return null;
        }
    }

    /**
     * Despues de actualizar: si la orden elegida cambio, la pagina debe volver a mostrarla
     * (antes solo cambiaba el total de la tarjeta, no el detalle de la derecha).
     */
    avisarCambiosDeLaSeleccionada(antes) {
        if (!this.seleccionada) {
            return;
        }
        let ahora = this.ordenes.find(o => o.orden.idOrden === this.seleccionada);
        if (!ahora) {
            let idOrden = this.seleccionada;
            this.seleccionada = null;
            this.dispatchEvent(new CustomEvent("cafefe:orden-ya-no-pendiente", { detail: { idOrden }, bubbles: true, composed: true }));
        } else if (!antes || firma(antes) !== firma(ahora)) {
            this.dispatchEvent(new CustomEvent("cafefe:orden-seleccionada", {
                detail: { ...ahora, actualizada: true }, bubbles: true, composed: true
            }));
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
                    <span class="detalle">${formatearFecha(o.orden.fechaCreacion)} · ${o.productos.length} producto${o.productos.length === 1 ? "" : "s"}
                    ${o.estado ? `<span class="estado" data-estado="${escapar(o.estado)}">${escapar(TEXTO_ESTADO[o.estado] ?? o.estado)}</span>` : ""}</span>
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

/** Lo que identifica el contenido de una orden: si cambia, la orden cambio. */
function firma(o) {
    return o.productos.map(p => `${p.idOrdenProducto}:${p.precio}`).join("|") + "#" + (o.estado ?? "");
}

export function formatearFecha(texto) {
    let fecha = new Date(texto);
    return isNaN(fecha) ? "" : fecha.toLocaleString("es-SV", { dateStyle: "short", timeStyle: "short" });
}

customElements.define("lista-ordenes-pendientes", ListaOrdenesPendientes);
export default ListaOrdenesPendientes;
