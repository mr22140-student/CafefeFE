import DefaultService from "./default_service.js";

/** Servicio del recurso /pago_detalle */
class PagoDetalleService extends DefaultService {
    constructor() {
        super("pago_detalle");
    }

    /** GET /pago_detalle/pago/{id} */
    findByPago(id) {
        return this.findBy(`${this.URL}/pago/${id}`);
    }
}
export default PagoDetalleService;
