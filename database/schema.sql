-- Dump minimal pour le projet station_guessr
-- Contient la création de la base et des tables utilisées par l'API

CREATE DATABASE IF NOT EXISTS `station_guessr` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `station_guessr`;

-- Table users
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `display_name` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table games (parties jouées par les utilisateurs)
CREATE TABLE IF NOT EXISTS `games` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `date` DATE NOT NULL,
  `station_name` VARCHAR(255) NOT NULL,
  `attempts` INT NOT NULL DEFAULT 0,
  `extra_lines` INT NOT NULL DEFAULT 0,
  `city_revealed` TINYINT(1) NOT NULL DEFAULT 0,
  `score` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_games_user_id` (`user_id`),
  CONSTRAINT `fk_games_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table daily_games (une station par date)
CREATE TABLE IF NOT EXISTS `daily_games` (
  `date` DATE NOT NULL,
  `station_name` VARCHAR(255) NOT NULL,
  `city` VARCHAR(255) DEFAULT '',
  `arrondissement` INT DEFAULT NULL,
  `lines_json` JSON NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- games_history exposé comme une vue (reflète la table games)
DROP VIEW IF EXISTS `games_history`;
CREATE VIEW `games_history` AS
  SELECT id, user_id, date, station_name, attempts, extra_lines, city_revealed, score, created_at
  FROM games;

-- Sample data (optionnel)
INSERT INTO `users` (`email`, `password_hash`, `display_name`) VALUES
  ('test@example.com', '$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'Test User');

-- Quelques daily games exemples (dernières dates jusqu'à aujourd'hui)
INSERT INTO `daily_games` (`date`, `station_name`, `city`, `arrondissement`, `lines_json`) VALUES
  ('2025-11-27', 'Gare de Test 1', 'Paris', 1, JSON_ARRAY('TRAM 1', 'METRO 2')),
  ('2025-11-28', 'Gare de Test 2', 'Paris', 2, JSON_ARRAY('TRAM 3a', 'RER A')),
  ('2025-11-29', 'Gare de Test 3', 'Paris', NULL, JSON_ARRAY('TRAM 5', 'METRO 7'));

-- Exemple de parties jouées
INSERT INTO `games` (`user_id`, `date`, `station_name`, `attempts`, `extra_lines`, `city_revealed`, `score`) VALUES
  (1, '2025-11-27', 'Gare de Test 1', 3, 1, 0, 120),
  (1, '2025-11-28', 'Gare de Test 2', 2, 0, 1, 150);

-- Fin du dump
