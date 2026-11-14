import OrdenCliente from "./orden_cliente.js";
import AlmacenLocal from "./almacen_local.js";

/** Evento que avisa cambios en la cola: detail { pendientes, enviadas, rechazadas }. */
export const EVENTO_COLA = "cafefe:cola-ordenes";

const CLAVE = "ordenes-pendientes";

/**
 * Ordenes hechas sin conexion (HU2).
 * Si el cliente confirma su orden y no hay conexion, se guarda aqui (en el navegador)
 * y se envia sola cuando vuelve la conexion (evento "online") o al abrir la app.
 * - Si al enviar sigue sin conexion (estado 0), se detiene y la orden se queda guardada.
 * - Si el servidor la rechaza (por ejemplo, un producto ya no existe), se quita de la
 *   cola para no intentarla para siempre y se reporta en "rechazadas".
 */
export class ColaOrdenes extends EventTarget {
    constructor(ordenCliente = new OrdenCliente(), almacen = new AlmacenLocal()) {
        super();
        this.ordenCliente = ordenCliente;
        this.almacen = almacen;
        this.enviando = null;
    }

    pendientes() {
        return this.almacen.leer(CLAVE, []);
    }

    /** Guarda la orden. Solo se guardan los datos del producto que hacen falta para crearla. */
    agregar(cliente, items) {
        let orden = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            cliente,
            items: items.map(i => ({
                cantidad: i.cantidad,
                producto: { idProducto: i.producto.idProducto, nombre: i.producto.nombre, precioSugerido: i.producto.precioSugerido }
            })),
            fecha: new Date().toISOString()
        };
        this.almacen.guardar(CLAVE, [...this.pendientes(), orden]);
        this.avisar([], []);
        return orden;
    }

    quitar(id) {
        this.almacen.guardar(CLAVE, this.pendientes().filter(o => o.id !== id));
    }

    /**
     * Envia las ordenes guardadas, una por una y en el orden en que se hicieron.
     * Si ya se esta enviando, devuelve el mismo envio (no se mandan dos veces).
     */
    enviarPendientes() {
        if (!this.enviando) {
            this.enviando = this.enviar().finally(() => { this.enviando = null; });
        }
        return this.enviando;
    }

    async enviar() {
        let enviadas = [];
        let rechazadas = [];
        for (let orden of this.pendientes()) {
            try {
                let resultado = await this.ordenCliente.crear(orden.cliente, orden.items);
                this.quitar(orden.id);
                enviadas.push({ ...orden, idOrden: resultado.orden.idOrden });
            } catch (e) {
                if (e.estado === 0) {
                    break;      // sigue sin conexion: se intenta despues
                }
                this.quitar(orden.id);
                rechazadas.push({ ...orden, mensaje: e.mensaje || "El servidor rechazó la orden." });
            }
        }
        if (enviadas.length || rechazadas.length) {
            this.avisar(enviadas, rechazadas);
        }
        return { enviadas, rechazadas, pendientes: this.pendientes().length };
    }

    avisar(enviadas, rechazadas) {
        this.dispatchEvent(new CustomEvent(EVENTO_COLA, {
            detail: { pendientes: this.pendientes().length, enviadas, rechazadas }
        }));
    }
}

/** Instancia compartida por toda la app. */
export const cola = new ColaOrdenes();

/** Envia las ordenes guardadas al abrir la app y cada vez que vuelve la conexion. */
export function iniciarEnvioAutomatico(colaOrdenes = cola, ventana = window) {
    ventana.addEventListener("online", () => colaOrdenes.enviarPendientes());
    if (ventana.navigator?.onLine !== false) {
        colaOrdenes.enviarPendientes();
    }
}
