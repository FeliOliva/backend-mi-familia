-- Migración manual ADITIVA: vincula cada cheque con el pago (entrega) con el
-- que se cobró.
--
-- Solo toca la tabla `cheque`. Las 3 sentencias del esquema salen de
-- `prisma migrate diff` (coinciden con schema.prisma); el resto de ese diff
-- NO se aplica, porque borraría tablas legacy que siguen en la base.
--
-- - entregaId es NULL-able: los cheques cargados a mano no tienen pago.
-- - UNIQUE: un cheque corresponde a un solo pago.
-- - ON DELETE CASCADE: si se borra el pago (o la venta, que borra sus pagos),
--   se borra el cheque y no queda huérfano.

-- 1) Esquema -------------------------------------------------------------------

ALTER TABLE `cheque` ADD COLUMN `entregaId` INTEGER NULL;

CREATE UNIQUE INDEX `Cheque_entregaId_key` ON `cheque`(`entregaId`);

ALTER TABLE `cheque` ADD CONSTRAINT `Cheque_entregaId_fkey`
  FOREIGN KEY (`entregaId`) REFERENCES `entregas`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 2) Backfill de cheques existentes ---------------------------------------------
--
-- Hasta ahora cheque y entrega se creaban en dos llamadas separadas sin nada
-- que las uniera. Se vinculan por: mismo negocio, mismo monto, entrega con
-- método CHEQUE y creadas con menos de 5 minutos de diferencia.
--
-- Solo se vinculan pares SIN AMBIGÜEDAD: el cheque tiene un único pago
-- candidato y ese pago tiene un único cheque candidato. Los casos ambiguos
-- (varios cheques iguales del mismo negocio en el mismo momento) quedan con
-- entregaId NULL. Idempotente: solo toca cheques que aún no tienen entregaId.

UPDATE `cheque` c
JOIN (
  SELECT chequeId, entregaId
  FROM (
    SELECT
      c2.id AS chequeId,
      e.id  AS entregaId,
      COUNT(*) OVER (PARTITION BY c2.id) AS nPorCheque,
      COUNT(*) OVER (PARTITION BY e.id)  AS nPorEntrega
    FROM `cheque` c2
    JOIN `entregas` e
      ON e.negocioId = c2.negocioId
     AND e.monto = c2.monto
    JOIN `metodopago` m
      ON m.id = e.metodoPagoId
     AND m.nombre = 'CHEQUE'
    WHERE c2.entregaId IS NULL
      AND ABS(TIMESTAMPDIFF(SECOND, c2.fechaCreacion, e.fechaCreacion)) <= 300
      AND NOT EXISTS (SELECT 1 FROM `cheque` x WHERE x.entregaId = e.id)
  ) candidatos
  WHERE nPorCheque = 1 AND nPorEntrega = 1
) v ON v.chequeId = c.id
SET c.entregaId = v.entregaId;

-- Verificación (opcional):
-- SELECT COUNT(*) AS vinculados FROM cheque WHERE entregaId IS NOT NULL;
