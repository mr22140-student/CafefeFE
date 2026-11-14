import { ESTILOS } from "./estilos.js";
import { sesion } from "../control/sesion.js";
import { escapar } from "../control/texto.js";
import OrdenService from "../control/orden_service.js";
import { ESTADOS, TEXTO_ESTADO, agruparProductos, siguienteEstado } from "../control/recepcion.js";
import "./lista_ordenes_pendientes.js";

/** Boton para avanzar segun el estado en que esta la orden. */
const ACCION = {
    RECIBIDA: "Empezar a preparar",
    PREPARANDO: "Enviar a la mesa",
    EN_CAMINO: "Marcar como entregada"
};

/**
 * <pagina-recepcion> (Recepcion de orden): el barista o cocinero ve las
 * ordenes que llegaron (<lista-ordenes-pendientes>), elige una, ve que productos
 * tiene que preparar y la avanza: Recibida -> En preparación -> En camino -> Entregada.
 * El estado se guarda en el backend (orden/{id}/estado), asi el cliente lo ve en
 * <seguimiento-orden>. Al cambiarlo dispara "cafefe:estado-orden" con { idOrden, estado }.
 * Propiedades reemplazables en pruebas: sesion, ordenService.
 */
class PaginaRecepcion extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.sesion = sesion;
        this.ordenService = new OrdenService();
        this.estados = {};        // idOrden -> estado que respondio el backend
        this.seleccion = null;    // { orden, productos, total, cliente }
        this.ocupado = false;
    }

    connectedCallback() {
        let datos = this.sesion.obtener();
        let saludo = datos ? `${escapar(datos.rol?.nombre ?? "")} ${escapar(datos.empleado.nombre)}` : "";
        this.shadowRoot.innerHTML = `
            ${ESTILOS}
            <style>
                .columnas { display: grid; gap: var(--esp-5); grid-template-columns: minmax(0, 1fr); align-items: start; }
                @media (min-width: 56rem) {
                    .columnas { grid-template-columns: minmax(0, 2fr) minmax(0, 3fr); }
                }
                .numero { margin: 0; font-size: var(--texto-sm); color: var(--color-texto-suave); }
                .estado {
                    display: inline-block;
                    padding: var(--esp-1) var(--esp-3);
                    border-radius: 999px;
                    font-size: var(--texto-sm);
                    font-weight: 700;
                    color: var(--color-texto);
                    background: var(--azul-palido);
                }
                .estado[data-estado="PREPARANDO"] { background: var(--color-aviso-fondo); color: var(--color-aviso); }
                .estado[data-estado="EN_CAMINO"] { background: var(--chambray); color: var(--expreso); }
                .estado[data-estado="ENTREGADA"] { background: var(--expreso); color: var(--pergamino); }
                .productos { margin: var(--esp-4) 0; padding: 0; list-style: none; }
                .productos li {
                    display: flex;
                    gap: var(--esp-3);
                    align-items: baseline;
                    padding: var(--esp-2) 0;
                    border-bottom: 1px solid var(--color-borde);
                    font-size: var(--texto-lg);
                }
                .cantidad { min-width: 3ch; font-family: var(--fuente-titulos); font-weight: 700; color: var(--color-primario); }
            </style>
            <h1>¡Hola, ${saludo}!</h1>
            <div class="columnas">
                <lista-ordenes-pendientes titulo="Órdenes por preparar"></lista-ordenes-pendientes>
                <section class="tarjeta" aria-labelledby="titulo-panel" aria-live="polite" id="panel"></section>
            </div>`;
        this.shadowRoot.addEventListener("cafefe:orden-seleccionada", e => this.elegirOrden(e.detail));
        this.mostrarSinSeleccion();
    }

    estadoDe(idOrden) {
        return this.estados[idOrden] ?? ESTADOS.RECIBIDA;
    }

    mostrarSinSeleccion() {
        this.shadowRoot.querySelector("#panel").innerHTML = `
            <h2 id="titulo-panel" class="solo-lector">Orden</h2>
            <p class="vacio">Seleccione una orden de la lista para ver qué preparar.</p>`;
    }

    /** Muestra la orden de una vez y luego pide al backend en que estado va. */
    async elegirOrden(seleccion) {
        this.seleccion = seleccion;
        this.mostrarOrden();
        let id = seleccion.orden.idOrden;
        try {
            this.estados[id] = (await this.ordenService.findEstado(id)).datos.estado;
        } catch (e) {
            this.mostrarOrden(e.mensaje || "No se pudo consultar el estado de la orden.");
            return;
        }
        if (this.seleccion === seleccion) {
            this.mostrarOrden();
        }
    }

    mostrarOrden(error = "") {
        let seleccion = this.seleccion;
        let id = seleccion.orden.idOrden;
        let estado = this.estadoDe(id);
        let cliente = seleccion.cliente || "Cliente sin nombre";
        let accion = estado === ESTADOS.ENTREGADA
            ? `<p class="alerta alerta--aviso" id="aviso" tabindex="-1">Orden entregada a ${escapar(cliente)}.</p>`
            : `<button type="button" class="boton ${estado === ESTADOS.EN_CAMINO ? "boton--acento" : ""} boton--bloque" id="avanzar"
                       ${this.ocupado ? "disabled" : ""}>${this.ocupado ? "Guardando…" : ACCION[estado]}</button>`;
        let panel = this.shadowRoot.querySelector("#panel");
        panel.innerHTML = `
            <h2 id="titulo-panel">Orden de ${escapar(cliente)}</h2>
            <p class="numero">Orden #${escapar(String(id).slice(0, 8).toUpperCase())}</p>
            <span class="estado" id="estado" data-estado="${estado}">${TEXTO_ESTADO[estado]}</span>
            <ul class="productos" aria-label="Productos a preparar">
                ${agruparProductos(seleccion.productos).map(p => `
                <li><span class="cantidad">${p.cantidad} ×</span><span>${escapar(p.nombre)}</span></li>`).join("")}
            </ul>
            <p class="alerta alerta--error" role="alert" id="error">${escapar(error)}</p>
            ${accion}`;
        panel.querySelector("#avanzar")?.addEventListener("click", () => this.avanzar());
    }

    /** Guarda el siguiente estado en el backend; si falla, la orden se queda como estaba. */
    async avanzar() {
        if (!this.seleccion || this.ocupado) {
            return;
        }
        let seleccion = this.seleccion;
        let id = seleccion.orden.idOrden;
        this.ocupado = true;
        this.mostrarOrden();
        let error = "";
        try {
            this.estados[id] = (await this.ordenService.cambiarEstado(id, siguienteEstado(this.estadoDe(id)))).datos.estado;
            this.dispatchEvent(new CustomEvent("cafefe:estado-orden", {
                detail: { idOrden: id, estado: this.estados[id] }, bubbles: true, composed: true
            }));
        } catch (e) {
            error = e.estado === 0
                ? "No se pudo guardar: no hay conexión con el servidor."
                : (e.mensaje || "No se pudo cambiar el estado de la orden.");
        } finally {
            this.ocupado = false;
        }
        if (this.seleccion === seleccion) {
            this.mostrarOrden(error);
            this.shadowRoot.querySelector("#avanzar, #aviso")?.focus();
        }
    }
}
customElements.define("pagina-recepcion", PaginaRecepcion);
export default PaginaRecepcion;