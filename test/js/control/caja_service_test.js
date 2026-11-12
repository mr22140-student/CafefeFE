import CajaService from "../../../src/js/control/caja_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";

pruebasUnitarias(CajaService, {
    "idCampo": "idCaja",
    "registro": {
        "idCaja": "11111111-1111-4111-8111-000000000001",
        "nombre": "Caja 1",
        "activo": true,
        "observaciones": "prueba"
    },
    "campoActualizar": "observaciones",
    "valorActualizado": "actualizado",
    "filtros": [],
    "sinId": []
});
