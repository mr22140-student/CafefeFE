import DefaultService from "./default_service.js";

/** Servicio del recurso /orden_producto */
class OrdenProductoService extends DefaultService {
    constructor() {
        super("orden_producto");
    }

    /** GET /orden_producto/orden/{id} */
    findByOrden(id) {
        return this.findBy(`${this.URL}/orden/${id}`);
    }
}
export default OrdenProductoService;
