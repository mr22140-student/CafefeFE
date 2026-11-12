import OrdenProductoService from "../../../src/js/control/orden_producto_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";

pruebasIntegracion(OrdenProductoService, {
    "idCampo": "idOrdenProducto",
    "campoActualizar": "observaciones",
    "valorActualizado": "Cliente: Ana Garcia",
    "filtros": [
        "findByOrden"
    ],
    "sinId": [],
    "ciclo": false
});
