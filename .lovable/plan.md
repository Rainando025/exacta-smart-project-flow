## Plan: Dashboard Filters, CSV Export, Audit Log, RLS Hardening & Invitations

### 1. Team Dashboard PDF — Filter Controls
In `src/routes/dashboard.tsx`, add a filter bar above the existing dashboard:
- **Date range**: two date pickers (from / to) defaulting to current month
- **Team member**: multi-select of profiles (loaded from `profiles` table)
- **Status**: multi-select (`todo`, `in_progress`, `review`, `done`)

The PDF export will accept the active filters and apply them to the tasks query before generating charts/tables. The on-screen dashboard metrics also react to the filters so the user previews exactly what the PDF will contain. Filters are listed in the PDF header summary section.

### 2. CSV Export of Productivity Metrics
Add an "Exportar CSV" button next to "Exportar PDF" (gestor/admin only).
The CSV contains one row per team member with columns:
`name, role, total_tasks, completed, in_progress, todo, completion_rate, avg_completion_days, overdue_count`.
Generated client-side with a small `toCSV()` helper and triggered via `Blob` + `URL.createObjectURL`. Honors the same filters as the PDF.

### 3. Audit Log
**New table `audit_logs`** (migration):
- `id`, `actor_id` (uuid), `entity_type` (`task` | `project` | `role`), `entity_id` (uuid), `action` (`create` | `update` | `delete`), `changes` (jsonb — diff of old → new), `created_at`.
- RLS: only admins can `SELECT`; inserts allowed for any authenticated user (the trigger inserts on behalf of `auth.uid()`).

**Triggers** on `tasks`, `projects`, `user_roles`:
- After insert/update/delete, write a row to `audit_logs` with the diff (old/new column values via `to_jsonb`).
- The `actor_id` comes from `auth.uid()` (works for client-issued mutations).

**UI**: a new "Auditoria" tab in `src/routes/settings.tsx` (admin-only) showing a paginated table — actor name, entity, action, timestamp, and an expandable JSON diff.

### 4. RLS Hardening — Tasks, Projects, Dashboard Data
Tighten policies to match role hierarchy:

**`tasks`**
- SELECT: creator, assignee, project owner, gestor (any), or admin
- INSERT: creator must be `auth.uid()` AND user must be at least `colaborador`
- UPDATE: creator, assignee, gestor, or admin
- DELETE: creator, gestor, or admin (current is creator/admin only)

**`projects`**
- SELECT: owner, gestor, admin, or any user with at least one task in the project
- INSERT: only gestor/admin (currently any authenticated)
- UPDATE/DELETE: owner, gestor, or admin

**Dashboard data** is computed from `tasks` + `profiles` — RLS on those tables governs access. No separate dashboard policy needed; the new task SELECT policy ensures colaboradores only see their own tasks while gestor/admin see the full team view used by the dashboard.

A SECURITY DEFINER helper `public.is_at_least(_role app_role)` will be added to keep policies readable.

### 5. Invitations Table & Settings UI
**New table `invitations`** (migration):
- `id`, `email`, `role` (`app_role`), `invited_by`, `token` (uuid, unique), `status` (`pending` | `accepted` | `revoked`), `expires_at` (default `now() + 7 days`), `accepted_at`, `created_at`.
- RLS: admins manage all; any authenticated user can SELECT their own invites by email (for accept flow).

**Settings UI updates** (`src/routes/settings.tsx`):
- Replace the current "send invite" flow with: insert an `invitations` row + call `supabase.auth.signUp` with the invite token in `data` (existing email link reuses Supabase's password setup).
- New "Convites" section listing rows with: email, role, status badge, expiry, and actions:
  - **Reenviar**: regenerates token + calls `supabase.auth.resetPasswordForEmail`
  - **Revogar**: sets status = `revoked`
  - **Copiar link**: copies the invitation URL `${origin}/auth?invite=<token>`
- On `auth.tsx`, when `?invite=<token>` is present, look up the invite, prefill email + role context, and on successful signup mark the invite `accepted`.

### Technical notes
- All migrations go in a single SQL file with proper drop-then-create for replaced policies.
- Audit trigger uses `current_setting('request.jwt.claims', true)::json->>'sub'` fallback when `auth.uid()` is null (e.g. service-role writes), so admin actions from edge contexts are still attributed.
- CSV uses RFC 4180 quoting (`"` doubled, fields with `,`/newline quoted).
- All new UI honors `useRole()` — non-admin/gestor users see no audit tab, no invitation tools, no CSV/PDF export.

### Files
- **Migration**: `supabase/migrations/<ts>_audit_invites_rls.sql`
- **Edited**: `src/routes/dashboard.tsx`, `src/routes/settings.tsx`, `src/routes/auth.tsx`, `src/hooks/useRole.ts` (add helpers), `src/lib/csv.ts` (new)
