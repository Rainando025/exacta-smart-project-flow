import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Palette, Check, Pipette } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColorPalette {
  name: string;
  colors: string[];
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    name: "Padrão",
    colors: [
      "#ffffff", "#94a3b8", "#64748b", "#0f172a",
      "#ef4444", "#f97316", "#f59e0b", "#10b981",
      "#06b6d4", "#3b82f6", "#6366f1", "#a855f7", "#ec4899"
    ]
  },
  {
    name: "Pastel",
    colors: [
      "#fbcfe8", "#fed7aa", "#fef08a", "#a7f3d0",
      "#bae6fd", "#c7d2fe", "#ddd6fe", "#f5d0fe", "#e2e8f0"
    ]
  },
  {
    name: "Neon / Vibrante",
    colors: [
      "#22c55e", "#00f0ff", "#ff007f", "#8b5cf6",
      "#ffaa00", "#ff3300", "#00ffcc", "#e000ff"
    ]
  },
  {
    name: "Terroso / Warm",
    colors: [
      "#c2410c", "#b45309", "#d97706", "#4d7c0f",
      "#15803d", "#9a3412", "#78350f", "#451a03"
    ]
  },
  {
    name: "Dark / Slate",
    colors: [
      "#020617", "#0f172a", "#1e293b", "#334155",
      "#1e1b4b", "#064e3b", "#4c0519", "#312e81"
    ]
  }
];

interface RichColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
  compact?: boolean;
  label?: string;
  showCustomInput?: boolean;
}

export function RichColorPicker({
  value,
  onChange,
  className,
  compact = false,
  label,
  showCustomInput = true
}: RichColorPickerProps) {
  const [activeTab, setActiveTab] = React.useState(0);
  const [hexInput, setHexInput] = React.useState(value);

  React.useEffect(() => {
    setHexInput(value);
  }, [value]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
      onChange(val);
    }
  };

  const currentColor = value || "#3b82f6";

  const PickerContent = (
    <div className="space-y-3 p-1">
      {/* Category selector */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar border-b border-border/50">
        {COLOR_PALETTES.map((palette, idx) => (
          <button
            key={palette.name}
            type="button"
            onClick={() => setActiveTab(idx)}
            className={cn(
              "px-2 py-1 text-[11px] font-medium rounded-md whitespace-nowrap transition-colors",
              activeTab === idx
                ? "bg-accent/20 text-accent font-semibold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {palette.name}
          </button>
        ))}
      </div>

      {/* Swatches for active category */}
      <div className="grid grid-cols-7 gap-1.5 pt-1">
        {COLOR_PALETTES[activeTab].colors.map((c) => {
          const isSelected = currentColor.toLowerCase() === c.toLowerCase();
          return (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              className={cn(
                "h-6 w-6 rounded-lg transition-transform relative flex items-center justify-center border border-white/10 hover:scale-110 focus:outline-none",
                isSelected && "ring-2 ring-accent ring-offset-2 ring-offset-background scale-110"
              )}
              style={{ backgroundColor: c }}
              title={c}
            >
              {isSelected && (
                <Check
                  className={cn(
                    "h-3 w-3 stroke-[3]",
                    ["#ffffff", "#fbcfe8", "#fed7aa", "#fef08a", "#a7f3d0", "#bae6fd", "#c7d2fe", "#ddd6fe", "#f5d0fe", "#e2e8f0"].includes(c.toLowerCase())
                      ? "text-black"
                      : "text-white"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Custom color input */}
      {showCustomInput && (
        <div className="pt-2 border-t border-border/50 flex items-center gap-2">
          <div className="relative h-8 w-8 rounded-lg border border-border overflow-hidden shrink-0 flex items-center justify-center" style={{ backgroundColor: currentColor }}>
            <input
              type="color"
              value={currentColor.length === 7 ? currentColor : "#3b82f6"}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              title="Escolher cor personalizada"
            />
            <Pipette className={cn("h-3.5 w-3.5 pointer-events-none", ["#ffffff", "#fbcfe8", "#fef08a", "#e2e8f0"].includes(currentColor.toLowerCase()) ? "text-black" : "text-white")} />
          </div>
          <Input
            value={hexInput}
            onChange={handleHexChange}
            placeholder="#000000"
            className="h-8 text-xs font-mono bg-muted/20"
          />
        </div>
      )}
    </div>
  );

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2 px-2 border-white/10 hover:bg-muted"
            >
              <div
                className="h-4 w-4 rounded-full border border-white/20 shadow-sm shrink-0"
                style={{ backgroundColor: currentColor }}
              />
              <span className="text-xs font-mono">{currentColor}</span>
              <Palette className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3 z-50 bg-card/95 backdrop-blur-xl border-white/10 shadow-2xl" align="start">
            {PickerContent}
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
      <div className="p-3 rounded-xl border border-white/10 bg-card/50 backdrop-blur-md">
        {PickerContent}
      </div>
    </div>
  );
}
