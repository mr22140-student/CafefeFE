import TipoCaracteristicaService from "../../../src/js/control/tipo_caracteristica_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";

pruebasUnitarias(TipoCaracteristicaService, {
    "idCampo": "idTipoCaracteristica",
    "registro": {
        "idTipoCaracteristica": "11111111-1111-4111-8111-000000000001",
        "nombre": "Tamaño",
        "expresionRegular": ".*",
        "activo": true,
        "observaciones": ""
    },
    "campoActualizar": "observaciones",
    "valorActualizado": "actualizado",
    "filtros": [],
    "sinId": []
});
