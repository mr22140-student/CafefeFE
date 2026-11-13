import FacturaService from "./factura_service.js";
import FacturaOrdenProductoService from "./factura_orden_producto_service.js";
import PagoService from "./pago_service.js";
import PagoDetalleService from "./pago_detalle_service.js";
import DefaultError from "../entity/default_error.js";
import { leerCliente } from "./texto.js";

/** Formas de pago que acepta el backend (PagoDetalleDAO.TIPOS_PAGO). */
export const TIPOS_PAGO = ["EFECTIVO", "TARJETA", "TRANSFERENCIA"];
export const EFECTIVO = "EFECTIVO";

const PENDIENTE = "PENDIENTE";
const COMPLETADO = "COMPLETADO";
const ANULADO = "ANULADO";

/** El dinero se maneja en centavos enteros para no tener errores de decimales (0.1 + 0.2). */
export function aCentavos(valor) {
    return Math.round(Number(valor ?? 0) * 100);
}

export function deCentavos(centavos) {
    return Number((centavos / 100).toFixed(2));
}

/**
 * Total, pagado, saldo y cambio de un cobro (todo en centavos).
 * Solo el EFECTIVO puede pasarse del saldo: lo que sobra es el cambio.
 * @param total      total de la orden
 * @param yaPagado   montos que ya estaban registrados en el backend
 * @param pagos      [{tipoPago, monto (centavos), referenciaExterna}]
 */
export function calcularResumen(total, yaPagado, pagos) {
    let recibido = yaPagado + pagos.reduce((suma, p) => suma + p.monto, 0);
    let saldo = Math.max(total - recibido, 0);
    let cambio = Math.max(recibido - total, 0);
    return { total, pagado: Math.min(recibido, total), saldo, cambio, recibido };
}

/**
 * Convierte lo que el cajero escribio en lo que se registra en el backend:
 * el backend no acepta un monto mayor al saldo, asi que el efectivo que sobra
 * se registra hasta completar y el resto se devuelve como cambio.
 * @returns {{registrar: Array, cambio: number}} montos en centavos
 */
export function prepararPagos(saldoInicial, pagos) {
    let restante = saldoInicial;
    let registrar = [];
    let cambio = 0;
    for (let pago of pagos) {
        if (pago.monto <= 0) {
            continue;
        }
        if (pago.monto > restante && pago.tipoPago !== EFECTIVO) {
            throw crearError(`El pago con ${pago.tipoPago.toLowerCase()} no puede ser mayor que el saldo.`);
        }
        let monto = Math.min(pago.monto, restante);
        cambio += pago.monto - monto;
        restante -= monto;
        if (monto > 0) {
            registrar.push({ ...pago, monto });
        }
    }
    return { registrar, cambio };
}

/**
 * se busca la observacion
 * "Cliente: Nombre". Las observaciones de las ordenes del backend (notas de los meseros,
 * descuentos...) no son nombres y se ignoran: devuelve "".
 */
export function clienteDeOrden(productos) {
    for (let producto of productos ?? []) {
        let nombre = leerCliente(producto.observaciones);
        if (nombre) {
            return nombre;
        }
    }
    return "";
}

function crearError(mensaje, causa = null) {
    let error = new DefaultError();
    error.mensaje = mensaje;
    error.error = causa;
    return error;
}

/**
 * Logica de la HU4 (Pago), separada de la pantalla para poder probarla.
 *
 * cargarOrden(): revisa que productos de la orden faltan por facturar y si quedo
 *   una factura PENDIENTE de un intento anterior (por ejemplo, se fue la conexion).
 * cobrar(): factura -> productos facturados -> pago -> detalles de pago -> pago COMPLETADO.
 *   Al completar el pago, el backend deja la factura PAGADA y la orden deja de estar pendiente.
 */
class Cobro {
    constructor(facturaService = new FacturaService(), facturaOrdenProductoService = new FacturaOrdenProductoService(),
        pagoService = new PagoService(), pagoDetalleService = new PagoDetalleService()) {
        this.facturaService = facturaService;
        this.facturaOrdenProductoService = facturaOrdenProductoService;
        this.pagoService = pagoService;
        this.pagoDetalleService = pagoDetalleService;
    }

    /**
     * @param productos los orden_producto de la orden
     * @returns {Promise<{porFacturar, enFactura, yaPagados, factura, pago, detallesPrevios, total, yaPagado}>}
     */
    async cargarOrden(productos) {
        let disponibles = (await this.facturaOrdenProductoService.findDisponibles()).datos;
        let idsDisponibles = new Set(disponibles.map(d => d.idOrdenProducto));
        let porFacturar = productos.filter(p => idsDisponibles.has(p.idOrdenProducto));
        let facturados = productos.filter(p => !idsDisponibles.has(p.idOrdenProducto));

        let factura = null;
        let enFactura = [];
        if (facturados.length > 0) {
            let encontrada = await this.buscarFacturaPendiente(facturados.map(p => p.idOrdenProducto));
            if (encontrada) {
                factura = encontrada.factura;
                let ids = new Set(encontrada.detalles.map(d => d.idOrdenProducto.idOrdenProducto));
                enFactura = facturados.filter(p => ids.has(p.idOrdenProducto));
            }
        }
        let idsEnFactura = new Set(enFactura.map(p => p.idOrdenProducto));
        let yaPagados = facturados.filter(p => !idsEnFactura.has(p.idOrdenProducto));

        let pago = null;
        let detallesPrevios = [];
        if (factura) {
            pago = await this.buscarPagoActivo(factura.idFactura);
            if (pago) {
                detallesPrevios = (await this.pagoDetalleService.findByPago(pago.idPago)).datos;
            }
        }

        let total = [...porFacturar, ...enFactura].reduce((suma, p) => suma + aCentavos(p.precio), 0);
        let yaPagado = detallesPrevios.reduce((suma, d) => suma + aCentavos(d.monto), 0);
        return { porFacturar, enFactura, yaPagados, factura, pago, detallesPrevios, total, yaPagado };
    }

    async buscarFacturaPendiente(idsOrdenProducto) {
        let facturas = (await this.facturaService.findRange(0, 100)).datos.filter(f => f.estado === PENDIENTE);
        for (let factura of facturas) {
            let detalles = (await this.facturaOrdenProductoService.findByFactura(factura.idFactura)).datos;
            if (detalles.some(d => idsOrdenProducto.includes(d.idOrdenProducto.idOrdenProducto))) {
                return { factura, detalles };
            }
        }
        return null;
    }

    async buscarPagoActivo(idFactura) {
        let pagos = (await this.pagoService.findRange(0, 100)).datos;
        return pagos.find(p => p.idFactura && p.idFactura.idFactura === idFactura && p.estado !== ANULADO) ?? null;
    }

    /**
     * Registra el cobro completo en el backend.
     * @param estado     lo que devolvio cargarOrden()
     * @param datos      { cliente, idCaja, idEmpleadoRol, pagos: [{tipoPago, monto (centavos), referenciaExterna}] }
     * @returns {Promise<{factura, pago, detalles, cambio}>}
     */
    async cobrar(estado, datos) {
        if (estado.total <= 0) {
            throw crearError("La orden no tiene productos por cobrar.");
        }
        let saldo = estado.total - estado.yaPagado;
        let { registrar, cambio } = prepararPagos(saldo, datos.pagos);
        let registrado = registrar.reduce((suma, p) => suma + p.monto, 0);
        if (registrado < saldo) {
            throw crearError("Falta cubrir el saldo antes de cobrar.");
        }

        let cliente = (datos.cliente ?? "").trim();
        let factura = estado.factura;
        if (!factura) {
            factura = (await this.facturaService.create({
                cliente,
                observaciones: "",
                idCaja: { idCaja: datos.idCaja },
                idEmpleadoRol: { idEmpleadoRol: datos.idEmpleadoRol }
            })).datos;
        } else if (cliente && cliente !== factura.cliente) {
            factura = (await this.facturaService.update(factura.idFactura, { ...factura, cliente })).datos;
        }

        for (let producto of estado.porFacturar) {
            await this.facturaOrdenProductoService.create({
                observaciones: "",
                idFactura: { idFactura: factura.idFactura },
                idOrdenProducto: { idOrdenProducto: producto.idOrdenProducto }
            });
        }

        let pago = estado.pago;
        if (!pago) {
            pago = (await this.pagoService.create({ observaciones: "", idFactura: { idFactura: factura.idFactura } })).datos;
        }

        let detalles = [...estado.detallesPrevios];
        for (let p of registrar) {
            let detalle = (await this.pagoDetalleService.create({
                tipoPago: p.tipoPago,
                monto: deCentavos(p.monto),
                referenciaExterna: p.referenciaExterna ?? "",
                observaciones: "",
                idPago: { idPago: pago.idPago }
            })).datos;
            detalles.push(detalle);
        }

        pago = (await this.pagoService.update(pago.idPago, {
            idPago: pago.idPago,
            estado: COMPLETADO,
            observaciones: pago.observaciones ?? "",
            idFactura: { idFactura: factura.idFactura }
        })).datos;

        return { factura, pago, detalles, cambio };
    }
}
export default Cobro;
