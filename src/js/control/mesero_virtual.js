import EmpleadoService from "./empleado_service.js";
import EmpleadoRolService from "./empleado_rol_service.js";
import DefaultError from "../entity/default_error.js";
import { MESERO_VIRTUAL, ROLES } from "../config.js";
import { normalizar } from "./texto.js";

export const SIN_MESERO = "No está configurado el mesero virtual (empleado \"Mesero Virtual\" con rol Camarero activo).";

/**
 * Encuentra la asignacion empleado_rol del mesero virtual (HU2).
 *  1. busca el empleado activo llamado como MESERO_VIRTUAL en config.js
 *  2. toma su asignacion activa con rol Camarero activo
 * El resultado se guarda para no repetir las consultas en cada orden.
 */
class MeseroVirtual {
    constructor(empleadoService = new EmpleadoService(), empleadoRolService = new EmpleadoRolService(), datos = MESERO_VIRTUAL) {
        this.empleadoService = empleadoService;
        this.empleadoRolService = empleadoRolService;
        this.datos = datos;
        this.encontrado = null;
    }

    /** Resuelve con el idEmpleadoRol del mesero virtual o rechaza con DefaultError. */
    async obtenerIdEmpleadoRol() {
        if (this.encontrado) {
            return this.encontrado;
        }
        let empleados = (await this.empleadoService.findRange(0, 100)).datos;
        let empleado = empleados.find(e => e.activo !== false
            && normalizar(e.nombre) === normalizar(this.datos.nombre)
            && normalizar(e.apellido) === normalizar(this.datos.apellido));
        if (!empleado) {
            throw this.error();
        }
        let asignaciones = (await this.empleadoRolService.findByEmpleado(empleado.idEmpleado)).datos;
        let asignacion = asignaciones.find(a => a.activo !== false && a.idRol
            && a.idRol.activo !== false && normalizar(a.idRol.nombre) === ROLES.CAMARERO);
        if (!asignacion) {
            throw this.error();
        }
        this.encontrado = asignacion.idEmpleadoRol;
        return this.encontrado;
    }

    error() {
        let error = new DefaultError();
        error.mensaje = SIN_MESERO;
        return error;
    }
}
export default MeseroVirtual;
