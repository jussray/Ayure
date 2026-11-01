-- Run only on a dedicated AYURE database as a provider administrator.
-- Set LOGIN passwords out of band; never commit them or grant application DDL.
BEGIN;
DO $bootstrap$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ayure_migrator') THEN
    CREATE ROLE ayure_migrator LOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ayure_app') THEN
    CREATE ROLE ayure_app LOGIN;
  END IF;
  EXECUTE format('REVOKE ALL ON DATABASE %I FROM PUBLIC', current_database());
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO ayure_migrator, ayure_app', current_database());
END
$bootstrap$;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE, CREATE ON SCHEMA public TO ayure_migrator;
GRANT USAGE ON SCHEMA public TO ayure_app;
-- The creator role matters. No blanket SELECT/INSERT on future tables.
ALTER DEFAULT PRIVILEGES FOR ROLE ayure_migrator IN SCHEMA public
  REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE ayure_migrator IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM PUBLIC;
COMMIT;
