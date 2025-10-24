const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getTiposUnidades = async () => {
    try {
        return await prisma.tipounidad.findMany();
    } catch (error) {
        console.error("Error en getTiposUnidades:", error);
        throw new Error("Error al obtener los tipos de unidades");
    }
}

const getTiposUnidadesById = async (id) => {
    try {
        return await prisma.tipounidad.findUnique({ where: { id: parseInt(id) } });
    } catch (error) {
        console.error("Error consultando tipos de unidades:", error);
        throw error;
    }
}

const addTiposUnidades = async (tipo) => {
    try {
        return await prisma.tipounidad.create({ data: { tipo } });
    } catch (error) {
        console.error("Error consultando tipos de unidades:", error);
        throw error;
    }
}

const updateTiposUnidades = async (id, tipo) => {
    try {
        return await prisma.tipounidad.update({
            where: { id: parseInt(id) },
            data: { tipo }
        });
    } catch (error) {
        console.error("Error actualizando tipo de unidad:", error);
        throw new Error("No se pudo actualizar el tipo de unidad");
    }
};

const updateTipoUnidadesStatus = async (id, estado) => {
    try {
        return await prisma.tipounidad.update({
            where: { id: parseInt(id) },
            data: { estado },
        });
    } catch (error) {
        console.error("Error eliminando tipo de unidad:", error);
        throw new Error("No se pudo eliminar el tipo de unidad");
    }
}

module.exports = { getTiposUnidades, getTiposUnidadesById, addTiposUnidades, updateTiposUnidades, updateTipoUnidadesStatus };