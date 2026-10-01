-- AYURE provider-neutral Join persistence.
-- Apply as ayure_migrator after ayure_app has been provisioned.
-- PostgreSQL 13+ provides gen_random_uuid() in core; no pgcrypto extension is required.

CREATE TABLE public.ayure_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  role TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  goal TEXT NOT NULL,

  receipt TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'received',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT ayure_leads_role_check
    CHECK (role IN ('buyer', 'owner', 'investor', 'operator', 'service_provider')),

  CONSTRAINT ayure_leads_name_check
    CHECK (char_length(trim(name)) BETWEEN 2 AND 120),

  CONSTRAINT ayure_leads_email_check
    CHECK (char_length(email) <= 254 AND email = lower(trim(email))),

  CONSTRAINT ayure_leads_goal_check
    CHECK (char_length(trim(goal)) BETWEEN 8 AND 2000),

  CONSTRAINT ayure_leads_status_check
    CHECK (status IN ('received', 'reviewed', 'contacted', 'archived'))
);

CREATE INDEX ayure_leads_created_at_idx
  ON public.ayure_leads (created_at DESC);

CREATE INDEX ayure_leads_status_created_at_idx
  ON public.ayure_leads (status, created_at DESC);

CREATE OR REPLACE FUNCTION public.ayure_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER ayure_leads_set_updated_at
BEFORE UPDATE ON public.ayure_leads
FOR EACH ROW
EXECUTE FUNCTION public.ayure_set_updated_at();

REVOKE ALL ON TABLE public.ayure_leads FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ayure_set_updated_at() FROM PUBLIC;

GRANT INSERT ON TABLE public.ayure_leads TO ayure_app;

-- INSERT ... RETURNING requires SELECT on exactly the returned columns.
-- This access is column-scoped, not row-scoped.
GRANT SELECT (receipt, status, created_at)
ON TABLE public.ayure_leads
TO ayure_app;
