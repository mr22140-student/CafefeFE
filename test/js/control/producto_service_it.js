import ProductoService from "../../../src/js/control/producto_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";

pruebasIntegracion(ProductoService, {
    "idCampo": "idProducto",
    "campoActualizar": "comentarios",
    "valorActualizado": "actualizado",
    "filtros": [],
    "sinId": [],
    "ciclo": false
});
