import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Funnel,
  FunnelChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
} from "recharts";
import { buildChartData, formatNumber } from "@/lib/analyze/aggregate";
import type { ChartSpec, Row } from "@/lib/analyze/types";

const PALETTE = [
  "var(--neon-blue)",
  "var(--neon-red)",
  "var(--neon-cyan)",
  "var(--neon-purple)",
  "var(--neon-orange)",
  "var(--neon-green)",
];

function parseColor(color: string) {
  if (color.startsWith("#")) {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return { r, g, b };
  }
  if (color.startsWith("rgb")) {
    const matches = color.match(/\d+/g);
    if (matches && matches.length >= 3) {
      return { r: Number(matches[0]), g: Number(matches[1]), b: Number(matches[2]) };
    }
  }
  if (color.includes("neon-blue")) return { r: 0, g: 150, b: 255 };
  if (color.includes("neon-red")) return { r: 255, g: 50, b: 50 };
  if (color.includes("neon-cyan")) return { r: 0, g: 255, b: 255 };
  if (color.includes("neon-purple")) return { r: 180, g: 50, b: 255 };
  if (color.includes("neon-orange")) return { r: 255, g: 130, b: 0 };
  if (color.includes("neon-green")) return { r: 50, g: 255, b: 50 };
  return { r: 128, g: 128, b: 128 };
}

function interpolateColor(color1: string, color2: string, factor: number) {
  const c1 = parseColor(color1);
  const c2 = parseColor(color2);
  const r = Math.round(c1.r + factor * (c2.r - c1.r));
  const g = Math.round(c1.g + factor * (c2.g - c1.g));
  const b = Math.round(c1.b + factor * (c2.b - c1.b));
  return `rgb(${r}, ${g}, ${b})`;
}

function getCellColor(
  val: number,
  defaultColor: string,
  spec: ChartSpec,
  dataList: any[],
  measureKey: string
): string {
  if (spec.colorRules && spec.colorRules.length > 0) {
    for (const rule of spec.colorRules) {
      let match = false;
      if (rule.op === "gt" && val > rule.value1) match = true;
      else if (rule.op === "lt" && val < rule.value1) match = true;
      else if (rule.op === "eq" && val === rule.value1) match = true;
      else if (rule.op === "between" && rule.value2 !== undefined && val >= rule.value1 && val <= rule.value2) match = true;
      
      if (match) return rule.color;
    }
  }

  if (spec.gradientEnabled && spec.gradientColors && spec.gradientColors.length >= 2) {
    const values = dataList.map((d) => Number(d[measureKey] ?? 0));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const ratio = max === min ? 0.5 : (val - min) / (max - min);
    return interpolateColor(spec.gradientColors[0]!, spec.gradientColors[1]!, ratio);
  }

  return defaultColor;
}

const axis = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
  minTickGap: 2,
} as const;

function tooltipStyle() {
  return {
    contentStyle: {
      background: "var(--popover)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      fontSize: 12,
      color: "var(--popover-foreground)",
    },
    cursor: { fill: "var(--accent)", opacity: 0.25 },
  };
}

const truncate = (v: unknown) => {
  const s = String(v ?? "");
  return s.length > 14 ? `${s.slice(0, 13)}…` : s;
};

export function ChartRenderer({
  spec,
  rows,
  onSelect,
  active,
}: {
  spec: ChartSpec;
  rows: Row[];
  onSelect?: (value: string) => void;
  active?: string | null;
}) {
  const { data, keys } = buildChartData(rows, spec);
  const offset = spec.palette ?? 0;
  const color = (i: number) => PALETTE[(i + offset) % PALETTE.length] as string;
  const dense = ["line", "area", "stackedArea", "scatter"].includes(spec.type) || data.length > 10;
  const catAxis = {
    ...axis,
    interval: (dense ? "preserveStartEnd" : 0) as 0 | "preserveStartEnd",
    tickFormatter: truncate,
    angle: -18,
    textAnchor: "end" as const,
    height: 52,
  };
  const grid = <CartesianGrid stroke="var(--grid-line)" strokeDasharray="3 3" vertical={false} />;
  const legend =
    keys.length > 1 ? <Legend wrapperStyle={{ fontSize: 11, color: "var(--muted-foreground)" }} /> : null;

  const dim = (name: string) => (active && active !== name ? 0.3 : 1);
  const pick = (name: unknown) => {
    if (!onSelect) return;
    const v = String(name ?? "");
    if (v) onSelect(v);
  };
  const rootClick = (state: unknown) => pick((state as { activeLabel?: unknown } | null)?.activeLabel);
  const cellProps = (name: string) => ({
    onClick: () => pick(name),
    cursor: onSelect ? ("pointer" as const) : undefined,
    fillOpacity: dim(name),
  });
  const cursorClass = onSelect ? "cursor-pointer" : "";

  if (!data.length) {
    return <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Sem dados</div>;
  }

  if (spec.type === "table") {
    return (
      <div className="h-full overflow-auto text-xs">
        <table className="w-full">
          <thead className="sticky top-0 bg-card">
            <tr className="text-left text-muted-foreground">
              <th className="py-1 pr-2 font-medium">{spec.dimension}</th>
              {keys.map((k) => (
                <th key={k} className="py-1 pr-2 text-right font-medium">
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr
                key={d.name}
                onClick={() => pick(d.name)}
                className={`border-t border-border/60 ${cursorClass} ${
                  active === d.name ? "bg-primary/10" : "hover:bg-accent/40"
                }`}
              >
                <td className="py-1 pr-2">{d.name}</td>
                {keys.map((k) => {
                  const val = Number(d[k] ?? 0);
                  const cellColor = getCellColor(val, "", spec, data, k);
                  return (
                    <td key={k} className="py-1 pr-2 text-right tabular-nums">
                      <span 
                        className="inline-block px-1.5 py-0.5 rounded"
                        style={cellColor ? { color: cellColor, backgroundColor: `${cellColor}18`, fontWeight: "600" } : {}}
                      >
                        {formatNumber(val)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const chart = () => {
    switch (spec.type) {
      case "barH":
        return (
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }} onClick={rootClick}>
            {grid}
            <XAxis type="number" {...axis} tickFormatter={formatNumber} />
            <YAxis type="category" dataKey="name" width={110} {...axis} interval={0} tickFormatter={truncate} />
            <Tooltip {...tooltipStyle()} />
            {legend}
            {keys.map((k, i) => (
              <Bar key={k} dataKey={k} fill={color(i)} radius={[0, 4, 4, 0]} barSize={12}>
                {data.map((d) => (
                  <Cell key={d.name} {...cellProps(d.name)} fill={getCellColor(Number(d[k] ?? 0), color(i), spec, data, k)} />
                ))}
              </Bar>
            ))}
          </BarChart>
        );
      case "stackedBar":
        return (
          <BarChart data={data} onClick={rootClick}>
            {grid}
            <XAxis dataKey="name" {...catAxis} />
            <YAxis {...axis} tickFormatter={formatNumber} />
            <Tooltip {...tooltipStyle()} />
            {legend}
            {keys.map((k, i) => (
              <Bar key={k} dataKey={k} stackId="s" fill={color(i)} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        );
      case "line":
        return (
          <LineChart data={data} onClick={rootClick}>
            {grid}
            <XAxis dataKey="name" {...catAxis} />
            <YAxis {...axis} tickFormatter={formatNumber} />
            <Tooltip {...tooltipStyle()} />
            {legend}
            {keys.map((k, i) => (
              <Line key={k} type="monotone" dataKey={k} stroke={color(i)} strokeWidth={2} dot={{ r: 2 }} />
            ))}
          </LineChart>
        );
      case "area":
      case "stackedArea":
        return (
          <AreaChart data={data} onClick={rootClick}>
            <defs>
              {keys.map((k, i) => (
                <linearGradient key={k} id={`grad-${spec.id}-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color(i)} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={color(i)} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>
            {grid}
            <XAxis dataKey="name" {...catAxis} />
            <YAxis {...axis} tickFormatter={formatNumber} />
            <Tooltip {...tooltipStyle()} />
            {legend}
            {keys.map((k, i) => (
              <Area
                key={k}
                type="monotone"
                dataKey={k}
                {...(spec.type === "stackedArea" ? { stackId: "s" } : {})}
                stroke={color(i)}
                strokeWidth={2}
                fill={`url(#grad-${spec.id}-${i})`}
              />
            ))}
          </AreaChart>
        );
      case "pie":
      case "donut":
        return (
          <PieChart>
            <Tooltip {...tooltipStyle()} cursor={false} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Pie
              data={data}
              dataKey={keys[0] as string}
              nameKey="name"
              innerRadius={spec.type === "donut" ? "55%" : 0}
              outerRadius="80%"
              paddingAngle={spec.type === "donut" ? 2 : 0}
            >
              {data.map((d, i) => (
                <Cell key={d.name} {...cellProps(d.name)} fill={getCellColor(Number(d[keys[0] as string] ?? 0), color(i), spec, data, keys[0] as string)} stroke="var(--background)" strokeWidth={2} />
              ))}
            </Pie>
          </PieChart>
        );
      case "radar":
        return (
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke="var(--grid-line)" />
            <PolarAngleAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
            <PolarRadiusAxis tick={{ fill: "var(--muted-foreground)", fontSize: 9 }} />
            <Tooltip {...tooltipStyle()} cursor={false} />
            {legend}
            {keys.map((k, i) => (
              <Radar key={k} dataKey={k} stroke={color(i)} fill={color(i)} fillOpacity={0.35} />
            ))}
          </RadarChart>
        );
      case "radialBar":
        return (
          <RadialBarChart data={data} innerRadius="25%" outerRadius="95%" startAngle={90} endAngle={-270}>
            <Tooltip {...tooltipStyle()} cursor={false} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <RadialBar dataKey={keys[0] as string} background cornerRadius={6}>
              {data.map((d, i) => (
                <Cell key={d.name} {...cellProps(d.name)} fill={getCellColor(Number(d[keys[0] as string] ?? 0), color(i), spec, data, keys[0] as string)} />
              ))}
            </RadialBar>
          </RadialBarChart>
        );
      case "scatter":
        return (
          <ScatterChart onClick={rootClick}>
            {grid}
            <XAxis dataKey="name" {...catAxis} />
            <YAxis dataKey={keys[0] as string} {...axis} tickFormatter={formatNumber} />
            <Tooltip {...tooltipStyle()} cursor={{ strokeDasharray: "3 3" }} />
            <Scatter data={data} fill={color(0)}>
              {data.map((d, i) => (
                <Cell key={d.name} {...cellProps(d.name)} fill={getCellColor(Number(d[keys[0] as string] ?? 0), color(i), spec, data, keys[0] as string)} />
              ))}
            </Scatter>
          </ScatterChart>
        );
      case "composed":
        return (
          <ComposedChart data={data} onClick={rootClick}>
            {grid}
            <XAxis dataKey="name" {...catAxis} />
            <YAxis {...axis} tickFormatter={formatNumber} />
            <Tooltip {...tooltipStyle()} />
            {legend}
            {keys.map((k, i) =>
              i === 0 ? (
                <Bar key={k} dataKey={k} fill={color(i)} radius={[4, 4, 0, 0]} />
              ) : (
                <Line key={k} type="monotone" dataKey={k} stroke={color(i)} strokeWidth={2} />
              ),
            )}
          </ComposedChart>
        );
      case "treemap":
        return (
          <Treemap
            data={data.map((d, i) => ({ name: d.name, size: Number(d[keys[0] as string] ?? 0), fill: color(i) }))}
            dataKey="size"
            stroke="var(--background)"
            isAnimationActive={false}
            onClick={(node: unknown) => pick((node as { name?: unknown } | null)?.name)}
          >
            <Tooltip {...tooltipStyle()} cursor={false} />
          </Treemap>
        );
      case "funnel":
        return (
          <FunnelChart>
            <Tooltip {...tooltipStyle()} cursor={false} />
            <Funnel dataKey={keys[0] as string} data={data} isAnimationActive={false}>
              {data.map((d, i) => (
                <Cell key={d.name} {...cellProps(d.name)} fill={getCellColor(Number(d[keys[0] as string] ?? 0), color(i), spec, data, keys[0] as string)} />
              ))}
            </Funnel>
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </FunnelChart>
        );
      default:
        return (
          <BarChart data={data} onClick={rootClick}>
            {grid}
            <XAxis dataKey="name" {...catAxis} />
            <YAxis {...axis} tickFormatter={formatNumber} />
            <Tooltip {...tooltipStyle()} />
            {legend}
            {keys.map((k, i) => (
              <Bar key={k} dataKey={k} fill={color(i)} radius={[4, 4, 0, 0]}>
                {data.map((d) => (
                  <Cell key={d.name} {...cellProps(d.name)} fill={getCellColor(Number(d[k] ?? 0), color(i), spec, data, k)} />
                ))}
              </Bar>
            ))}
          </BarChart>
        );
    }
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      {chart()}
    </ResponsiveContainer>
  );
}
