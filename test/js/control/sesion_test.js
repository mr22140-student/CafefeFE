import * as chai from "../lib/chai/index.js";
import { Sesion, EVENTO_SESION } from "../../../src/js/control/sesion.js";

/** Almacen falso con la misma interfaz que sessionStorage. */
function almacenFalso() {
    let datos = {};
    return {
        getItem: k => (k in datos ? datos[k] : null),
        setItem: (k, v) => { datos[k] = String(v); },
        removeItem: k => { delete datos[k]; }
    };
}

const CAJERA = {
    empleado: { idEmpleado: "e1", nombre: "Laura", apellido: "Martinez" },
    rol: { idRol: "r1", nombre: "Cajero" },
    idEmpleadoRol: "er1"
};

suite("Sesion", function () {
    let sesion;
    let objetivo;

    setup(function () {
        objetivo = new EventTarget();
        sesion = new Sesion(almacenFalso(), objetivo);
    });

    test("sin iniciar no deberia haber sesion ni rol", function () {
        chai.expect(sesion.obtener()).to.equal(null);
        chai.expect(sesion.estaIniciada()).to.equal(false);
        chai.expect(sesion.rol()).to.equal(null);
    });

    test("iniciar deberia guardar los datos y avisar con un evento", function () {
        let recibido = null;
        objetivo.addEventListener(EVENTO_SESION, e => { recibido = e.detail; });
        sesion.iniciar(CAJERA);
        chai.expect(sesion.obtener()).to.deep.equal(CAJERA);
        chai.expect(recibido).to.deep.equal(CAJERA);
    });

    test("rol deberia devolver el nombre normalizado y tieneRol compararlo sin mayusculas", function () {
        sesion.iniciar(CAJERA);
        chai.expect(sesion.rol()).to.equal("cajero");
        chai.expect(sesion.tieneRol(["CAJERO"])).to.equal(true);
        chai.expect(sesion.tieneRol(["barista"])).to.equal(false);
    });

    test("cerrar deberia borrar la sesion y avisar", function () {
        let avisos = 0;
        objetivo.addEventListener(EVENTO_SESION, () => { avisos++; });
        sesion.iniciar(CAJERA);
        sesion.cerrar();
        chai.expect(sesion.obtener()).to.equal(null);
        chai.expect(avisos).to.equal(2);
    });

    test("deberia seguir funcionando en memoria si el almacenamiento falla", function () {
        let roto = { getItem() { throw new Error("bloqueado"); }, setItem() { throw new Error("bloqueado"); }, removeItem() { } };
        let enMemoria = new Sesion(roto, objetivo);
        enMemoria.iniciar(CAJERA);
        chai.expect(enMemoria.obtener()).to.deep.equal(CAJERA);
    });
});
