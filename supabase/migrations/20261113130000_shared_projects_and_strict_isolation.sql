-- Suporte a compartilhamento de projetos com outros setores (shared_department_ids)
-- e isolamento estrito por setor + compartilhamento em projetos, tarefas e documentos

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS shared_department_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];

CREATE INDEX IF NOT EXISTS idx_projects_shared_departments
  ON public.projects USING GIN (shared_department_ids);

CREATE OR REPLACE FUNCTION public.can_access_project(p_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = p_id
      AND (
        p.owner_id = auth.uid()
        OR (
          public.my_department_id() IS NOT NULL
          AND (
            COALESCE(p.department_id, public.user_department_id(p.owner_id)) = public.my_department_id()
            OR public.my_department_id() = ANY(p.shared_department_ids)
          )
        )
      )
  );
$$;

-- Atualiza política SELECT de projects
DROP POLICY IF EXISTS "Projects viewable by same department" ON public.projects;
CREATE POLICY "Projects viewable by same department or shared"
  ON public.projects FOR SELECT TO authenticated
  USING (public.can_access_project(id));

-- Atualiza política SELECT de tasks (inclui projetos compartilhados com o setor)
DROP POLICY IF EXISTS "Tasks viewable by same department" ON public.tasks;
CREATE POLICY "Tasks viewable by same department or shared project"
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
        OR (project_id IS NOT NULL AND public.can_access_project(project_id))
      )
    )
  );

-- Atualiza política SELECT de documents (inclui documentos de projetos compartilhados)
DROP POLICY IF EXISTS "Documents viewable by same department" ON public.documents;
CREATE POLICY "Documents viewable by same department or shared project"
  ON public.documents FOR SELECT TO authenticated
  USING (
    auth.uid() = owner_id
    OR public.same_department(owner_id)
    OR (project_id IS NOT NULL AND public.can_access_project(project_id))
  );

