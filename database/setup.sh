#!/usr/bin/env bash
set -euo pipefail

# Script d'installation rapide de la base de données pour le projet
# Usage:
#   DB_HOST=localhost DB_PORT=3306 DB_USER=station_user DB_PASSWORD=... ./database/setup.sh
# or (if you keep backend/.env):
#   ./database/setup.sh    # le script essaiera de lire ../backend/.env

## Resolve paths relative to this script's directory (so running from any CWD works)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../backend/.env"
# If backend/.env exists, source it safely (export variables) so values
# (including quoted values) are handled correctly and become available
# to this script. This avoids falling back to the wrong defaults.
if [ -f "$ENV_FILE" ]; then
  echo "Loading DB vars from $ENV_FILE"
  # shellcheck disable=SC1090
  set -o allexport
  source "$ENV_FILE"
  set +o allexport
fi

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-}
DB_NAME=${DB_NAME:-station_guessr}

SCHEMA_FILE="$SCRIPT_DIR/schema.sql"

echo "Will import schema into database '$DB_NAME' on $DB_HOST:$DB_PORT using user '$DB_USER'"

if ! command -v mysql >/dev/null 2>&1; then
  echo "mysql client not found in PATH. Please install mysql-client or run the SQL manually."
  exit 1
fi
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

exit 0
