\set ON_ERROR_STOP on
CREATE ROLE postgres LOGIN NOSUPERUSER CREATEDB CREATEROLE BYPASSRLS;
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE ROLE authenticator LOGIN;
CREATE ROLE app_operator NOLOGIN;
CREATE ROLE sl_postpilot_owner NOLOGIN;
CREATE ROLE supabase_auth_admin NOLOGIN;
CREATE ROLE supabase_storage_admin NOLOGIN;
GRANT anon,authenticated,service_role TO authenticator;
GRANT app_operator TO service_role;
ALTER DATABASE postgres OWNER TO postgres;
ALTER SCHEMA public OWNER TO postgres;
