#!/usr/bin/env bash
set -euo pipefail
printf 'SET session_replication_role = replica;\n\n'
pg_dump --data-only --quote-all-identifiers --role "postgres" \
  --exclude-schema "information_schema|pg_*|graphql|graphql_public|pgsodium|pgsodium_masks|pgtle|repack|tiger|tiger_data|timescaledb_*|_timescaledb_*|topology|vault|etl|extensions|pgbouncer|realtime|supabase_migrations|_analytics|_realtime|_supavisor" \
  --exclude-table "auth.schema_migrations" --exclude-table "storage.migrations" \
  --exclude-table "supabase_functions.migrations" --schema "*" \
  --exclude-table '"storage"."buckets_vectors"' --exclude-table '"storage"."vector_indexes"' \
| sed -E 's/^\\(un)?restrict .*$/-- &/'
echo "RESET ALL;"
