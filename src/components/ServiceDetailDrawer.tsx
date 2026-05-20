import { useMemo, useState } from "react";
import { format, parse } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { KeyRound, ExternalLink, AlertTriangle, CheckCircle2 } from "lucide-react";
import { CostEntry, AnomalyResult } from "@/lib/types";
import { computeAnomaly } from "@/hooks/use-cost-history";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { AIService } from "./AIServiceCard";
import {
  getDailyTotals,
  getBaselineStats,
  getHourlyHeatmap,
  getEventsForService,
  getProviderKeyDocsUrl,
} from "@/lib/mockUsage";

interface Props {
  service: AIService | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onRotateKey: (id: string) => void;
  costEntries?: CostEntry[];
  onLogCost?: (service: AIService) => void;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const PIE_COLORS = [
  "hsl(var(--openai))",
  "hsl(var(--anthropic))",
  "hsl(var(--google))",
  "hsl(var(--midjourney))",
  "hsl(var(--replicate))",
];

export function ServiceDetailDrawer({ service, open, onOpenChange, onRotateKey, costEntries = [], onLogCost }: Props) {
  const [notes, setNotes] = useState("");

  const serviceEntries = useMemo(
    () =>
      costEntries
        .filter((e) => e.serviceId === service?.id)
        .sort((a, b) => b.yearMonth.localeCompare(a.yearMonth)),
    [costEntries, service?.id]
  );

  const latestEntry = serviceEntries[0] ?? null;
  const latestAnomaly: AnomalyResult | null = useMemo(() => {
    if (!latestEntry || !service) return null;
    return computeAnomaly(costEntries, service.id, latestEntry.yearMonth);
  }, [costEntries, latestEntry, service]);

  const data = useMemo(() => {
    if (!service) return null;
    const daily = getDailyTotals(service, 30).map((d) => ({
      date: d.date.slice(5),
      cost: Number(d.cost.toFixed(2)),
      anomalyCost: d.anomaly ? Number(d.cost.toFixed(2)) : null,
    }));
    const baseline = getBaselineStats(service);
    const heatmap = getHourlyHeatmap(service);
    const events = getEventsForService(service, 30);
    const byModel = new Map<string, number>();
    for (const e of events) byModel.set(e.model, (byModel.get(e.model) ?? 0) + e.costUsd);
    const modelData = Array.from(byModel.entries()).map(([name, value]) => ({ name, value }));
    return { daily, baseline, heatmap, modelData };
  }, [service]);

  if (!service || !data) return null;

  const status = service.keyStatus ?? "healthy";
  const heatMax = Math.max(0.01, ...data.heatmap.flat());

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle className="text-foreground">{service.name}</SheetTitle>
            <Badge
              variant="outline"
              className={
                status === "compromised"
                  ? "border-destructive/40 text-destructive bg-destructive/10"
                  : status === "warning"
                  ? "border-anthropic/40 text-anthropic bg-anthropic/10"
                  : "border-primary/40 text-primary bg-primary/10"
              }
            >
              {status}
            </Badge>
          </div>
          <SheetDescription className="text-muted-foreground">
            {service.provider}
            {service.keyLabel && (
              <span className="font-mono ml-2">· {service.keyLabel}</span>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">

          {/* Logged cost summary */}
          {serviceEntries.length > 0 && latestEntry ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Baseline</p>
                <p className="text-sm font-semibold text-foreground">
                  {latestAnomaly ? `$${latestAnomaly.baseline.toFixed(2)}` : '—'}
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  {format(parse(latestEntry.yearMonth, 'yyyy-MM', new Date()), 'MMM yyyy')}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  ${latestEntry.amount.toFixed(2)}
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Deviation</p>
                <p className={`text-sm font-semibold ${
                  latestAnomaly?.severity === 'critical'
                    ? 'text-destructive'
                    : latestAnomaly?.severity === 'warning'
                    ? 'text-yellow-500'
                    : 'text-primary'
                }`}>
                  {latestAnomaly
                    ? `${latestAnomaly.deviationPct > 0 ? '+' : ''}${latestAnomaly.deviationPct.toFixed(0)}%`
                    : '—'}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-muted/20 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">
                No cost entries logged yet.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-border"
                onClick={() => service && onLogCost?.(service)}
              >
                Log your first entry
              </Button>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-foreground mb-2">30-day spend vs baseline</p>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={data.daily}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: number) => `$${v.toFixed(2)}`} />
                <ReferenceArea y1={data.baseline.lower} y2={data.baseline.upper} fill="hsl(var(--primary))" fillOpacity={0.08} />
                <ReferenceLine y={data.baseline.mean} stroke="hsl(var(--primary))" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="cost" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Scatter dataKey="anomalyCost" fill="hsl(var(--destructive))" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Hour-of-day pattern</p>
              <div className="overflow-x-auto">
                <div className="inline-block">
                  {data.heatmap.map((row, d) => (
                    <div key={d} className="flex items-center gap-1 mb-1">
                      <div className="w-6 text-[10px] text-muted-foreground">{DAYS[d]}</div>
                      {row.map((v, h) => (
                        <div
                          key={h}
                          title={`${DAYS[d]} ${h}:00 — $${v.toFixed(2)}`}
                          className="w-2.5 h-4 rounded-sm"
                          style={{ background: `hsl(var(--primary) / ${0.08 + (v / heatMax) * 0.85})` }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground mb-2">Model breakdown</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={data.modelData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    className="text-[10px]"
                  >
                    {data.modelData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Logged cost history table */}
          {serviceEntries.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">Cost history</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-border"
                  onClick={() => service && onLogCost?.(service)}
                >
                  + Log Cost
                </Button>
              </div>
              <div className="space-y-1">
                {serviceEntries.map((entry) => {
                  const rowAnomaly = computeAnomaly(costEntries, entry.serviceId, entry.yearMonth);
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between text-xs py-2 px-3 rounded-md bg-muted/20 hover:bg-muted/30 transition-colors"
                    >
                      <span className="text-muted-foreground w-20 shrink-0">
                        {format(parse(entry.yearMonth, 'yyyy-MM', new Date()), 'MMM yyyy')}
                      </span>
                      <span className="font-medium text-foreground w-20 text-right shrink-0">
                        ${entry.amount.toFixed(2)}
                      </span>
                      <span className={`w-16 text-right shrink-0 ${
                        rowAnomaly.deviationPct > 0 ? 'text-destructive' : 'text-primary'
                      }`}>
                        {rowAnomaly.dataPoints >= 2
                          ? `${rowAnomaly.deviationPct > 0 ? '+' : ''}${rowAnomaly.deviationPct.toFixed(0)}%`
                          : '—'}
                      </span>
                      <span className="flex items-center gap-1 justify-end w-20 shrink-0">
                        {rowAnomaly.isAnomaly ? (
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 h-4 ${
                              rowAnomaly.severity === 'critical'
                                ? 'border-destructive/40 text-destructive bg-destructive/10'
                                : 'border-yellow-500/40 text-yellow-500 bg-yellow-500/10'
                            }`}
                          >
                            <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                            {rowAnomaly.severity}
                          </Badge>
                        ) : rowAnomaly.dataPoints >= 2 ? (
                          <CheckCircle2 className="h-3 w-3 text-primary" />
                        ) : null}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Key management</p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  window.open(getProviderKeyDocsUrl(service.provider), "_blank");
                  onRotateKey(service.id);
                }}
              >
                <KeyRound className="h-4 w-4 mr-1" />
                Rotate key
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Investigation notes (local only)"
                className="bg-input border-border min-h-[80px]"
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
