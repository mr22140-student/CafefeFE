import PagoService from "../../../src/js/control/pago_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";

pruebasIntegracion(PagoService, {
    "idCampo": "idPago",
    "campoActualizar": "observaciones",
    "valorActualizado": "actualizado",
    "filtros": [],
    "sinId": [],
    "ciclo": false
});
