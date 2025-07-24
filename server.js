const express = require("express");
require("dotenv").config();
const { generateToken, verifyToken } = require("./auth");
const { prisma } = require("./db");
const cors = require("cors");
const { setupWebSocket } = require("./websocket");
const http = require("http");

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
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
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
