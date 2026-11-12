import EmpleadoService from "./empleado_service.js";
import EmpleadoRolService from "./empleado_rol_service.js";
import DefaultError from "../entity/default_error.js";
import { normalizar, esUuid } from "./texto.js";

export const CREDENCIALES_INVALIDAS = "Usuario o contraseña incorrectos.";

/**
 * Login de HU1: el usuario es el nombre del empleado y la contraseña su idEmpleado.
 * No hace falta un endpoint nuevo:
 *  1. GET empleado/{contraseña}            -> si no existe, credenciales invalidas
 *  2. el nombre debe coincidir (sin tildes ni mayusculas; vale "nombre" o "nombre apellido")
 *  3. GET empleado_rol/empleado/{id}       -> se toma la asignacion activa con rol activo
 * Los servicios se reciben en el constructor para poder simularlos en las pruebas.
 */
class Autenticacion {
    constructor(empleadoService = new EmpleadoService(), empleadoRolService = new EmpleadoRolService()) {
        this.empleadoService = empleadoService;
        this.empleadoRolService = empleadoRolService;
    }

    async ingresar(usuario, contrasena) {
        usuario = (usuario ?? "").trim();
        contrasena = (contrasena ?? "").trim().toLowerCase();
        if (!usuario || !contrasena) {
            throw this.error("Ingrese su usuario y su contraseña.");
        }
        if (!esUuid(contrasena)) {
            throw this.error(CREDENCIALES_INVALIDAS);
        }

        let empleado;
        try {
            empleado = (await this.empleadoService.findById(contrasena)).datos;
        } catch (e) {
            if (e.estado === 404 || e.estado === 422) {
                throw this.error(CREDENCIALES_INVALIDAS);
            }
            throw this.error("No se pudo conectar con el servidor. Intente de nuevo.", e);
        }

        if (!this.coincideNombre(usuario, empleado)) {
            throw this.error(CREDENCIALES_INVALIDAS);
        }
        if (empleado.activo === false) {
            throw this.error("El empleado está inactivo. Consulte con el administrador.");
        }

        let asignaciones = (await this.empleadoRolService.findByEmpleado(empleado.idEmpleado)).datos;
        let asignacion = asignaciones.find(a => a.activo !== false && a.idRol && a.idRol.activo !== false);
        if (!asignacion) {
            throw this.error("No tiene un rol activo asignado. Consulte con el administrador.");
        }

        return {
            empleado: { idEmpleado: empleado.idEmpleado, nombre: empleado.nombre, apellido: empleado.apellido },
            rol: { idRol: asignacion.idRol.idRol, nombre: asignacion.idRol.nombre },
            idEmpleadoRol: asignacion.idEmpleadoRol
        };
    }

    coincideNombre(usuario, empleado) {
        let escrito = normalizar(usuario);
        return escrito === normalizar(empleado.nombre)
            || escrito === normalizar(`${empleado.nombre} ${empleado.apellido ?? ""}`);
    }

    error(mensaje, causa = null) {
        let error = new DefaultError();
        error.mensaje = mensaje;
        error.error = causa;
        return error;
    }
}
export default Autenticacion;
