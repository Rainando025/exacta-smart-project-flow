-- Permite que admins e gestores atualizem perfis (ex: atribuir department_id aos colaboradores)
DROP POLICY IF EXISTS "Managers update profiles" ON public.profiles;
CREATE POLICY "Managers update profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'gestor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'gestor')
    )
  );
