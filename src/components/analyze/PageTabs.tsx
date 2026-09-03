import {
  Activity,
  BadgeDollarSign,
  BarChart3,
  Boxes,
  CalendarDays,
  ClipboardList,
  Factory,
  Gauge,
  LineChart,
  Package,
  PieChart,
  Plus,
  ShoppingCart,
  Truck,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  activity: Activity,
  money: BadgeDollarSign,
  bar: BarChart3,
  boxes: Boxes,
  calendar: CalendarDays,
  clipboard: ClipboardList,
  factory: Factory,
  gauge: Gauge,
  line: LineChart,
  package: Package,
  pie: PieChart,
  cart: ShoppingCart,
  truck: Truck,
  users: Users,
  wrench: Wrench,
};

const RULES: Array<[RegExp, string]> = [
  [/venda|receita|faturament|financ|custo|preÃ§o|preco|fatur/i, "money"],
  [/cliente|usuario|usuÃ¡rio|pessoa|colaborador|funcion|equipe/i, "users"],
  [/estoque|produto|item|invent/i, "package"],
  [/pedido|compra|carrinho|order/i, "cart"],
  [/entrega|frete|log[iÃ­]stic|transport/i, "truck"],
  [/o\.?s\.?|servi[Ã§c]o|manuten|chamado|ticket/i, "wrench"],
  [/produ[Ã§c][Ã£a]o|f[Ã¡a]brica|industr|maquin/i, "factory"],
  [/data|mes|mÃªs|ano|per[iÃ­]odo|agenda/i, "calendar"],
  [/indicador|kpi|meta|performance|desempenho/i, "gauge"],
  [/relat[Ã³o]rio|lista|cadastro|registro/i, "clipboard"],
  [/tend[Ãªe]ncia|hist[Ã³o]ric|evolu/i, "line"],
  [/distribui|percent|share/i, "pie"],
  [/opera|monitor|status/i, "activity"],
];

/** Escolhe automaticamente um Ã­cone com base no nome da base/pÃ¡gina. */
export function pickIcon(name: string): string {
  for (const [re, icon] of RULES) if (re.test(name)) return icon;
  return "bar";
}

export function PageIcon({ icon, className }: { icon: string; className?: string }) {
  const Cmp = ICONS[icon] ?? Boxes;
  return <Cmp className={className} />;
}

export function PageTabs({
  pages,
  activeId,
  onSelect,
  onRename,
  onRemove,
  onAdd,
}: {
  pages: Array<{ id: string; name: string; icon: string }>;
  activeId: string | null;
  onSelect: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <nav className="no-print flex flex-wrap items-center gap-1.5">
      {pages.map((p) => {
        const active = p.id === activeId;
        return (
          <div
            key={p.id}
            className={`group flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
              active
                ? "border-primary/60 bg-primary/15 text-foreground panel-glow-blue"
                : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            <button className="flex items-center gap-1.5" onClick={() => onSelect(p.id)}>
              <PageIcon icon={p.icon} className="size-3.5" />
              <span className="max-w-[160px] truncate">{p.name}</span>
            </button>
            <button
              aria-label="Renomear pÃ¡gina"
              className="opacity-0 transition group-hover:opacity-60 hover:!opacity-100"
              onClick={() => {
                const next = window.prompt("Nome da pÃ¡gina", p.name);
                if (next && next.trim()) onRename(p.id, next.trim());
              }}
            >
              <span className="text-[10px]">âœŽ</span>
            </button>
            <button
              aria-label="Remover pÃ¡gina"
              className="opacity-0 transition group-hover:opacity-60 hover:!opacity-100"
              onClick={() => onRemove(p.id)}
            >
              <X className="size-3" />
            </button>
          </div>
        );
      })}
      <button
        onClick={onAdd}
        className="flex items-center gap-1 rounded-lg border border-dashed border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <Plus className="size-3.5" /> Nova pÃ¡gina
      </button>
    </nav>
  );
}


