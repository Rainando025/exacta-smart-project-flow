-- 1. CORREÇÃO DE POLÍTICAS DE RLS (Finanças e Lembretes)
-- Garantir que as políticas de inserção e atualização existam e funcionem perfeitamente para usuários autenticados.

-- personal_finances
DROP POLICY IF EXISTS "Users create own finances" ON public.personal_finances;
CREATE POLICY "Users create own finances" ON public.personal_finances 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own finances" ON public.personal_finances;
CREATE POLICY "Users update own finances" ON public.personal_finances 
  FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id);

-- reminders
DROP POLICY IF EXISTS "Users create own reminders" ON public.reminders;
CREATE POLICY "Users create own reminders" ON public.reminders 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own reminders" ON public.reminders;
CREATE POLICY "Users update own reminders" ON public.reminders 
  FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id);


-- 2. SUPORTE A ANEXOS EM DOCUMENTOS
-- Adicionar coluna document_id e atualizar a restrição CHECK para permitir que o anexo pertença a uma tarefa, projeto ou documento.

ALTER TABLE public.attachments 
  ADD COLUMN IF NOT EXISTS document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE;

-- Dropar restrição antiga (seja attachments_check ou qualquer outra similar)
ALTER TABLE public.attachments DROP CONSTRAINT IF EXISTS attachments_check;

-- Adicionar nova restrição que inclui o document_id
ALTER TABLE public.attachments 
  ADD CONSTRAINT attachments_check CHECK (task_id IS NOT NULL OR project_id IS NOT NULL OR document_id IS NOT NULL);


-- 3. SEPARAÇÃO DE TAREFAS (PESSOAIS VS EQUIPE)
-- Adicionar coluna is_personal na tabela de tarefas.

ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS is_personal boolean NOT NULL DEFAULT false;


-- 4. INTEGRAÇÃO MAPA NEURAL E ANOTAÇÕES
-- Adicionar coluna note_id no mapa neural para sincronização.

ALTER TABLE public.neural_nodes 
  ADD COLUMN IF NOT EXISTS note_id uuid REFERENCES public.notes(id) ON DELETE CASCADE;


-- 5. SETORES (TEAMS/EQUIPES) E MEMBROS
-- Adicionar coluna department_id à tabela profiles

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;


-- 6. BUCKET DE AVATARES NO STORAGE
-- Criar bucket e políticas para fotos de perfil

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de RLS para objetos do bucket de avatares
DROP POLICY IF EXISTS "Public read avatars bucket" ON storage.objects;
CREATE POLICY "Public read avatars bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated upload avatars bucket" ON storage.objects;
CREATE POLICY "Authenticated upload avatars bucket"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Owner update avatars bucket" ON storage.objects;
CREATE POLICY "Owner update avatars bucket"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Owner delete avatars bucket" ON storage.objects;
CREATE POLICY "Owner delete avatars bucket"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid() = owner);
