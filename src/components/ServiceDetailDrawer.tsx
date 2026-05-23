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
import { CostEntry, DailyEntry, AnomalyResult } from "@/lib/types";
import { computeAnomaly } from "@/hooks/use-cost-history";
import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { AIService } from "./AIServiceCard";
import { getProviderKeyDocsUrl } from "@/lib/mockUsage";

interface Props {
  service: AIService | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onRotateKey: (id: string) => void;
  costEntries?: CostEntry[];
  dailyEntries?: DailyEntry[];
  onLogCost?: (service: AIService) => void;
}

const TOOLTIP_STYLE = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  color: "hsl(var(--popover-foreground))",
};

export function ServiceDetailDrawer({
  service,
  open,
  onOpenChange,
  onRotateKey,
  costEntries = [],
  dailyEntries = [],
  onLogCost,
}: Props) {
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

  const sortedDailyEntries = useMemo(
    () => [...dailyEntries].sort((a, b) => a.date.localeCompare(b.date)),
    [dailyEntries]
  );

  const hasDailyData = sortedDailyEntries.length > 0;

  const monthlyChartData = useMemo(
    () =>
      [...serviceEntries]
        .sort((a, b) => a.yearMonth.localeCompare(b.yearMonth))
        .slice(-12)
        .map((e) => ({ month: e.yearMonth, amount: e.amount })),
    [serviceEntries]
  );

  if (!service) return null;

  const status = service.keyStatus ?? "healthy";

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

          {/* Summary stats */}
          {serviceEntries.length > 0 && latestEntry ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Baseline</p>
                <p className="text-sm font-semibold text-foreground">
                  {latestAnomaly ? `$${latestAnomaly.baseline.toFixed(2)}` : "—"}
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  {format(parse(latestEntry.yearMonth, "yyyy-MM", new Date()), "MMM yyyy")}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  ${latestEntry.amount.toFixed(2)}
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Deviation</p>
                <p
                  className={`text-sm font-semibold ${
                    latestAnomaly?.severity === "critical"
                      ? "text-destructive"
                      : latestAnomaly?.severity === "warning"
                      ? "text-yellow-500"
                      : "text-primary"
                  }`}
                >
                  {latestAnomaly
                    ? `${latestAnomaly.deviationPct > 0 ? "+" : ""}${latestAnomaly.deviationPct.toFixed(0)}%`
                    : "—"}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-muted/20 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">No cost entries logged yet.</p>
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

          {/* Spend chart — daily if synced, monthly otherwise */}
          {(hasDailyData || monthlyChartData.length > 0) && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">
                {hasDailyData ? "Daily spend" : "Monthly spend history"}
              </p>
              <ResponsiveContainer width="100%" height={220}>
                {hasDailyData ? (
                  <LineChart
                    data={sortedDailyEntries.map((e) => ({
                      date: e.date.slice(5),
                      amount: e.amount,
                    }))}
                  >
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => `$${v.toFixed(2)}`} />
                    <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                ) : (
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => `$${v.toFixed(2)}`} />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" fillOpacity={0.8} radius={[3, 3, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

          {/* Cost history table */}
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
                        {format(parse(entry.yearMonth, "yyyy-MM", new Date()), "MMM yyyy")}
                      </span>
                      <span className="font-medium text-foreground w-20 text-right shrink-0">
                        ${entry.amount.toFixed(2)}
                      </span>
                      <span
                        className={`w-16 text-right shrink-0 ${
                          rowAnomaly.deviationPct > 0 ? "text-destructive" : "text-primary"
                        }`}
                      >
                        {rowAnomaly.dataPoints >= 2
                          ? `${rowAnomaly.deviationPct > 0 ? "+" : ""}${rowAnomaly.deviationPct.toFixed(0)}%`
                          : "—"}
                      </span>
                      <span className="flex items-center gap-1 justify-end w-20 shrink-0">
                        {rowAnomaly.isAnomaly ? (
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 h-4 ${
                              rowAnomaly.severity === "critical"
                                ? "border-destructive/40 text-destructive bg-destructive/10"
                                : "border-yellow-500/40 text-yellow-500 bg-yellow-500/10"
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

          {/* Key management */}
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
