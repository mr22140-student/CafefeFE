import TipoProductoService from "./tipo_producto_service.js";
import ProductoTipoProductoService from "./producto_tipo_producto_service.js";
import AlmacenLocal from "./almacen_local.js";
import DefaultResponse from "../entity/default_response.js";

/**
 * Menu sin conexion.
 * Cada vez que el menu se consulta con conexion se guarda una copia en el navegador.
 * Si despues no hay conexion con el servidor (estado 0), se responde con esa copia
 * y la respuesta trae desdeCopia = true y fechaCopia (cuando se guardo).
 * Otros errores (404, 422, 500) no usan la copia: se pasan igual que siempre.
 *
 * El service worker NO guarda las respuestas del API (como se indico en clase):
 * la copia la guarda la app.
 */
export async function conCopiaLocal(clave, consultar, almacen) {
    try {
        let respuesta = await consultar();
        almacen.guardar(clave, { datos: respuesta.datos, fecha: new Date().toISOString() });
        return respuesta;
    } catch (e) {
        let copia = e.estado === 0 ? almacen.leer(clave) : null;
        if (!copia) {
            throw e;
        }
        let respuesta = new DefaultResponse();
        respuesta.datos = copia.datos;
        respuesta.totalDatos = copia.datos.length;
        respuesta.desdeCopia = true;
        respuesta.fechaCopia = copia.fecha;
        return respuesta;
    }
}

/** Igual que TipoProductoService, pero con copia local de las categorias. */
export class TipoProductoServiceConCopia extends TipoProductoService {
    constructor(almacen = new AlmacenLocal()) {
        super();
        this.almacen = almacen;
    }

    findRange(first = 0, max = 50) {
        return conCopiaLocal(`menu.categorias.${first}.${max}`, () => super.findRange(first, max), this.almacen);
    }
}

/** Igual que ProductoTipoProductoService, pero con copia local de los productos de cada categoria. */
export class ProductoTipoProductoServiceConCopia extends ProductoTipoProductoService {
    constructor(almacen = new AlmacenLocal()) {
        super();
        this.almacen = almacen;
    }

    findByTipoProducto(id) {
        return conCopiaLocal(`menu.productos.${id}`, () => super.findByTipoProducto(id), this.almacen);
    }
}

/** "2026-11-14T15:30:00.000Z" -> "14/11/26, 9:30 a. m." (para el aviso) */
export function textoFechaCopia(fecha) {
    let d = new Date(fecha);
    return isNaN(d) ? "" : d.toLocaleString("es-SV", { dateStyle: "short", timeStyle: "short" });
}