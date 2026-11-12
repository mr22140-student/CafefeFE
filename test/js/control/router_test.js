import * as chai from "../lib/chai/index.js";
import { resolverRuta, rutaPorRol, rutasDelMenu, RUTA_INICIAL, RUTA_LOGIN } from "../../../src/js/control/router.js";

suite("router", function () {
    test("sin hash deberia mostrar la pagina inicial (ordenar, publica)", function () {
        let r = resolverRuta("", null);
        chai.expect(r.ruta).to.equal(RUTA_INICIAL);
        chai.expect(r.elemento).to.equal("pagina-orden");
    });

    test("una ruta publica deberia mostrarse sin sesion", function () {
        chai.expect(resolverRuta("#/login", null).elemento).to.equal("pagina-login");
    });

    test("una ruta con rol deberia mandar al login y recordar el destino si no se tiene el rol", function () {
        let r = resolverRuta("#/pago", null);
        chai.expect(r.ruta).to.equal(RUTA_LOGIN);
        chai.expect(r.redirigido).to.equal(true);
        chai.expect(r.destino).to.equal("/pago");
    });

    test("un barista no deberia entrar a pago pero si a recepcion", function () {
        chai.expect(resolverRuta("#/pago", "barista").ruta).to.equal(RUTA_LOGIN);
        chai.expect(resolverRuta("#/recepcion", "Barista").elemento).to.equal("pagina-recepcion");
    });

    test("un cajero deberia entrar a pago", function () {
        chai.expect(resolverRuta("#/pago", "cajero").elemento).to.equal("pagina-pago");
    });

    test("una ruta desconocida deberia mostrar la pagina no encontrada", function () {
        chai.expect(resolverRuta("#/no-existe", null).elemento).to.equal("pagina-no-encontrada");
    });

    test("rutaPorRol deberia llevar a cada empleado a su pantalla", function () {
        chai.expect(rutaPorRol("Cajero")).to.equal("/pago");
        chai.expect(rutaPorRol("barista")).to.equal("/recepcion");
        chai.expect(rutaPorRol("Cocinero")).to.equal("/recepcion");
        chai.expect(rutaPorRol("Camarero")).to.equal(RUTA_INICIAL);
    });

    test("el menu deberia mostrar solo las rutas permitidas para el rol", function () {
        chai.expect(rutasDelMenu(null).map(r => r.ruta)).to.deep.equal(["/orden"]);
        chai.expect(rutasDelMenu("cajero").map(r => r.ruta)).to.deep.equal(["/orden", "/pago"]);
        chai.expect(rutasDelMenu("barista").map(r => r.ruta)).to.deep.equal(["/orden", "/recepcion"]);
    });
});
