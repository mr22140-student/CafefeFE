import DescuentoProductoService from "../../../src/js/control/descuento_producto_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";

pruebasIntegracion(DescuentoProductoService, {
    "idCampo": "idDescuentoProducto",
    "campoActualizar": "valor",
    "valorActualizado": 15,
    "filtros": [
        "findByDescuento",
        "findByProducto"
    ],
    "sinId": [],
    "ciclo": false
});
