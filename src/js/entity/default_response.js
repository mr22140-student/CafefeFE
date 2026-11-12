/** Respuesta exitosa de un servicio: los datos y cuantos registros hay en total. */
class DefaultResponse {
    constructor() {
        this.datos = [];
        this.totalDatos = -1;
        this.ubicacion = null;   // cabecera Location (solo en create)
    }
}
export default DefaultResponse;
