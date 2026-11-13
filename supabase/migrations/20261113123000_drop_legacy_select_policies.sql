-- Remove quaisquer políticas SELECT antigas/permissivas (USING true) que possam ter ficado no banco
-- e garante apenas as políticas estritas por setor/equipe.

DO $$
DECLARE
  pol record;
  target_tables text[] := ARRAY[
    'projects',
    'tasks',
    'visual_boards',
    'documents',
    'brainstorming_sessions',
    'announcements',
    'neural_nodes',
    'neural_edges'
  ];
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY(target_tables)
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- 1. PROJETOS: apenas o dono OU mesma equipe/setor (se usuário tiver setor)
CREATE POLICY "Projects viewable by same department"
  ON public.projects FOR SELECT TO authenticated
  USING (
    auth.uid() = owner_id
    OR (
      public.my_department_id() IS NOT NULL
      AND COALESCE(department_id, public.user_department_id(owner_id)) = public.my_department_id()
    )
  );

-- 2. TAREFAS: pessoais só dono/responsável; equipe apenas mesma equipe/setor
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

-- 3. GESTÃO VISUAL: colaborativo = toda equipe do mesmo setor; não colaborativo = só criador/gestor do mesmo setor
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

-- 4. COLABORAÇÃO: Documentos, Brainstorming, Mural e Mapa Neural restritos à mesma equipe
CREATE POLICY "Documents viewable by same department"
  ON public.documents FOR SELECT TO authenticated
  USING (
    auth.uid() = owner_id
    OR public.same_department(owner_id)
  );

CREATE POLICY "Brainstorming viewable by same department"
  ON public.brainstorming_sessions FOR SELECT TO authenticated
  USING (
    auth.uid() = created_by
    OR public.same_department(created_by)
  );

CREATE POLICY "Announcements viewable by same department"
  ON public.announcements FOR SELECT TO authenticated
  USING (
    target_user_id = auth.uid()
    OR author_id = auth.uid()
    OR (target_user_id IS NULL AND public.same_department(author_id))
  );

CREATE POLICY "Neural nodes viewable by owner or same team"
  ON public.neural_nodes FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR (is_team = true AND public.same_department(user_id))
  );

CREATE POLICY "Neural edges viewable by owner or same team"
  ON public.neural_edges FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR (is_team = true AND public.same_department(user_id))
  );

