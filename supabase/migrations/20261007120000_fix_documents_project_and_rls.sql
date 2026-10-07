-- ============================================================
-- Fix: Add project_id to documents + create missing RLS policies
-- ============================================================

-- 1. Add project_id column to documents (if not exists)
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

-- 2. Create index for faster lookups by project
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON public.documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_owner_id ON public.documents(owner_id);

-- 3. Drop any conflicting policies before recreating
DROP POLICY IF EXISTS "documents_select" ON public.documents;
DROP POLICY IF EXISTS "documents_insert" ON public.documents;
DROP POLICY IF EXISTS "documents_update" ON public.documents;
DROP POLICY IF EXISTS "documents_delete" ON public.documents;

-- 4. SELECT: users can see their own documents OR documents from projects they own/access
CREATE POLICY "documents_select" ON public.documents
  FOR SELECT USING (
    auth.uid() = owner_id
    OR project_id IN (
      SELECT id FROM public.projects
      WHERE owner_id = auth.uid()
    )
    OR project_id IS NULL -- rascunhos sem projeto ficam visíveis ao dono
      AND auth.uid() = owner_id
  );

-- 5. INSERT: authenticated users can create documents
CREATE POLICY "documents_insert" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- 6. UPDATE: owner or project owner can update documents
CREATE POLICY "documents_update" ON public.documents
  FOR UPDATE USING (
    auth.uid() = owner_id
    OR project_id IN (
      SELECT id FROM public.projects
      WHERE owner_id = auth.uid()
    )
  );

-- 7. DELETE: owner or project owner can delete
CREATE POLICY "documents_delete" ON public.documents
  FOR DELETE USING (
    auth.uid() = owner_id
    OR project_id IN (
      SELECT id FROM public.projects
      WHERE owner_id = auth.uid()
    )
  );
