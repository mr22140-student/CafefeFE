import CaracteristicaService from "../../../src/js/control/caracteristica_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";

pruebasIntegracion(CaracteristicaService, {
    "idCampo": "idCaracteristica",
    "campoActualizar": "observaciones",
    "valorActualizado": "actualizado",
    "filtros": [
        "findByTipoCaracteristica"
    ],
    "sinId": [],
    "ciclo": false
});
