#!/usr/bin/env bash
set -euo pipefail
printf 'SET session_replication_role = replica;\n\n'
pg_dump --data-only --quote-all-identifiers --role "postgres" --exclude-schema "" \
  --exclude-table "auth.schema_migrations" --exclude-table "storage.migrations" \
  --exclude-table "supabase_functions.migrations" --schema "supabase_migrations" \
| sed -E 's/^\\(un)?restrict .*$/-- &/'
echo "RESET ALL;"
