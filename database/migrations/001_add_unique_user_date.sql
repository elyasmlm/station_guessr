-- Migration 001: ajouter contrainte UNIQUE (user_id, date) sur `games`
-- Usage: exécuter sur la base de données de production après sauvegarde

-- 1) Sauvegarde rapide (optionnel si vous avez dump externe)
-- CREATE TABLE IF NOT EXISTS games_backup AS SELECT * FROM games;

-- 2) Vérifier les doublons (affiche les groupes >1)
-- SELECT user_id, date, COUNT(*) AS c
-- FROM games
-- GROUP BY user_id, date
-- HAVING c > 1;

-- 3) Supprimer les doublons en conservant la ligne la plus récente (max id)
-- Nous utilisons une sous-requête dérivée pour MySQL afin d'éviter les erreurs

SET AUTOCOMMIT=0;
START TRANSACTION;

-- create a small safeguard backup table (fast copy of ids) if desired
CREATE TABLE IF NOT EXISTS games_pre_migration_backup AS SELECT * FROM games LIMIT 0;
INSERT INTO games_pre_migration_backup SELECT * FROM games;

-- Delete duplicates while keeping the row with the MAX(id) for each (user_id, date)
DELETE FROM games
WHERE id NOT IN (
  SELECT id FROM (
    SELECT MAX(id) AS id FROM games GROUP BY user_id, date
  ) AS keep_ids
);

-- 4) Verify no duplicates remain (should return 0 rows)
-- SELECT user_id, date, COUNT(*) AS c
-- FROM games
-- GROUP BY user_id, date
-- HAVING c > 1;

-- 5) Add unique index on (user_id, date)
ALTER TABLE `games`
  ADD UNIQUE INDEX `uniq_games_user_date` (`user_id`, `date`);

COMMIT;
SET AUTOCOMMIT=1;

-- Notes:
-- - This migration keeps the row with the highest `id` per (user_id,date). If you prefer to keep the most recent by `created_at`, adapt the SELECT MAX(...) logic to use `created_at` (and tie-break by id).
-- - Test first on a staging copy. Keep the backup tables (games_backup, games_pre_migration_backup) until you're sure.
