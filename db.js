const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getUserByUsername = async (usuario) => {
  try {
    return await prisma.usuario.findUnique({
      where: { usuario },
    });
  } catch (error) {
    console.error("Error consultando usuario:", error);
    throw error;
  }
};

module.exports = { prisma, getUserByUsername };
