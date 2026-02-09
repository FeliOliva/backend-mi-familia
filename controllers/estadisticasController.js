const { prisma } = require("../db");

/**
 * GET /api/estadisticas?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Solo debería ser consumido por el front para rol admin (rol === 0).
 * Devuelve: totalVentas, top10Negocios, totalEntregas, entregasPorMetodo, totalNotasCredito, totalGastos
 */
const getEstadisticas = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: "Faltan startDate o endDate (formato YYYY-MM-DD)",
      });
    }

    const parseDate = (str, endOfDay = false) => {
      const [y, m, d] = str.split("-").map(Number);
      if (endOfDay) {
        return new Date(y, m - 1, d, 23, 59, 59, 999);
      }
      return new Date(y, m - 1, d, 0, 0, 0, 0);
    };

    const inicio = parseDate(startDate);
    const fin = parseDate(endDate, true);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      return res.status(400).json({ error: "Fechas inválidas" });
    }

    const rango = {
      gte: inicio,
      lte: fin,
    };

    // 1) Total ventas y top 10 negocios por total de compras (sum de venta.total)
    const ventasEnRango = await prisma.venta.findMany({
      where: { fechaCreacion: rango },
      select: {
        total: true,
        negocioId: true,
        negocio: { select: { nombre: true } },
      },
    });

    const totalVentas = ventasEnRango.reduce((acc, v) => acc + Number(v.total || 0), 0);

    const porNegocio = {};
    ventasEnRango.forEach((v) => {
      const id = v.negocioId;
      if (!porNegocio[id]) {
        porNegocio[id] = { negocioId: id, nombre: (v.negocio?.nombre || "-").trim(), totalCompras: 0, totalPagos: 0, totalNC: 0 };
      }
      porNegocio[id].totalCompras += Number(v.total || 0);
    });

    // 2) Entregas: total, por método y por negocio (pagos por cliente)
    const entregasEnRango = await prisma.entregas.findMany({
      where: { fechaCreacion: rango },
      include: {
        metodopago: { select: { id: true, nombre: true } },
      },
    });

    entregasEnRango.forEach((e) => {
      const id = e.negocioId;
      if (!porNegocio[id]) {
        porNegocio[id] = { negocioId: id, nombre: "-", totalCompras: 0, totalPagos: 0, totalNC: 0 };
      }
      porNegocio[id].totalPagos += Number(e.monto || 0);
    });

    const ncEnRango = await prisma.notacredito.findMany({
      where: { fechaCreacion: rango },
      select: { negocioId: true, monto: true },
    });
    ncEnRango.forEach((nc) => {
      const id = nc.negocioId;
      if (!porNegocio[id]) {
        porNegocio[id] = { negocioId: id, nombre: "-", totalCompras: 0, totalPagos: 0, totalNC: 0 };
      }
      porNegocio[id].totalNC += Number(nc.monto || 0);
    });

    const NOMBRE_CF = "CONSUMIDOR FINAL";
    const esConsumidorFinal = (nombre) =>
      String(nombre || "").toUpperCase().trim() === NOMBRE_CF;

    const todosArray = Object.values(porNegocio).sort((a, b) => b.totalCompras - a.totalCompras);
    const consumidorFinal = todosArray.find((n) => esConsumidorFinal(n.nombre)) || null;
    const todosNegocios = todosArray.filter((n) => !esConsumidorFinal(n.nombre));
    const top10Negocios = todosNegocios.slice(0, 10);

    const totalEntregas = entregasEnRango.reduce((acc, e) => acc + Number(e.monto || 0), 0);

    const porMetodo = {};
    entregasEnRango.forEach((e) => {
      const key = e.metodoPagoId ?? 0;
      const nombre = e.metodopago?.nombre ?? "Sin método";
      if (!porMetodo[key]) {
        porMetodo[key] = { metodoPagoId: key, metodoPagoNombre: nombre, total: 0 };
      }
      porMetodo[key].total += Number(e.monto || 0);
    });
    const entregasPorMetodo = Object.values(porMetodo);

    // 3) Total notas de crédito en el rango
    const agregacionNC = await prisma.notacredito.aggregate({
      where: { fechaCreacion: rango },
      _sum: { monto: true },
    });
    const totalNotasCredito = Number(agregacionNC._sum?.monto ?? 0);

    // 4) Total gastos en el rango
    const agregacionGastos = await prisma.gasto.aggregate({
      where: { fechaCreacion: rango },
      _sum: { monto: true },
    });
    const totalGastos = Number(agregacionGastos._sum?.monto ?? 0);

    // 5) Total clientes (en el período) y total productos (catálogo)
    const totalClientes = todosNegocios.length + (consumidorFinal ? 1 : 0);
    const totalProductos = await prisma.producto.count({ where: { estado: 1 } });

    return res.json({
      totalVentas,
      consumidorFinal,
      top10Negocios,
      todosNegocios,
      totalEntregas,
      entregasPorMetodo,
      totalNotasCredito,
      totalGastos,
      sumPagosYNotasCredito: totalEntregas + totalNotasCredito,
      diferenciaVentasMenosPagosNC: totalVentas - (totalEntregas + totalNotasCredito),
      diferenciaConsiderandoGastos: totalVentas - (totalEntregas + totalNotasCredito) - totalGastos,
      totalClientes,
      totalProductos,
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return res.status(500).json({ error: "Error al obtener estadísticas" });
  }
};

module.exports = {
  getEstadisticas,
};
