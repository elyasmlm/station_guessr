#!/usr/bin/env bash
set -euo pipefail

# Script d'installation rapide de la base de données pour le projet
# Usage:
#   DB_HOST=localhost DB_PORT=3306 DB_USER=station_user DB_PASSWORD=... ./database/setup.sh
# or (if you keep backend/.env):
#   ./database/setup.sh    # le script essaiera de lire ../backend/.env

ENV_FILE="../backend/.env"
if [ -f "$ENV_FILE" ]; then
  echo "Loading DB vars from $ENV_FILE"
  DB_HOST=$(grep '^DB_HOST=' "$ENV_FILE" | cut -d '=' -f2- || true)
  DB_PORT=$(grep '^DB_PORT=' "$ENV_FILE" | cut -d '=' -f2- || true)
  DB_USER=$(grep '^DB_USER=' "$ENV_FILE" | cut -d '=' -f2- || true)
  DB_PASSWORD=$(grep '^DB_PASSWORD=' "$ENV_FILE" | cut -d '=' -f2- || true)
  DB_NAME=$(grep '^DB_NAME=' "$ENV_FILE" | cut -d '=' -f2- || true)
fi

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-}
DB_NAME=${DB_NAME:-station_guessr}

SCHEMA_FILE="$(dirname "$0")/schema.sql"

echo "Will import schema into database '$DB_NAME' on $DB_HOST:$DB_PORT using user '$DB_USER'"

if ! command -v mysql >/dev/null 2>&1; then
  echo "mysql client not found in PATH. Please install mysql-client or run the SQL manually."
  exit 1
fi

# If DB user is root or has privilege to create DB, we can run the schema directly.
# Note: if DB user lacks CREATE DATABASE privilege, run this script as a privileged user
# or create the DB manually then re-run the import (or run with a root user by setting DB_USER/DB_PASSWORD).

# Build mysql command
MYSQL_CMD=(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER")
if [ -n "$DB_PASSWORD" ]; then
  MYSQL_CMD+=( -p"$DB_PASSWORD" )
fi

# Execute import
echo "Importing $SCHEMA_FILE ..."
"${MYSQL_CMD[@]}" < "$SCHEMA_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Import terminé. Base '$DB_NAME' prête."
else
  echo "❌ Import échoué. Vérifie les permissions / credentials."
fi

echo "Si tu veux créer l'utilisateur MySQL 'station_user', exécute manuellement en tant que root :"
cat <<'EOF'
-- Exemple (à exécuter en tant que root MySQL):
CREATE USER IF NOT EXISTS 'station_user'@'localhost' IDENTIFIED BY 'motdepasse_tres_fort';
GRANT ALL PRIVILEGES ON station_guessr.* TO 'station_user'@'localhost';
FLUSH PRIVILEGES;
EOF

exit 0
