const express = require("express");
require("dotenv").config();
const { generateToken, verifyToken } = require("./auth");
const { prisma } = require("./db");
const cors = require("cors");
const { setupWebSocket } = require("./websocket");
const http = require("http");
const cron = require("node-cron");
const entregaModel = require("./models/entregaModel");
const cajaModel = require("./models/cajaModel");
// si necesitás prisma, importalo también

// Correr todos los días a las 23:59 hora de Argentina
cron.schedule(
  "59 23 * * *",
  async () => {
    console.log("🕒 Ejecutando cierre automático de cajas...");

    try {
      // Cerrar el día de HOY (ya que es 23:59)
      const hoy = new Date();

      // 1) Obtener los totales de entregas de hoy por caja
      const totalesPorCaja = await entregaModel.getTotalesEntregasDelDiaPorCaja(
        hoy
      );

      if (!totalesPorCaja.length) {
        console.log("No hay cajas pendientes para cerrar automáticamente.");
        return;
      }

      // 2) Crear un cierre por cada caja pendiente
      for (const caja of totalesPorCaja) {
        const {
          cajaId,
          totalEfectivo,
          totalOtros,
          totalEntregado,
          totalCuentaCorriente = 0,
          metodospago = [],
        } = caja;

        const totalPagado = totalEntregado; // efectivo + otros
        const ingresoLimpio = totalPagado; // ajustalo si descontás algo

        console.log(
          `Creando cierre automático para caja ${cajaId}, total: ${totalEntregado}`
        );

        await cajaModel.crearCierreCaja({
          // estos nombres tienen que coincidir con lo que tu model espera
          cajaId,
          totalVentas: totalEntregado + totalCuentaCorriente, // o lo que uses
          totalPagado,
          totalCuentaCorriente,
          totalEfectivo,
          ingresoLimpio,
          estado: 0, // por ejemplo estado 0 = cierre auto pendiente de revisar
          metodoPago: metodospago.map((m) => ({
            nombre: m.nombre,
            total: m.total,
          })),
          // usuarioId lo podés dejar null o un usuario "sistema"
        });
      }

      console.log("✅ Cierre automático de cajas finalizado");
    } catch (err) {
      console.error("❌ Error en cierre automático de cajas:", err);
    }
  },
  {
    timezone: "America/Argentina/Cordoba",
  }
);

const app = express();
const PORT = process.env.PORT;

const server = http.createServer(app);

// WebSocket con prisma y el server HTTP
setupWebSocket(server, prisma);

//ROUTES
const negociosRoutes = require("./routes/negocioRoutes");
const productsRoutes = require("./routes/productsRoutes");
const ventaRoutes = require("./routes/ventasRoutes");
const precioLogRoutes = require("./routes/precioLogRoutes");
const entregaRoutes = require("./routes/entregasRoutes");
const notasCreditoRoutes = require("./routes/notasCreditoRoutes");
const tiposUnidadesRoutes = require("./routes/tiposUnidadesRoutes");
const chequesRoutes = require("./routes/chequeRoutes");
const resumenCuentaRoutes = require("./routes/resumenCuenta");
const cajaRoutes = require("./routes/cajaRoutes");
const metodosPagoRoutes = require("./routes/metodosPagoRoutes");

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.post("/login", async (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({ error: "Faltan datos en la solicitud" });
  }
  try {
    // Buscar el usuario por nombre de usuario
    const user = await prisma.usuario.findFirst({
      where: { usuario },
    });
    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const token = generateToken({ id: user.id, usuario: user.usuario });

    res.json({
      token,
      rol: user.rol,
      cajaId: user.cajaId,
      userName: user.usuario,
      usuarioId: user.id,
    });
  } catch (error) {
    console.error("Error al autenticar:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.use(
  "/api",
  verifyToken,
  resumenCuentaRoutes,
  negociosRoutes,
  productsRoutes,
  ventaRoutes,
  precioLogRoutes,
  entregaRoutes,
  notasCreditoRoutes,
  tiposUnidadesRoutes,
  chequesRoutes,
  cajaRoutes,
  metodosPagoRoutes
);

server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
