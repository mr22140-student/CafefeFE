/**
 * Error de un servicio.
 * mensaje: texto para mostrar al usuario.
 * error: el campo que fallo (cabecera Wrong-Parameter) o la excepcion original.
 * estado: codigo HTTP (0 si no se pudo llegar al servidor).
 */
class DefaultError {
    constructor() {
        this.mensaje = "";
        this.error = null;
        this.estado = 0;
    }
}
export default DefaultError;
