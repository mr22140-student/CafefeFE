import DefaultService from "./default_service.js";

/** Servicio del recurso /orden */
class OrdenService extends DefaultService {
    constructor() {
        super("orden");
    }

    /** GET /orden/pendientes */
    findPendientes() {
        return this.findBy(`${this.URL}/pendientes`);
    }
}
export default OrdenService;
