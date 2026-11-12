import { ESTILOS } from "./estilos.js";
import { sesion, EVENTO_SESION } from "../control/sesion.js";
import { resolverRuta, navegar } from "../control/router.js";
import "./cafefe_encabezado.js";
import "./estado_conexion.js";
import "./pagina_login.js";
import "./pagina_orden.js";
import "./pagina_recepcion.js";
import "./pagina_pago.js";
import "./pagina_no_encontrada.js";

/**
 * <cafefe-app>: componente raiz de la SPA.
 * Escucha el hash de la URL y cambia la pagina sin recargar.
 * Las paginas piden navegar con el evento "cafefe:navegar" { detail: { ruta } }.
 */
class CafefeApp extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.sesion = sesion;
        this.alCambiarRuta = () => this.mostrarRuta();
        this.alNavegar = evento => navegar(evento.detail.ruta);
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            ${ESTILOS}
            <style>
                :host { display: flex; flex-direction: column; min-height: 100vh; }
                .saltar {
                    position: absolute;
                    left: var(--esp-2);
                    top: -4rem;
                    z-index: 10;
                    padding: var(--esp-2) var(--esp-3);
                    border-radius: var(--radio-sm);
                    color: #fff;
                    background: var(--color-primario);
                }
                .saltar:focus { top: var(--esp-2); }
                main {
                    flex: 1;
                    width: 100%;
                    max-width: var(--ancho-contenido);
                    margin: 0 auto;
                    padding: var(--esp-5) var(--esp-4) var(--esp-8);
                }
                main:focus { outline: none; }
                footer {
                    padding: var(--esp-4);
                    text-align: center;
                    font-size: var(--texto-xs);
                    color: var(--color-texto-suave);
                }
            </style>
            <a class="saltar" href="#contenido">Saltar al contenido</a>
            <cafefe-encabezado></cafefe-encabezado>
            <estado-conexion></estado-conexion>
            <main id="contenido" tabindex="-1"></main>
            <footer>Cafefe · PPI115 2026</footer>`;

        // "Saltar al contenido" mueve el foco sin tocar el hash (el hash es del router)
        this.shadowRoot.querySelector(".saltar").addEventListener("click", evento => {
            evento.preventDefault();
            this.shadowRoot.querySelector("main").focus();
        });

        window.addEventListener("hashchange", this.alCambiarRuta);
        window.addEventListener(EVENTO_SESION, this.alCambiarRuta);
        this.addEventListener("cafefe:navegar", this.alNavegar);
        this.mostrarRuta();
    }

    disconnectedCallback() {
        window.removeEventListener("hashchange", this.alCambiarRuta);
        window.removeEventListener(EVENTO_SESION, this.alCambiarRuta);
        this.removeEventListener("cafefe:navegar", this.alNavegar);
    }

    mostrarRuta() {
        let destino = resolverRuta(window.location.hash, this.sesion.rol());
        let main = this.shadowRoot.querySelector("main");
        let actual = main.firstElementChild;

        // Si ya se esta mostrando esa pagina (por ejemplo, solo cambio la sesion), no se recrea
        if (actual && actual.localName === destino.elemento && !destino.redirigido) {
            return;
        }
        if (destino.redirigido) {
            history.replaceState(null, "", "#" + destino.ruta);
        }

        let pagina = document.createElement(destino.elemento);
        if (destino.destino) {
            pagina.setAttribute("destino", destino.destino);
        }
        main.replaceChildren(pagina);
        document.title = `${destino.titulo} · Cafefe`;
        main.focus({ preventScroll: true });
        window.scrollTo(0, 0);
        this.dispatchEvent(new CustomEvent("cafefe:ruta", { detail: destino, bubbles: true, composed: true }));
    }
}
customElements.define("cafefe-app", CafefeApp);
export default CafefeApp;
