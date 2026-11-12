/**
 * Reglas de la recepcion de ordenes.
 * El estado de preparacion (NUEVA -> PREPARANDO -> LISTA) es solo visual: el backend no lo guarda, la orden sigue pendiente hasta que se paga.
 */
export const ESTADOS = { NUEVA: "NUEVA", PREPARANDO: "PREPARANDO", LISTA: "LISTA" };

export const TEXTO_ESTADO = {
    NUEVA: "Nueva",
    PREPARANDO: "En preparación",
    LISTA: "Lista para entregar"
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

/** NUEVA -> PREPARANDO -> LISTA (LISTA ya no avanza). */
export function siguienteEstado(estado) {
    if (estado === ESTADOS.PREPARANDO || estado === ESTADOS.LISTA) {
        return ESTADOS.LISTA;
    }
    return ESTADOS.PREPARANDO;
}