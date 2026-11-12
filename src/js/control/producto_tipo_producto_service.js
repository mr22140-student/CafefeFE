import DefaultService from "./default_service.js";

/** Servicio del recurso /producto_tipo_producto */
class ProductoTipoProductoService extends DefaultService {
    constructor() {
        super("producto_tipo_producto");
    }

    /** GET /producto_tipo_producto/producto/{id} */
    findByProducto(id) {
        return this.findBy(`${this.URL}/producto/${id}`);
    }

    /** GET /producto_tipo_producto/tipo_producto/{id} */
    findByTipoProducto(id) {
        return this.findBy(`${this.URL}/tipo_producto/${id}`);
    }
}
export default ProductoTipoProductoService;
