import DefaultService from "./default_service.js";

/** Servicio del recurso /producto_caracteristica */
class ProductoCaracteristicaService extends DefaultService {
    constructor() {
        super("producto_caracteristica");
    }

    /** GET /producto_caracteristica/producto/{id} */
    findByProducto(id) {
        return this.findBy(`${this.URL}/producto/${id}`);
    }
}
export default ProductoCaracteristicaService;
