import { History, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ImportEntry } from "@/lib/analyze/types";

const MODE_LABEL: Record<ImportEntry["mode"], string> = {
  create: "Base criada",
  append: "Acrescentado",
  replace: "SubstituÃ­do",
};

export function HistoryDialog({
  open,
  entries,
  onOpenChange,
  onRestore,
}: {
  open: boolean;
  entries: ImportEntry[];
  onOpenChange: (v: boolean) => void;
  onRestore: (entry: ImportEntry) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <History className="size-4" /> HistÃ³rico de importaÃ§Ãµes
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-80 space-y-2 overflow-auto">
          {!entries.length && <p className="text-sm text-muted-foreground">Nenhuma importaÃ§Ã£o registrada.</p>}
          {[...entries].reverse().map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 p-3"
            >
              <div className="min-w-0 text-sm">
                <p className="truncate font-medium">{e.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {MODE_LABEL[e.mode]} Â· {new Date(e.at).toLocaleString("pt-BR")} Â·{" "}
                  {e.rowCount.toLocaleString("pt-BR")} registros
                  {e.added !== undefined ? ` Â· +${e.added.toLocaleString("pt-BR")}` : ""}
                  {e.duplicates ? ` Â· ${e.duplicates.toLocaleString("pt-BR")} duplicados` : ""}
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                disabled={!e.previous}
                onClick={() => onRestore(e)}
                title={e.previous ? "Voltar ao estado anterior a esta importaÃ§Ã£o" : "Sem versÃ£o anterior"}
              >
                <Undo2 className="size-3.5" /> Reverter
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}


