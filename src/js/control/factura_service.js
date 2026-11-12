import DefaultService from "./default_service.js";

/** Servicio del recurso /factura */
class FacturaService extends DefaultService {
    constructor() {
        super("factura");
    }
}
export default FacturaService;
