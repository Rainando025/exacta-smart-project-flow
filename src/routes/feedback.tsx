import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquarePlus,
  Star,
  EyeOff,
  Filter,
  TrendingUp,
  Award,
  Trash2,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { notify } from "@/lib/notify";

export const Route = createFileRoute("/feedback")({
  component: () => (
    <AppShell>
      <FeedbackPage />
    </AppShell>
  ),
});

const DEFAULT_COMPETENCIES = [
  "Comunicação",
  "Colaboração",
  "Liderança",
  "Conhecimento técnico",
  "Proatividade",
  "Organização",
  "Resolução de problemas",
];

const TYPE_LABELS: Record<string, string> = {
  peer: "Entre pares",
  manager: "Gestor → Colaborador",
  self: "Autoavaliação",
};

interface Feedback {
  id: string;
  reviewee_id: string;
  reviewer_id: string;
  is_anonymous: boolean;
  feedback_type: string;
  rating: number;
  strengths: string | null;
  improvements: string | null;
  message: string | null;
  created_at: string;
}

interface Competency {
  id: string;
  feedback_id: string;
  name: string;
  score: number;
}

function StarRating({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md";
}) {
  const sz = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          disabled={!onChange}
          className={`${onChange ? "cursor-pointer" : "cursor-default"}`}
          aria-label={`${n} estrela${n === 1 ? "" : "s"}`}
        >
          <Star
            className={`${sz} transition ${
              n <= value
                ? "fill-accent text-accent"
                : "text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function FeedbackPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [tab, setTab] = useState<"received" | "sent" | "metrics">("received");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  // form
  const [revieweeId, setRevieweeId] = useState("");
  const [type, setType] = useState<"peer" | "manager" | "self">("peer");
  const [rating, setRating] = useState(4);
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [comps, setComps] = useState<{ name: string; score: number }[]>([
    { name: "Comunicação", score: 4 },
    { name: "Colaboração", score: 4 },
  ]);
  const [newComp, setNewComp] = useState("");

  const load = async () => {
    if (!user) return;
    const [m, f] = await Promise.all([
      supabase.from("profiles").select("id,full_name,job_title"),
      supabase.from("feedbacks").select("*").order("created_at", { ascending: false }),
    ]);
    if (m.data) setMembers(m.data);
    if (f.data) {
      const list = f.data as Feedback[];
      setFeedbacks(list);
      if (list.length > 0) {
        const ids = list.map((x) => x.id);
        const c = await supabase
          .from("feedback_competencies")
          .select("*")
          .in("feedback_id", ids);
        setCompetencies((c.data || []) as Competency[]);
      } else {
        setCompetencies([]);
      }
    }
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase
      .channel("feedback-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feedbacks" },
        load
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feedback_competencies" },
        load
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const memberById = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m])),
    [members]
  );

  const received = feedbacks.filter((f) => f.reviewee_id === user?.id);
  const sent = feedbacks.filter((f) => f.reviewer_id === user?.id);

  // Métricas: recebidas pelo usuário
  const avgRating =
    received.length > 0
      ? received.reduce((s, f) => s + f.rating, 0) / received.length
      : 0;

  const competenciesByName = useMemo(() => {
    const map: Record<string, { sum: number; count: number }> = {};
    const myFeedbackIds = new Set(received.map((f) => f.id));
    competencies
      .filter((c) => myFeedbackIds.has(c.feedback_id))
      .forEach((c) => {
        if (!map[c.name]) map[c.name] = { sum: 0, count: 0 };
        map[c.name].sum += c.score;
        map[c.name].count += 1;
      });
    return Object.entries(map)
      .map(([name, v]) => ({ name, avg: v.sum / v.count, count: v.count }))
      .sort((a, b) => b.avg - a.avg);
  }, [competencies, received]);

  const strongest = competenciesByName.slice(0, 3);
  const toImprove = [...competenciesByName].reverse().slice(0, 3);

  const resetForm = () => {
    setRevieweeId("");
    setType("peer");
    setRating(4);
    setStrengths("");
    setImprovements("");
    setMessage("");
    setAnonymous(false);
    setComps([
      { name: "Comunicação", score: 4 },
      { name: "Colaboração", score: 4 },
    ]);
    setNewComp("");
  };

  const submit = async () => {
    if (!user) return;
    const target = type === "self" ? user.id : revieweeId;
    if (!target) return toast.error("Selecione quem será avaliado");

    const { data, error } = await supabase
      .from("feedbacks")
      .insert({
        reviewee_id: target,
        reviewer_id: user.id,
        is_anonymous: type === "self" ? false : anonymous,
        feedback_type: type,
        rating,
        strengths: strengths || null,
        improvements: improvements || null,
        message: message || null,
      })
      .select()
      .single();

    if (error) return toast.error(error.message);

    if (comps.length > 0 && data) {
      await supabase.from("feedback_competencies").insert(
        comps.map((c) => ({
          feedback_id: data.id,
          name: c.name,
          score: c.score,
        }))
      );
    }

    // Notifica o avaliado (não notifica em autoavaliação)
    if (type !== "self" && target !== user.id) {
      await notify({
        user_id: target,
        type: "feedback",
        title: anonymous ? "Você recebeu um novo feedback" : "Novo feedback recebido",
        message: `Avaliação: ${rating}/5 estrelas`,
        link: "/feedback",
      });
    }

    toast.success("Feedback enviado ✨");
    setOpen(false);
    resetForm();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este feedback?")) return;
    const { error } = await supabase.from("feedbacks").delete().eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Feedback excluído");
  };

  const addComp = () => {
    const name = newComp.trim();
    if (!name) return;
    if (comps.find((c) => c.name.toLowerCase() === name.toLowerCase())) {
      return toast.error("Competência já adicionada");
    }
    setComps([...comps, { name, score: 4 }]);
    setNewComp("");
  };

  const removeComp = (name: string) => setComps(comps.filter((c) => c.name !== name));

  const filterList = (list: Feedback[]) =>
    list.filter((f) => {
      if (!search.trim()) return true;
      const otherId = f.reviewee_id === user?.id ? f.reviewer_id : f.reviewee_id;
      const name = memberById[otherId]?.full_name || "";
      return (
        name.toLowerCase().includes(search.toLowerCase()) ||
        (f.message || "").toLowerCase().includes(search.toLowerCase())
      );
    });

  const renderCard = (f: Feedback, mode: "received" | "sent") => {
    const otherId = mode === "received" ? f.reviewer_id : f.reviewee_id;
    const showAnonymous = mode === "received" && f.is_anonymous;
    const otherName = showAnonymous
      ? "Anônimo"
      : memberById[otherId]?.full_name || "Usuário";
    const fComps = competencies.filter((c) => c.feedback_id === f.id);
    return (
      <Card key={f.id} className="p-5 shadow-card space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${
                showAnonymous
                  ? "bg-muted text-muted-foreground"
                  : "bg-gradient-accent text-accent-foreground"
              }`}
            >
              {showAnonymous ? <EyeOff className="h-4 w-4" /> : otherName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm">
                {mode === "received" ? "De" : "Para"}: {otherName}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {TYPE_LABELS[f.feedback_type]} •{" "}
                {new Date(f.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StarRating value={f.rating} />
            {mode === "sent" && (
              <button
                onClick={() => remove(f.id)}
                className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted"
                aria-label="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {f.strengths && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-accent font-bold mb-1">
              Pontos fortes
            </p>
            <p className="text-sm">{f.strengths}</p>
          </div>
        )}
        {f.improvements && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-primary font-bold mb-1">
              Pontos a melhorar
            </p>
            <p className="text-sm">{f.improvements}</p>
          </div>
        )}
        {f.message && (
          <p className="text-sm text-muted-foreground italic border-l-2 border-accent/40 pl-3">
            "{f.message}"
          </p>
        )}
        {fComps.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {fComps.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted text-xs"
              >
                <span className="font-medium">{c.name}</span>
                <StarRating value={c.score} size="sm" />
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-accent font-medium uppercase tracking-wider">
            Feedback 360°
          </p>
          <h1 className="font-display text-3xl lg:text-4xl font-bold mt-1">
            Cultura de feedback contínuo
          </h1>
          <p className="text-muted-foreground mt-2">
            Avalie colegas, receba retornos e acompanhe sua evolução em competências.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-primary text-primary-foreground shadow-elegant">
              <MessageSquarePlus className="h-4 w-4" /> Dar feedback
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo feedback</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={type} onValueChange={(v: any) => setType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TYPE_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {type !== "self" && (
                  <div>
                    <Label>Para quem</Label>
                    <Select value={revieweeId} onValueChange={setRevieweeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione…" />
                      </SelectTrigger>
                      <SelectContent>
                        {members
                          .filter((m) => m.id !== user?.id)
                          .map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.full_name || "Sem nome"}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div>
                <Label>Avaliação geral</Label>
                <div className="mt-2">
                  <StarRating value={rating} onChange={setRating} />
                </div>
              </div>

              <div>
                <Label>Pontos fortes</Label>
                <Textarea
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  placeholder="O que essa pessoa faz muito bem?"
                />
              </div>
              <div>
                <Label>Pontos a melhorar</Label>
                <Textarea
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  placeholder="O que pode ser desenvolvido?"
                />
              </div>
              <div>
                <Label>Mensagem (opcional)</Label>
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Comentário adicional"
                />
              </div>

              <div>
                <Label>Competências avaliadas</Label>
                <div className="space-y-2 mt-2">
                  {comps.map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/40"
                    >
                      <span className="text-sm flex-1 font-medium">{c.name}</span>
                      <StarRating
                        value={c.score}
                        onChange={(v) =>
                          setComps(
                            comps.map((x) => (x.name === c.name ? { ...x, score: v } : x))
                          )
                        }
                        size="sm"
                      />
                      <button
                        onClick={() => removeComp(c.name)}
                        className="p-1 text-muted-foreground hover:text-destructive"
                        aria-label="Remover"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Select value={newComp} onValueChange={setNewComp}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Adicionar competência…" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_COMPETENCIES.filter(
                          (d) => !comps.find((c) => c.name === d)
                        ).map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="ou personalizada…"
                      value={newComp.startsWith("__") ? "" : newComp}
                      onChange={(e) => setNewComp(e.target.value)}
                      className="h-9"
                    />
                    <Button
                      onClick={addComp}
                      size="sm"
                      variant="outline"
                      className="gap-1"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {type !== "self" && (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <EyeOff className="h-4 w-4 text-accent" />
                    <div>
                      <p className="text-sm font-medium">Enviar anonimamente</p>
                      <p className="text-[11px] text-muted-foreground">
                        Seu nome não aparecerá para o avaliado.
                      </p>
                    </div>
                  </div>
                  <Switch checked={anonymous} onCheckedChange={setAnonymous} />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={submit}
                className="bg-gradient-primary text-primary-foreground"
              >
                Enviar feedback
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 shadow-card">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Star className="h-3.5 w-3.5 text-accent" /> Nota média recebida
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-4xl font-bold">
              {avgRating ? avgRating.toFixed(1) : "—"}
            </span>
            <span className="text-sm text-muted-foreground">/ 5</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {received.length} feedback{received.length === 1 ? "" : "s"} recebido
            {received.length === 1 ? "" : "s"}
          </p>
        </Card>
        <Card className="p-5 shadow-card">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Award className="h-3.5 w-3.5 text-accent" /> Pontos fortes
          </div>
          <ul className="mt-3 space-y-1.5">
            {strongest.length === 0 && (
              <li className="text-xs text-muted-foreground">Sem dados ainda</li>
            )}
            {strongest.map((c) => (
              <li key={c.name} className="flex items-center justify-between text-sm">
                <span className="truncate">{c.name}</span>
                <StarRating value={Math.round(c.avg)} size="sm" />
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5 shadow-card">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-primary" /> Áreas de desenvolvimento
          </div>
          <ul className="mt-3 space-y-1.5">
            {toImprove.length === 0 && (
              <li className="text-xs text-muted-foreground">Sem dados ainda</li>
            )}
            {toImprove.map((c) => (
              <li key={c.name} className="flex items-center justify-between text-sm">
                <span className="truncate">{c.name}</span>
                <StarRating value={Math.round(c.avg)} size="sm" />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { v: "received", l: `Recebidos (${received.length})` },
          { v: "sent", l: `Enviados (${sent.length})` },
          { v: "metrics", l: "Tabela de competências" },
        ].map((t) => (
          <button
            key={t.v}
            onClick={() => setTab(t.v as any)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              tab === t.v
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/70"
            }`}
          >
            {t.l}
          </button>
        ))}
        {tab !== "metrics" && (
          <div className="flex items-center gap-2 ml-auto">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs h-9"
            />
          </div>
        )}
      </div>

      {tab === "received" && (
        <div className="space-y-3">
          {filterList(received).length === 0 && (
            <Card className="p-12 text-center text-muted-foreground border-dashed">
              Você ainda não recebeu feedbacks.
            </Card>
          )}
          {filterList(received).map((f) => renderCard(f, "received"))}
        </div>
      )}
      {tab === "sent" && (
        <div className="space-y-3">
          {filterList(sent).length === 0 && (
            <Card className="p-12 text-center text-muted-foreground border-dashed">
              Você ainda não enviou feedbacks.
            </Card>
          )}
          {filterList(sent).map((f) => renderCard(f, "sent"))}
        </div>
      )}
      {tab === "metrics" && (
        <Card className="shadow-card overflow-hidden">
          <div className="px-5 py-3 border-b flex items-center justify-between">
            <h3 className="font-display font-bold text-sm">
              Suas competências (média das avaliações recebidas)
            </h3>
            <span className="text-xs text-muted-foreground">
              {competenciesByName.length} competência(s)
            </span>
          </div>
          {competenciesByName.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              Nenhuma competência avaliada ainda.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-2.5">Competência</th>
                  <th className="px-5 py-2.5">Nota média</th>
                  <th className="px-5 py-2.5">Avaliações</th>
                  <th className="px-5 py-2.5 w-[40%]">Distribuição</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {competenciesByName.map((c) => (
                  <tr key={c.name} className="hover:bg-muted/20">
                    <td className="px-5 py-3 font-medium">{c.name}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{c.avg.toFixed(1)}</span>
                        <StarRating value={Math.round(c.avg)} size="sm" />
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{c.count}</td>
                    <td className="px-5 py-3">
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-gradient-accent"
                          style={{ width: `${(c.avg / 5) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
}
