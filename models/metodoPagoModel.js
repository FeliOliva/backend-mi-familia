const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getMetodosPago = async (req, res) => {
    try {
        const metodosPago = await prisma.metodoPago.findMany();
        return res.status(200).json(metodosPago);
    } catch (error) {
        console.error('Error al obtener los métodos de pago:', error);
        return res.status(500).json({ error: 'Error al obtener los métodos de pago' });
    }
};

module.exports = { getMetodosPago };