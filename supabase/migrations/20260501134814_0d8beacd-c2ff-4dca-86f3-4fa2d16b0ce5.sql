
-- Personal finances table
CREATE TABLE public.personal_finances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'despesa',
  category TEXT NOT NULL DEFAULT 'outros',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.personal_finances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own finances" ON public.personal_finances FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own finances" ON public.personal_finances FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own finances" ON public.personal_finances FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own finances" ON public.personal_finances FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER personal_finances_updated_at BEFORE UPDATE ON public.personal_finances
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Notes table
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  content TEXT,
  color TEXT NOT NULL DEFAULT '#1e3a8a',
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notes" ON public.notes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own notes" ON public.notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own notes" ON public.notes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notes" ON public.notes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER notes_updated_at BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
