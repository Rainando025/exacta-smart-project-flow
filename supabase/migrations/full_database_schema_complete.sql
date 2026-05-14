-- ==============================================================================
-- MIGRAÇÃO COMPLETA: TODAS AS TABELAS DO EXACTA SMART PROJECT FLOW
-- ==============================================================================
-- Este arquivo contém TODAS as tabelas, tipos e relacionamentos necessários
-- para a plataforma funcionar integralmente, cobrindo todos os módulos criados.
-- O comando `CREATE TABLE IF NOT EXISTS` garante que ele possa ser executado
-- com segurança sem apagar ou subscrever dados existentes.
-- ==============================================================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMERADORES (ENUMS)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'gestor', 'colaborador');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;


-- 2. PERFIS E CARGOS
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  avatar_url text,
  job_title text,
  reminder_advance_minutes integer DEFAULT 15,
  reminder_snooze_minutes integer DEFAULT 10,
  skills jsonb DEFAULT '{"soft": [], "hard": []}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'colaborador',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);


-- 3. CONVITES DA EQUIPE
CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'colaborador',
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);


-- 4. PROJETOS E TAREFAS (CORE)
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_id uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'active',
  color text NOT NULL DEFAULT 'bg-accent',
  progress integer NOT NULL DEFAULT 0,
  due_date date,
  start_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo',
  priority text NOT NULL DEFAULT 'media',
  due_date date,
  start_date date,
  creator_id uuid NOT NULL REFERENCES auth.users(id),
  assignee_id uuid REFERENCES auth.users(id),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  tags text[],
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.task_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  predecessor_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  successor_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(predecessor_id, successor_id)
);


-- 5. COMUNICAÇÃO E ARQUIVOS NAS TAREFAS
CREATE TABLE IF NOT EXISTS public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.task_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.task_comments(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  file_size bigint NOT NULL DEFAULT 0,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  folder text NOT NULL DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now()
);


-- 6. TIME TRACKING (RASTREAMENTO DE TEMPO)
CREATE TABLE IF NOT EXISTS public.time_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration interval,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);


-- 7. CALENDÁRIO E NOTIFICAÇÕES (ALERTAS)
CREATE TABLE IF NOT EXISTS public.reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  remind_at timestamptz NOT NULL,
  repeat text NOT NULL DEFAULT 'none',
  priority text NOT NULL DEFAULT 'media',
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  link text,
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);


-- 8. MAPA NEURAL (OBSIDIAN 3D) E NOTAS
CREATE TABLE IF NOT EXISTS public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Nova Anotação',
  content text,
  color text NOT NULL DEFAULT 'bg-card',
  pinned boolean NOT NULL DEFAULT false,
  priority text NOT NULL DEFAULT 'media',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.neural_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_team boolean NOT NULL DEFAULT false,
  label text NOT NULL,
  x float NOT NULL,
  y float NOT NULL,
  color text NOT NULL DEFAULT 'bg-accent',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.neural_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_team boolean NOT NULL DEFAULT false,
  source uuid NOT NULL REFERENCES public.neural_nodes(id) ON DELETE CASCADE,
  target uuid NOT NULL REFERENCES public.neural_nodes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, target)
);


-- 9. NOVOS MÓDULOS DE PRODUTIVIDADE E RH
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  author_id uuid NOT NULL REFERENCES auth.users(id),
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_type text NOT NULL,
  trigger_config jsonb,
  action_type text NOT NULL,
  action_config jsonb,
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.brainstorming_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  tags text[],
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  type text NOT NULL DEFAULT 'doc',
  data jsonb,
  is_starred boolean DEFAULT false,
  owner_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL REFERENCES auth.users(id),
  reviewee_id uuid NOT NULL REFERENCES auth.users(id),
  feedback_type text NOT NULL DEFAULT '360',
  rating numeric NOT NULL,
  message text,
  strengths text,
  improvements text,
  is_anonymous boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.feedback_competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid NOT NULL REFERENCES public.feedbacks(id) ON DELETE CASCADE,
  name text NOT NULL,
  score numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);


-- 10. FINANÇAS PESSOAIS
CREATE TABLE IF NOT EXISTS public.personal_finances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL DEFAULT 'expense',
  category text NOT NULL DEFAULT 'outros',
  date date NOT NULL,
  due_date date,
  paid boolean NOT NULL DEFAULT false,
  recurring text NOT NULL DEFAULT 'none',
  installments integer NOT NULL DEFAULT 1,
  installment_number integer NOT NULL DEFAULT 1,
  parent_id uuid,
  is_credit_card boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);


-- 11. AUDITORIA
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- FIM DA MIGRAÇÃO
-- ==============================================================================
