
-- ============= TASK COMMENTS & ATTACHMENTS =============
CREATE TABLE IF NOT EXISTS public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.task_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.task_comments(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_type text,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- ============= BRAINSTORMING =============
CREATE TABLE IF NOT EXISTS public.brainstorming_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  tags text[] DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.brainstorming_sessions ENABLE ROW LEVEL SECURITY;

-- ============= DOCUMENTS & WHITEBOARDS =============
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  type text NOT NULL DEFAULT 'document' CHECK (type IN ('document', 'whiteboard')),
  data jsonb,
  owner_id uuid NOT NULL REFERENCES auth.users(id),
  is_starred boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- ============= AUTOMATIONS =============
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
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

-- ============= TIME TRACKING =============
CREATE TABLE IF NOT EXISTS public.time_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  duration interval,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

-- ============= POLICIES =============
-- Comments
CREATE POLICY "Authenticated view comments" ON public.task_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own comments" ON public.task_comments FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Attachments
CREATE POLICY "Authenticated view attachments" ON public.task_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users upload attachments" ON public.task_attachments FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);

-- Brainstorming
CREATE POLICY "Authenticated view brainstorming" ON public.brainstorming_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own brainstorming" ON public.brainstorming_sessions FOR ALL TO authenticated USING (auth.uid() = created_by);

-- Documents
CREATE POLICY "Authenticated view documents" ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners manage documents" ON public.documents FOR ALL TO authenticated USING (auth.uid() = owner_id);

-- Automations
CREATE POLICY "Authenticated view automations" ON public.automations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Creators manage automations" ON public.automations FOR ALL TO authenticated USING (auth.uid() = created_by);

-- Time Logs
CREATE POLICY "Users manage own time logs" ON public.time_logs FOR ALL TO authenticated USING (auth.uid() = user_id);

-- ============= REALTIME & TRIGGERS =============
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.time_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;

CREATE TRIGGER touch_brainstorming BEFORE UPDATE ON public.brainstorming_sessions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_documents BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
