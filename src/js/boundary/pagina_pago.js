import { ESTILOS } from "./estilos.js";
import { sesion } from "../control/sesion.js";
import { escapar } from "../control/texto.js";

/**
 * <pagina-pago> (HU4 Pago) — PENDIENTE.
 * Para el cajero: ordenes pendientes de pago, factura (FacturaService),
 * productos facturados (FacturaOrdenProductoService), pago + pago_detalle con varias
 * formas de pago hasta completar el total, y ticket para imprimir/guardar en PDF.
 * La factura usa this.sesion.obtener().idEmpleadoRol del cajero.
 */
class PaginaPago extends HTMLElement {
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
            <h1>¡Hola, Cajero ${nombre}!</h1>
            <div class="tarjeta">
                <p class="vacio">Pago de órdenes: en construcción.</p>
            </div>`;
    }
}
customElements.define("pagina-pago", PaginaPago);
export default PaginaPago;
