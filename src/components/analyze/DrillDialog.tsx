import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChartRenderer } from "@/components/analyze/ChartRenderer";
import type { ChartSpec, Row } from "@/lib/analyze/types";

export function DrillDialog({
  spec,
  rows,
  label,
  onOpenChange,
}: {
  spec: ChartSpec | null;
  rows: Row[];
  label: string | null;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={!!spec} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wide">
            {label ? `Detalhamento · ${label}` : "Detalhamento"}
          </DialogTitle>
        </DialogHeader>
        <div className="h-[420px]">{spec && <ChartRenderer spec={spec} rows={rows} />}</div>
      </DialogContent>
    </Dialog>
  );
}
