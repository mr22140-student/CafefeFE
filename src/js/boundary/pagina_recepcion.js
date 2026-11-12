import { ESTILOS } from "./estilos.js";
import { sesion } from "../control/sesion.js";
import { escapar } from "../control/texto.js";
import { ESTADOS, TEXTO_ESTADO, agruparProductos, siguienteEstado } from "../control/recepcion.js";
import "./lista_ordenes_pendientes.js";

/**
 * <pagina-recepcion> (HU3 Recepcion de orden): el barista o cocinero ve las ordenes que llegaron (<lista-ordenes-pendientes>), elige una, ve que productos tiene que preparar y la marca "En preparación" y luego "Lista para entregar".
El estado es solo visual (el backend no lo guarda) y dispara "cafefe:estado-orden" con { idOrden, estado }.
 */
class PaginaRecepcion extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.sesion = sesion;
        this.estados = {};        // idOrden -> NUEVA | PREPARANDO | LISTA
        this.seleccion = null;    // { orden, productos, total, cliente }
    }

    connectedCallback() {
        let datos = this.sesion.obtener();
        let saludo = datos ? `${escapar(datos.rol?.nombre ?? "")} ${escapar(datos.empleado.nombre)}` : "";
        this.shadowRoot.innerHTML = `
            ${ESTILOS}
            <style>
                .columnas { display: grid; gap: var(--esp-5); grid-template-columns: minmax(0, 1fr); align-items: start; }
                @media (min-width: 56rem) {
                    .columnas { grid-template-columns: minmax(0, 2fr) minmax(0, 3fr); }
                }
                .numero { margin: 0; font-size: var(--texto-sm); color: var(--color-texto-suave); }
                .estado {
                    display: inline-block;
                    padding: var(--esp-1) var(--esp-3);
                    border-radius: 999px;
                    font-size: var(--texto-sm);
                    font-weight: 700;
                    color: var(--color-texto);
                    background: var(--azul-palido);
                }
                .estado[data-estado="PREPARANDO"] { background: var(--color-aviso-fondo); color: var(--color-aviso); }
                .estado[data-estado="LISTA"] { background: var(--chambray); color: var(--expreso); }
                .productos { margin: var(--esp-4) 0; padding: 0; list-style: none; }
                .productos li {
                    display: flex;
                    gap: var(--esp-3);
                    align-items: baseline;
                    padding: var(--esp-2) 0;
                    border-bottom: 1px solid var(--color-borde);
                    font-size: var(--texto-lg);
                }
                .cantidad { min-width: 3ch; font-family: var(--fuente-titulos); font-weight: 700; color: var(--color-primario); }
            </style>
            <h1>¡Hola, ${saludo}!</h1>
            <div class="columnas">
                <lista-ordenes-pendientes titulo="Órdenes por preparar"></lista-ordenes-pendientes>
                <section class="tarjeta" aria-labelledby="titulo-panel" aria-live="polite" id="panel"></section>
            </div>`;
        this.shadowRoot.addEventListener("cafefe:orden-seleccionada", e => this.mostrarOrden(e.detail));
        this.mostrarSinSeleccion();
    }

    estadoDe(idOrden) {
        return this.estados[idOrden] ?? ESTADOS.NUEVA;
    }

    mostrarSinSeleccion() {
        this.shadowRoot.querySelector("#panel").innerHTML = `
            <h2 id="titulo-panel" class="solo-lector">Orden</h2>
            <p class="vacio">Seleccione una orden de la lista para ver qué preparar.</p>`;
    }

    mostrarOrden(seleccion) {
        this.seleccion = seleccion;
        let id = seleccion.orden.idOrden;
        let estado = this.estadoDe(id);
        let cliente = seleccion.cliente || "Cliente sin nombre";
        let accion = {
            NUEVA: `<button type="button" class="boton boton--bloque" id="avanzar">Empezar a preparar</button>`,
            PREPARANDO: `<button type="button" class="boton boton--acento boton--bloque" id="avanzar">Marcar como lista</button>`,
            LISTA: `<p class="alerta alerta--aviso" id="aviso">Llame a ${escapar(cliente)}: su orden está lista.</p>`
        }[estado];
        let panel = this.shadowRoot.querySelector("#panel");
        panel.innerHTML = `
            <h2 id="titulo-panel">Orden de ${escapar(cliente)}</h2>
            <p class="numero">Orden #${escapar(String(id).slice(0, 8).toUpperCase())}</p>
            <span class="estado" id="estado" data-estado="${estado}">${TEXTO_ESTADO[estado]}</span>
            <ul class="productos" aria-label="Productos a preparar">
                ${agruparProductos(seleccion.productos).map(p => `
                <li><span class="cantidad">${p.cantidad} ×</span><span>${escapar(p.nombre)}</span></li>`).join("")}
            </ul>
            ${accion}`;
        panel.querySelector("#avanzar")?.addEventListener("click", () => this.avanzar());
    }

    avanzar() {
        if (!this.seleccion) {
            return;
        }
        let id = this.seleccion.orden.idOrden;
        this.estados[id] = siguienteEstado(this.estadoDe(id));
        this.mostrarOrden(this.seleccion);
        this.shadowRoot.querySelector("#avanzar, #aviso")?.focus();
        this.dispatchEvent(new CustomEvent("cafefe:estado-orden", {
            detail: { idOrden: id, estado: this.estados[id] }, bubbles: true, composed: true
        }));
    }
}
customElements.define("pagina-recepcion", PaginaRecepcion);
export default PaginaRecepcion;