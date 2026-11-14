import { ESTILOS } from "./estilos.js";
import { cola, EVENTO_COLA } from "../control/cola_ordenes.js";

/**
 * <estado-conexion>: avisa cuando la app se queda sin internet y cuando vuelve. Usa role="status" para que los lectores de pantalla lo anuncien.
 * Tambien dice cuantas ordenes hay guardadas sin enviar y avisa cuando se envian.
 */
class EstadoConexion extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.alCambiar = () => this.actualizar(true); 
        this.cola = cola;
        this.alCambiarCola = evento => this.avisarCola(evento.detail);
        this.temporizador = null;
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            ${ESTILOS}
            <style>
                p {
                    margin: 0;
                    padding: var(--esp-2) var(--esp-4);
                    text-align: center;
                    font-size: var(--texto-sm);
                    font-weight: 600;
                }
                p[hidden] { display: none; }
                .fuera { color: var(--color-aviso); background: var(--color-aviso-fondo); }
                .dentro { color: #fff; background: var(--color-exito); }
            </style>
            <p role="status" aria-live="polite" hidden></p>`;
        window.addEventListener("online", this.alCambiar);
        window.addEventListener("offline", this.alCambiar);
        this.cola.addEventListener(EVENTO_COLA, this.alCambiarCola);
        this.actualizar(false);
    }

    disconnectedCallback() {
        window.removeEventListener("online", this.alCambiar);
        window.removeEventListener("offline", this.alCambiar);
        this.cola.removeEventListener(EVENTO_COLA, this.alCambiarCola);
        clearTimeout(this.temporizador);
    }

    get enLinea() {
        return navigator.onLine;
    }
    /** Avisa cuando se enviaron (o rechazaron) ordenes que estaban guardadas sin conexion. */
    avisarCola({ enviadas, rechazadas }) {
        let aviso = this.shadowRoot.querySelector("p");
        if (!this.enLinea) {
            this.actualizar(false);     
            return;
        }
        if (!enviadas.length && !rechazadas.length) {
            return;
        }
        clearTimeout(this.temporizador);
        let partes = [];
        if (enviadas.length) {
            partes.push(`Se ${enviadas.length === 1 ? "envió 1 orden que estaba guardada" : `enviaron ${enviadas.length} órdenes que estaban guardadas`}.`);
        }
        if (rechazadas.length) {
            partes.push(`${rechazadas.length === 1 ? "1 orden guardada no se pudo enviar" : `${rechazadas.length} órdenes guardadas no se pudieron enviar`}: ${rechazadas[0].mensaje}`);
        }
        aviso.className = rechazadas.length ? "fuera" : "dentro";
        aviso.textContent = partes.join(" ");
        aviso.hidden = false;
        this.temporizador = setTimeout(() => { aviso.hidden = true; }, 6000);
    }

    actualizar(huboCambio) {
        let aviso = this.shadowRoot.querySelector("p");
        clearTimeout(this.temporizador);
        if (!this.enLinea) {
            let pendientes = this.cola.pendientes().length;
            aviso.className = "fuera";
            aviso.textContent = "Sin conexión: puede ver el menú guardado y hacer su orden. Las pantallas de empleados necesitan conexión."
             + (pendientes ? ` Órdenes guardadas por enviar: ${pendientes}.` : "");
            aviso.hidden = false;
        } else if (huboCambio) {
            aviso.className = "dentro";
            aviso.textContent = "Conexión restablecida.";
            aviso.hidden = false;
            this.temporizador = setTimeout(() => { aviso.hidden = true; }, 3000);
        } else {
            aviso.hidden = true;
        }
    }
}
customElements.define("estado-conexion", EstadoConexion);
export default EstadoConexion;
