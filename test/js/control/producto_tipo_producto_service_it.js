import ProductoTipoProductoService from "../../../src/js/control/producto_tipo_producto_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";

pruebasIntegracion(ProductoTipoProductoService, {
    "idCampo": "idProductoTipoProducto",
    "campoActualizar": "observaciones",
    "valorActualizado": "actualizado",
    "filtros": [
        "findByProducto",
        "findByTipoProducto"
    ],
    "sinId": [],
    "ciclo": false
});
