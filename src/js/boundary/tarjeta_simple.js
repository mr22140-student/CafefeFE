import { ESTILOS } from "./estilos.js";

/**
 * <tarjeta-simple> (vista en clase): tarjeta generica con tres slots.
 *   <tarjeta-simple>
 *     <span slot="titulo">...</span>
 *     <div slot="contenido">...</div>
 *     <div slot="pie">...</div>
 *   </tarjeta-simple>
 * Atributo "seleccionada": la resalta. Atributo "inactiva": la atenua.
 */
class TarjetaSimple extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            ${ESTILOS}
            <style>
                :host { height: 100%; }
                article {
                    display: flex;
                    flex-direction: column;
                    gap: var(--esp-2);
                    height: 100%;
                    padding: var(--esp-4);
                    border: 2px solid var(--color-borde);
                    border-radius: var(--radio);
                    background: var(--color-superficie);
                    box-shadow: var(--sombra);
                    transition: border-color var(--transicion), box-shadow var(--transicion);
                }
                :host([seleccionada]) article {
                    border-color: var(--color-acento);
                    box-shadow: var(--sombra-elevada);
                }
                :host([inactiva]) article { opacity: 0.55; }
                header { font-weight: 700; font-size: var(--texto-lg); }
                .contenido { flex: 1; }
            </style>
            <article part="tarjeta">
                <header><slot name="titulo"></slot></header>
                <div class="contenido"><slot name="contenido"></slot></div>
                <footer><slot name="pie"></slot></footer>
            </article>`;
    }
}
customElements.define("tarjeta-simple", TarjetaSimple);
export default TarjetaSimple;
