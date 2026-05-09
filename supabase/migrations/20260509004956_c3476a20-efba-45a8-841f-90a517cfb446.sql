
-- Helper: role hierarchy check
CREATE OR REPLACE FUNCTION public.is_at_least(_role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND (
        role = 'admin'
        OR (role = 'gestor' AND _role IN ('gestor','colaborador'))
        OR (role = _role)
      )
  )
$$;

-- ============= AUDIT LOGS =============
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  changes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read audit"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System insert audit"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _action text;
  _entity uuid;
  _changes jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _action := 'create'; _entity := NEW.id; _changes := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    _action := 'update'; _entity := NEW.id;
    _changes := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  ELSE
    _action := 'delete'; _entity := OLD.id; _changes := to_jsonb(OLD);
  END IF;
  INSERT INTO public.audit_logs(actor_id, entity_type, entity_id, action, changes)
  VALUES (auth.uid(), TG_ARGV[0], _entity, _action, _changes);
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS audit_tasks ON public.tasks;
CREATE TRIGGER audit_tasks AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_audit('task');

DROP TRIGGER IF EXISTS audit_projects ON public.projects;
CREATE TRIGGER audit_projects AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.log_audit('project');

DROP TRIGGER IF EXISTS audit_roles ON public.user_roles;
CREATE TRIGGER audit_roles AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_audit('role');

-- ============= INVITATIONS =============
CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role app_role NOT NULL DEFAULT 'colaborador',
  invited_by uuid NOT NULL,
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage invites"
  ON public.invitations FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Invitees read own invite"
  ON public.invitations FOR SELECT TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE TRIGGER touch_invitations BEFORE UPDATE ON public.invitations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============= TASKS RLS =============
DROP POLICY IF EXISTS "Tasks viewable by authenticated" ON public.tasks;
DROP POLICY IF EXISTS "Creator assignee or admin update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Creator or admin delete tasks" ON public.tasks;

CREATE POLICY "Tasks viewable by stakeholders or gestor"
  ON public.tasks FOR SELECT TO authenticated
  USING (
    auth.uid() = creator_id
    OR auth.uid() = assignee_id
    OR public.is_at_least('gestor')
    OR EXISTS(SELECT 1 FROM public.projects p WHERE p.id = tasks.project_id AND p.owner_id = auth.uid())
  );

CREATE POLICY "Creator assignee gestor update tasks"
  ON public.tasks FOR UPDATE TO authenticated
  USING (
    auth.uid() = creator_id OR auth.uid() = assignee_id OR public.is_at_least('gestor')
  );

CREATE POLICY "Creator gestor delete tasks"
  ON public.tasks FOR DELETE TO authenticated
  USING (auth.uid() = creator_id OR public.is_at_least('gestor'));

-- ============= PROJECTS RLS =============
DROP POLICY IF EXISTS "Authenticated create projects" ON public.projects;
DROP POLICY IF EXISTS "Owner or admin update projects" ON public.projects;
DROP POLICY IF EXISTS "Owner or admin delete projects" ON public.projects;

CREATE POLICY "Gestor create projects"
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id AND public.is_at_least('gestor'));

CREATE POLICY "Owner or gestor update projects"
  ON public.projects FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.is_at_least('gestor'));

CREATE POLICY "Owner or gestor delete projects"
  ON public.projects FOR DELETE TO authenticated
  USING (auth.uid() = owner_id OR public.is_at_least('gestor'));
