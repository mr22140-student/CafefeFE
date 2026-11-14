import * as chai from "../lib/chai/index.js";
import sinon from "../lib/sinon/sinon-esm.js";
import { conCopiaLocal, TipoProductoServiceConCopia, ProductoTipoProductoServiceConCopia } from "../../../src/js/control/menu_local.js";
import AlmacenLocal from "../../../src/js/control/almacen_local.js";
import DefaultResponse from "../../../src/js/entity/default_response.js";
import DefaultError from "../../../src/js/entity/default_error.js";
import { almacenamientoFalso } from "./almacenamiento_falso.js";
import { esperarRechazo } from "./pruebas_comunes.js";

function respuesta(datos) {
    let r = new DefaultResponse();
    r.datos = datos;
    return r;
}

function errorHttp(estado) {
    let e = new DefaultError();
    e.estado = estado;
    e.mensaje = "error " + estado;
    return e;
}

const CATEGORIAS = [{ idTipoProducto: "t1", nombre: "Bebidas", activo: true }];

suite("menu_local: copia del menu", function () {
    let almacen;

    setup(function () {
        almacen = new AlmacenLocal(almacenamientoFalso());
    });

    test("con conexion deberia devolver la respuesta del servidor y guardar una copia", async function () {
        let resp = await conCopiaLocal("menu.x", () => Promise.resolve(respuesta(CATEGORIAS)), almacen);
        chai.expect(resp.datos).to.deep.equal(CATEGORIAS);
        chai.expect(resp.desdeCopia).to.equal(undefined);
        chai.expect(almacen.leer("menu.x").datos).to.deep.equal(CATEGORIAS);
    });

    test("sin conexion deberia devolver la copia guardada marcada como copia", async function () {
        await conCopiaLocal("menu.x", () => Promise.resolve(respuesta(CATEGORIAS)), almacen);
        let resp = await conCopiaLocal("menu.x", () => Promise.reject(errorHttp(0)), almacen);
        chai.expect(resp.datos).to.deep.equal(CATEGORIAS);
        chai.expect(resp.desdeCopia).to.equal(true);
        chai.expect(resp.fechaCopia).to.be.a("string");
    });

    test("sin conexion y sin copia deberia pasar el error de conexion", async function () {
        let err = await esperarRechazo(conCopiaLocal("menu.x", () => Promise.reject(errorHttp(0)), almacen));
        chai.expect(err.estado).to.equal(0);
    });

    test("un error del servidor (no de conexion) no deberia usar la copia", async function () {
        await conCopiaLocal("menu.x", () => Promise.resolve(respuesta(CATEGORIAS)), almacen);
        let err = await esperarRechazo(conCopiaLocal("menu.x", () => Promise.reject(errorHttp(500)), almacen));
        chai.expect(err.estado).to.equal(500);
    });

    test("TipoProductoServiceConCopia deberia responder las categorias guardadas sin conexion", async function () {
        let stubFetch = sinon.stub(window, "fetch");
        try {
            let servicio = new TipoProductoServiceConCopia(almacen);
            stubFetch.resolves(new Response(JSON.stringify(CATEGORIAS), { status: 200, headers: { "Total-Registros": "1" } }));
            await servicio.findRange(0, 100);
            stubFetch.rejects(new TypeError("Failed to fetch"));
            let resp = await servicio.findRange(0, 100);
            chai.expect(resp.desdeCopia).to.equal(true);
            chai.expect(resp.datos[0].nombre).to.equal("Bebidas");
        } finally {
            stubFetch.restore();
        }
    });

    test("ProductoTipoProductoServiceConCopia deberia guardar una copia por categoria", async function () {
        let stubFetch = sinon.stub(window, "fetch");
        try {
            let servicio = new ProductoTipoProductoServiceConCopia(almacen);
            stubFetch.resolves(new Response(JSON.stringify([{ producto: { nombre: "Latte" } }]), { status: 200 }));
            await servicio.findByTipoProducto("t1");
            stubFetch.rejects(new TypeError("Failed to fetch"));
            chai.expect((await servicio.findByTipoProducto("t1")).datos[0].producto.nombre).to.equal("Latte");
            let err = await esperarRechazo(servicio.findByTipoProducto("t2"));
            chai.expect(err.estado).to.equal(0);
        } finally {
            stubFetch.restore();
        }
    });
});