-- ==============================================================================
-- Isolamento por Equipe/Setor (Projects, Tasks, Visual Boards, Colaboração)
-- e Flag "Colaborativo" na Gestão Visual (visual_boards)
-- ==============================================================================

-- 1. Funções auxiliares de departamento
CREATE OR REPLACE FUNCTION public.user_department_id(uid uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT department_id FROM public.profiles WHERE id = uid LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.my_department_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT department_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.same_department(other_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.my_department_id() IS NOT NULL
     AND public.user_department_id(other_user_id) = public.my_department_id();
$$;

-- 2. PROJETOS: adicionar department_id + preencher automaticamente no INSERT + RLS por equipe
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;

UPDATE public.projects p
SET department_id = public.user_department_id(p.owner_id)
WHERE p.department_id IS NULL;

CREATE OR REPLACE FUNCTION public.set_project_department()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.department_id IS NULL THEN
    NEW.department_id := public.user_department_id(NEW.owner_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_project_department ON public.projects;
CREATE TRIGGER trg_set_project_department
  BEFORE INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_project_department();

DROP POLICY IF EXISTS "Projects viewable by authenticated" ON public.projects;
CREATE POLICY "Projects viewable by same department"
  ON public.projects FOR SELECT TO authenticated
  USING (
    auth.uid() = owner_id
    OR (
      public.my_department_id() IS NOT NULL
      AND COALESCE(department_id, public.user_department_id(owner_id)) = public.my_department_id()
    )
  );

-- 3. TAREFAS: isolar tarefas de equipe por departamento/setor
DROP POLICY IF EXISTS "Tasks viewable by authenticated" ON public.tasks;
DROP POLICY IF EXISTS "Tasks viewable by stakeholders or gestor" ON public.tasks;
CREATE POLICY "Tasks viewable by same department"
  ON public.tasks FOR SELECT TO authenticated
  USING (
    (
      is_personal = true AND (auth.uid() = creator_id OR auth.uid() = assignee_id)
    )
    OR
    (
      (is_personal = false OR is_personal IS NULL)
      AND (
        auth.uid() = creator_id
        OR auth.uid() = assignee_id
        OR public.same_department(creator_id)
        OR (assignee_id IS NOT NULL AND public.same_department(assignee_id))
        OR (
          project_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = tasks.project_id
              AND (
                p.owner_id = auth.uid()
                OR (
                  public.my_department_id() IS NOT NULL
                  AND COALESCE(p.department_id, public.user_department_id(p.owner_id)) = public.my_department_id()
                )
              )
          )
        )
      )
    )
  );

-- 4. GESTÃO VISUAL (visual_boards): flag is_collaborative + department_id + RLS
ALTER TABLE public.visual_boards
  ADD COLUMN IF NOT EXISTS is_collaborative boolean NOT NULL DEFAULT false;

ALTER TABLE public.visual_boards
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;

ALTER TABLE public.visual_boards DROP CONSTRAINT IF EXISTS visual_boards_tool_type_check;
ALTER TABLE public.visual_boards
  ADD CONSTRAINT visual_boards_tool_type_check
  CHECK (tool_type IN ('swot','eisenhower','5w2h','pareto','smart','gut','raci','flowchart','mindmap'));

UPDATE public.visual_boards vb
SET department_id = public.user_department_id(vb.user_id)
WHERE vb.department_id IS NULL;

CREATE OR REPLACE FUNCTION public.set_visual_board_department()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.department_id IS NULL THEN
    NEW.department_id := public.user_department_id(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_visual_board_department ON public.visual_boards;
CREATE TRIGGER trg_set_visual_board_department
  BEFORE INSERT ON public.visual_boards
  FOR EACH ROW EXECUTE FUNCTION public.set_visual_board_department();

DROP POLICY IF EXISTS "Users view own visual_boards" ON public.visual_boards;
CREATE POLICY "Visual boards viewable by team or gestor"
  ON public.visual_boards FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR (
      is_collaborative = true
      AND public.my_department_id() IS NOT NULL
      AND COALESCE(department_id, public.user_department_id(user_id)) = public.my_department_id()
    )
    OR (
      is_collaborative = false
      AND public.is_at_least('gestor')
      AND public.my_department_id() IS NOT NULL
      AND COALESCE(department_id, public.user_department_id(user_id)) = public.my_department_id()
    )
  );

DROP POLICY IF EXISTS "Users update own visual_boards" ON public.visual_boards;
CREATE POLICY "Visual boards updatable by team or gestor"
  ON public.visual_boards FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR (
      is_collaborative = true
      AND public.my_department_id() IS NOT NULL
      AND COALESCE(department_id, public.user_department_id(user_id)) = public.my_department_id()
    )
    OR (
      public.is_at_least('gestor')
      AND public.my_department_id() IS NOT NULL
      AND COALESCE(department_id, public.user_department_id(user_id)) = public.my_department_id()
    )
  );

DROP POLICY IF EXISTS "Users delete own visual_boards" ON public.visual_boards;
CREATE POLICY "Visual boards deletable by owner or dept gestor"
  ON public.visual_boards FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR (
      public.is_at_least('gestor')
      AND public.my_department_id() IS NOT NULL
      AND COALESCE(department_id, public.user_department_id(user_id)) = public.my_department_id()
    )
  );

-- 5. COLABORAÇÃO: Documentos, Brainstorming, Mural e Mapa Neural restritos à mesma equipe
DROP POLICY IF EXISTS "documents_select" ON public.documents;
DROP POLICY IF EXISTS "Authenticated view documents" ON public.documents;
CREATE POLICY "Documents viewable by same department"
  ON public.documents FOR SELECT TO authenticated
  USING (
    auth.uid() = owner_id
    OR public.same_department(owner_id)
  );

DROP POLICY IF EXISTS "documents_update" ON public.documents;
DROP POLICY IF EXISTS "Owner or admin update documents" ON public.documents;
CREATE POLICY "Documents updatable by same department"
  ON public.documents FOR UPDATE TO authenticated
  USING (
    auth.uid() = owner_id
    OR public.same_department(owner_id)
  );

DROP POLICY IF EXISTS "documents_delete" ON public.documents;
DROP POLICY IF EXISTS "Owner or admin delete documents" ON public.documents;
CREATE POLICY "Documents deletable by owner or dept gestor"
  ON public.documents FOR DELETE TO authenticated
  USING (
    auth.uid() = owner_id
    OR (public.is_at_least('gestor') AND public.same_department(owner_id))
  );

DROP POLICY IF EXISTS "Authenticated view brainstorming" ON public.brainstorming_sessions;
DROP POLICY IF EXISTS "Users manage own brainstorming" ON public.brainstorming_sessions;
CREATE POLICY "Brainstorming viewable by same department"
  ON public.brainstorming_sessions FOR SELECT TO authenticated
  USING (
    auth.uid() = created_by
    OR public.same_department(created_by)
  );
CREATE POLICY "Brainstorming insertable by authenticated"
  ON public.brainstorming_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Brainstorming updatable by same department"
  ON public.brainstorming_sessions FOR UPDATE TO authenticated
  USING (
    auth.uid() = created_by
    OR public.same_department(created_by)
  );
CREATE POLICY "Brainstorming deletable by owner or dept gestor"
  ON public.brainstorming_sessions FOR DELETE TO authenticated
  USING (
    auth.uid() = created_by
    OR (public.is_at_least('gestor') AND public.same_department(created_by))
  );

DROP POLICY IF EXISTS "Announcements viewable by authenticated" ON public.announcements;
CREATE POLICY "Announcements viewable by same department"
  ON public.announcements FOR SELECT TO authenticated
  USING (
    target_user_id = auth.uid()
    OR author_id = auth.uid()
    OR (target_user_id IS NULL AND public.same_department(author_id))
  );

DROP POLICY IF EXISTS "Usuários podem ver seus próprios nós ou nós da equipe" ON public.neural_nodes;
CREATE POLICY "Neural nodes viewable by owner or same team"
  ON public.neural_nodes FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR (is_team = true AND public.same_department(user_id))
  );

DROP POLICY IF EXISTS "Usuários podem atualizar nós pessoais ou da equipe" ON public.neural_nodes;
CREATE POLICY "Neural nodes updatable by owner or same team"
  ON public.neural_nodes FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR (is_team = true AND public.same_department(user_id))
  );

DROP POLICY IF EXISTS "Usuários podem deletar nós pessoais ou da equipe" ON public.neural_nodes;
CREATE POLICY "Neural nodes deletable by owner or same team"
  ON public.neural_nodes FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR (is_team = true AND public.same_department(user_id))
  );

DROP POLICY IF EXISTS "Usuários podem ver suas próprias conexões ou da equipe" ON public.neural_edges;
CREATE POLICY "Neural edges viewable by owner or same team"
  ON public.neural_edges FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR (is_team = true AND public.same_department(user_id))
  );

DROP POLICY IF EXISTS "Usuários podem atualizar conexões" ON public.neural_edges;
CREATE POLICY "Neural edges updatable by owner or same team"
  ON public.neural_edges FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR (is_team = true AND public.same_department(user_id))
  );

DROP POLICY IF EXISTS "Usuários podem deletar conexões" ON public.neural_edges;
CREATE POLICY "Neural edges deletable by owner or same team"
  ON public.neural_edges FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR (is_team = true AND public.same_department(user_id))
  );

