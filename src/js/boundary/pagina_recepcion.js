import { ESTILOS } from "./estilos.js";
import { sesion } from "../control/sesion.js";
import { escapar } from "../control/texto.js";

/**
 * <pagina-recepcion> (HU3 Recepción de orden) — PENDIENTE.
 * Para barista/cocinero: listar las ordenes pendientes (OrdenService.findPendientes)
 * y al elegir una mostrar sus productos (OrdenProductoService.findByOrden).
 */
class PaginaRecepcion extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.sesion = sesion;
    }

    connectedCallback() {
        let datos = this.sesion.obtener();
        let nombre = datos ? escapar(datos.empleado.nombre) : "";
        this.shadowRoot.innerHTML = `
            ${ESTILOS}
            <h1>¡Hola, Barista ${nombre}!</h1>
            <div class="tarjeta">
                <p class="vacio">Órdenes pendientes: en construcción.</p>
            </div>`;
    }
}
customElements.define("pagina-recepcion", PaginaRecepcion);
export default PaginaRecepcion;
