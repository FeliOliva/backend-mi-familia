const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Normaliza un nombre de catalogo: mayusculas, sin espacios de mas.
const normalizarNombre = (nombre) =>
  String(nombre || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();

/**
 * Crea los handlers CRUD de un catalogo simple (id, nombre unico, activo).
 * Se usa para bancos y motivos de gasto. No hay DELETE: un valor en desuso se
 * desactiva, para no romper los registros que ya lo referencian.
 */
const crearCatalogo = (modelo, etiqueta) => ({
  // GET  ?todos=1 incluye los inactivos (para la pantalla de administracion)
  listar: async (req, res) => {
    try {
      const where = req.query.todos === "1" ? {} : { activo: true };
      const items = await prisma[modelo].findMany({
        where,
        orderBy: { nombre: "asc" },
      });
      res.json(items);
    } catch (error) {
      console.error(`Error listando ${etiqueta}:`, error);
      res.status(500).json({ error: `Error al obtener ${etiqueta}` });
    }
  },

  crear: async (req, res) => {
    try {
      const nombre = normalizarNombre(req.body.nombre);
      if (!nombre) {
        return res.status(400).json({ error: "El nombre es obligatorio" });
      }
      // Si ya existe (aunque este inactivo), se reactiva en vez de duplicar.
      const existente = await prisma[modelo].findUnique({ where: { nombre } });
      if (existente) {
        const item = existente.activo
          ? existente
          : await prisma[modelo].update({
              where: { id: existente.id },
              data: { activo: true },
            });
        return res.json(item);
      }
      const item = await prisma[modelo].create({ data: { nombre } });
      res.status(201).json(item);
    } catch (error) {
      console.error(`Error creando en ${etiqueta}:`, error);
      res.status(500).json({ error: `Error al crear en ${etiqueta}` });
    }
  },

  // PUT: renombrar y/o activar/desactivar
  actualizar: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = {};
      if (req.body.nombre !== undefined) {
        const nombre = normalizarNombre(req.body.nombre);
        if (!nombre) {
          return res.status(400).json({ error: "El nombre es obligatorio" });
        }
        data.nombre = nombre;
      }
      if (req.body.activo !== undefined) data.activo = Boolean(req.body.activo);
      const item = await prisma[modelo].update({ where: { id }, data });
      res.json(item);
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(400).json({ error: "Ya existe un valor con ese nombre" });
      }
      console.error(`Error actualizando ${etiqueta}:`, error);
      res.status(500).json({ error: `Error al actualizar ${etiqueta}` });
    }
  },
});

module.exports = {
  bancos: crearCatalogo("banco", "bancos"),
  motivosGasto: crearCatalogo("motivogasto", "motivos de gasto"),
  normalizarNombre,
};
