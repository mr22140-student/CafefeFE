import AlmacenLocal from "./almacen_local.js";

const CLAVE = "ultima-orden";

/**
 * Recuerda en el navegador la ultima orden que hizo el cliente ({ idOrden, cliente, total }),
 * para que pueda volver a ver como va si se sale de la pantalla o recarga la pagina.
 * Se olvida cuando el barista la marca como entregada.
 */
export class UltimaOrden {
    constructor(almacen = new AlmacenLocal()) {
        this.almacen = almacen;
    }

    guardar(idOrden, cliente, total) {
        this.almacen.guardar(CLAVE, { idOrden, cliente, total });
    }

    /** { idOrden, cliente, total } o null si no hay una orden por seguir. */
    leer() {
        let orden = this.almacen.leer(CLAVE);
        return orden && orden.idOrden ? orden : null;
    }

    olvidar() {
        this.almacen.borrar(CLAVE);
    }
}

export const ultimaOrden = new UltimaOrden();