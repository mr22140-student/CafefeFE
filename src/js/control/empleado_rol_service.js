import DefaultService from "./default_service.js";

/** Servicio del recurso /empleado_rol */
class EmpleadoRolService extends DefaultService {
    constructor() {
        super("empleado_rol");
    }

    /** GET /empleado_rol/empleado/{id} */
    findByEmpleado(id) {
        return this.findBy(`${this.URL}/empleado/${id}`);
    }
}
export default EmpleadoRolService;
