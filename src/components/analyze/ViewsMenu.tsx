import { Bookmark, Link2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SavedView } from "@/lib/analyze/types";

export function ViewsMenu({
  views,
  onSave,
  onApply,
  onDelete,
  onShare,
  onShareView,
}: {
  views: SavedView[];
  onSave: () => void;
  onApply: (view: SavedView) => void;
  onDelete: (id: string) => void;
  onShare: () => void;
  onShareView: (view: SavedView) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm">
          <Bookmark className="size-4" /> VisÃµes
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuItem onSelect={onSave}>
          <Plus className="size-4" /> Salvar visÃ£o atual
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onShare}>
          <Link2 className="size-4" /> Copiar link da visÃ£o atual
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">VisÃµes salvas</DropdownMenuLabel>
        {!views.length && <p className="px-2 py-1.5 text-xs text-muted-foreground">Nenhuma visÃ£o salva ainda.</p>}
        {views.map((v) => (
          <div key={v.id} className="flex items-center gap-1 px-1">
            <button
              onClick={() => onApply(v)}
              className="flex-1 truncate rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
            >
              {v.name}
              <span className="ml-2 text-[10px] text-muted-foreground">
                {new Date(v.createdAt).toLocaleDateString("pt-BR")}
              </span>
            </button>
            <button
              aria-label="Copiar link"
              onClick={() => onShareView(v)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Link2 className="size-3.5" />
            </button>
            <button
              aria-label="Excluir visÃ£o"
              onClick={() => onDelete(v.id)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


