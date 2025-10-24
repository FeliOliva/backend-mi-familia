// utils/format.js
const norm = (s) =>
  (s ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

/**
 * Devuelve "1 un" / "2 un" (abreviado) o "1 unidad" / "2 unidades" (no abreviado)
 * Para KG: "1,25 kg" o "250 g" si es menor a 1
 * Para CAJON: "1 cj" / "2 cj" (abreviado) o "1 cajon" / "2 cajones"
 * Para BOLSA: "1 bol" / "2 bol" (abreviado) o "1 bolsa" / "2 bolsas"
 *
 * Lee la unidad desde:
 *  - detalle.producto.tipounidad.tipo  (tu schema actual)
 *  - o detalle.producto.tipoUnidad.tipo (fallback por si quedó camelCase en algún lado)
 */
function cantidadConUnidad(detalle, { abbrUnidad = true } = {}) {
  const cant = Number(detalle?.cantidad ?? 0);

  // tolerante al nombre del campo
  const rawUnidad =
    detalle?.producto?.tipounidad?.tipo ??
    detalle?.producto?.tipoUnidad?.tipo ??
    "";

  const u = norm(rawUnidad);

  // 3 decimales para cantidades (p.ej. 0,125 kg)
  const nfCant = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 3,
  });

  // UNIDAD / UN
  if (["UNIDAD", "UNIDADES", "UNID", "U"].includes(u)) {
    if (abbrUnidad) {
      // abreviado siempre "un"
      return `${nfCant.format(cant)} un`;
    }
    // singular/plural
    const etiqueta = Math.abs(cant) === 1 ? "unidad" : "unidades";
    return `${nfCant.format(cant)} ${etiqueta}`;
  }

  // KG / G
  if (["KG", "KILO", "KILOS", "KILOGRAMO", "KILOGRAMOS"].includes(u)) {
    if (cant >= 1) {
      return `${nfCant.format(cant)} kg`;
    }
    // menor a 1 -> gramos, sin decimales
    const gramos = Math.round(cant * 1000);
    return `${gramos} g`;
  }
  if (["G", "GR", "GRAMO", "GRAMOS"].includes(u)) {
    return `${Math.round(cant)} g`;
  }

  // CAJON
  if (["CAJON", "CAJONES", "CAJ", "CAJA", "CAJAS"].includes(u)) {
    if (abbrUnidad) {
      return `${nfCant.format(cant)} caj`;
    }
    const etiqueta = Math.abs(cant) === 1 ? "cajon" : "cajones";
    return `${nfCant.format(cant)} ${etiqueta}`;
  }

  // BOLSA
  if (["BOLSA", "BOLSAS", "BOL"].includes(u)) {
    if (abbrUnidad) {
      return `${nfCant.format(cant)} Bol`;
    }
    const etiqueta = Math.abs(cant) === 1 ? "bolsa" : "bolsas";
    return `${nfCant.format(cant)} ${etiqueta}`;
  }

  // Fallback: mostrar la unidad tal cual llegó (en minúsculas)
  const raw = (rawUnidad || "").toString().trim();
  if (raw) {
    return `${nfCant.format(cant)} ${raw.toLowerCase()}`.trim();
  }
  // Si no hay unidad, solo la cantidad
  return nfCant.format(cant);
}

module.exports = { cantidadConUnidad };
