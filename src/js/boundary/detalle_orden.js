import { ESTILOS } from "./estilos.js";
import { aCentavos, deCentavos } from "../control/cobro.js";
import { escapar, moneda } from "../control/texto.js";

/**
 * <detalle-orden>: tabla con los productos de una orden y su total.
 * Se le asigna la propiedad "productos" (orden_producto con su idProducto).
 * Propiedad opcional "notas": { idOrdenProducto: "texto" } para marcar filas
 * (por ejemplo "Ya pagado").
 */
class DetalleOrden extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._productos = [];
        this.notas = {};
    }

    set productos(lista) {
        this._productos = lista ?? [];
        if (this.isConnected) {
            this.dibujar();
        }
    }

    get productos() {
        return this._productos;
    }

    connectedCallback() {
        this.dibujar();
    }

    dibujar() {
        let total = this._productos
            .filter(p => !this.notas[p.idOrdenProducto])
            .reduce((suma, p) => suma + aCentavos(p.precio), 0);
        this.shadowRoot.innerHTML = `
            ${ESTILOS}
            <style>
                table { width: 100%; border-collapse: collapse; }
                caption { text-align: left; font-weight: 700; margin-bottom: var(--esp-2); }
                th, td { padding: var(--esp-2); border-bottom: 1px solid var(--color-borde); text-align: left; vertical-align: top; }
                th { font-size: var(--texto-sm); color: var(--color-texto-suave); }
                .precio { text-align: right; white-space: nowrap; }
                .nota { display: block; font-size: var(--texto-xs); color: var(--color-texto-suave); }
                tfoot td { font-weight: 800; font-size: var(--texto-lg); border-bottom: 0; }
            </style>
            <table>
                <caption>Productos de la orden</caption>
                <thead><tr><th scope="col">Producto</th><th scope="col" class="precio">Precio</th></tr></thead>
                <tbody>${this._productos.map(p => `
                    <tr>
                        <td>${escapar(p.idProducto?.nombre ?? "Producto")}
                            ${this.notas[p.idOrdenProducto] ? `<span class="nota">${escapar(this.notas[p.idOrdenProducto])}</span>` : ""}</td>
                        <td class="precio">${moneda(p.precio)}</td>
                    </tr>`).join("")}
                </tbody>
                <tfoot><tr><td>Total a cobrar</td><td class="precio" id="total">${moneda(deCentavos(total))}</td></tr></tfoot>
            </table>`;
    }
}
customElements.define("detalle-orden", DetalleOrden);
export default DetalleOrden;
