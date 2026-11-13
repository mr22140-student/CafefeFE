/** Utilidades de texto compartidas. */

/** Quita tildes, espacios de mas y mayusculas: "  Café  Lúcia " -> "cafe lucia". */
export function normalizar(texto) {
    return (texto ?? "")
        .toString()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
}

/** Formato de moneda para toda la app: 3.5 -> "$3.50". */
export function moneda(valor) {
    return "$" + Number(valor ?? 0).toFixed(2);
}

/** Escapa texto que viene del servidor antes de meterlo en innerHTML. */
export function escapar(texto) {
    return (texto ?? "").toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

const PATRON_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** true si el texto tiene forma de UUID (los ids del backend). */
export function esUuid(texto) {
    return PATRON_UUID.test((texto ?? "").toString().trim());
}

/**
 * El nombre del cliente que ordena desde la app se guarda en OrdenProducto.observaciones
 * con este prefijo ("Cliente: Ana"). Asi se distingue de las observaciones que escriben
 * los meseros en el backend (por ejemplo "Descuento Clientes Preferenciales").
 */
export const PREFIJO_CLIENTE = "Cliente: ";

export function marcarCliente(nombre) {
    return PREFIJO_CLIENTE + (nombre ?? "").trim();
}

/** "Cliente: Ana" -> "Ana"; cualquier otra observacion -> "" (no es un nombre de cliente). */
export function leerCliente(observaciones) {
    let texto = (observaciones ?? "").trim();
    let coincide = texto.match(/^cliente\s*:\s*(.+)$/i);
    return coincide ? coincide[1].trim() : "";
}
