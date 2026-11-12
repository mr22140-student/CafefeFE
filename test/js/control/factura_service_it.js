import FacturaService from "../../../src/js/control/factura_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";

pruebasIntegracion(FacturaService, {
    "idCampo": "idFactura",
    "campoActualizar": "observaciones",
    "valorActualizado": "actualizado",
    "filtros": [],
    "sinId": [],
    "ciclo": false
});
