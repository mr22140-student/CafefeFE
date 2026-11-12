import ProductoCaracteristicaService from "../../../src/js/control/producto_caracteristica_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";

pruebasIntegracion(ProductoCaracteristicaService, {
    "idCampo": "idProductoCaracteristica",
    "campoActualizar": "valor",
    "valorActualizado": "16oz",
    "filtros": [
        "findByProducto"
    ],
    "sinId": [],
    "ciclo": false
});
