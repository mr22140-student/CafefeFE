import { ESTILOS } from "./estilos.js";
import OrdenService from "../control/orden_service.js";
import { ESTADOS, PASOS, TEXTO_ESTADO, MENSAJE_CLIENTE } from "../control/recepcion.js";

/**
 * <seguimiento-orden orden="{idOrden}">: el cliente ve en tiempo real como va su
 * orden en el local (Recibida -> En preparación -> En camino -> Entregada).
 * Cada "intervalo" ms pregunta al backend GET orden/{id}/estado; el barista lo
 * cambia desde <pagina-recepcion>. Deja de preguntar cuando la orden se entrega
 * o cuando el componente se quita de la pagina.
 * Dibujo de cada paso: recursos/imagenes/seguimiento/{ESTADO}.png (si no existe,
 * se muestra el numero del paso). Al cambiar dispara "cafefe:estado-cambio".
 * Propiedades reemplazables en pruebas: ordenService, intervalo.
 */
class SeguimientoOrden extends HTMLElement {
    static get observedAttributes() {
        return ["orden"];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.ordenService = new OrdenService();
        this.intervalo = 3000;
        this.estado = ESTADOS.RECIBIDA;
        this.temporizador = null;
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            ${ESTILOS}
            <style>
                :host { display: block; margin: var(--esp-5) 0; }
                ol {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: var(--esp-2);
                    margin: 0;
                    padding: 0;
                    list-style: none;
                    counter-reset: paso;
                }
                li { position: relative; display: grid; justify-items: center; gap: var(--esp-2); text-align: center; }
                /* la linea que une los pasos */
                li:not(:first-child)::before {
                    content: "";
                    position: absolute;
                    top: 2.25rem;
                    right: 50%;
                    width: 100%;
                    height: 6px;
                    border-radius: 3px;
                    background: var(--color-borde);
                    z-index: 0;
                }
                li.hecho::before, li.actual::before { background: var(--chambray); }
                .dibujo {
                    position: relative;
                    z-index: 1;
                    display: grid;
                    place-items: center;
                    width: 4.5rem;
                    height: 4.5rem;
                    border: 3px solid var(--color-borde);
                    border-radius: 50%;
                    overflow: hidden;
                    font-family: var(--fuente-titulos);
                    font-size: var(--texto-xl);
                    font-weight: 700;
                    color: var(--color-texto-suave);
                    background: var(--color-superficie);
                    filter: grayscale(1);
                    opacity: .55;
                    transition: transform var(--transicion), opacity var(--transicion);
                }
                .dibujo img { width: 100%; height: 100%; object-fit: contain; }
                li.hecho .dibujo, li.actual .dibujo { border-color: var(--chambray); color: var(--expreso); filter: none; opacity: 1; }
                li.actual .dibujo { transform: scale(1.15); border-color: var(--expreso); box-shadow: var(--sombra-elevada); }
                .nombre { font-size: var(--texto-sm); color: var(--color-texto-suave); }
                li.actual .nombre { font-weight: 700; color: var(--color-texto); }
                .mensaje { margin: var(--esp-5) 0 0; font-size: var(--texto-lg); font-weight: 600; }
                .conexion { margin: var(--esp-2) 0 0; font-size: var(--texto-xs); color: var(--color-texto-suave); }
                @media (prefers-reduced-motion: reduce) { .dibujo { transition: none; } }
            </style>
            <h3 class="solo-lector" id="titulo-seguimiento">Estado de su orden</h3>
            <ol aria-labelledby="titulo-seguimiento">${PASOS.map((paso, i) => `
                <li data-paso="${paso}">
                    <span class="dibujo" aria-hidden="true">
                        <img alt="" src="recursos/imagenes/seguimiento/${paso}.png">
                    </span>
                    <span class="nombre">${TEXTO_ESTADO[paso]}</span>
                </li>`).join("")}
            </ol>
            <p class="mensaje" id="mensaje" role="status" aria-live="polite"></p>
            <p class="conexion" id="conexion"></p>`;
        this.shadowRoot.querySelectorAll(".dibujo img").forEach((img, i) => {
            // sin dibujo todavia: se queda el numero del paso
            img.addEventListener("error", () => img.replaceWith(String(i + 1)), { once: true });
        });
        this.dibujar();
        this.empezar();
    }

    disconnectedCallback() {
        this.detener();
    }

    attributeChangedCallback() {
        if (this.isConnected) {
            this.estado = ESTADOS.RECIBIDA;
            this.dibujar();
            this.empezar();
        }
    }

    empezar() {
        this.detener();
        if (this.getAttribute("orden")) {
            this.consultar();
            this.temporizador = setInterval(() => this.consultar(), this.intervalo);
        }
    }

    detener() {
        clearInterval(this.temporizador);
        this.temporizador = null;
    }

    async consultar() {
        let conexion = this.shadowRoot.querySelector("#conexion");
        try {
            let estado = (await this.ordenService.findEstado(this.getAttribute("orden"))).datos.estado;
            conexion.textContent = "";
            if (estado !== this.estado) {
                this.estado = estado;
                this.dibujar();
                this.dispatchEvent(new CustomEvent("cafefe:estado-cambio", {
                    detail: { idOrden: this.getAttribute("orden"), estado }, bubbles: true, composed: true
                }));
            }
            if (estado === ESTADOS.ENTREGADA) {
                this.detener();
            }
        } catch (e) {
            // se sigue intentando en la siguiente vuelta
            conexion.textContent = "Sin conexión con el servidor; reintentando…";
        }
    }

    dibujar() {
        let actual = Math.max(PASOS.indexOf(this.estado), 0);
        this.shadowRoot.querySelectorAll("li").forEach((li, i) => {
            li.classList.toggle("hecho", i < actual);
            li.classList.toggle("actual", i === actual);
            if (i === actual) {
                li.setAttribute("aria-current", "step");
            } else {
                li.removeAttribute("aria-current");
            }
        });
        this.shadowRoot.querySelector("#mensaje").textContent = MENSAJE_CLIENTE[PASOS[actual]];
    }
}
customElements.define("seguimiento-orden", SeguimientoOrden);
export default SeguimientoOrden;