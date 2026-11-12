import DefaultService from "./default_service.js";

/** Servicio del recurso /factura_orden_producto */
class FacturaOrdenProductoService extends DefaultService {
    constructor() {
        super("factura_orden_producto");
    }

    /** GET /factura_orden_producto/factura/{id} */
    findByFactura(id) {
        return this.findBy(`${this.URL}/factura/${id}`);
    }

    /** GET /factura_orden_producto/disponibles */
    findDisponibles() {
        return this.findBy(`${this.URL}/disponibles`);
    }
}
export default FacturaOrdenProductoService;
