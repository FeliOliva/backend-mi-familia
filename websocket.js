// websocket.js
const { WebSocketServer } = require("ws");
const url = require("url");

const connections = {};
const ventasPorCaja = {};

let prismaRef = null;

// --- Util común: normalizar shape para el frontend ---
function normalizeVenta(dbVenta) {
  const detalles = (dbVenta.detalleventa || []).map((d) => ({
    id: d.id,
    precio: d.precio,
    cantidad: d.cantidad,
    subTotal: d.subTotal,
    fechaCreacion: d.fechaCreacion,
    estado: d.estado,
    ventaId: d.ventaId,
    productoId: d.productoId,
    nombreProducto: d.producto?.nombre || "Producto sin nombre",
    producto: d.producto
      ? {
          nombre: d.producto.nombre,
          unidad: d.producto?.tipounidad?.tipo || null,
        }
      : undefined,
  }));

  return {
    id: dbVenta.id,
    nroVenta: dbVenta.nroVenta,
    total: dbVenta.total,
    totalPagado: dbVenta.totalPagado,
    restoPendiente: dbVenta.restoPendiente,
    estadoPago: dbVenta.estadoPago,
    fechaCreacion: dbVenta.fechaCreacion,
    negocioId: dbVenta.negocioId,
    cajaId: dbVenta.cajaId,
    usuarioId: dbVenta.usuarioId,
    negocio: dbVenta.negocio ? { nombre: dbVenta.negocio.nombre } : undefined,
    detalles,
    fueAplazadaOParcial: false, // 👈 default
  };
}

/**
 * Misma lógica que la carga inicial: lista autoritativa desde BD para una caja.
 */
async function fetchVentasCajaDiaFromDb(prisma, cajaIdKey) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const mañana = new Date(hoy);
  mañana.setDate(hoy.getDate() + 1);
  const cajaNum = Number(cajaIdKey);

  const ventasDelDia = await prisma.venta.findMany({
    where: {
      fechaCreacion: { gte: hoy, lt: mañana },
      cajaId: cajaNum,
    },
    include: {
      detalleventa: {
        include: {
          producto: {
            include: {
              tipounidad: {
                select: { tipo: true },
              },
            },
          },
        },
      },
      negocio: { select: { nombre: true } },
    },
  });

  const otrasVentas = await prisma.venta.findMany({
    where: {
      fechaCreacion: { lt: hoy },
      cajaId: cajaNum,
      estadoPago: { in: [1, 3, 5] },
    },
    include: {
      detalleventa: {
        include: {
          producto: {
            include: {
              tipounidad: {
                select: { tipo: true },
              },
            },
          },
        },
      },
      negocio: { select: { nombre: true } },
    },
  });

  const ventasPreviasCobradasHoy = await prisma.venta.findMany({
    where: {
      fechaCreacion: { lt: hoy },
      cajaId: cajaNum,
      estadoPago: 2,
      entregas: {
        some: {
          fechaCreacion: { gte: hoy, lt: mañana },
        },
      },
    },
    include: {
      detalleventa: {
        include: {
          producto: {
            include: {
              tipounidad: {
                select: { tipo: true },
              },
            },
          },
        },
      },
      negocio: { select: { nombre: true } },
    },
  });

  const ventasDb = [
    ...ventasDelDia,
    ...otrasVentas,
    ...ventasPreviasCobradasHoy.filter(
      (v) =>
        !ventasDelDia.some((x) => x.id === v.id) &&
        !otrasVentas.some((x) => x.id === v.id)
    ),
  ];

  return ventasDb.map((v) => {
    const base = normalizeVenta(v);
    if (v.estadoPago === 3 || v.estadoPago === 5) {
      base.fueAplazadaOParcial = true;
    }
    if (v.fechaCreacion < hoy && v.estadoPago === 2) {
      base.fueAplazadaOParcial = true;
    }
    return base;
  });
}

async function emitVentasInicialesDesdeDb(cajaIdKey) {
  if (!prismaRef) return;
  const key = String(cajaIdKey);
  try {
    const ventas = await fetchVentasCajaDiaFromDb(prismaRef, key);
    ventasPorCaja[key] = ventas;
    const msg = JSON.stringify({ tipo: "ventas-iniciales", data: ventas });
    connections[key]?.forEach(
      (ws) => ws.readyState === 1 && ws.send(msg)
    );
  } catch (e) {
    console.error("emitVentasInicialesDesdeDb", key, e);
  }
}

function setupWebSocket(server, prisma) {
  prismaRef = prisma;
  const wss = new WebSocketServer({ server });

  const cargarVentasDelDia = async (cajaId) => {
    const key = String(cajaId);
    const ventas = await fetchVentasCajaDiaFromDb(prisma, key);
    ventasPorCaja[key] = ventas;
    return ventas;
  };

  const HEARTBEAT_MS = 30000;
  setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, HEARTBEAT_MS);

  wss.on("connection", async (ws, req) => {
    ws.isAlive = true;
    ws.on("pong", () => (ws.isAlive = true));
    ws.on("error", (err) => console.error("WS error:", err));

    const { query } = url.parse(req.url, true);
    const cajaId = String(Number(query.cajaId));
    if (cajaId === "NaN") {
      console.log("Conexión rechazada: cajaId inválido:", query.cajaId);
      ws.close();
      return;
    }

    console.log(`Nueva conexión establecida para caja ID: ${cajaId}`);
    (connections[cajaId] ||= []).push(ws);

    try {
      const ventasCaja =
        ventasPorCaja[cajaId] ?? (await cargarVentasDelDia(cajaId));
      ws.send(JSON.stringify({ tipo: "ventas-iniciales", data: ventasCaja }));
    } catch (error) {
      console.error("Error al cargar ventas:", error);
      ws.send(JSON.stringify({ tipo: "ventas-iniciales", data: [] }));
    }

    ws.on("close", () => {
      connections[cajaId] = (connections[cajaId] || []).filter((c) => c !== ws);
      if (!connections[cajaId]?.length) {
        delete connections[cajaId];
        delete ventasPorCaja[cajaId];
      }
    });
  });
}

// --- helpers de emisión (siempre normalizando antes de enviar) ---
function enviarNuevaVenta(cajaId, dbVenta) {
  const key = String(cajaId);
  const venta = normalizeVenta(dbVenta);

  if (!connections[key]) {
    console.log(`No hay conexiones activas para la caja ${key}`);
    return;
  }
  (ventasPorCaja[key] ||= []).push(venta);

  const msg = { tipo: "nueva-venta", data: venta };
  connections[key].forEach(
    (ws) => ws.readyState === 1 && ws.send(JSON.stringify(msg))
  );
}

function broadcastNuevaVenta(dbVenta) {
  if (Number.isFinite(Number(dbVenta?.cajaId))) {
    return enviarNuevaVenta(dbVenta.cajaId, dbVenta);
  }
  const venta = normalizeVenta(dbVenta);
  Object.keys(connections).forEach((key) => {
    connections[key].forEach(
      (ws) =>
        ws.readyState === 1 &&
        ws.send(JSON.stringify({ tipo: "nueva-venta", data: venta }))
    );
  });
}

function eliminarVenta(cajaId, ventaId) {
  const key = String(cajaId);
  if (ventasPorCaja[key]) {
    ventasPorCaja[key] = ventasPorCaja[key].filter(
      (v) => Number(v.id) !== Number(ventaId)
    );
  }

  const msg = { tipo: "venta-eliminada", data: { id: Number(ventaId) } };
  connections[key]?.forEach(
    (ws) => ws.readyState === 1 && ws.send(JSON.stringify(msg))
  );

  void emitVentasInicialesDesdeDb(key);
}

function actualizarVenta(
  cajaId,
  dbVentaActualizada,
  tipo = "venta-actualizada"
) {
  const key = String(cajaId);
  if (ventasPorCaja[key]) {
    const anterior = ventasPorCaja[key].find(
      (v) => v.id === Number(dbVentaActualizada.id)
    );
    const ventaNormalizada = normalizeVenta(dbVentaActualizada);
    const fueAplazadaOParcial =
      anterior?.fueAplazadaOParcial ||
      anterior?.estadoPago === 3 ||
      anterior?.estadoPago === 5;

    const venta = {
      ...ventaNormalizada,
      fueAplazadaOParcial,
    };
    ventasPorCaja[key] = ventasPorCaja[key].map((v) =>
      v.id === venta.id ? venta : v
    );

    const msg = { tipo, data: venta };
    connections[key]?.forEach(
      (ws) => ws.readyState === 1 && ws.send(JSON.stringify(msg))
    );
  }

  void emitVentasInicialesDesdeDb(key);
}

module.exports = {
  setupWebSocket,
  broadcastNuevaVenta,
  enviarNuevaVenta,
  eliminarVenta,
  actualizarVenta,
};
