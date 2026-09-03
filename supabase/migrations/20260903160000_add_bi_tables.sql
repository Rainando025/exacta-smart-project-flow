-- ==============================================================================
-- MIGRATION: 20260903160000_add_bi_tables.sql
-- Tabelas do Módulo "Análise de Dados BI" (Analyze & Flow)
-- ==============================================================================

-- 1. Tabelas de Páginas e Dashboards na Nuvem
CREATE TABLE IF NOT EXISTS public.bi_pages (
  id text PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_email text,
  name text NOT NULL,
  icon text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bi_page_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id text NOT NULL REFERENCES public.bi_pages(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer','editor')),
  invited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page_id, email)
);

CREATE TABLE IF NOT EXISTS public.bi_page_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id text NOT NULL REFERENCES public.bi_pages(id) ON DELETE CASCADE,
  user_id uuid,
  user_email text,
  action text NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bi_page_activity_page_idx ON public.bi_page_activity (page_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bi_page_members_email_idx ON public.bi_page_members (email);

-- 2. Função Auxiliar de Controle de Acesso (RLS)
CREATE OR REPLACE FUNCTION public.bi_page_role(_page_id text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.bi_pages p WHERE p.id = _page_id AND p.owner_id = auth.uid()) THEN 'owner'
    ELSE (
      SELECT m.role FROM public.bi_page_members m
      WHERE m.page_id = _page_id
        AND lower(m.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      LIMIT 1
    )
  END;
$$;

-- RLS bi_pages
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bi_pages TO authenticated;
GRANT ALL ON public.bi_pages TO service_role;
ALTER TABLE public.bi_pages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pages_select_with_access' AND tablename = 'bi_pages') THEN
    CREATE POLICY "pages_select_with_access" ON public.bi_pages FOR SELECT TO authenticated
      USING (owner_id = auth.uid() OR public.bi_page_role(id) IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pages_insert_own' AND tablename = 'bi_pages') THEN
    CREATE POLICY "pages_insert_own" ON public.bi_pages FOR INSERT TO authenticated
      WITH CHECK (owner_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pages_update_editors' AND tablename = 'bi_pages') THEN
    CREATE POLICY "pages_update_editors" ON public.bi_pages FOR UPDATE TO authenticated
      USING (public.bi_page_role(id) IN ('owner','editor'))
      WITH CHECK (public.bi_page_role(id) IN ('owner','editor'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pages_delete_owner' AND tablename = 'bi_pages') THEN
    CREATE POLICY "pages_delete_owner" ON public.bi_pages FOR DELETE TO authenticated
      USING (owner_id = auth.uid());
  END IF;
END $$;

-- RLS bi_page_members
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bi_page_members TO authenticated;
GRANT ALL ON public.bi_page_members TO service_role;
ALTER TABLE public.bi_page_members ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'members_select_with_access' AND tablename = 'bi_page_members') THEN
    CREATE POLICY "members_select_with_access" ON public.bi_page_members FOR SELECT TO authenticated
      USING (public.bi_page_role(page_id) IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'members_write_owner' AND tablename = 'bi_page_members') THEN
    CREATE POLICY "members_write_owner" ON public.bi_page_members FOR ALL TO authenticated
      USING (public.bi_page_role(page_id) = 'owner')
      WITH CHECK (public.bi_page_role(page_id) = 'owner');
  END IF;
END $$;

-- RLS bi_page_activity
GRANT SELECT, INSERT ON public.bi_page_activity TO authenticated;
GRANT ALL ON public.bi_page_activity TO service_role;
ALTER TABLE public.bi_page_activity ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'activity_select_with_access' AND tablename = 'bi_page_activity') THEN
    CREATE POLICY "activity_select_with_access" ON public.bi_page_activity FOR SELECT TO authenticated
      USING (public.bi_page_role(page_id) IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'activity_insert_with_access' AND tablename = 'bi_page_activity') THEN
    CREATE POLICY "activity_insert_with_access" ON public.bi_page_activity FOR INSERT TO authenticated
      WITH CHECK (public.bi_page_role(page_id) IS NOT NULL AND user_id = auth.uid());
  END IF;
END $$;

-- 3. Trigger para updated_at
CREATE OR REPLACE FUNCTION public.bi_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bi_pages_updated_at ON public.bi_pages;
CREATE TRIGGER bi_pages_updated_at BEFORE UPDATE ON public.bi_pages
FOR EACH ROW EXECUTE FUNCTION public.bi_touch_updated_at();

-- 4. Tabelas de Compartilhamento por Link
CREATE TABLE IF NOT EXISTS public.bi_share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  owner_id uuid NOT NULL,
  owner_email text,
  page_ids text[] NOT NULL DEFAULT '{}',
  role text NOT NULL DEFAULT 'viewer',
  label text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bi_share_links TO authenticated;
GRANT ALL ON public.bi_share_links TO service_role;
ALTER TABLE public.bi_share_links ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'share_links_read_authenticated' AND tablename = 'bi_share_links') THEN
    CREATE POLICY "share_links_read_authenticated" ON public.bi_share_links FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'share_links_insert_own' AND tablename = 'bi_share_links') THEN
    CREATE POLICY "share_links_insert_own" ON public.bi_share_links FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'share_links_update_own' AND tablename = 'bi_share_links') THEN
    CREATE POLICY "share_links_update_own" ON public.bi_share_links FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'share_links_delete_own' AND tablename = 'bi_share_links') THEN
    CREATE POLICY "share_links_delete_own" ON public.bi_share_links FOR DELETE TO authenticated USING (owner_id = auth.uid());
  END IF;
END $$;

-- Função para resgatar token de compartilhamento
CREATE OR REPLACE FUNCTION public.bi_redeem_share_link(_token text)
RETURNS TABLE(page_id text, page_name text, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  link public.bi_share_links%ROWTYPE;
  em text;
BEGIN
  SELECT * INTO link FROM public.bi_share_links WHERE token = _token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Link inválido'; END IF;
  IF link.expires_at IS NOT NULL AND link.expires_at < now() THEN RAISE EXCEPTION 'Link expirado'; END IF;

  em := lower(coalesce(auth.jwt() ->> 'email', ''));
  IF em = '' THEN RAISE EXCEPTION 'É preciso estar conectado'; END IF;

  INSERT INTO public.bi_page_members (page_id, email, role, invited_by)
  SELECT p.id, em, link.role, link.owner_id
  FROM public.bi_pages p
  WHERE p.id = ANY(link.page_ids) AND p.owner_id <> auth.uid()
  ON CONFLICT (page_id, email) DO UPDATE SET role = EXCLUDED.role;

  RETURN QUERY
  SELECT p.id, p.name, link.role
  FROM public.bi_pages p
  WHERE p.id = ANY(link.page_ids);
END;
$$;

-- 5. Tabela de Preferências de Notificação de Alertas
CREATE TABLE IF NOT EXISTS public.bi_alert_notify_prefs (
  user_id uuid PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  email_enabled boolean NOT NULL DEFAULT false,
  email_to text,
  webhook_enabled boolean NOT NULL DEFAULT false,
  webhook_url text,
  severities text[] NOT NULL DEFAULT ARRAY['critical'],
  rule_ids text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bi_alert_notify_prefs TO authenticated;
GRANT ALL ON public.bi_alert_notify_prefs TO service_role;
ALTER TABLE public.bi_alert_notify_prefs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notify_prefs_own' AND tablename = 'bi_alert_notify_prefs') THEN
    CREATE POLICY "notify_prefs_own" ON public.bi_alert_notify_prefs FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DROP TRIGGER IF EXISTS bi_alert_notify_prefs_updated_at ON public.bi_alert_notify_prefs;
CREATE TRIGGER bi_alert_notify_prefs_updated_at
BEFORE UPDATE ON public.bi_alert_notify_prefs
FOR EACH ROW EXECUTE FUNCTION public.bi_touch_updated_at();

REVOKE ALL ON FUNCTION public.bi_page_role(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bi_page_role(text) TO authenticated;

REVOKE ALL ON FUNCTION public.bi_redeem_share_link(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bi_redeem_share_link(text) TO authenticated;
