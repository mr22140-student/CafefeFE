import TipoCaracteristicaService from "../../../src/js/control/tipo_caracteristica_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";

pruebasIntegracion(TipoCaracteristicaService, {
    "idCampo": "idTipoCaracteristica",
    "campoActualizar": "observaciones",
    "valorActualizado": "actualizado",
    "filtros": [],
    "sinId": [],
    "ciclo": false
});
