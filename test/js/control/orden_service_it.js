import OrdenService from "../../../src/js/control/orden_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";

pruebasIntegracion(OrdenService, {
    "idCampo": "idOrden",
    "campoActualizar": "fechaCreacion",
    "valorActualizado": "2026-11-10T11:00:00.000-06:00",
    "filtros": [],
    "sinId": [
        "findPendientes"
    ],
    "ciclo": false
});
