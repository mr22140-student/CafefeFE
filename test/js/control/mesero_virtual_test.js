import * as chai from "../lib/chai/index.js";
import sinon from "../lib/sinon/sinon-esm.js";
import MeseroVirtual, { SIN_MESERO } from "../../../src/js/control/mesero_virtual.js";
import DefaultResponse from "../../../src/js/entity/default_response.js";
import { esperarRechazo } from "./pruebas_comunes.js";

function respuesta(datos) {
    let r = new DefaultResponse();
    r.datos = datos;
    return r;
}

const EMPLEADOS = [
    { idEmpleado: "e1", nombre: "Carlos", apellido: "Montano", activo: true },
    { idEmpleado: "e2", nombre: "MESERO", apellido: "VIRTUAL", activo: true }
];
const CAMARERO = { idEmpleadoRol: "er2", activo: true, idRol: { idRol: "r1", nombre: "Camarero", activo: true } };

suite("MeseroVirtual", function () {
    let empleadoService;
    let empleadoRolService;
    let mesero;

    setup(function () {
        empleadoService = { findRange: sinon.stub().resolves(respuesta(EMPLEADOS)) };
        empleadoRolService = { findByEmpleado: sinon.stub().resolves(respuesta([CAMARERO])) };
        mesero = new MeseroVirtual(empleadoService, empleadoRolService, { nombre: "Mesero", apellido: "Virtual" });
    });

    test("deberia encontrar al mesero sin importar mayusculas y devolver su idEmpleadoRol de camarero", async function () {
        chai.expect(await mesero.obtenerIdEmpleadoRol()).to.equal("er2");
        chai.expect(empleadoRolService.findByEmpleado.calledOnceWith("e2")).to.equal(true);
    });

    test("deberia recordar el resultado y no volver a consultar", async function () {
        await mesero.obtenerIdEmpleadoRol();
        await mesero.obtenerIdEmpleadoRol();
        chai.expect(empleadoService.findRange.calledOnce).to.equal(true);
    });

    test("deberia avisar si no existe el empleado mesero virtual", async function () {
        empleadoService.findRange.resolves(respuesta([EMPLEADOS[0]]));
        let err = await esperarRechazo(mesero.obtenerIdEmpleadoRol());
        chai.expect(err.mensaje).to.equal(SIN_MESERO);
    });

    test("deberia avisar si el mesero virtual no tiene rol Camarero activo", async function () {
        empleadoRolService.findByEmpleado.resolves(respuesta([
            { idEmpleadoRol: "er3", activo: true, idRol: { nombre: "Cajero", activo: true } }
        ]));
        let err = await esperarRechazo(mesero.obtenerIdEmpleadoRol());
        chai.expect(err.mensaje).to.equal(SIN_MESERO);
    });
});
