import { ESTILOS } from "./estilos.js";
import { sesion } from "../control/sesion.js";
import CajaService from "../control/caja_service.js";
import OrdenService from "../control/orden_service.js";
import Cobro, { clienteDeOrden, deCentavos, puedeCobrarse } from "../control/cobro.js";import { escapar, moneda } from "../control/texto.js";
import "./lista_ordenes_pendientes.js";
import "./detalle_orden.js";
import "./formulario_pago.js";
import "./ticket_factura.js";

/**
 * <pagina-pago> (HU4): el cajero ve las ordenes pendientes de pago, elige una,
 * registra una o varias formas de pago hasta cubrir el total, cobra y obtiene
 * el ticket para imprimir o guardar en PDF.
 *
 * Componentes que usa: <lista-ordenes-pendientes>, <detalle-orden>,
 * <formulario-pago> y <ticket-factura>. La logica esta en control/cobro.js.
 * Solo se puede cobrar una orden que el barista ya empezo a preparar (puedeCobrarse).
 * Propiedades reemplazables en pruebas: sesion, cajaService, ordenService, cobro.
 */
class PaginaPago extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.sesion = sesion;
        this.cajaService = new CajaService();
        this.ordenService = new OrdenService();
        this.cobro = new Cobro();
        this.cajas = [];
        this.seleccion = null;   // { orden, productos, total, cliente }
        this.estado = null;      // lo que devuelve cobro.cargarOrden()
        this.alCambiarConexion = () => this.actualizarBotonCobrar();
    }

    connectedCallback() {
        let datos = this.sesion.obtener();
        let nombre = datos ? escapar(datos.empleado.nombre) : "";
        this.shadowRoot.innerHTML = `
            ${ESTILOS}
            <style>
                .cabecera { display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: var(--esp-3); margin-bottom: var(--esp-5); }
                .cabecera h1 { margin: 0; }
                .cabecera .campo { margin: 0; min-width: 12rem; }
                .columnas { display: grid; gap: var(--esp-5); grid-template-columns: minmax(0, 1fr); align-items: start; }
                @media (min-width: 56rem) {
                    .columnas { grid-template-columns: minmax(0, 2fr) minmax(0, 3fr); }
                }
                .panel { display: grid; gap: var(--esp-5); }
                .cobrar { font-size: var(--texto-lg); min-height: 3.25rem; }
                .estado-orden { font-size: var(--texto-sm); color: var(--color-texto-suave); margin: 0; }
            </style>
            <div class="cabecera">
                <h1>¡Hola, Cajero ${nombre}!</h1>
                <div class="campo">
                    <label for="caja">Caja</label>
                    <select id="caja"><option value="">Cargando cajas…</option></select>
                </div>
            </div>
            <p class="alerta alerta--error" role="alert" id="error-caja"></p>
            <div class="columnas">
                 <lista-ordenes-pendientes con-estado titulo="Órdenes pendientes de pago"></lista-ordenes-pendientes>
                 <section class="panel tarjeta" aria-labelledby="titulo-panel" aria-live="polite" id="panel"></section>
            </div>`;

        this.shadowRoot.addEventListener("cafefe:orden-seleccionada", evento => this.elegirOrden(evento.detail));
        this.shadowRoot.addEventListener("cafefe:pagos-cambiaron", () => this.actualizarBotonCobrar());
        this.shadowRoot.addEventListener("cafefe:nuevo-cobro", () => this.reiniciar());
        this.shadowRoot.addEventListener("cafefe:orden-ya-no-pendiente", evento => this.ordenRetirada(evento.detail.idOrden));
        window.addEventListener("online", this.alCambiarConexion);
        window.addEventListener("offline", this.alCambiarConexion);
        this.mostrarSinSeleccion();
        this.cargarCajas();
    }

    disconnectedCallback() {
        window.removeEventListener("online", this.alCambiarConexion);
        window.removeEventListener("offline", this.alCambiarConexion);
    }

    get enLinea() {
        return navigator.onLine;
    }

    async cargarCajas() {
        let select = this.shadowRoot.querySelector("#caja");
        try {
            this.cajas = (await this.cajaService.findRange(0, 100)).datos.filter(c => c.activo !== false);
            if (this.cajas.length === 0) {
                select.innerHTML = `<option value="">Sin cajas</option>`;
                this.shadowRoot.querySelector("#error-caja").textContent = "No hay cajas activas. Cree una caja en el backend para poder cobrar.";
            } else {
                select.innerHTML = this.cajas.map(c => `<option value="${escapar(c.idCaja)}">${escapar(c.nombre)}</option>`).join("");
            }
        } catch (e) {
            select.innerHTML = `<option value="">Sin cajas</option>`;
            this.shadowRoot.querySelector("#error-caja").textContent = e.mensaje || "No se pudieron cargar las cajas.";
        }
        this.actualizarBotonCobrar();
    }

    mostrarSinSeleccion() {
        this.shadowRoot.querySelector("#panel").innerHTML = `
            <h2 id="titulo-panel" class="solo-lector">Cobro</h2>
            <p class="vacio">Seleccione una orden de la lista para cobrarla.</p>`;
    }

    async elegirOrden(seleccion) {
        this.seleccion = seleccion;
        this.estado = null;
        let panel = this.shadowRoot.querySelector("#panel");
        panel.innerHTML = `<h2 id="titulo-panel">Cobro</h2><p class="vacio">Revisando la orden…</p>`;
        try {
            this.estado = await this.cobro.cargarOrden(seleccion.productos);
        } catch (e) {
            panel.innerHTML = `<h2 id="titulo-panel">Cobro</h2>
                <p class="alerta alerta--error" role="alert">${escapar(e.mensaje || "No se pudo revisar la orden.")}</p>`;
            return;
        }
        // la seleccion pudo cambiar mientras se esperaba la respuesta
        if (this.seleccion !== seleccion) {
            return;
        }
        this.dibujarCobro();
    }

    dibujarCobro() {
        let { seleccion, estado } = this;
        let panel = this.shadowRoot.querySelector("#panel");
        let cliente = estado.factura?.cliente && estado.factura.cliente !== "Consumidor final"
            ? estado.factura.cliente
            : clienteDeOrden(seleccion.productos);

        panel.innerHTML = `
            <h2 id="titulo-panel">Cobro</h2>
            ${estado.factura ? `<p class="estado-orden">Esta orden ya tenía una factura pendiente; se continuará con ella.</p>` : ""}
            <detalle-orden></detalle-orden>
            <div class="campo">
                <label for="cliente">Nombre del cliente en la factura</label>
                <input id="cliente" maxlength="155" autocomplete="off" placeholder="Consumidor final" value="${escapar(cliente)}">
            </div>
            ${seleccion.actualizada ? `<p class="alerta alerta--aviso" role="status">La orden cambió: se actualizaron sus productos y el total. Vuelva a ingresar los pagos.</p>` : ""}
            <p class="alerta alerta--aviso" role="status" id="aviso-preparacion">${puedeCobrarse(seleccion.estado) ? "" : escapar(this.textoEsperando(seleccion.estado))}</p>
            <formulario-pago></formulario-pago>
            <p class="alerta alerta--error" role="alert" id="error-cobro"></p>
            <button type="button" class="boton boton--acento boton--bloque cobrar" id="cobrar" disabled>Cobrar</button>`;

        let notas = {};
        estado.yaPagados.forEach(p => { notas[p.idOrdenProducto] = "Ya pagado"; });
        let detalle = panel.querySelector("detalle-orden");
        detalle.notas = notas;
        detalle.productos = seleccion.productos;

        panel.querySelector("formulario-pago").establecer(estado.total, estado.yaPagado);
        panel.querySelector("#cobrar").addEventListener("click", () => this.cobrar());
        this.actualizarBotonCobrar();
    }

    actualizarBotonCobrar() {
        let boton = this.shadowRoot.querySelector("#cobrar");
        let formulario = this.shadowRoot.querySelector("formulario-pago");
        if (!boton || !formulario || !this.estado) {
            return;
        }
        let resumen = formulario.resumen;
        let hayCaja = Boolean(this.shadowRoot.querySelector("#caja").value);
        let preparada = puedeCobrarse(this.seleccion?.estado);
        boton.disabled = !(resumen.total > 0 && resumen.saldo === 0 && hayCaja && this.enLinea && preparada);
        boton.textContent = !this.enLinea
            ? "Sin conexión: no se puede cobrar"
            : !preparada
                ? "Esperando que el barista la prepare"
                : resumen.saldo > 0
                ? `Falta ${moneda(deCentavos(resumen.saldo))} por pagar`
                : `Cobrar ${moneda(deCentavos(resumen.total))}`;
    }

    async cobrar() {
        let raiz = this.shadowRoot;
        let boton = raiz.querySelector("#cobrar");
        let error = raiz.querySelector("#error-cobro");
        let datosSesion = this.sesion.obtener();
        error.textContent = "";
        boton.disabled = true;
        boton.textContent = "Registrando el cobro…";
        let idCaja = raiz.querySelector("#caja").value;
        try {
            // se vuelve a preguntar el estado: la lista pudo quedar desactualizada
            let estado = (await this.ordenService.findEstado(this.seleccion.orden.idOrden)).datos.estado;
            this.seleccion.estado = estado;
            if (!puedeCobrarse(estado)) {
                raiz.querySelector("#aviso-preparacion").textContent = this.textoEsperando(estado);
                throw { mensaje: "Todavía no se puede cobrar: el barista no ha empezado a preparar esta orden." };
            }
            let resultado = await this.cobro.cobrar(this.estado, {
                cliente: raiz.querySelector("#cliente").value,
                idCaja,
                idEmpleadoRol: datosSesion.idEmpleadoRol,
                pagos: raiz.querySelector("formulario-pago").pagos
            });
            this.mostrarTicket(resultado, idCaja, datosSesion);
            raiz.querySelector("lista-ordenes-pendientes").cargar();
            this.dispatchEvent(new CustomEvent("cafefe:orden-cobrada", { detail: resultado, bubbles: true, composed: true }));
        } catch (e) {
            error.textContent = e.mensaje || "No se pudo registrar el cobro.";
            this.actualizarBotonCobrar();
        }
    }

    mostrarTicket(resultado, idCaja, datosSesion) {
        let caja = this.cajas.find(c => c.idCaja === idCaja);
        let cobrados = new Set([...this.estado.porFacturar, ...this.estado.enFactura].map(p => p.idOrdenProducto));
        let panel = this.shadowRoot.querySelector("#panel");
        panel.innerHTML = `<h2 id="titulo-panel">Ticket</h2><ticket-factura></ticket-factura>`;
        panel.querySelector("ticket-factura").datos = {
            factura: resultado.factura,
            cajero: `${datosSesion.empleado.nombre} ${datosSesion.empleado.apellido ?? ""}`.trim(),
            caja: caja ? caja.nombre : "",
            productos: this.seleccion.productos.filter(p => cobrados.has(p.idOrdenProducto)),
            detalles: resultado.detalles,
            cambio: resultado.cambio
        };
        this.seleccion = null;
        this.estado = null;
        panel.querySelector("ticket-factura").shadowRoot.querySelector("#imprimir")?.focus();
    }

    textoEsperando(estado) {
        return estado
            ? "El barista todavía no ha empezado a preparar esta orden. Podrá cobrarla cuando esté en preparación."
            : "No se pudo consultar si la orden ya se está preparando. Use Actualizar en la lista.";
    }

    /** La orden elegida ya no esta pendiente (por ejemplo, la cobro otra caja). */
    ordenRetirada(idOrden) {
        if (!this.seleccion || this.seleccion.orden.idOrden !== idOrden) {
            return;
        }
        this.reiniciar();
        this.shadowRoot.querySelector("#panel").insertAdjacentHTML("afterbegin",
            `<p class="alerta alerta--aviso" role="status">La orden que tenía seleccionada ya no está pendiente de pago.</p>`);
    }

    reiniciar() {
        this.seleccion = null;
        this.estado = null;
        this.mostrarSinSeleccion();
    }
}
customElements.define("pagina-pago", PaginaPago);
export default PaginaPago;
