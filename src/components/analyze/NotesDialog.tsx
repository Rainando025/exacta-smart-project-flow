import { useState } from "react";
import { MessageSquarePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { Annotation } from "@/lib/analyze/types";

export function NotesDialog({
  open,
  title,
  notes,
  onOpenChange,
  onAdd,
  onDelete,
}: {
  open: boolean;
  title: string;
  notes: Annotation[];
  onOpenChange: (v: boolean) => void;
  onAdd: (text: string) => void;
  onDelete: (id: string) => void;
}) {
  const [text, setText] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">AnotaÃ§Ãµes Â· {title}</DialogTitle>
        </DialogHeader>

        <div className="max-h-64 space-y-2 overflow-auto">
          {!notes.length && <p className="text-sm text-muted-foreground">Nenhuma anotaÃ§Ã£o registrada.</p>}
          {notes.map((n) => (
            <div key={n.id} className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="whitespace-pre-wrap">{n.text}</p>
                <button
                  aria-label="Excluir anotaÃ§Ã£o"
                  onClick={() => onDelete(n.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {new Date(n.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>
          ))}
        </div>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Registre um insight sobre este visual..."
          rows={3}
        />
        <Button
          onClick={() => {
            if (!text.trim()) return;
            onAdd(text.trim());
            setText("");
          }}
        >
          <MessageSquarePlus className="size-4" /> Adicionar anotaÃ§Ã£o
        </Button>
      </DialogContent>
    </Dialog>
  );
}


