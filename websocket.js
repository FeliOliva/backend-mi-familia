// websocket.js
const { WebSocketServer } = require("ws");
const url = require("url");

// Almacenar conexiones activas por cajaId
const connections = {};
// Mantener un registro de ventas por cajaId
const ventasPorCaja = {};

function setupWebSocket(server, prisma) {
  const wss = new WebSocketServer({ server });

  const cargarVentasDelDia = async (cajaId) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mañana = new Date(hoy);
    mañana.setDate(hoy.getDate() + 1);

    // 1. Ventas del día actual (todas sin importar estadoPago)
    const ventasDelDia = await prisma.venta.findMany({
      where: {
        fechaCreacion: {
          gte: hoy,
          lt: mañana,
        },
        cajaId: parseInt(cajaId),
      },
      include: {
        detalles: {
          include: {
            producto: { select: { nombre: true } },
          },
        },
        negocio: { select: { nombre: true } },
      },
    });

    // 2. Ventas de otros días pero con estadoPago 1, 2 o 5
    const otrasVentas = await prisma.venta.findMany({
      where: {
        fechaCreacion: {
          lt: hoy,
        },
        cajaId: parseInt(cajaId),
        estadoPago: {
          in: [1, 3, 5],
        },
      },
      include: {
        detalles: {
          include: {
            producto: { select: { nombre: true } },
          },
        },
        negocio: { select: { nombre: true } },
      },
    });

    // Combinar resultados
    const ventas = [...ventasDelDia, ...otrasVentas];

    // Añadir nombreProducto directamente para facilitar en el frontend
    const ventasMejoradas = ventas.map((venta) => ({
      ...venta,
      detalles: (venta.detalles || []).map((detalle) => ({
        ...detalle,
        nombreProducto: detalle.producto?.nombre || "Producto sin nombre",
      })),
    }));

    ventasPorCaja[cajaId] = ventasMejoradas;
    return ventasMejoradas;
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

    const parameters = url.parse(req.url, true);
    const rawId = parameters.query.cajaId;
    const cajaIdNum = Number(rawId);
    if (!Number.isFinite(cajaIdNum)) {
      console.log("Conexión rechazada: cajaId inválido:", rawId);
      ws.close();
      return;
    }
    const key = String(cajaIdNum);

    console.log(`Nueva conexión establecida para caja ID: ${key}`);

    if (!connections[key]) connections[key] = [];
    connections[key].push(ws);

    try {
      const ventasCaja =
        ventasPorCaja[key] ?? (await cargarVentasDelDia(cajaIdNum)); // ← usa el num
      ws.send(JSON.stringify({ tipo: "ventas-iniciales", data: ventasCaja }));
    } catch (error) {
      console.error("Error al cargar ventas:", error);
      ws.send(JSON.stringify({ tipo: "ventas-iniciales", data: [] }));
    }

    // Cierre de conexión — usa 'key' (no 'cajaId')
    ws.on("close", (code, reason) => {
      const reasonStr = reason?.toString?.() || "";
      console.log(`[WS] Close caja=${key} code=${code} reason=${reasonStr}`);

      connections[key] = (connections[key] || []).filter((c) => c !== ws);
      if (!connections[key].length) {
        delete connections[key];
        delete ventasPorCaja[key]; // limpieza opcional de cache
      }
    });
  });
}

// Nueva función para enviar venta solo a los clientes de una caja específica
function enviarNuevaVenta(cajaId, venta) {
  const key = String(cajaId);
  if (!connections[key]) {
    console.log(`No hay conexiones activas para la caja ${key}`);
    return;
  }

  // Añadir la venta al historial de esa caja
  if (!ventasPorCaja[key]) {
    ventasPorCaja[key] = [];
  }
  ventasPorCaja[key].push(venta);

  const mensaje = {
    tipo: "nueva-venta",
    data: venta,
  };

  connections[key].forEach((ws) => {
    if (ws.readyState === 1) {
      // 1 = WebSocket.OPEN
      try {
        ws.send(JSON.stringify(mensaje));
      } catch (error) {
        console.error(
          `Error al enviar mensaje a cliente de caja ${key}:`,
          error
        );
      }
    }
  });
}

function broadcastNuevaVenta(venta) {
  if (venta && Number.isFinite(Number(venta.cajaId))) {
    enviarNuevaVenta(venta.cajaId, venta); // enviarNuevaVenta ya castea a String
    return;
  }
  // fallback: broadcast a todas las cajas (poco común, pero ok)
  for (const cajaId of Object.keys(connections)) {
    for (const client of connections[cajaId]) {
      if (client.readyState === 1) {
        try {
          client.send(JSON.stringify({ tipo: "nueva-venta", data: venta }));
        } catch (err) {
          console.error("Error al enviar mensaje a cliente:", err);
        }
      }
    }
  }
}

function eliminarVenta(cajaId, ventaId) {
  const key = String(cajaId);
  if (!ventasPorCaja[key]) return;
  ventasPorCaja[key] = ventasPorCaja[key].filter(
    (venta) => venta.id !== Number(ventaId)
  );

  // Notificar a todos los clientes conectados a esa caja
  const mensaje = {
    tipo: "venta-eliminada",
    data: { id: ventaId },
  };

  if (connections[key]) {
    connections[key].forEach((ws) => {
      if (ws.readyState === 1) {
        try {
          ws.send(JSON.stringify(mensaje));
        } catch (error) {
          console.error(
            `Error al enviar eliminación a cliente de caja ${key}:`,
            error
          );
        }
      }
    });
  }
}

function actualizarVenta(cajaId, ventaActualizada, tipo = "venta-actualizada") {
  const key = String(cajaId);
  if (!ventasPorCaja[key]) return;

  ventasPorCaja[key] = ventasPorCaja[key].map((venta) =>
    venta.id === ventaActualizada.id ? ventaActualizada : venta
  );

  const mensaje = {
    tipo,
    data: ventaActualizada, // <- CORREGIDO AQUÍ
  };

  if (connections[key]) {
    connections[key].forEach((ws) => {
      if (ws.readyState === 1) {
        try {
          ws.send(JSON.stringify(mensaje));
        } catch (error) {
          console.error(
            `Error al enviar actualización a cliente de caja ${key}:`,
            error
          );
        }
      }
    });
  }
}

module.exports = {
  setupWebSocket,
  broadcastNuevaVenta,
  enviarNuevaVenta,
  eliminarVenta,
  actualizarVenta,
};
