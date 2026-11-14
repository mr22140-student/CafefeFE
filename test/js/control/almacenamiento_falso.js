/** Almacenamiento falso con la misma interfaz que localStorage (para las pruebas). */
export function almacenamientoFalso() {
    let datos = {};
    return {
        datos,
        getItem: k => (k in datos ? datos[k] : null),
        setItem: (k, v) => { datos[k] = String(v); },
        removeItem: k => { delete datos[k]; }
    };
}