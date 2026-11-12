import FacturaService from "../../../src/js/control/factura_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";

pruebasUnitarias(FacturaService, {
    "idCampo": "idFactura",
    "registro": {
        "idFactura": "11111111-1111-4111-8111-000000000001",
        "cliente": "Consumidor final",
        "fechaFacturacion": "2026-11-10T10:00:00.000-06:00",
        "estado": "PENDIENTE",
        "observaciones": "",
        "idCaja": {
            "idCaja": "11111111-1111-4111-8111-000000000011"
        },
        "idEmpleadoRol": {
            "idEmpleadoRol": "11111111-1111-4111-8111-000000000012"
        }
    },
    "campoActualizar": "observaciones",
    "valorActualizado": "actualizado",
    "filtros": [],
    "sinId": []
});
