import OrdenService from "../../../src/js/control/orden_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";

pruebasUnitarias(OrdenService, {
    "idCampo": "idOrden",
    "registro": {
        "idOrden": "11111111-1111-4111-8111-000000000001",
        "fechaCreacion": "2026-11-10T10:00:00.000-06:00",
        "idEmpleadoRol": {
            "idEmpleadoRol": "11111111-1111-4111-8111-000000000011"
        }
    },
    "campoActualizar": "fechaCreacion",
    "valorActualizado": "2026-11-10T11:00:00.000-06:00",
    "filtros": [],
    "sinId": [
        {
            "metodo": "findPendientes",
            "ruta": "pendientes"
        }
    ]
});
