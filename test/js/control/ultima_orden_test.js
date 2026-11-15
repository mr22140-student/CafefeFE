import * as chai from "../lib/chai/index.js";
import { UltimaOrden } from "../../../src/js/control/ultima_orden.js";
import AlmacenLocal from "../../../src/js/control/almacen_local.js";
import { almacenamientoFalso } from "./almacenamiento_falso.js";

suite("UltimaOrden", function () {
    let ultima;

    setup(function () {
        ultima = new UltimaOrden(new AlmacenLocal(almacenamientoFalso()));
    });

    test("sin ordenes deberia devolver null", function () {
        chai.expect(ultima.leer()).to.equal(null);
    });

    test("guardar deberia recordar el id, el cliente y el total", function () {
        ultima.guardar("o1", "Ana", 8.5);
        chai.expect(ultima.leer()).to.deep.equal({ idOrden: "o1", cliente: "Ana", total: 8.5 });
    });

    test("una orden nueva deberia reemplazar a la anterior", function () {
        ultima.guardar("o1", "Ana", 8.5);
        ultima.guardar("o2", "Beto", 3);
        chai.expect(ultima.leer().idOrden).to.equal("o2");
    });

    test("olvidar deberia borrarla", function () {
        ultima.guardar("o1", "Ana", 8.5);
        ultima.olvidar();
        chai.expect(ultima.leer()).to.equal(null);
    });

    test("un dato danado o sin id no deberia tomarse como orden", function () {
        let almacenamiento = almacenamientoFalso();
        almacenamiento.setItem("cafefe.ultima-orden", "{no es json");
        chai.expect(new UltimaOrden(new AlmacenLocal(almacenamiento)).leer()).to.equal(null);
        almacenamiento.setItem("cafefe.ultima-orden", JSON.stringify({ cliente: "Ana" }));
        chai.expect(new UltimaOrden(new AlmacenLocal(almacenamiento)).leer()).to.equal(null);
    });
});