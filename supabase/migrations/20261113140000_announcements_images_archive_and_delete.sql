-- Adiciona suporte a imagens, destaque em largura total e arquivamento no Mural (announcements)
-- e corrige políticas de UPDATE/DELETE para autores e gestores/admins

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS full_width boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Author or admin update announcements" ON public.announcements;
CREATE POLICY "Author or gestor update announcements"
  ON public.announcements FOR UPDATE TO authenticated
  USING (auth.uid() = author_id OR public.is_at_least('gestor'));

DROP POLICY IF EXISTS "Author or admin delete announcements" ON public.announcements;
CREATE POLICY "Author or gestor delete announcements"
  ON public.announcements FOR DELETE TO authenticated
  USING (auth.uid() = author_id OR public.is_at_least('gestor'));
