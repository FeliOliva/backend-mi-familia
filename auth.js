const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware para verificar el token JWT
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: "Token inválido" });
        }
        req.user = decoded; // Guardamos los datos del usuario en la request
        next(); // Pasamos al siguiente middleware o controlador
    });
};

// Generar un token JWT
const generateToken = (user) => {
    return jwt.sign({ id: user.id, usuario: user.usuario }, JWT_SECRET, { expiresIn: "1h" });
};

module.exports = { verifyToken, generateToken };
