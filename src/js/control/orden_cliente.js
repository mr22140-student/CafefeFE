import OrdenService from "./orden_service.js";
import OrdenProductoService from "./orden_producto_service.js";
import MeseroVirtual from "./mesero_virtual.js";
import DefaultError from "../entity/default_error.js";

/**
Crea la orden que el cliente arma en la app 
1. busca el idEmpleadoRol del mesero virtual (camarero)
2. crea la Orden asignada a ese mesero (la fecha la pone el servidor)
3. crea un OrdenProducto por cada unidad pedida, con el precio sugerido y el nombre del cliente en "observaciones" (Orden no tiene descripcion)
 */
class OrdenCliente {
    constructor(ordenService = new OrdenService(), ordenProductoService = new OrdenProductoService(),
            meseroVirtual = new MeseroVirtual()) {
        this.ordenService = ordenService;
        this.ordenProductoService = ordenProductoService;
        this.meseroVirtual = meseroVirtual;
    }

    /**
     * items: [{ producto, cantidad }]
     * Resuelve con { orden, detalles } o rechaza con DefaultError.
     */
    async crear(cliente, items) {
        let nombre = (cliente || "").trim();
        if (!nombre) {
            throw this.error("Escriba su nombre para que le podamos llamar.");
        }
        if (!items || items.length === 0 || items.some(i => !(i.cantidad >= 1))) {
            throw this.error("Agregue al menos un producto a su orden.");
        }
        let idEmpleadoRol = await this.meseroVirtual.obtenerIdEmpleadoRol();
        let orden = (await this.ordenService.create({ idEmpleadoRol: { idEmpleadoRol } })).datos;

        let unidades = items.flatMap(i => Array.from({ length: i.cantidad }, () => i.producto));
        let respuestas = await Promise.all(unidades.map(producto => this.ordenProductoService.create({
            idOrden: { idOrden: orden.idOrden },
            idProducto: { idProducto: producto.idProducto },
            precio: producto.precioSugerido,
            observaciones: nombre
        })));
        return { orden, detalles: respuestas.map(r => r.datos) };
    }

    error(mensaje) {
        let error = new DefaultError();
        error.mensaje = mensaje;
        error.estado = 422;
        return error;
    }
}
export default OrdenCliente;