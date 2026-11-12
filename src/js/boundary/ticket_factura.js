import { ESTILOS } from "./estilos.js";
import { aCentavos, deCentavos } from "../control/cobro.js";
import { escapar, moneda } from "../control/texto.js";
import { formatearFecha } from "./lista_ordenes_pendientes.js";

const NOMBRES = { EFECTIVO: "Efectivo", TARJETA: "Tarjeta", TRANSFERENCIA: "Transferencia" };

/**
 * <ticket-factura>: comprobante del cobro (HU4).
 * Propiedad "datos": { factura, cajero, caja, productos, detalles, cambio (centavos) }.
 * "Imprimir / Guardar PDF" abre el dialogo de impresion del navegador con solo el
 * ticket (en un iframe oculto); ahi se elige "Guardar como PDF". Sin librerias.
 * "Nuevo cobro" dispara "cafefe:nuevo-cobro".
 */
class TicketFactura extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._datos = null;
        // se puede reemplazar en las pruebas para no abrir el dialogo real
        this.alImprimir = ventana => ventana.print();
    }

    set datos(valor) {
        this._datos = valor;
        if (this.isConnected) {
            this.dibujar();
        }
    }

    get datos() {
        return this._datos;
    }

    connectedCallback() {
        this.dibujar();
    }

    /** El HTML del ticket (se usa en pantalla y para imprimir). */
    contenido() {
        let d = this._datos;
        if (!d) {
            return "";
        }
        let total = d.productos.reduce((suma, p) => suma + aCentavos(p.precio), 0);
        let numero = (d.factura.idFactura ?? "").slice(0, 8).toUpperCase();
        return `
            <div class="ticket">
                <h2>CAFEFE</h2>
                <p class="centro">Pasa un cálido momento con nosotros</p>
                <p class="centro"><strong>Factura N.º ${escapar(numero)}</strong></p>
                <dl>
                    <dt>Fecha</dt><dd>${escapar(formatearFecha(d.factura.fechaFacturacion) || formatearFecha(new Date().toISOString()))}</dd>
                    <dt>Cliente</dt><dd>${escapar(d.factura.cliente || "Consumidor final")}</dd>
                    <dt>Cajero</dt><dd>${escapar(d.cajero)}</dd>
                    <dt>Caja</dt><dd>${escapar(d.caja)}</dd>
                </dl>
                <table>
                    <thead><tr><th scope="col">Producto</th><th scope="col" class="der">Precio</th></tr></thead>
                    <tbody>${d.productos.map(p => `
                        <tr><td>${escapar(p.idProducto?.nombre ?? "Producto")}</td><td class="der">${moneda(p.precio)}</td></tr>`).join("")}
                    </tbody>
                    <tfoot><tr><td>TOTAL</td><td class="der">${moneda(deCentavos(total))}</td></tr></tfoot>
                </table>
                <table class="pagos">
                    <tbody>${d.detalles.map(p => `
                        <tr><td>${escapar(NOMBRES[p.tipoPago] ?? p.tipoPago)}${p.referenciaExterna ? ` · Ref. ${escapar(p.referenciaExterna)}` : ""}</td>
                            <td class="der">${moneda(p.monto)}</td></tr>`).join("")}
                        ${d.cambio > 0 ? `<tr><td>Cambio</td><td class="der">${moneda(deCentavos(d.cambio))}</td></tr>` : ""}
                    </tbody>
                </table>
                <p class="centro">¡Gracias por su compra!</p>
            </div>`;
    }

    /** Estilos del ticket: los mismos en pantalla y en papel. */
    estilosTicket() {
        return `
            .ticket { max-width: 20rem; margin: 0 auto; font-family: "Courier New", ui-monospace, monospace; font-size: 0.875rem; color: #111; }
            .ticket h2 { margin: 0; text-align: center; letter-spacing: 0.2em; font-size: 1.25rem; }
            .centro { text-align: center; margin: 0.25rem 0; }
            .ticket dl { display: grid; grid-template-columns: auto 1fr; gap: 0.125rem 0.75rem; margin: 0.75rem 0; }
            .ticket dt { font-weight: 700; }
            .ticket dd { margin: 0; }
            .ticket table { width: 100%; border-collapse: collapse; margin: 0.5rem 0; }
            .ticket th, .ticket td { padding: 0.25rem 0; text-align: left; border-bottom: 1px dashed #999; }
            .ticket tfoot td { font-weight: 700; border-bottom: 0; }
            .ticket .der { text-align: right; }`;
    }

    dibujar() {
        this.shadowRoot.innerHTML = `
            ${ESTILOS}
            <style>
                ${this.estilosTicket()}
                .hoja { padding: var(--esp-5); border: 1px solid var(--color-borde); border-radius: var(--radio); background: #fff; }
                .exito { text-align: center; font-weight: 700; color: var(--color-exito); }
                .acciones { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--esp-3); margin-top: var(--esp-4); }
            </style>
            <p class="exito" role="status">Cobro registrado. La factura quedó pagada.</p>
            <div class="hoja">${this.contenido()}</div>
            <div class="acciones">
                <button type="button" class="boton" id="imprimir">Imprimir / Guardar PDF</button>
                <button type="button" class="boton boton--secundario" id="nuevo">Nuevo cobro</button>
            </div>`;
        this.shadowRoot.querySelector("#imprimir").addEventListener("click", () => this.imprimir());
        this.shadowRoot.querySelector("#nuevo").addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("cafefe:nuevo-cobro", { bubbles: true, composed: true }));
        });
    }

    /** Documento completo que se manda a imprimir. */
    documentoImprimible() {
        return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Ticket Cafefe</title>
            <style>@page { margin: 10mm; } body { margin: 0; } ${this.estilosTicket()}</style></head>
            <body>${this.contenido()}</body></html>`;
    }

    imprimir() {
        let marco = document.createElement("iframe");
        marco.setAttribute("aria-hidden", "true");
        marco.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
        marco.addEventListener("load", () => {
            marco.contentWindow.focus();
            this.alImprimir(marco.contentWindow);
            setTimeout(() => marco.remove(), 1000);
        }, { once: true });
        marco.srcdoc = this.documentoImprimible();
        document.body.appendChild(marco);
        return marco;
    }
}
customElements.define("ticket-factura", TicketFactura);
export default TicketFactura;
