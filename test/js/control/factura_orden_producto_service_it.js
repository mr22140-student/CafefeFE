import FacturaOrdenProductoService from "../../../src/js/control/factura_orden_producto_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";

pruebasIntegracion(FacturaOrdenProductoService, {
    "idCampo": "idFacturaOrdenProducto",
    "campoActualizar": "observaciones",
    "valorActualizado": "actualizado",
    "filtros": [
        "findByFactura"
    ],
    "sinId": [
        "findDisponibles"
    ],
    "ciclo": false
});
