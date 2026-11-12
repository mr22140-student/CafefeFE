import RolService from "../../../src/js/control/rol_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";

pruebasUnitarias(RolService, {
    "idCampo": "idRol",
    "registro": {
        "idRol": "11111111-1111-4111-8111-000000000001",
        "nombre": "Cajero",
        "activo": true,
        "observaciones": ""
    },
    "campoActualizar": "observaciones",
    "valorActualizado": "actualizado",
    "filtros": [],
    "sinId": []
});
