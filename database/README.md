This folder contains SQL schema and migrations for the `station_guessr` project.

Migration 001_add_unique_user_date.sql
-------------------------------------
Purpose: add a UNIQUE constraint on `(user_id, date)` in the `games` table to prevent duplicate game records per user and date.

Recommended procedure for production
1) Take a full DB dump (mysqldump) or snapshot before running any migration.

2) Run the migration using the MySQL client (replace credentials/host as needed):

```bash
# example using environment variables (adjust as needed)
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME < database/migrations/001_add_unique_user_date.sql
```

3) Verify:
```sql
-- no duplicate groups should remain
SELECT user_id, date, COUNT(*) AS c
FROM games
GROUP BY user_id, date
HAVING c > 1;
```

4) If something goes wrong you can restore from the dump or use the `games_pre_migration_backup` table created by the script.

Notes
- The migration keeps the row with the largest `id` for each `(user_id, date)`. If you prefer another policy (e.g. based on `created_at`) adapt the DELETE query before running.
- For managed DBs consider running ALTER TABLE during a maintenance window because MySQL may lock the table while adding the index depending on the engine and version.
