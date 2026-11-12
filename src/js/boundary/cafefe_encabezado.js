import { ESTILOS } from "./estilos.js";
import { sesion, EVENTO_SESION } from "../control/sesion.js";
import { rutasDelMenu, resolverRuta, RUTA_LOGIN } from "../control/router.js";
import { escapar } from "../control/texto.js";
import "./boton_instalar.js";

/**
 * <cafefe-encabezado>: logo, menu segun el rol, saludo, cerrar sesion e instalar.
 * Se vuelve a dibujar solo cuando cambia la sesion o la ruta (reactivo).
 */
class CafefeEncabezado extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.sesion = sesion;
        this.alCambiar = () => this.dibujar();
    }

    connectedCallback() {
        this.dibujar();
        window.addEventListener(EVENTO_SESION, this.alCambiar);
        window.addEventListener("hashchange", this.alCambiar);
    }

    disconnectedCallback() {
        window.removeEventListener(EVENTO_SESION, this.alCambiar);
        window.removeEventListener("hashchange", this.alCambiar);
    }

    dibujar() {
        let datos = this.sesion.obtener();
        let rol = this.sesion.rol();
        let actual = resolverRuta(window.location.hash, rol).ruta;
        let enlaces = rutasDelMenu(rol).map(r => `
            <a href="#${r.ruta}" ${r.ruta === actual ? 'aria-current="page"' : ""}>${escapar(r.titulo)}</a>`).join("");

        let cuenta = datos
            ? `<span class="saludo">Hola, <strong>${escapar(datos.empleado.nombre)}</strong> <span class="rol">${escapar(datos.rol.nombre)}</span></span>
               <button type="button" class="boton boton--secundario" id="salir">Cerrar sesión</button>`
            : `<a class="boton boton--secundario" href="#${RUTA_LOGIN}">Soy empleado</a>`;

        this.shadowRoot.innerHTML = `
            ${ESTILOS}
            <style>
                header {
                    background: var(--color-superficie);
                    border-bottom: 1px solid var(--color-borde);
                    box-shadow: var(--sombra);
                }
                .barra {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: var(--esp-3) var(--esp-5);
                    max-width: var(--ancho-contenido);
                    margin: 0 auto;
                    padding: var(--esp-3) var(--esp-4);
                }
                .marca {
                    display: flex;
                    align-items: center;
                    gap: var(--esp-2);
                    font-size: var(--texto-xl);
                    font-weight: 800;
                    letter-spacing: 0.04em;
                    color: var(--color-primario);
                    text-decoration: none;
                }
                nav { display: flex; flex-wrap: wrap; gap: var(--esp-1); flex: 1; }
                nav a {
                    padding: var(--esp-2) var(--esp-3);
                    border-radius: var(--radio-sm);
                    color: var(--color-texto);
                    font-weight: 600;
                    text-decoration: none;
                }
                nav a:hover { background: var(--color-primario-claro); }
                nav a[aria-current="page"] { color: var(--color-primario); background: var(--color-primario-claro); }
                .cuenta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--esp-3); }
                .saludo { font-size: var(--texto-sm); }
                .rol {
                    margin-left: var(--esp-1);
                    padding: 0 var(--esp-2);
                    border-radius: 999px;
                    font-size: var(--texto-xs);
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--color-acento);
                    background: #e3f2ef;
                }
                .cuenta .boton { min-height: 2.25rem; padding-block: var(--esp-1); }
                @media (max-width: 40rem) {
                    nav { order: 3; flex-basis: 100%; }
                }
            </style>
            <header>
                <div class="barra">
                    <a class="marca" href="#/orden" aria-label="Cafefe, ir al inicio">
                        <img src="recursos/iconos/icono-192.png" alt="" width="44" height="44">
                        CAFEFE
                    </a>
                    <nav aria-label="Principal">${enlaces}</nav>
                    <div class="cuenta">
                        <boton-instalar></boton-instalar>
                        ${cuenta}
                    </div>
                </div>
            </header>`;

        this.shadowRoot.querySelector("#salir")?.addEventListener("click", () => {
            this.sesion.cerrar();
            this.dispatchEvent(new CustomEvent("cafefe:navegar", { detail: { ruta: "/orden" }, bubbles: true, composed: true }));
        });
    }
}
customElements.define("cafefe-encabezado", CafefeEncabezado);
export default CafefeEncabezado;
