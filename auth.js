const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware para verificar el token JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      code: "NO_TOKEN",
      message: "No se proporcionó el token de autenticación.",
    });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      // Token vencido
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          code: "TOKEN_EXPIRED",
          message: "Tu sesión ha expirado. Vuelve a iniciar sesión.",
        });
      }

      // Token inválido por cualquier otro motivo
      return res.status(401).json({
        code: "TOKEN_INVALID",
        message: "Token inválido. Vuelve a iniciar sesión.",
      });
    }

    // Todo OK → guardamos datos del usuario en la request
    req.user = decoded;
    next();
  });
};

// Generar un token JWT
const generateToken = (user) => {
  return jwt.sign({ id: user.id, usuario: user.usuario }, JWT_SECRET, {
    // podés cambiarlo a "8h", "12h", "24h" según lo que quieras
    expiresIn: "8h",
  });
};

module.exports = { verifyToken, generateToken };
