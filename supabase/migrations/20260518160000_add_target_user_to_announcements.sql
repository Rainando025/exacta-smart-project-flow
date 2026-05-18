-- Migration to add target_user_id and type to announcements

ALTER TABLE public.announcements
ADD COLUMN IF NOT EXISTS target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'aviso';

-- Update RLS policies
DROP POLICY IF EXISTS "Announcements viewable by authenticated" ON public.announcements;

CREATE POLICY "Announcements viewable by target or author" ON public.announcements
  FOR SELECT TO authenticated USING (
    target_user_id IS NULL 
    OR target_user_id = auth.uid() 
    OR author_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
