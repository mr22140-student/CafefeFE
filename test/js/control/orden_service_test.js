import OrdenService from "../../../src/js/control/orden_service.js";
import { pruebasUnitarias, esperarRechazo } from "./pruebas_comunes.js";
import * as chai from "../lib/chai/index.js";
import sinon from "../lib/sinon/sinon-esm.js";

pruebasUnitarias(OrdenService, {
    "idCampo": "idOrden",
    "registro": {
        "idOrden": "11111111-1111-4111-8111-000000000001",
        "fechaCreacion": "2026-11-10T10:00:00.000-06:00",
        "idEmpleadoRol": {
            "idEmpleadoRol": "11111111-1111-4111-8111-000000000011"
        }
    },
    "campoActualizar": "fechaCreacion",
    "valorActualizado": "2026-11-10T11:00:00.000-06:00",
    "filtros": [],
    "sinId": [
        {
            "metodo": "findPendientes",
            "ruta": "pendientes"
        }
    ]
});

suite("OrdenService estado de preparacion", function () {
    let stubFetch;
    const ID = "11111111-1111-4111-8111-000000000001";

    teardown(function () {
        stubFetch.restore();
    });

    test("findEstado deberia pedir GET orden/{id}/estado", async function () {
        stubFetch = sinon.stub(window, "fetch").resolves(new Response(JSON.stringify({ idOrden: ID, estado: "PREPARANDO" }), { status: 200 }));
        let resp = await new OrdenService().findEstado(ID);
        chai.expect(stubFetch.firstCall.args[0]).to.match(new RegExp(`/orden/${ID}/estado$`));
        chai.expect(stubFetch.firstCall.args[1].method).to.equal("GET");
        chai.expect(resp.datos.estado).to.equal("PREPARANDO");
    });

    test("cambiarEstado deberia mandar PUT con el estado nuevo", async function () {
        stubFetch = sinon.stub(window, "fetch").resolves(new Response(JSON.stringify({ idOrden: ID, estado: "EN_CAMINO" }), { status: 200 }));
        let resp = await new OrdenService().cambiarEstado(ID, "EN_CAMINO");
        let [url, opciones] = stubFetch.firstCall.args;
        chai.expect(url).to.match(new RegExp(`/orden/${ID}/estado$`));
        chai.expect(opciones.method).to.equal("PUT");
        chai.expect(JSON.parse(opciones.body)).to.deep.equal({ estado: "EN_CAMINO" });
        chai.expect(resp.datos.estado).to.equal("EN_CAMINO");
    });

    test("findEstado de una orden que no existe deberia rechazar con 404", async function () {
        stubFetch = sinon.stub(window, "fetch").resolves(new Response(null, { status: 404 }));
        let err = await esperarRechazo(new OrdenService().findEstado(ID));
        chai.expect(err.estado).to.equal(404);
    });

    test("cambiarEstado a un estado anterior deberia rechazar con el mensaje del servidor (422)", async function () {
        stubFetch = sinon.stub(window, "fetch").resolves(new Response("La orden ya está ENTREGADA y no puede regresar a PREPARANDO.",
            { status: 422, headers: { "Wrong-Parameter": "estado" } }));
        let err = await esperarRechazo(new OrdenService().cambiarEstado(ID, "PREPARANDO"));
        chai.expect(err.estado).to.equal(422);
        chai.expect(err.mensaje).to.contain("no puede regresar");
    });

    test("sin conexion deberia rechazar con estado 0", async function () {
        stubFetch = sinon.stub(window, "fetch").rejects(new TypeError("Failed to fetch"));
        let err = await esperarRechazo(new OrdenService().findEstado(ID));
        chai.expect(err.estado).to.equal(0);
    });
});
