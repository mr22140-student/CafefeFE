import DefaultService from "./default_service.js";

/** Servicio del recurso /descuento_producto */
class DescuentoProductoService extends DefaultService {
    constructor() {
        super("descuento_producto");
    }

    /** GET /descuento_producto/descuento/{id} */
    findByDescuento(id) {
        return this.findBy(`${this.URL}/descuento/${id}`);
    }

    /** GET /descuento_producto/producto/{id} */
    findByProducto(id) {
        return this.findBy(`${this.URL}/producto/${id}`);
    }
}
export default DescuentoProductoService;
