// utils/format.js
const norm = (s) =>
  (s ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

function cantidadConUnidad(detalle, { abbrUnidad = true } = {}) {
  const cant = Number(detalle?.cantidad ?? 0);
  const raw = detalle?.producto?.tipoUnidad?.tipo ?? "";
  const u = norm(raw);
  const nfCant = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 3 });

  if (["UNIDAD", "UNIDADES", "UNID", "U"].includes(u)) {
    const etiqueta = abbrUnidad ? "un" : "unidad";
    return `${nfCant.format(cant)} ${etiqueta}`;
  }
  if (["KG", "KILO", "KILOS", "KILOGRAMO", "KILOGRAMOS"].includes(u)) {
    return cant >= 1
      ? `${nfCant.format(cant)} kg`
      : `${Math.round(cant * 1000)} g`;
  }
  if (["G", "GR", "GRAMO", "GRAMOS"].includes(u)) {
    return `${Math.round(cant)} g`;
  }
  if (["A", "AT", "ATADO", "ATADOS"].includes(u)) {
    return cant >= 1
      ? `${nfCant.format(cant)} at`
      : `${Math.round(cant * 1000)} at`;
  }
  return `${nfCant.format(cant)} ${raw.toLowerCase()}`.trim();
}

module.exports = { cantidadConUnidad };
