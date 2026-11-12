import { UNITARIAS, INTEGRACION } from "./lista_pruebas.js";

/**
 * Ejecuta las pruebas con mocha en el navegador.
 * tipo "unit": interfaz tdd (suite/test); "it": interfaz bdd (describe/it).
 * ?archivo=control/caja_service_test  -> ejecuta solo ese archivo
 * sin parametro                       -> ejecuta todos los de la lista
 */
export async function ejecutar(tipo) {
    mocha.setup({ ui: tipo === "unit" ? "tdd" : "bdd", timeout: 10000 });
    let archivo = new URLSearchParams(location.search).get("archivo");
    let lista = tipo === "unit" ? UNITARIAS : INTEGRACION;
    if (archivo) {
        if (!/^[a-z_]+\/[a-z_]+$/.test(archivo)) {
            document.getElementById("mocha").textContent = "Parametro ?archivo invalido";
            return;
        }
        lista = [archivo];
    }
    for (let a of lista) {
        await import(`./${a}.js`);
    }
    // Para poder leer el resultado desde la consola o desde un navegador automatizado
    mocha.run(fallas => {
        window.resultadoPruebas = { fallas, total: mocha.suite.total() };
        document.title = (fallas === 0 ? "OK " : "FALLAS " + fallas + " ") + document.title;
    });
}
