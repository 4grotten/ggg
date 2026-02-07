-- ================================================
-- Supabase Self-Hosted Initialization
-- Run BEFORE other init scripts
-- ================================================

-- Create required schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE SCHEMA IF NOT EXISTS _realtime;
CREATE SCHEMA IF NOT EXISTS realtime;

-- Create required roles for PostgREST
DO $$
BEGIN
    -- Anonymous role (public access)
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN NOINHERIT;
    END IF;

    -- Authenticated role (logged-in users)
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN NOINHERIT;
    END IF;

    -- Service role (admin access, bypasses RLS)
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
    END IF;

    -- Supabase admin role
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_admin') THEN
        CREATE ROLE supabase_admin NOLOGIN NOINHERIT BYPASSRLS;
    END IF;

    -- Authenticator role (used by PostgREST)
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticator') THEN
        CREATE ROLE authenticator NOINHERIT LOGIN;
    END IF;
END $$;

-- Grant role memberships
GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role TO authenticator;
GRANT supabase_admin TO authenticator;

-- Grant schema permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;

-- Grant table permissions for public schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;

-- Grant sequence permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO anon, authenticated, service_role;

-- Grant function execute permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

-- NOTE: GoTrue (supabase-auth) will create its own tables in the auth schema
-- via its migration system. Do not create auth tables manually here.

-- Grant auth schema permissions to supabase_admin
GRANT ALL ON SCHEMA auth TO supabase_admin;
-- GoTrue will grant specific table permissions after creating them

-- Realtime schema setup
CREATE TABLE IF NOT EXISTS _realtime.schema_migrations (
    version bigint PRIMARY KEY,
    inserted_at timestamptz DEFAULT now()
);

GRANT ALL ON SCHEMA _realtime TO supabase_admin;
GRANT ALL ON SCHEMA realtime TO supabase_admin;

-- Create function to get current user ID (for RLS policies)
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION auth.role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.role', true), '')::text
$$;

-- Create function to get JWT claim
CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true),
    '{}'
  )::jsonb
$$;

COMMENT ON FUNCTION auth.uid() IS 'Returns the user ID from the JWT token';
COMMENT ON FUNCTION auth.role() IS 'Returns the role from the JWT token';
COMMENT ON FUNCTION auth.jwt() IS 'Returns the JWT claims as jsonb';
