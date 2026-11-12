import { ESTILOS } from "./estilos.js";
import { RUTA_INICIAL } from "../control/router.js";

/** <pagina-no-encontrada>: cuando el hash no corresponde a ninguna ruta. */
class PaginaNoEncontrada extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            ${ESTILOS}
            <section class="tarjeta vacio">
                <h1>Página no encontrada</h1>
                <p>La dirección que abrió no existe.</p>
                <a class="boton" href="#${RUTA_INICIAL}">Ir al inicio</a>
            </section>`;
    }
}
customElements.define("pagina-no-encontrada", PaginaNoEncontrada);
export default PaginaNoEncontrada;
