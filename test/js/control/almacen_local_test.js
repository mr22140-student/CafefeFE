import * as chai from "../lib/chai/index.js";
import AlmacenLocal from "../../../src/js/control/almacen_local.js";
import { almacenamientoFalso } from "./almacenamiento_falso.js";

suite("AlmacenLocal", function () {
    test("deberia guardar y leer valores como JSON con el prefijo cafefe.", function () {
        let falso = almacenamientoFalso();
        let almacen = new AlmacenLocal(falso);
        chai.expect(almacen.guardar("menu", { datos: [1, 2] })).to.equal(true);
        chai.expect(falso.datos["cafefe.menu"]).to.equal('{"datos":[1,2]}');
        chai.expect(almacen.leer("menu")).to.deep.equal({ datos: [1, 2] });
    });

    test("leer algo que no existe deberia devolver el valor por defecto", function () {
        let almacen = new AlmacenLocal(almacenamientoFalso());
        chai.expect(almacen.leer("nada")).to.equal(null);
        chai.expect(almacen.leer("nada", [])).to.deep.equal([]);
    });

    test("borrar deberia quitar el valor", function () {
        let almacen = new AlmacenLocal(almacenamientoFalso());
        almacen.guardar("x", 1);
        almacen.borrar("x");
        chai.expect(almacen.leer("x")).to.equal(null);
    });

    test("si el navegador no deja guardar no deberia romperse", function () {
        let roto = { getItem() { throw new Error("bloqueado"); }, setItem() { throw new Error("lleno"); }, removeItem() { throw new Error("x"); } };
        let almacen = new AlmacenLocal(roto);
        chai.expect(almacen.guardar("x", 1)).to.equal(false);
        chai.expect(almacen.leer("x", "defecto")).to.equal("defecto");
        chai.expect(() => almacen.borrar("x")).to.not.throw();
    });

    test("un valor danado deberia devolver el valor por defecto", function () {
        let falso = almacenamientoFalso();
        falso.setItem("cafefe.x", "{no es json");
        chai.expect(new AlmacenLocal(falso).leer("x", [])).to.deep.equal([]);
    });
});