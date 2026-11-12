import { ESTILOS } from "./estilos.js";
import { TIPOS_PAGO, EFECTIVO, aCentavos, deCentavos, calcularResumen } from "../control/cobro.js";
import { escapar, moneda } from "../control/texto.js";

const NOMBRES = { EFECTIVO: "Efectivo", TARJETA: "Tarjeta", TRANSFERENCIA: "Transferencia" };

/**
 * <formulario-pago>: el cajero agrega una o varias formas de pago hasta cubrir el total.
 * - establecer(totalCentavos, yaPagadoCentavos) lo llama la pagina al elegir una orden
 * - tarjeta y transferencia piden referencia (lo exige el backend)
 * - el efectivo puede pasarse del saldo: se muestra el cambio
 * Cada cambio dispara "cafefe:pagos-cambiaron" con { pagos, resumen }.
 */
class FormularioPago extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.total = 0;
        this.yaPagado = 0;
        this.pagos = [];
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            ${ESTILOS}
            <style>
                fieldset { margin: 0; padding: 0; border: 0; }
                legend { font-weight: 700; font-size: var(--texto-lg); margin-bottom: var(--esp-3); }
                .fila { display: grid; gap: var(--esp-3); grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr)); align-items: start; }
                .fila .campo { margin-bottom: 0; }
                .acciones { display: flex; flex-wrap: wrap; gap: var(--esp-2); margin-top: var(--esp-3); }
                ul { margin: var(--esp-4) 0 0; padding: 0; list-style: none; display: grid; gap: var(--esp-2); }
                li {
                    display: flex; align-items: center; justify-content: space-between; gap: var(--esp-3);
                    padding: var(--esp-2) var(--esp-3); border-radius: var(--radio-sm); background: var(--color-primario-claro);
                }
                li .ref { font-size: var(--texto-xs); color: var(--color-texto-suave); }
                li .boton { min-height: 2rem; padding: 0 var(--esp-3); }
                dl { display: grid; grid-template-columns: 1fr auto; gap: var(--esp-1) var(--esp-4); margin: var(--esp-4) 0 0; }
                dt { color: var(--color-texto-suave); }
                dd { margin: 0; text-align: right; font-weight: 700; }
                .saldo { font-size: var(--texto-lg); color: var(--color-error); }
                .saldo.cubierto { color: var(--color-exito); }
                .alerta { margin-top: var(--esp-3); }
            </style>
            <form novalidate>
                <fieldset>
                    <legend>Formas de pago</legend>
                    <div class="fila">
                        <div class="campo">
                            <label for="tipo">Forma de pago</label>
                            <select id="tipo">${TIPOS_PAGO.map(t => `<option value="${t}">${NOMBRES[t]}</option>`).join("")}</select>
                        </div>
                        <div class="campo">
                            <label for="monto">Monto ($)</label>
                            <input id="monto" type="number" inputmode="decimal" min="0.01" step="0.01" required>
                        </div>
                        <div class="campo" id="campo-referencia" hidden>
                            <label for="referencia">Referencia</label>
                            <input id="referencia" autocomplete="off" aria-describedby="ayuda-referencia">
                            <span class="ayuda" id="ayuda-referencia">N.º de autorización o de transferencia</span>
                        </div>
                    </div>
                    <div class="acciones">
                        <button type="submit" class="boton">Agregar pago</button>
                        <button type="button" class="boton boton--secundario" id="completar">Completar saldo</button>
                    </div>
                    <p class="alerta alerta--error" role="alert" id="error"></p>
                </fieldset>
            </form>
            <ul id="pagos" aria-label="Pagos agregados"></ul>
            <dl aria-live="polite">
                <dt>Total</dt><dd id="total"></dd>
                <dt>Pagado</dt><dd id="pagado"></dd>
                <dt>Saldo</dt><dd id="saldo" class="saldo"></dd>
                <dt id="etiqueta-cambio" hidden>Cambio</dt><dd id="cambio" hidden></dd>
            </dl>`;

        let raiz = this.shadowRoot;
        raiz.querySelector("#tipo").addEventListener("change", () => this.actualizarReferencia());
        raiz.querySelector("#completar").addEventListener("click", () => {
            raiz.querySelector("#monto").value = deCentavos(this.resumen.saldo).toFixed(2);
            raiz.querySelector("#monto").focus();
        });
        raiz.querySelector("form").addEventListener("submit", evento => {
            evento.preventDefault();
            this.agregar();
        });
        this.actualizarReferencia();
        this.dibujar();
    }

    /** Lo llama la pagina cuando elige una orden. Borra los pagos agregados. */
    establecer(total, yaPagado = 0) {
        this.total = total;
        this.yaPagado = yaPagado;
        this.pagos = [];
        if (this.isConnected) {
            this.mostrarError("");
            this.shadowRoot.querySelector("#monto").value = "";
            this.dibujar();
        }
    }

    get resumen() {
        return calcularResumen(this.total, this.yaPagado, this.pagos);
    }

    actualizarReferencia() {
        let tipo = this.shadowRoot.querySelector("#tipo").value;
        let campo = this.shadowRoot.querySelector("#campo-referencia");
        campo.hidden = tipo === EFECTIVO;
        this.shadowRoot.querySelector("#referencia").required = tipo !== EFECTIVO;
    }

    agregar() {
        let raiz = this.shadowRoot;
        let tipoPago = raiz.querySelector("#tipo").value;
        let monto = aCentavos(raiz.querySelector("#monto").value);
        let referenciaExterna = raiz.querySelector("#referencia").value.trim();
        let saldo = this.resumen.saldo;

        let error = "";
        if (saldo <= 0) {
            error = "El total ya está cubierto.";
        } else if (!(monto > 0)) {
            error = "Escriba un monto mayor que cero.";
        } else if (tipoPago !== EFECTIVO && !referenciaExterna) {
            error = `Para ${NOMBRES[tipoPago].toLowerCase()} escriba la referencia.`;
        } else if (tipoPago !== EFECTIVO && monto > saldo) {
            error = `Con ${NOMBRES[tipoPago].toLowerCase()} no se puede pagar más que el saldo (${moneda(deCentavos(saldo))}).`;
        }
        this.mostrarError(error);
        if (error) {
            return;
        }

        this.pagos = [...this.pagos, { tipoPago, monto, referenciaExterna: tipoPago === EFECTIVO ? "" : referenciaExterna }];
        raiz.querySelector("#monto").value = "";
        raiz.querySelector("#referencia").value = "";
        this.dibujar();
        this.avisar();
        raiz.querySelector("#monto").focus();
    }

    quitar(indice) {
        this.pagos = this.pagos.filter((_, i) => i !== indice);
        this.dibujar();
        this.avisar();
    }

    mostrarError(mensaje) {
        this.shadowRoot.querySelector("#error").textContent = mensaje;
        this.shadowRoot.querySelector("#monto").setAttribute("aria-invalid", mensaje ? "true" : "false");
    }

    dibujar() {
        let raiz = this.shadowRoot;
        let r = this.resumen;
        raiz.querySelector("#pagos").innerHTML = this.pagos.map((p, i) => `
            <li>
                <span><strong>${NOMBRES[p.tipoPago]}</strong> ${moneda(deCentavos(p.monto))}
                    ${p.referenciaExterna ? `<span class="ref">Ref. ${escapar(p.referenciaExterna)}</span>` : ""}</span>
                <button type="button" class="boton boton--secundario" data-indice="${i}"
                        aria-label="Quitar pago de ${moneda(deCentavos(p.monto))} en ${NOMBRES[p.tipoPago].toLowerCase()}">Quitar</button>
            </li>`).join("");
        raiz.querySelectorAll("#pagos button").forEach(b => b.addEventListener("click", () => this.quitar(Number(b.dataset.indice))));

        raiz.querySelector("#total").textContent = moneda(deCentavos(r.total));
        raiz.querySelector("#pagado").textContent = moneda(deCentavos(r.pagado));
        let saldo = raiz.querySelector("#saldo");
        saldo.textContent = moneda(deCentavos(r.saldo));
        saldo.classList.toggle("cubierto", r.saldo === 0 && r.total > 0);
        raiz.querySelector("#cambio").textContent = moneda(deCentavos(r.cambio));
        raiz.querySelector("#cambio").hidden = r.cambio === 0;
        raiz.querySelector("#etiqueta-cambio").hidden = r.cambio === 0;
    }

    avisar() {
        this.dispatchEvent(new CustomEvent("cafefe:pagos-cambiaron", {
            detail: { pagos: this.pagos, resumen: this.resumen }, bubbles: true, composed: true
        }));
    }
}
customElements.define("formulario-pago", FormularioPago);
export default FormularioPago;
