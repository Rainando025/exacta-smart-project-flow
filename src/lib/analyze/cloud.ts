import { supabase } from "@/integrations/supabase/client";
import type { Page } from "./types";

export type Role = "owner" | "editor" | "viewer";

export type Member = {
  id: string;
  page_id: string;
  email: string;
  role: Exclude<Role, "owner">;
  created_at: string;
};

export type ActivityEntry = {
  id: string;
  page_id: string;
  user_email: string | null;
  action: string;
  detail: string | null;
  created_at: string;
};

/** Limite de linhas sincronizadas para a nuvem (evita payloads gigantes). */
const MAX_SYNC_ROWS = 5000;

function toContent(page: Page) {
  const { dataset, ...rest } = page;
  return { ...rest, dataset: { ...dataset, rows: dataset.rows.slice(0, MAX_SYNC_ROWS) } };
}

export async function fetchCloudPages(userId: string): Promise<Page[]> {
  const { data, error } = await supabase
    .from("bi_pages")
    .select("id, owner_id, owner_email, name, icon, content, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => {
    const content = (r.content ?? {}) as Partial<Page>;
    return {
      ...(content as Page),
      id: r.id,
      name: r.name,
      icon: r.icon ?? content.icon ?? "chart",
      cloud: {
        role: r.owner_id === userId ? "owner" : "viewer",
        ownerEmail: r.owner_email,
      },
    } satisfies Page;
  });
}

/** Ajusta o papel real (editor/viewer) das pÃ¡ginas compartilhadas comigo. */
export async function resolveRoles(pages: Page[], email: string): Promise<Record<string, Role>> {
  const roles: Record<string, Role> = {};
  const shared = pages.filter((p) => p.cloud?.role !== "owner");
  for (const p of pages) roles[p.id] = p.cloud?.role === "owner" ? "owner" : "viewer";
  if (!shared.length) return roles;
  const { data } = await supabase
    .from("bi_page_members")
    .select("page_id, email, role")
    .in(
      "page_id",
      shared.map((p) => p.id),
    );
  for (const m of data ?? []) {
    if (roles[m.page_id] === "owner") continue;
    if (m.email.toLowerCase() === email.toLowerCase()) roles[m.page_id] = m.role as Role;
  }
  return roles;
}


export async function publishPage(page: Page, userId: string, email: string | null) {
  const { error } = await (supabase as any).from("bi_pages").upsert({
    id: page.id,
    owner_id: userId,
    owner_email: email,
    name: page.name,
    icon: page.icon,
    content: toContent(page) as never,
  });
  if (error) throw error;
}

export async function savePageContent(page: Page) {
  const { error } = await supabase
    .from("bi_pages")
    .update({ name: page.name, icon: page.icon, content: toContent(page) as never })
    .eq("id", page.id);
  if (error) throw error;
}

export async function deleteCloudPage(pageId: string) {
  const { error } = await (supabase as any).from("bi_pages").delete().eq("id", pageId);
  if (error) throw error;
}

export type PageAccess = {
  pageId: string;
  pageName: string;
  ownerEmail: string | null;
  role: Role;
  members: Member[];
};

/** Todas as pÃ¡ginas na nuvem que eu vejo, com seus convidados e meu papel em cada uma. */
export async function listAccessOverview(userId: string, email: string): Promise<PageAccess[]> {
  const { data: pages, error } = await supabase
    .from("bi_pages")
    .select("id, name, owner_id, owner_email, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  if (!pages?.length) return [];

  const { data: members } = await supabase
    .from("bi_page_members")
    .select("id, page_id, email, role, created_at")
    .in(
      "page_id",
      pages.map((p) => p.id),
    );

  return pages.map((p) => {
    const mine = ((members ?? []) as Member[]).filter((m) => m.page_id === p.id);
    const role: Role =
      p.owner_id === userId
        ? "owner"
        : ((mine.find((m) => m.email.toLowerCase() === email.toLowerCase())?.role ?? "viewer") as Role);
    return { pageId: p.id, pageName: p.name, ownerEmail: p.owner_email, role, members: mine };
  });
}

export async function listMembers(pageId: string): Promise<Member[]> {

  const { data, error } = await supabase
    .from("bi_page_members")
    .select("id, page_id, email, role, created_at")
    .eq("page_id", pageId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Member[];
}

export async function addMember(pageId: string, email: string, role: "viewer" | "editor", invitedBy: string) {
  const { error } = await supabase
    .from("bi_page_members")
    .upsert({ page_id: pageId, email: email.trim().toLowerCase(), role, invited_by: invitedBy }, { onConflict: "page_id,email" });
  if (error) throw error;
}

export async function updateMemberRole(id: string, role: "viewer" | "editor") {
  const { error } = await (supabase as any).from("bi_page_members").update({ role }).eq("id", id);
  if (error) throw error;
}

export async function removeMember(id: string) {
  const { error } = await (supabase as any).from("bi_page_members").delete().eq("id", id);
  if (error) throw error;
}

export async function listActivity(pageId: string): Promise<ActivityEntry[]> {
  const { data, error } = await supabase
    .from("bi_page_activity")
    .select("id, page_id, user_email, action, detail, created_at")
    .eq("page_id", pageId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as ActivityEntry[];
}

export async function logActivity(
  pageId: string,
  userId: string,
  email: string | null,
  action: string,
  detail?: string,
) {
  await supabase
    .from("bi_page_activity")
    .insert({ page_id: pageId, user_id: userId, user_email: email, action, detail: detail ?? null });
}

/* ---------------- links de convite por seleÃ§Ã£o de pÃ¡ginas ---------------- */

export type ShareLink = {
  id: string;
  token: string;
  page_ids: string[];
  role: "viewer" | "editor";
  label: string | null;
  expires_at: string | null;
  created_at: string;
};

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 24);
}

export async function createShareLink(
  ownerId: string,
  ownerEmail: string | null,
  pageIds: string[],
  role: "viewer" | "editor",
  label?: string,
): Promise<ShareLink> {
  const { data, error } = await supabase
    .from("bi_share_links")
    .insert({
      token: randomToken(),
      owner_id: ownerId,
      owner_email: ownerEmail,
      page_ids: pageIds,
      role,
      label: label ?? null,
    })
    .select("id, token, page_ids, role, label, expires_at, created_at")
    .single();
  if (error) throw error;
  return data as ShareLink;
}

export async function listShareLinks(ownerId: string): Promise<ShareLink[]> {
  const { data, error } = await supabase
    .from("bi_share_links")
    .select("id, token, page_ids, role, label, expires_at, created_at")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ShareLink[];
}

export async function deleteShareLink(id: string) {
  const { error } = await (supabase as any).from("bi_share_links").delete().eq("id", id);
  if (error) throw error;
}

export function shareLinkUrl(token: string) {
  return `${window.location.origin}/convite/${token}`;
}

export async function redeemShareLink(token: string) {
  const { data, error } = await (supabase as any).rpc("bi_redeem_share_link", { _token: token });
  if (error) throw error;
  return (data ?? []) as { page_id: string; page_name: string; role: string }[];
}

/* ---------------- preferÃªncias de notificaÃ§Ã£o de alertas ---------------- */

export type NotifyPrefs = {
  enabled: boolean;
  email_enabled: boolean;
  email_to: string | null;
  webhook_enabled: boolean;
  webhook_url: string | null;
  severities: string[];
  rule_ids: string[];
};

export const DEFAULT_NOTIFY_PREFS: NotifyPrefs = {
  enabled: true,
  email_enabled: false,
  email_to: null,
  webhook_enabled: false,
  webhook_url: null,
  severities: ["critical"],
  rule_ids: [],
};

export async function getNotifyPrefs(userId: string): Promise<NotifyPrefs> {
  const { data, error } = await supabase
    .from("bi_alert_notify_prefs")
    .select("enabled, email_enabled, email_to, webhook_enabled, webhook_url, severities, rule_ids")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return { ...DEFAULT_NOTIFY_PREFS, ...(data ?? {}) } as NotifyPrefs;
}

export async function saveNotifyPrefs(userId: string, prefs: NotifyPrefs) {
  const { error } = await supabase
    .from("bi_alert_notify_prefs")
    .upsert({ user_id: userId, ...prefs }, { onConflict: "user_id" });
  if (error) throw error;
}

