-- ==============================================================================
-- CORREÇÃO DE POLÍTICAS RLS E CONSTRAINTS PARA COLABORADORES
-- Data: 2026-08-31
-- ==============================================================================

-- 0. GARANTIR ENUM DE PAPÉIS E FUNÇÃO HELPER DE SEGURANÇA
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'gestor', 'colaborador');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role text)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_at_least(_role text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND (
        role::text = 'admin'
        OR (role::text = 'gestor' AND _role IN ('gestor','colaborador'))
        OR (role::text = _role)
      )
  )
$$;

-- 1. CORREÇÃO DE PROJETOS (permitir que colaboradores e autenticados criem projetos)
DROP POLICY IF EXISTS "Gestor create projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated create projects" ON public.projects;
CREATE POLICY "Authenticated create projects" ON public.projects 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Projects viewable by authenticated" ON public.projects;
CREATE POLICY "Projects viewable by authenticated" ON public.projects 
  FOR SELECT TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Owner or gestor update projects" ON public.projects;
CREATE POLICY "Owner or gestor update projects" ON public.projects 
  FOR UPDATE TO authenticated 
  USING (auth.uid() = owner_id OR public.is_at_least('gestor'));

DROP POLICY IF EXISTS "Owner or gestor delete projects" ON public.projects;
CREATE POLICY "Owner or gestor delete projects" ON public.projects 
  FOR DELETE TO authenticated 
  USING (auth.uid() = owner_id OR public.is_at_least('gestor'));


-- 2. CORREÇÃO DE TAREFAS (garantir inserção e visualização para todos autenticados)
DROP POLICY IF EXISTS "Authenticated create tasks" ON public.tasks;
CREATE POLICY "Authenticated create tasks" ON public.tasks 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Tasks viewable by stakeholders or gestor" ON public.tasks;
DROP POLICY IF EXISTS "Tasks viewable by authenticated" ON public.tasks;
CREATE POLICY "Tasks viewable by authenticated" ON public.tasks 
  FOR SELECT TO authenticated 
  USING (
    is_personal = false 
    OR is_personal IS NULL 
    OR auth.uid() = creator_id 
    OR auth.uid() = assignee_id 
    OR public.is_at_least('gestor')
  );


-- 3. CORREÇÃO DE DOCUMENTOS / QUADROS / WHITEBOARDS
-- Remover a restrição CHECK em documents.type que impedia tipos customizados/categorias ("Processo", "Manual", etc.)
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_type_check;

DROP POLICY IF EXISTS "Owners manage documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated create documents" ON public.documents;
CREATE POLICY "Authenticated create documents" ON public.documents 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Authenticated view documents" ON public.documents;
CREATE POLICY "Authenticated view documents" ON public.documents 
  FOR SELECT TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Owner or admin update documents" ON public.documents;
CREATE POLICY "Owner or admin update documents" ON public.documents 
  FOR UPDATE TO authenticated 
  USING (auth.uid() = owner_id OR public.is_at_least('gestor'));

DROP POLICY IF EXISTS "Owner or admin delete documents" ON public.documents;
CREATE POLICY "Owner or admin delete documents" ON public.documents 
  FOR DELETE TO authenticated 
  USING (auth.uid() = owner_id OR public.is_at_least('gestor'));


-- 4. CORREÇÃO DE VISUAL BOARDS (Gestão Visual)
DROP POLICY IF EXISTS "Users create own visual_boards" ON public.visual_boards;
CREATE POLICY "Users create own visual_boards" ON public.visual_boards 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own visual_boards" ON public.visual_boards;
CREATE POLICY "Users view own visual_boards" ON public.visual_boards 
  FOR SELECT TO authenticated 
  USING (true);


-- 5. CORREÇÃO DE ANÚNCIOS / AVISOS
DROP POLICY IF EXISTS "Authenticated create announcements" ON public.announcements;
CREATE POLICY "Authenticated create announcements" ON public.announcements 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Announcements viewable by target or author" ON public.announcements;
DROP POLICY IF EXISTS "Announcements viewable by authenticated" ON public.announcements;
CREATE POLICY "Announcements viewable by authenticated" ON public.announcements 
  FOR SELECT TO authenticated 
  USING (
    target_user_id IS NULL 
    OR target_user_id = auth.uid() 
    OR author_id = auth.uid() 
    OR public.is_at_least('gestor')
  );


-- 6. CORREÇÃO DO GATILHO E TRIGGER DE CRIAÇÃO DE USUÁRIOS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'colaborador')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
