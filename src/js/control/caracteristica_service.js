import DefaultService from "./default_service.js";

/** Servicio del recurso /caracteristica */
class CaracteristicaService extends DefaultService {
    constructor() {
        super("caracteristica");
    }

    /** GET /caracteristica/tipo_caracteristica/{id} */
    findByTipoCaracteristica(id) {
        return this.findBy(`${this.URL}/tipo_caracteristica/${id}`);
    }
}
export default CaracteristicaService;
