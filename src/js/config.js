/**
 * Configuracion unica del frontend.
 * Si cambia el puerto o el nombre del .war, solo se cambia aqui.
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
 * idEmpleadoRol del "mesero virtual" (HU2): el camarero al que se asignan
 * las ordenes que hacen los clientes desde la app.
 */
export const ID_MESERO_VIRTUAL = "0858e8ef-df1a-49ad-b96d-88c7c18bedae";