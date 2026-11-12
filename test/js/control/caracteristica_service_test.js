import CaracteristicaService from "../../../src/js/control/caracteristica_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";

pruebasUnitarias(CaracteristicaService, {
    "idCampo": "idCaracteristica",
    "registro": {
        "idCaracteristica": "11111111-1111-4111-8111-000000000001",
        "nombre": "Tamaño",
        "activo": true,
        "observaciones": "",
        "idTipoCaracteristica": {
            "idTipoCaracteristica": "11111111-1111-4111-8111-000000000011"
        }
    },
    "campoActualizar": "observaciones",
    "valorActualizado": "actualizado",
    "filtros": [
        {
            "metodo": "findByTipoCaracteristica",
            "ruta": "tipo_caracteristica"
        }
    ],
    "sinId": []
});
