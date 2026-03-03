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

    // 3) Total notas de crédito en el rango (usando datos ya cargados)
    const totalNotasCredito = ncEnRango.reduce((acc, nc) => acc + Number(nc.monto ?? 0), 0);

    // 4) Total gastos en el rango (findMany para evitar depender de aggregate)
    let totalGastos = 0;
    try {
      const gastosEnRango = await prisma.gasto.findMany({
        where: { fechaCreacion: rango, estado: 1 },
        select: { monto: true },
      });
      totalGastos = gastosEnRango.reduce((acc, g) => acc + Number(g.monto ?? 0), 0);
    } catch (e) {
      console.warn("Estadísticas: no se pudo cargar gastos (prisma.gasto puede no existir). Total gastos = 0.", e?.message);
    }

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

/**
 * GET /api/estadisticas/productos-vendidos?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Obtiene un resumen de productos vendidos agrupados por producto y unidad de medida
 */
const getProductosVendidos = async (req, res) => {
  try {
    const { startDate, endDate, cajaId } = req.query;
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

    const cajaIdNumero = Number(cajaId);
    const filtrarPorCaja = Number.isFinite(cajaIdNumero) && cajaIdNumero > 0;

    // Obtener detalles de venta filtrando por fecha de la venta (no del detalle),
    // para evitar desfasajes cuando una venta se edita y se recrean detalles.
    const detallesVenta = await prisma.detalleventa.findMany({
      where: {
        estado: 1, // Solo activos
        venta: {
          fechaCreacion: rango,
          ...(filtrarPorCaja ? { cajaId: cajaIdNumero } : {}),
        },
      },
      include: {
        producto: {
          include: {
            tipounidad: {
              select: {
                tipo: true,
              },
            },
          },
        },
      },
    });

    // Agrupar por producto + unidad (usando nombre para agrupar productos con mismo nombre pero diferentes unidades)
    const productosMap = new Map();

    detallesVenta.forEach((detalle) => {
      const productoId = detalle.productoId;
      const productoNombre = (detalle.producto.nombre || "Sin nombre").trim();
      const unidadTipo = (detalle.producto.tipounidad?.tipo || "Sin unidad").trim();
      // Agrupar por nombre + unidad para diferenciar productos con mismo nombre pero diferentes unidades
      const key = `${productoNombre}-${unidadTipo}`;

      if (!productosMap.has(key)) {
        productosMap.set(key, {
          productoId,
          productoNombre,
          unidadTipo,
          cantidadTotal: 0,
          precios: [],
          subtotal: 0,
        });
      }

      const item = productosMap.get(key);
      const cantidad = Number(detalle.cantidad || 0);
      const precio = Number(detalle.precio || 0);
      const subTotal = Number(detalle.subTotal ?? (cantidad * precio) ?? 0);

      item.cantidadTotal += cantidad;
      item.precios.push(precio);
      item.subtotal += subTotal;
    });

    // Convertir a array y calcular estadísticas
    const productosVendidos = Array.from(productosMap.values()).map((item) => {
      const precios = item.precios.filter((p) => p > 0);
      const precioMin = precios.length > 0 ? Math.min(...precios) : 0;
      const precioMax = precios.length > 0 ? Math.max(...precios) : 0;
      // Promedio ponderado por cantidad para evitar que una fila con poca cantidad
      // pese igual que otra con mucha cantidad.
      const precioPromedio =
        item.cantidadTotal > 0
          ? item.subtotal / item.cantidadTotal
          : 0;

      // Si hay precio mínimo y máximo diferentes, mostrar los 3 (min, max, promedio)
      // Si todos son iguales, solo mostrar el promedio
      const tieneVariacionPrecio = precioMin !== precioMax;

      return {
        productoId: item.productoId,
        productoNombre: item.productoNombre,
        unidadTipo: item.unidadTipo,
        cantidadTotal: Number(item.cantidadTotal.toFixed(3)),
        precioMin: tieneVariacionPrecio ? precioMin : null,
        precioMax: tieneVariacionPrecio ? precioMax : null,
        precioPromedio: Number(precioPromedio.toFixed(2)),
        subtotal: item.subtotal,
      };
    });

    // Ordenar por cantidad descendente para priorizar volumen vendido,
    // y usar subtotal como desempate.
    productosVendidos.sort((a, b) => {
      const diffCantidad = Number(b.cantidadTotal || 0) - Number(a.cantidadTotal || 0);
      if (diffCantidad !== 0) return diffCantidad;
      return Number(b.subtotal || 0) - Number(a.subtotal || 0);
    });

    return res.json({
      productosVendidos,
      totalProductos: productosVendidos.length,
      totalSubtotal: productosVendidos.reduce((acc, p) => acc + p.subtotal, 0),
    });
  } catch (error) {
    console.error("Error al obtener productos vendidos:", error);
    return res.status(500).json({ error: "Error al obtener productos vendidos" });
  }
};

/**
 * GET /api/estadisticas/productos-clientes?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Obtiene un diario por producto detallado por cliente.
 */
const getProductosClientes = async (req, res) => {
  try {
    const { startDate, endDate, cajaId } = req.query;
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

    const cajaIdNumero = Number(cajaId);
    const filtrarPorCaja = Number.isFinite(cajaIdNumero) && cajaIdNumero > 0;

    const detallesVenta = await prisma.detalleventa.findMany({
      where: {
        estado: 1,
        venta: {
          fechaCreacion: rango,
          ...(filtrarPorCaja ? { cajaId: cajaIdNumero } : {}),
        },
      },
      include: {
        producto: {
          include: {
            tipounidad: {
              select: { tipo: true },
            },
          },
        },
        venta: {
          select: {
            negocio: {
              select: { nombre: true },
            },
          },
        },
      },
    });

    const productosMap = new Map();

    detallesVenta.forEach((detalle) => {
      const productoNombre = (detalle.producto?.nombre || "Sin producto").trim();
      const unidadTipo = (detalle.producto?.tipounidad?.tipo || "Sin unidad").trim();
      const clienteNombre = (detalle.venta?.negocio?.nombre || "SIN CLIENTE").trim();
      const cantidad = Number(detalle.cantidad || 0);
      const precio = Number(detalle.precio || 0);
      const subTotal = Number(detalle.subTotal ?? (cantidad * precio) ?? 0);

      const keyProducto = `${productoNombre}-${unidadTipo}`;
      if (!productosMap.has(keyProducto)) {
        productosMap.set(keyProducto, {
          productoNombre,
          unidadTipo,
          cantidadTotal: 0,
          subtotalTotal: 0,
          clientesMap: new Map(),
        });
      }

      const productoItem = productosMap.get(keyProducto);
      productoItem.cantidadTotal += cantidad;
      productoItem.subtotalTotal += subTotal;

      if (!productoItem.clientesMap.has(clienteNombre)) {
        productoItem.clientesMap.set(clienteNombre, {
          clienteNombre,
          cantidadTotal: 0,
          subtotal: 0,
        });
      }

      const clienteItem = productoItem.clientesMap.get(clienteNombre);
      clienteItem.cantidadTotal += cantidad;
      clienteItem.subtotal += subTotal;
    });

    const productos = Array.from(productosMap.values())
      .map((p) => ({
        productoNombre: p.productoNombre,
        unidadTipo: p.unidadTipo,
        cantidadTotal: Number(p.cantidadTotal.toFixed(3)),
        subtotalTotal: p.subtotalTotal,
        clientes: Array.from(p.clientesMap.values())
          .map((c) => ({
            clienteNombre: c.clienteNombre,
            cantidadTotal: Number(c.cantidadTotal.toFixed(3)),
            subtotal: c.subtotal,
          }))
          .sort((a, b) => {
            const diffCant = Number(b.cantidadTotal || 0) - Number(a.cantidadTotal || 0);
            if (diffCant !== 0) return diffCant;
            return Number(b.subtotal || 0) - Number(a.subtotal || 0);
          }),
      }))
      .sort((a, b) => {
        const diffCant = Number(b.cantidadTotal || 0) - Number(a.cantidadTotal || 0);
        if (diffCant !== 0) return diffCant;
        return Number(b.subtotalTotal || 0) - Number(a.subtotalTotal || 0);
      });

    return res.json({
      productos,
      totalProductos: productos.length,
      totalSubtotal: productos.reduce((acc, p) => acc + Number(p.subtotalTotal || 0), 0),
    });
  } catch (error) {
    console.error("Error al obtener diario de productos por cliente:", error);
    return res.status(500).json({ error: "Error al obtener diario por producto y cliente" });
  }
};

module.exports = {
  getEstadisticas,
  getProductosVendidos,
  getProductosClientes,
};
