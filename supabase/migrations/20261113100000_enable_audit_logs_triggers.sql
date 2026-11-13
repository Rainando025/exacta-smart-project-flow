-- Habilita triggers de auditoria automática em todas as tabelas principais
-- e garante políticas RLS adequadas para leitura por admins e inserção de eventos de acesso.

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  changes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read audit" ON public.audit_logs;
CREATE POLICY "Admins read audit"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "System insert audit" ON public.audit_logs;
CREATE POLICY "System insert audit"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (actor_id IS NULL OR actor_id = auth.uid());

CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _action text;
  _entity uuid;
  _changes jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _action := 'create';
    _entity := NEW.id;
    _changes := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    _action := 'update';
    _entity := NEW.id;
    _changes := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  ELSE
    _action := 'delete';
    _entity := OLD.id;
    _changes := to_jsonb(OLD);
  END IF;

  INSERT INTO public.audit_logs(actor_id, entity_type, entity_id, action, changes)
  VALUES (auth.uid(), TG_ARGV[0], _entity, _action, _changes);

  RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$
DECLARE
  tbl text;
  entity text;
  pairs text[][] := ARRAY[
    ARRAY['projects', 'project'],
    ARRAY['tasks', 'task'],
    ARRAY['user_roles', 'role'],
    ARRAY['departments', 'department'],
    ARRAY['invitations', 'invitation'],
    ARRAY['profiles', 'profile'],
    ARRAY['notes', 'note'],
    ARRAY['documents', 'document'],
    ARRAY['transactions', 'transaction'],
    ARRAY['kpis', 'kpi'],
    ARRAY['bottlenecks', 'bottleneck']
  ];
  i int;
BEGIN
  FOR i IN 1 .. array_length(pairs, 1) LOOP
    tbl := pairs[i][1];
    entity := pairs[i][2];
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS audit_%I ON public.%I', tbl, tbl);
      EXECUTE format(
        'CREATE TRIGGER audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_audit(%L)',
        tbl, tbl, entity
      );
    END IF;
  END LOOP;
END $$;

