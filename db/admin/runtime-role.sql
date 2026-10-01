-- AYURE runtime role hardening.
-- Run as the database owner after the provider has created ayure_app.
-- Do not store role passwords in this repository.

ALTER ROLE ayure_app
  LOGIN
  NOINHERIT
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  NOREPLICATION
  NOBYPASSRLS;

DO $$
BEGIN
  EXECUTE format('REVOKE ALL ON DATABASE %I FROM PUBLIC', current_database());
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO ayure_app', current_database());
END;
$$;

REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO ayure_app;

-- Hard gate: ayure_app should inherit from no role and should be unable to SET ROLE
-- into a more privileged parent because no membership should exist at all.
SELECT
  member_role.rolname AS member_role,
  parent_role.rolname AS inherited_from
FROM pg_catalog.pg_auth_members membership
JOIN pg_catalog.pg_roles member_role
  ON member_role.oid = membership.member
JOIN pg_catalog.pg_roles parent_role
  ON parent_role.oid = membership.roleid
WHERE member_role.rolname = 'ayure_app';

-- Expected role posture for the runtime login.
SELECT
  rolname,
  rolsuper,
  rolinherit,
  rolcreaterole,
  rolcreatedb,
  rolcanlogin,
  rolreplication,
  rolbypassrls
FROM pg_catalog.pg_roles
WHERE rolname = 'ayure_app';
