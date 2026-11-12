import CajaService from "../../../src/js/control/caja_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";

pruebasIntegracion(CajaService, {
    "idCampo": "idCaja",
    "campoActualizar": "observaciones",
    "valorActualizado": "actualizado",
    "filtros": [],
    "sinId": [],
    "ciclo": true,
    "nuevo": () => ({ "nombre": "Caja FE " + Date.now(), "activo": true, "observaciones": "Creada desde las pruebas del front" })
});
