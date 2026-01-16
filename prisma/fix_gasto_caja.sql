UPDATE gasto g
JOIN usuario u ON u.id = g.usuarioId
SET g.cajaId = u.cajaId
WHERE g.cajaId IS NULL;

DELETE FROM gasto WHERE cajaId IS NULL;
