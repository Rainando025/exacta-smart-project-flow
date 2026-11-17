-- ==============================================================================
-- BRAINSTORMING: Templates, Meets, Colaboração e Isolamento por Equipe
-- ==============================================================================

-- 1. Novas colunas em public.brainstorming_sessions
ALTER TABLE public.brainstorming_sessions
  ADD COLUMN IF NOT EXISTS template text DEFAULT 'freeform',
  ADD COLUMN IF NOT EXISTS meet_url text,
  ADD COLUMN IF NOT EXISTS data jsonb NOT NULL DEFAULT '{"columns":[], "ideas":[], "timer":null}'::jsonb,
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;

-- 2. Preenchimento de departamento a partir do criador
UPDATE public.brainstorming_sessions b
SET department_id = public.user_department_id(b.created_by)
WHERE b.department_id IS NULL;

-- 3. Trigger para associar o department_id no INSERT
CREATE OR REPLACE FUNCTION public.set_brainstorming_department()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.department_id IS NULL THEN
    NEW.department_id := public.user_department_id(NEW.created_by);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_brainstorming_department ON public.brainstorming_sessions;
CREATE TRIGGER trg_set_brainstorming_department
  BEFORE INSERT ON public.brainstorming_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_brainstorming_department();

-- 4. RLS Políticas atualizadas com suporte a Administrador e Departamento
DROP POLICY IF EXISTS "Brainstorming viewable by same department" ON public.brainstorming_sessions;
CREATE POLICY "Brainstorming viewable by same department"
  ON public.brainstorming_sessions FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR auth.uid() = created_by
    OR public.same_department(created_by)
    OR (department_id IS NOT NULL AND department_id = public.my_department_id())
  );

DROP POLICY IF EXISTS "Brainstorming insertable by authenticated" ON public.brainstorming_sessions;
CREATE POLICY "Brainstorming insertable by authenticated"
  ON public.brainstorming_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Brainstorming updatable by same department" ON public.brainstorming_sessions;
CREATE POLICY "Brainstorming updatable by same department"
  ON public.brainstorming_sessions FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR auth.uid() = created_by
    OR public.same_department(created_by)
    OR (department_id IS NOT NULL AND department_id = public.my_department_id())
  );

DROP POLICY IF EXISTS "Brainstorming deletable by owner or dept gestor" ON public.brainstorming_sessions;
CREATE POLICY "Brainstorming deletable by owner or dept gestor"
  ON public.brainstorming_sessions FOR DELETE TO authenticated
  USING (
    public.is_admin()
    OR auth.uid() = created_by
    OR (public.is_at_least('gestor') AND (public.same_department(created_by) OR department_id = public.my_department_id()))
  );

-- 5. Realtime para broadcasting e persistência
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.brainstorming_sessions;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;
