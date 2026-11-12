import ProductoService from "../../../src/js/control/producto_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";

pruebasUnitarias(ProductoService, {
    "idCampo": "idProducto",
    "registro": {
        "idProducto": "11111111-1111-4111-8111-000000000001",
        "nombre": "Latte Caramel",
        "precioSugerido": 3.5,
        "activo": true,
        "comentarios": ""
    },
    "campoActualizar": "comentarios",
    "valorActualizado": "actualizado",
    "filtros": [],
    "sinId": []
});
