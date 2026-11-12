import { ESTILOS } from "./estilos.js";
import { instalador, EVENTO_INSTALADOR } from "../control/instalador.js";

/**
 * <boton-instalar>: solo aparece cuando el navegador permite instalar la PWA.
 * Al hacer clic muestra el dialogo de instalacion del navegador.
 */
class BotonInstalar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.instalador = instalador;
        this.alCambiar = () => this.actualizar();
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            ${ESTILOS}
            <style>
                :host { display: inline-block; }
                .boton { min-height: 2.25rem; padding-block: var(--esp-1); background: var(--color-acento); }
                .boton:hover { background: var(--color-acento-oscuro); }
            </style>
            <button type="button" class="boton">
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14"/></svg>
                Instalar app
            </button>`;
        this.shadowRoot.querySelector("button").addEventListener("click", () => this.instalar());
        this.instalador.addEventListener(EVENTO_INSTALADOR, this.alCambiar);
        this.actualizar();
    }

    disconnectedCallback() {
        this.instalador.removeEventListener(EVENTO_INSTALADOR, this.alCambiar);
    }

    actualizar() {
        this.hidden = !this.instalador.disponible;
    }

    async instalar() {
        let aceptada = await this.instalador.instalar();
        this.dispatchEvent(new CustomEvent("cafefe:instalacion", { detail: { aceptada }, bubbles: true, composed: true }));
        this.actualizar();
    }
}
customElements.define("boton-instalar", BotonInstalar);
export default BotonInstalar;
