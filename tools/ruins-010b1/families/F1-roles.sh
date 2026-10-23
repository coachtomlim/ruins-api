#!/usr/bin/env bash
set -euo pipefail
pg_dumpall --roles-only --role "postgres" --quote-all-identifiers --no-role-passwords --no-comments \
| sed -E 's/^\\(un)?restrict .*$/-- &/' \
| sed -E 's/^CREATE ROLE "(anon|authenticated|authenticator|cli_login_.*|dashboard_user|pgbouncer|postgres|service_role|supabase_.*|pgsodium_keyholder|pgsodium_keyiduser|pgsodium_keymaker|pgtle_admin)"/-- &/' \
| sed -E 's/^ALTER ROLE "(anon|authenticated|authenticator|cli_login_.*|dashboard_user|pgbouncer|postgres|service_role|supabase_.*|pgsodium_keyholder|pgsodium_keyiduser|pgsodium_keymaker|pgtle_admin)"/-- &/' \
| sed -E 's/ (NOSUPERUSER|NOREPLICATION)//g' \
| sed -E 's/^-- (.* SET "(pgaudit.*|pgrst.*|session_replication_role|statement_timeout|track_io_timing)" .*)/\1/' \
| sed -E 's/GRANT ".*" TO "(anon|authenticated|authenticator|cli_login_.*|dashboard_user|pgbouncer|postgres|service_role|supabase_.*|pgsodium_keyholder|pgsodium_keyiduser|pgsodium_keymaker|pgtle_admin)"/-- &/' \
| sed -E '/^--/d' | uniq
echo "RESET ALL;"
