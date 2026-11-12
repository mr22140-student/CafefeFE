import * as chai from "../lib/chai/index.js";
import sinon from "../lib/sinon/sinon-esm.js";
import Autenticacion, { CREDENCIALES_INVALIDAS } from "../../../src/js/control/autenticacion.js";
import DefaultResponse from "../../../src/js/entity/default_response.js";
import DefaultError from "../../../src/js/entity/default_error.js";
import { esperarRechazo } from "./pruebas_comunes.js";

const ID = "11111111-1111-4111-8111-000000000001";

function respuesta(datos) {
    let r = new DefaultResponse();
    r.datos = datos;
    return r;
}

function errorHttp(estado) {
    let e = new DefaultError();
    e.estado = estado;
    return e;
}

suite("Autenticacion", function () {
    let empleadoService;
    let empleadoRolService;
    let autenticacion;

    setup(function () {
        empleadoService = { findById: sinon.stub() };
        empleadoRolService = { findByEmpleado: sinon.stub() };
        autenticacion = new Autenticacion(empleadoService, empleadoRolService);
        empleadoService.findById.resolves(respuesta({ idEmpleado: ID, nombre: "Laura", apellido: "Martínez", activo: true }));
        empleadoRolService.findByEmpleado.resolves(respuesta([
            { idEmpleadoRol: "er-viejo", activo: false, idRol: { idRol: "r0", nombre: "Barista", activo: true } },
            { idEmpleadoRol: "er1", activo: true, idRol: { idRol: "r1", nombre: "Cajero", activo: true } }
        ]));
    });

    test("ingresar deberia devolver el empleado y su rol activo con nombre e id correctos", async function () {
        let datos = await autenticacion.ingresar("  laura ", ID.toUpperCase());
        chai.expect(empleadoService.findById.calledOnceWith(ID)).to.equal(true);
        chai.expect(datos.empleado.nombre).to.equal("Laura");
        chai.expect(datos.rol.nombre).to.equal("Cajero");
        chai.expect(datos.idEmpleadoRol).to.equal("er1");
    });

    test("ingresar deberia aceptar el nombre completo sin tildes", async function () {
        let datos = await autenticacion.ingresar("Laura Martinez", ID);
        chai.expect(datos.empleado.idEmpleado).to.equal(ID);
    });

    test("ingresar deberia pedir los dos campos si falta alguno", async function () {
        let err = await esperarRechazo(autenticacion.ingresar("", ID));
        chai.expect(err.mensaje).to.contain("Ingrese");
        chai.expect(empleadoService.findById.called).to.equal(false);
    });

    test("ingresar deberia rechazar una contraseña que no es un UUID sin llamar al servidor", async function () {
        let err = await esperarRechazo(autenticacion.ingresar("Laura", "12345"));
        chai.expect(err.mensaje).to.equal(CREDENCIALES_INVALIDAS);
        chai.expect(empleadoService.findById.called).to.equal(false);
    });

    test("ingresar deberia rechazar si el empleado no existe (404)", async function () {
        empleadoService.findById.rejects(errorHttp(404));
        let err = await esperarRechazo(autenticacion.ingresar("Laura", ID));
        chai.expect(err.mensaje).to.equal(CREDENCIALES_INVALIDAS);
    });

    test("ingresar deberia rechazar si el nombre no coincide con el del empleado", async function () {
        let err = await esperarRechazo(autenticacion.ingresar("Miguel", ID));
        chai.expect(err.mensaje).to.equal(CREDENCIALES_INVALIDAS);
        chai.expect(empleadoRolService.findByEmpleado.called).to.equal(false);
    });

    test("ingresar deberia rechazar a un empleado inactivo", async function () {
        empleadoService.findById.resolves(respuesta({ idEmpleado: ID, nombre: "Laura", activo: false }));
        let err = await esperarRechazo(autenticacion.ingresar("Laura", ID));
        chai.expect(err.mensaje).to.contain("inactivo");
    });

    test("ingresar deberia rechazar si no tiene un rol activo", async function () {
        empleadoRolService.findByEmpleado.resolves(respuesta([
            { idEmpleadoRol: "er1", activo: true, idRol: { idRol: "r1", nombre: "Cajero", activo: false } }
        ]));
        let err = await esperarRechazo(autenticacion.ingresar("Laura", ID));
        chai.expect(err.mensaje).to.contain("rol activo");
    });

    test("ingresar deberia avisar si no se puede conectar con el servidor", async function () {
        empleadoService.findById.rejects(errorHttp(0));
        let err = await esperarRechazo(autenticacion.ingresar("Laura", ID));
        chai.expect(err.mensaje).to.contain("conectar");
    });
});
