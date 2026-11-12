import { ESTILOS } from "./estilos.js";

/**
 * <estado-conexion>: avisa cuando la app se queda sin internet y cuando vuelve.
 * Usa role="status" para que los lectores de pantalla lo anuncien.
 */
class EstadoConexion extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.alCambiar = () => this.actualizar(true);
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
        this.actualizar(false);
    }

    disconnectedCallback() {
        window.removeEventListener("online", this.alCambiar);
        window.removeEventListener("offline", this.alCambiar);
        clearTimeout(this.temporizador);
    }

    get enLinea() {
        return navigator.onLine;
    }

    actualizar(huboCambio) {
        let aviso = this.shadowRoot.querySelector("p");
        clearTimeout(this.temporizador);
        if (!this.enLinea) {
            aviso.className = "fuera";
            aviso.textContent = "Sin conexión: puede seguir usando la app; los cambios se enviarán al volver la conexión.";
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
