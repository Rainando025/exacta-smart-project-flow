import { useCallback, useEffect, useState } from "react";
import { CloudUpload, Eye, Loader2, Pencil, Share2, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  addMember,
  listActivity,
  listMembers,
  removeMember,
  updateMemberRole,
  type ActivityEntry,
  type Member,
  type Role,
} from "@/lib/analyze/cloud";

const ROLE_LABEL: Record<string, string> = {
  owner: "Dono",
  editor: "EdiÃ§Ã£o",
  viewer: "Somente leitura",
};

export function ShareDialog({
  open,
  pageId,
  pageName,
  role,
  published,
  userId,
  onOpenChange,
  onPublish,
}: {
  open: boolean;
  pageId: string | null;
  pageName: string;
  role: Role | null;
  published: boolean;
  userId: string;
  onOpenChange: (v: boolean) => void;
  onPublish: () => Promise<void>;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [email, setEmail] = useState("");
  const [newRole, setNewRole] = useState<"viewer" | "editor">("viewer");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!pageId || !published) return;
    try {
      const [m, a] = await Promise.all([listMembers(pageId), listActivity(pageId)]);
      setMembers(m);
      setActivity(a);
    } catch (e) {
      toast.error("NÃ£o foi possÃ­vel carregar o compartilhamento", { description: (e as Error).message });
    }
  }, [pageId, published]);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  const invite = async () => {
    if (!pageId || !email.trim()) return;
    setBusy(true);
    try {
      await addMember(pageId, email, newRole, userId);
      setEmail("");
      await refresh();
      toast.success("Acesso concedido", {
        description: `${email.trim().toLowerCase()} Â· ${ROLE_LABEL[newRole]}`,
      });
    } catch (e) {
      toast.error("Falha ao conceder acesso", { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const isOwner = role === "owner";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Share2 className="size-4" /> Compartilhar â€œ{pageName}â€
          </DialogTitle>
        </DialogHeader>

        {!published ? (
          <div className="space-y-3 py-2 text-sm">
            <p className="text-muted-foreground">
              Publique esta pÃ¡gina na nuvem para compartilhÃ¡-la com outras pessoas e registrar quem altera visÃµes e
              pÃ¡ginas.
            </p>
            <Button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onPublish();
                  await refresh();
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <CloudUpload className="size-4" />} Publicar e
              compartilhar
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="people">
            <TabsList>
              <TabsTrigger value="people">Pessoas</TabsTrigger>
              <TabsTrigger value="activity">Atividade</TabsTrigger>
            </TabsList>

            <TabsContent value="people" className="space-y-3">
              {isOwner ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@empresa.com"
                    type="email"
                    className="h-9 min-w-52 flex-1"
                  />
                  <div className="flex rounded-lg border border-border bg-secondary/60 p-0.5">
                    {(["viewer", "editor"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setNewRole(r)}
                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors ${
                          newRole === r ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {r === "viewer" ? <Eye className="size-3.5" /> : <Pencil className="size-3.5" />}
                        {ROLE_LABEL[r]}
                      </button>
                    ))}
                  </div>
                  <Button size="sm" onClick={() => void invite()} disabled={busy || !email.trim()}>
                    <UserPlus className="size-4" /> Convidar
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Seu acesso nesta pÃ¡gina: <strong>{ROLE_LABEL[role ?? "viewer"]}</strong>. Apenas o dono pode alterar
                  permissÃµes.
                </p>
              )}

              <div className="max-h-72 space-y-2 overflow-auto">
                {!members.length && (
                  <p className="text-sm text-muted-foreground">NinguÃ©m convidado ainda â€” sÃ³ vocÃª tem acesso.</p>
                )}
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 p-3"
                  >
                    <div className="min-w-0 text-sm">
                      <p className="truncate font-medium">{m.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {ROLE_LABEL[m.role]} Â· desde {new Date(m.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    {isOwner && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={async () => {
                            await updateMemberRole(m.id, m.role === "viewer" ? "editor" : "viewer");
                            await refresh();
                          }}
                        >
                          {m.role === "viewer" ? <Pencil className="size-3.5" /> : <Eye className="size-3.5" />}
                          {m.role === "viewer" ? "Dar ediÃ§Ã£o" : "Somente leitura"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label="Remover acesso"
                          onClick={async () => {
                            await removeMember(m.id);
                            await refresh();
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <div className="max-h-80 space-y-2 overflow-auto">
                {!activity.length && <p className="text-sm text-muted-foreground">Nenhuma alteraÃ§Ã£o registrada.</p>}
                {activity.map((a) => (
                  <div key={a.id} className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
                    <p className="font-medium">
                      {a.user_email ?? "UsuÃ¡rio"} Â· <span className="font-normal">{a.action}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleString("pt-BR")}
                      {a.detail ? ` Â· ${a.detail}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}


