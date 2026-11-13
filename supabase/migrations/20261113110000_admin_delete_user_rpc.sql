-- RPC para que administradores possam excluir usuários de forma segura
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller_id uuid := auth.uid();
  is_caller_admin boolean;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = caller_id AND role = 'admin'
  ) INTO is_caller_admin;

  IF NOT is_caller_admin THEN
    RAISE EXCEPTION 'Apenas administradores podem excluir usuários.';
  END IF;

  IF target_user_id = caller_id THEN
    RAISE EXCEPTION 'Você não pode excluir a própria conta.';
  END IF;

  -- Reatribui registros que possuem FK NOT NULL sem ON DELETE CASCADE para o admin executor
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'owner_id') THEN
    UPDATE public.projects SET owner_id = caller_id WHERE owner_id = target_user_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'creator_id') THEN
    UPDATE public.tasks SET creator_id = caller_id WHERE creator_id = target_user_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'assignee_id') THEN
    UPDATE public.tasks SET assignee_id = NULL WHERE assignee_id = target_user_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'departments' AND column_name = 'created_by') THEN
    UPDATE public.departments SET created_by = caller_id WHERE created_by = target_user_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invitations' AND column_name = 'invited_by') THEN
    UPDATE public.invitations SET invited_by = caller_id WHERE invited_by = target_user_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'owner_id') THEN
    UPDATE public.documents SET owner_id = caller_id WHERE owner_id = target_user_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'created_by') THEN
    UPDATE public.transactions SET created_by = caller_id WHERE created_by = target_user_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kpis' AND column_name = 'created_by') THEN
    UPDATE public.kpis SET created_by = caller_id WHERE created_by = target_user_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bottlenecks' AND column_name = 'created_by') THEN
    UPDATE public.bottlenecks SET created_by = caller_id WHERE created_by = target_user_id;
  END IF;

  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;

