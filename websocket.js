// websocket.js
const { WebSocketServer } = require("ws");
const url = require("url");

const connections = {};
const ventasPorCaja = {};

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
    // campo que espera el front:
    nombreProducto: d.producto?.nombre || "Producto sin nombre",
    // por compatibilidad:
    producto: d.producto ? { nombre: d.producto.nombre } : undefined,
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
    // lo que consumen los componentes:
    detalles,
  };
}

function setupWebSocket(server, prisma) {
  const wss = new WebSocketServer({ server });

  const cargarVentasDelDia = async (cajaId) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mañana = new Date(hoy);
    mañana.setDate(hoy.getDate() + 1);

    // 1) ventas de hoy (cualquier estado)
    const ventasDelDia = await prisma.venta.findMany({
      where: {
        fechaCreacion: { gte: hoy, lt: mañana },
        cajaId: Number(cajaId),
      },
      include: {
        detalleventa: { include: { producto: { select: { nombre: true } } } },
        negocio: { select: { nombre: true } },
      },
    });

    // 2) ventas de días anteriores pero con estado 1/3/5
    const otrasVentas = await prisma.venta.findMany({
      where: {
        fechaCreacion: { lt: hoy },
        cajaId: Number(cajaId),
        estadoPago: { in: [1, 3, 5] },
      },
      include: {
        detalleventa: { include: { producto: { select: { nombre: true } } } },
        negocio: { select: { nombre: true } },
      },
    });

    // normalizar
    const ventas = [...ventasDelDia, ...otrasVentas].map(normalizeVenta);

    ventasPorCaja[cajaId] = ventas;
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
  // fallback
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
  if (!ventasPorCaja[key]) return;
  ventasPorCaja[key] = ventasPorCaja[key].filter(
    (v) => v.id !== Number(ventaId)
  );

  const msg = { tipo: "venta-eliminada", data: { id: Number(ventaId) } };
  connections[key]?.forEach(
    (ws) => ws.readyState === 1 && ws.send(JSON.stringify(msg))
  );
}

function actualizarVenta(
  cajaId,
  dbVentaActualizada,
  tipo = "venta-actualizada"
) {
  const key = String(cajaId);
  if (!ventasPorCaja[key]) return;

  const venta = normalizeVenta(dbVentaActualizada);
  ventasPorCaja[key] = ventasPorCaja[key].map((v) =>
    v.id === venta.id ? venta : v
  );

  const msg = { tipo, data: venta };
  connections[key]?.forEach(
    (ws) => ws.readyState === 1 && ws.send(JSON.stringify(msg))
  );
}

module.exports = {
  setupWebSocket,
  broadcastNuevaVenta,
  enviarNuevaVenta,
  eliminarVenta,
  actualizarVenta,
};
