/**
 * Reglas de la preparacion de ordenes en el local (HU3 y seguimiento del cliente).
 * El estado se guarda en el backend (GET/PUT orden/{id}/estado, en memoria):
 * el barista lo avanza desde <pagina-recepcion> y el cliente lo ve en <seguimiento-orden>.
 */
export const ESTADOS = { RECIBIDA: "RECIBIDA", PREPARANDO: "PREPARANDO", EN_CAMINO: "EN_CAMINO", ENTREGADA: "ENTREGADA" };

/** Los pasos en el orden en que avanza la orden (igual que OrdenDAO.ESTADOS_PREPARACION). */
export const PASOS = [ESTADOS.RECIBIDA, ESTADOS.PREPARANDO, ESTADOS.EN_CAMINO, ESTADOS.ENTREGADA];

export const TEXTO_ESTADO = {
    RECIBIDA: "Recibida",
    PREPARANDO: "En preparación",
    EN_CAMINO: "En camino",
    ENTREGADA: "Entregada"
};

/** Lo que lee el cliente en su seguimiento. */
export const MENSAJE_CLIENTE = {
    RECIBIDA: "Recibimos su orden. En un momento empezamos a prepararla.",
    PREPARANDO: "Estamos preparando su orden.",
    EN_CAMINO: "Su orden va en camino a su mesa.",
    ENTREGADA: "¡Buen provecho! Su orden fue entregada."
};

/** Junta las unidades iguales: [{ nombre, cantidad }] en el orden en que llegaron. */
export function agruparProductos(productos) {
    let grupos = new Map();
    (productos ?? []).forEach(p => {
        let nombre = p.idProducto?.nombre ?? "Producto";
        let clave = p.idProducto?.idProducto ?? nombre;
        let grupo = grupos.get(clave) ?? { nombre, cantidad: 0 };
        grupo.cantidad++;
        grupos.set(clave, grupo);
    });
    return [...grupos.values()];
}

/** RECIBIDA -> PREPARANDO -> EN_CAMINO -> ENTREGADA (ENTREGADA ya no avanza). */
export function siguienteEstado(estado) {
    let actual = Math.max(PASOS.indexOf(estado), 0);
    return PASOS[Math.min(actual + 1, PASOS.length - 1)];
}