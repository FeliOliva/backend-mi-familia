const cron = require("node-cron");
const entregaModel = require("../models/entregaModel");
const cajaModel = require("../models/cajaModel");

/**
 * Configuración del cierre automático de cajas
 */
const CONFIG = {
  // Horario: 23:59 todos los días
  cronExpression: "59 23 * * *",
  timezone: "America/Argentina/Cordoba",
  maxReintentos: 3,
  delayEntreReintentos: 2000, // 2 segundos
};

/**
 * Espera un tiempo determinado
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Procesa el cierre de una caja individual con reintentos
 */
const procesarCierreCaja = async (caja, intento = 1) => {
  const {
    cajaId,
    totalEfectivo,
    totalOtros,
    totalEntregado,
    totalCuentaCorriente = 0,
    metodospago = [],
  } = caja;

  try {
    const totalPagado = totalEntregado;
    const ingresoLimpio = totalPagado;

    // Agrupar métodos de pago por nombre y sumar totales
    const metodosPagoAgrupados = metodospago.reduce((acc, m) => {
      const existente = acc.find((item) => item.nombre === m.nombre);
      if (existente) {
        existente.total += m.total;
      } else {
        acc.push({ nombre: m.nombre, total: m.total });
      }
      return acc;
    }, []);

    await cajaModel.crearCierreCaja({
      cajaId,
      totalVentas: totalEntregado + totalCuentaCorriente,
      totalPagado,
      totalCuentaCorriente,
      totalEfectivo,
      ingresoLimpio,
      estado: 0, // 0 = cierre automático pendiente de revisar
      metodoPago: metodosPagoAgrupados,
    });

    return { success: true, cajaId };
  } catch (error) {
    console.error(
      `   ❌ Error en caja ${cajaId} (intento ${intento}/${CONFIG.maxReintentos}):`,
      error.message
    );

    // Reintentar si no se alcanzó el máximo
    if (intento < CONFIG.maxReintentos) {
      await delay(CONFIG.delayEntreReintentos);
      return procesarCierreCaja(caja, intento + 1);
    }

    return { success: false, cajaId, error: error.message };
  }
};

/**
 * Ejecuta el cierre automático de todas las cajas
 */
const ejecutarCierreAutomatico = async () => {
  const inicioEjecucion = new Date();
  console.log("\n" + "=".repeat(60));
  console.log("🕒 CIERRE AUTOMÁTICO DE CAJAS");
  console.log(`   Fecha: ${inicioEjecucion.toLocaleString("es-AR")}`);
  console.log("=".repeat(60));

  const resultados = {
    exitosos: [],
    fallidos: [],
  };

  try {
    // Obtener los totales de entregas del día por caja
    const totalesPorCaja = await entregaModel.getTotalesEntregasDelDiaPorCaja();

    if (!totalesPorCaja.length) {
      console.log("   ℹ️  No hay cajas pendientes para cerrar.");
      console.log("=".repeat(60) + "\n");
      return;
    }

    console.log(`   📦 Cajas a procesar: ${totalesPorCaja.length}`);
    console.log("-".repeat(60));

    // Procesar cada caja
    for (const caja of totalesPorCaja) {
      console.log(`   🔄 Procesando caja ${caja.cajaId}...`);
      console.log(`      - Total entregado: $${caja.totalEntregado}`);
      console.log(`      - Efectivo: $${caja.totalEfectivo}`);
      console.log(`      - Otros: $${caja.totalOtros}`);
      console.log(`      - Cuenta corriente: $${caja.totalCuentaCorriente}`);

      const resultado = await procesarCierreCaja(caja);

      if (resultado.success) {
        console.log(`   ✅ Caja ${caja.cajaId} cerrada correctamente`);
        resultados.exitosos.push(caja.cajaId);
      } else {
        console.log(`   ❌ Caja ${caja.cajaId} falló después de ${CONFIG.maxReintentos} intentos`);
        resultados.fallidos.push({ cajaId: caja.cajaId, error: resultado.error });
      }
      console.log("-".repeat(60));
    }

    // Resumen final
    const finEjecucion = new Date();
    const duracion = (finEjecucion - inicioEjecucion) / 1000;

    console.log("\n📊 RESUMEN DE EJECUCIÓN");
    console.log(`   ✅ Exitosos: ${resultados.exitosos.length}`);
    console.log(`   ❌ Fallidos: ${resultados.fallidos.length}`);
    console.log(`   ⏱️  Duración: ${duracion.toFixed(2)} segundos`);

    if (resultados.fallidos.length > 0) {
      console.log("\n⚠️  CAJAS CON ERROR:");
      resultados.fallidos.forEach((f) => {
        console.log(`   - Caja ${f.cajaId}: ${f.error}`);
      });
    }

    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("❌ ERROR CRÍTICO en cierre automático:", error);
    console.log("=".repeat(60) + "\n");
  }
};

/**
 * Configura e inicia el cron job de cierre automático
 */
const setupCierreCajaAutomatico = () => {
  console.log("⏰ Cron de cierre automático configurado:");
  console.log(`   - Horario: ${CONFIG.cronExpression} (${CONFIG.timezone})`);
  console.log(`   - Reintentos máximos: ${CONFIG.maxReintentos}`);

  cron.schedule(CONFIG.cronExpression, ejecutarCierreAutomatico, {
    timezone: CONFIG.timezone,
  });
};

/**
 * Permite ejecutar el cierre manualmente (útil para testing)
 */
const ejecutarCierreManual = async () => {
  console.log("🔧 Ejecutando cierre manual...");
  await ejecutarCierreAutomatico();
};

module.exports = {
  setupCierreCajaAutomatico,
  ejecutarCierreManual,
};

