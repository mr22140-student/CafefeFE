import DefaultService from "./default_service.js";

/** Servicio del recurso /producto */
class ProductoService extends DefaultService {
    constructor() {
        super("producto");
    }
}
export default ProductoService;
