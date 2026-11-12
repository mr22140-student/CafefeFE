/**
 * Configuracion unica del frontend.
 * Si cambia el puerto o el nombre del .war, solo se cambia aqui.
 * Es la misma URL que usan para ver el JSON en el navegador (sin el recurso final).
 */
export const URL_API = "http://localhost:9080/CafefeSV-1.0-SNAPSHOT/resources/v1/";

/** Nombres de rol tal como estan en la tabla rol (se comparan sin tildes ni mayusculas). */
export const ROLES = {
    CAMARERO: "camarero",
    CAJERO: "cajero",
    BARISTA: "barista",
    COCINERO: "cocinero"
};

/**
 * "Mesero virtual" (HU2): empleado con rol Camarero que toma las ordenes que los
 * clientes hacen desde la app. Se busca por nombre y apellido (sin importar
 * mayusculas ni tildes), asi funciona en cualquier base de datos sin copiar ids.
 */
export const MESERO_VIRTUAL = {
    nombre: "Mesero",
    apellido: "Virtual"
};
