import * as chai from "../lib/chai/index.js";
import sinon from "../lib/sinon/sinon-esm.js";
import DefaultResponse from "../../../src/js/entity/default_response.js";
import DefaultError from "../../../src/js/entity/default_error.js";

const ID_INEXISTENTE = "11111111-1111-4111-8111-000000000027";

/**
 * Pruebas unitarias comunes de un servicio (interfaz tdd: suite/test).
 * fetch se simula con sinon, asi que NO necesitan el backend.
 * config: { idCampo, registro, campoActualizar, valorActualizado,
 *           filtros: [{metodo, ruta}], sinId: [{metodo, ruta}] }
 */
export function pruebasUnitarias(Servicio, config) {
    const registro = config.registro;
    const ID = registro[config.idCampo];
    let stubFetch;

    suite(Servicio.name, function () {

        teardown(function () {
            if (stubFetch) {
                stubFetch.restore();
                stubFetch = null;
            }
        });

        test("findRange deberia pedir la pagina y retornar los datos con el total de registros", async function () {
            stubFetch = sinon.stub(window, "fetch").resolves(new Response(JSON.stringify([registro, registro]),
                { status: 200, headers: { "Total-Registros": "7" } }));
            let servicio = new Servicio();
            let resp = await servicio.findRange(10, 2);
            chai.expect(stubFetch.firstCall.args[0]).to.equal(servicio.URL + "?first=10&max=2");
            chai.expect(resp).to.be.an.instanceOf(DefaultResponse);
            chai.expect(resp.datos).to.be.an("array").that.has.lengthOf(2);
            chai.expect(resp.totalDatos).to.equal(7);
        });

        test("findById deberia retornar el registro solicitado", async function () {
            stubFetch = sinon.stub(window, "fetch").resolves(new Response(JSON.stringify(registro), { status: 200 }));
            let servicio = new Servicio();
            let resp = await servicio.findById(ID);
            chai.expect(stubFetch.firstCall.args[0]).to.equal(servicio.URL + "/" + ID);
            chai.expect(resp.datos[config.idCampo]).to.equal(ID);
        });

        test("findById deberia rechazar con DefaultError 404 si el registro no existe", async function () {
            stubFetch = sinon.stub(window, "fetch").resolves(new Response(null, { status: 404 }));
            let err = await esperarRechazo(new Servicio().findById(ID));
            chai.expect(err).to.be.an.instanceOf(DefaultError);
            chai.expect(err.mensaje).to.equal("No existe el registro");
            chai.expect(err.estado).to.equal(404);
        });

        test("create deberia enviar un POST con JSON y retornar la entidad creada y su ubicacion", async function () {
            let servicio = new Servicio();
            let ubicacion = servicio.URL + "/" + ID;
            stubFetch = sinon.stub(window, "fetch").resolves(new Response(JSON.stringify(registro),
                { status: 201, headers: { "Location": ubicacion } }));
            let resp = await servicio.create(registro);
            let args = stubFetch.firstCall.args;
            chai.expect(args[0]).to.equal(servicio.URL);
            chai.expect(args[1].method).to.equal("POST");
            chai.expect(args[1].headers["Content-Type"]).to.equal("application/json");
            chai.expect(JSON.parse(args[1].body)).to.deep.equal(registro);
            chai.expect(resp.datos[config.idCampo]).to.equal(ID);
            chai.expect(resp.ubicacion).to.equal(ubicacion);
        });

        test("create deberia rechazar con el mensaje del servidor y el campo si el dato es invalido (422)", async function () {
            stubFetch = sinon.stub(window, "fetch").resolves(new Response("El dato no es valido",
                { status: 422, headers: { "Wrong-Parameter": config.campoActualizar } }));
            let err = await esperarRechazo(new Servicio().create(registro));
            chai.expect(err).to.be.an.instanceOf(DefaultError);
            chai.expect(err.mensaje).to.equal("El dato no es valido");
            chai.expect(err.error).to.equal(config.campoActualizar);
            chai.expect(err.estado).to.equal(422);
        });

        test("update deberia enviar un PUT al id y retornar el registro actualizado", async function () {
            let modificado = Object.assign({}, registro, { [config.campoActualizar]: config.valorActualizado });
            stubFetch = sinon.stub(window, "fetch").resolves(new Response(JSON.stringify(modificado), { status: 200 }));
            let servicio = new Servicio();
            let resp = await servicio.update(ID, modificado);
            let args = stubFetch.firstCall.args;
            chai.expect(args[0]).to.equal(servicio.URL + "/" + ID);
            chai.expect(args[1].method).to.equal("PUT");
            chai.expect(JSON.parse(args[1].body)).to.deep.equal(modificado);
            chai.expect(resp.datos[config.campoActualizar]).to.deep.equal(config.valorActualizado);
        });

        test("delete deberia enviar un DELETE y aceptar el 204 sin cuerpo", async function () {
            stubFetch = sinon.stub(window, "fetch").resolves(new Response(null, { status: 204 }));
            let servicio = new Servicio();
            let resp = await servicio.delete(ID);
            chai.expect(stubFetch.firstCall.args[0]).to.equal(servicio.URL + "/" + ID);
            chai.expect(stubFetch.firstCall.args[1].method).to.equal("DELETE");
            chai.expect(resp.datos).to.be.an("array").that.has.lengthOf(0);
            chai.expect(resp.totalDatos).to.equal(0);
        });

        test("deberia rechazar con el detalle de App-Error si el servidor falla (500)", async function () {
            stubFetch = sinon.stub(window, "fetch").resolves(new Response(null,
                { status: 500, headers: { "App-Error": "Fallo la base de datos" } }));
            let err = await esperarRechazo(new Servicio().findRange(0, 10));
            chai.expect(err.estado).to.equal(500);
            chai.expect(err.mensaje).to.contain("Fallo la base de datos");
        });

        test("deberia rechazar con DefaultError si no se puede acceder al repositorio", async function () {
            stubFetch = sinon.stub(window, "fetch").rejects(new TypeError("Failed to fetch"));
            let err = await esperarRechazo(new Servicio().findRange(0, 10));
            chai.expect(err).to.be.an.instanceOf(DefaultError);
            chai.expect(err.mensaje).to.equal("Error al acceder al repositorio");
            chai.expect(err.estado).to.equal(0);
        });

        (config.filtros || []).forEach(filtro => {
            test(filtro.metodo + " deberia consultar /" + filtro.ruta + "/{id} y retornar la lista", async function () {
                stubFetch = sinon.stub(window, "fetch").resolves(new Response(JSON.stringify([registro, registro]), { status: 200 }));
                let servicio = new Servicio();
                let resp = await servicio[filtro.metodo](ID);
                chai.expect(stubFetch.firstCall.args[0]).to.equal(servicio.URL + "/" + filtro.ruta + "/" + ID);
                chai.expect(resp.datos).to.be.an("array").that.has.lengthOf(2);
                chai.expect(resp.totalDatos).to.equal(2);
            });
        });

        (config.sinId || []).forEach(filtro => {
            test(filtro.metodo + " deberia consultar /" + filtro.ruta + " y retornar la lista", async function () {
                stubFetch = sinon.stub(window, "fetch").resolves(new Response(JSON.stringify([registro]), { status: 200 }));
                let servicio = new Servicio();
                let resp = await servicio[filtro.metodo]();
                chai.expect(stubFetch.firstCall.args[0]).to.equal(servicio.URL + "/" + filtro.ruta);
                chai.expect(resp.datos).to.be.an("array").that.has.lengthOf(1);
            });
        });
    });
}

/**
 * Pruebas de integracion comunes de un servicio (interfaz bdd: describe/it).
 * NECESITAN el backend corriendo y la base de datos.
 * config: { idCampo, campoActualizar, valorActualizado, filtros: ["metodo"], sinId: ["metodo"], ciclo, nuevo() }
 * Si ciclo es true, crea, consulta, actualiza y elimina un registro de prueba.
 */
export function pruebasIntegracion(Servicio, config) {
    describe(Servicio.name, function () {
        this.timeout(10000);
        let cut;

        before(function () {
            cut = new Servicio();
        });

        it("findRange should return an array and the total of records", async function () {
            let resp = await cut.findRange(0, 10);
            chai.expect(resp.datos).to.be.an("array");
            chai.expect(resp.totalDatos).to.be.at.least(resp.datos.length);
        });

        it("findById should return the first record found", async function () {
            let resp = await cut.findRange(0, 1);
            if (resp.datos.length === 0) {
                this.skip();
            }
            let id = resp.datos[0][config.idCampo];
            let r = await cut.findById(id);
            chai.expect(r.datos[config.idCampo]).to.equal(id);
        });

        it("findById should reject with 404 when the record does not exist", async function () {
            let err = await esperarRechazo(cut.findById(ID_INEXISTENTE));
            chai.expect(err.estado).to.equal(404);
        });

        (config.filtros || []).forEach(metodo => {
            it(metodo + " should reject with 404 when the parent does not exist", async function () {
                let err = await esperarRechazo(cut[metodo](ID_INEXISTENTE));
                chai.expect(err.estado).to.equal(404);
            });
        });

        (config.sinId || []).forEach(metodo => {
            it(metodo + " should return an array", async function () {
                let resp = await cut[metodo]();
                chai.expect(resp.datos).to.be.an("array");
            });
        });

        if (config.ciclo) {
            it("create, update and delete should work against the repository", async function () {
                let nuevo = config.nuevo();
                let creado = await cut.create(nuevo);
                let id = creado.datos[config.idCampo];
                chai.expect(id).to.be.a("string");
                chai.expect(creado.ubicacion).to.contain(id);

                let leido = await cut.findById(id);
                chai.expect(leido.datos[config.campoActualizar]).to.equal(nuevo[config.campoActualizar]);

                let actual = leido.datos;
                actual[config.campoActualizar] = config.valorActualizado;
                let actualizado = await cut.update(id, actual);
                chai.expect(actualizado.datos[config.campoActualizar]).to.equal(config.valorActualizado);

                await cut.delete(id);
                let err = await esperarRechazo(cut.findById(id));
                chai.expect(err.estado).to.equal(404);
            });

            it("create should reject with 422 when the name is longer than 155 characters", async function () {
                let invalido = Object.assign(config.nuevo(), { nombre: "x".repeat(200) });
                let err = await esperarRechazo(cut.create(invalido));
                chai.expect(err.estado).to.equal(422);
            });
        }
    });
}

/** Espera que la promesa falle y devuelve el error; si se resuelve, la prueba falla. */
export async function esperarRechazo(promesa) {
    try {
        await promesa;
    } catch (e) {
        return e;
    }
    throw new Error("Debio rechazar la promesa");
}
