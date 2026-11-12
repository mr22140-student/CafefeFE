import DefaultService from "./default_service.js";

/** Servicio del recurso /empleado */
class EmpleadoService extends DefaultService {
    constructor() {
        super("empleado");
    }
}
export default EmpleadoService;
