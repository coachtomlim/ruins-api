#!/usr/bin/env bash
set -euo pipefail
pg_dump --schema-only --quote-all-identifiers --role "postgres" --exclude-schema "" --schema=supabase_migrations \
| sed -E 's/^\\(un)?restrict .*$/-- &/' \
| sed -E 's/^CREATE SCHEMA "/CREATE SCHEMA IF NOT EXISTS "/' \
| sed -E 's/^CREATE TABLE "/CREATE TABLE IF NOT EXISTS "/' \
| sed -E 's/^CREATE SEQUENCE "/CREATE SEQUENCE IF NOT EXISTS "/' \
| sed -E 's/^CREATE VIEW "/CREATE OR REPLACE VIEW "/' \
| sed -E 's/^CREATE FUNCTION "/CREATE OR REPLACE FUNCTION "/' \
| sed -E 's/^CREATE TRIGGER "/CREATE OR REPLACE TRIGGER "/' \
| sed -E 's/^CREATE PUBLICATION "supabase_realtime/-- &/' \
| sed -E 's/^CREATE EVENT TRIGGER /-- &/' \
| sed -E 's/^         WHEN TAG IN /-- &/' \
| sed -E 's/^   EXECUTE FUNCTION /-- &/' \
| sed -E 's/^ALTER EVENT TRIGGER /-- &/' \
| sed -E 's/^ALTER PUBLICATION "supabase_realtime_/-- &/' \
| sed -E 's/^ALTER FOREIGN DATA WRAPPER (.+) OWNER TO /-- &/' \
| sed -E 's/^ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin"/-- &/' \
| sed -E 's/^GRANT ALL ON FOREIGN DATA WRAPPER (.+) TO "postgres" WITH GRANT OPTION/-- &/' \
| sed -E 's/^SET transaction_timeout = 0;/-- &/' \
| sed -E '/^--/d'
