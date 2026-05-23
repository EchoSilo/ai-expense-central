import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { AIService } from "./AIServiceCard";
import { CostEntry, DailyEntry } from "@/lib/types";
import { TrendsSection } from "./TrendsSection";

interface SpendingChartProps {
  services: AIService[];
  entries: CostEntry[];
  dailyEntries: DailyEntry[];
}

const COLORS = [
  "hsl(var(--openai))",
  "hsl(var(--anthropic))",
  "hsl(var(--google))",
  "hsl(var(--microsoft))",
  "hsl(var(--midjourney))",
  "hsl(var(--github))",
  "hsl(var(--replicate))",
  "hsl(var(--stability))",
];

const TOOLTIP_STYLE = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  color: "hsl(var(--popover-foreground))",
};

export function SpendingChart({ services, entries, dailyEntries }: SpendingChartProps) {
  const [range, setRange] = useState<7 | 30 | 90 | "monthly">(30);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

  // Pie: current month breakdown by provider from real entries
  const currentYM = new Date().toISOString().slice(0, 7);
  const providerData = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries.filter((e) => e.yearMonth === currentYM)) {
      const svc = services.find((s) => s.id === e.serviceId);
      if (!svc) continue;
      const monthly =
        svc.billingCycle === "yearly" ? e.amount / 12
        : svc.billingCycle === "one-time" ? e.amount / 12
        : e.amount;
      if (monthly > 0) map.set(svc.provider, (map.get(svc.provider) ?? 0) + monthly);
    }
    // Fall back to service.amount for services with no entry this month
    if (map.size === 0) {
      for (const svc of services) {
        const monthly =
          svc.billingCycle === "yearly" ? svc.amount / 12
          : svc.billingCycle === "one-time" ? svc.amount / 12
          : svc.amount;
        if (monthly > 0) map.set(svc.provider, (map.get(svc.provider) ?? 0) + monthly);
      }
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [entries, services, currentYM]);

  const showMonthly = range === "monthly";
  const cutoffDate = showMonthly
    ? ""
    : new Date(Date.now() - range * 86400_000).toISOString().slice(0, 10);
  const rangedDailyEntries = showMonthly ? [] : dailyEntries.filter((e) => e.date >= cutoffDate);
  const hasDailyData = rangedDailyEntries.length > 0;

  const dailyChartData = useMemo(() => {
    if (!hasDailyData) return [];
    const byDate = new Map<string, Record<string, number>>();
    for (const e of rangedDailyEntries) {
      const svc = services.find((s) => s.id === e.serviceId);
      if (!svc) continue;
      const row = byDate.get(e.date) ?? {};
      row[svc.name] = (row[svc.name] ?? 0) + e.amount;
      byDate.set(e.date, row);
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date: date.slice(5), ...data }));
  }, [rangedDailyEntries, services, hasDailyData]);

  const monthlyChartData = useMemo(() => {
    const byMonth = new Map<string, Record<string, number>>();
    for (const e of entries) {
      const svc = services.find((s) => s.id === e.serviceId);
      if (!svc) continue;
      const row = byMonth.get(e.yearMonth) ?? {};
      row[svc.name] = (row[svc.name] ?? 0) + e.amount;
      byMonth.set(e.yearMonth, row);
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({ month, ...data }));
  }, [entries, services]);

  const servicesWithData = useMemo(() => {
    const ids = new Set(
      !showMonthly && hasDailyData
        ? rangedDailyEntries.map((e) => e.serviceId)
        : entries.map((e) => e.serviceId)
    );
    return services.filter((s) => ids.has(s.id));
  }, [services, entries, rangedDailyEntries, hasDailyData, showMonthly]);

  const hasAnyData = hasDailyData || monthlyChartData.length > 0;
  const anyDailyData = dailyEntries.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Cost trends</h2>
        {(anyDailyData || monthlyChartData.length > 0) && (
          <div className="flex gap-1 bg-muted rounded-md p-1">
            {anyDailyData && ([7, 30, 90] as const).map((d) => (
              <Button
                key={d}
                size="sm"
                variant={range === d ? "default" : "ghost"}
                className="h-7 px-3 text-xs"
                onClick={() => setRange(d)}
              >
                {d}d
              </Button>
            ))}
            <Button
              size="sm"
              variant={range === "monthly" ? "default" : "ghost"}
              className="h-7 px-3 text-xs"
              onClick={() => setRange("monthly")}
            >
              Mo
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-4 items-stretch">
        {/* Pie: current month by provider */}
        <div className="w-[20%] shrink-0">
          <Card className="bg-gradient-card shadow-card border-border/50 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-sm">Spending by Provider</CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                {currentYM} breakdown
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center pt-0 pb-3">
              {providerData.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center px-2 py-16">
                  Sync or log a cost to see breakdown.
                </p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={providerData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={60}
                        dataKey="value"
                      >
                        {providerData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => formatCurrency(v)}
                        contentStyle={TOOLTIP_STYLE}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="w-full space-y-1 mt-1">
                    {providerData.map((entry, i) => {
                      const total = providerData.reduce((s, e) => s + e.value, 0);
                      const pct = total > 0 ? ((entry.value / total) * 100).toFixed(0) : "0";
                      return (
                        <div key={entry.name} className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: COLORS[i % COLORS.length] }}
                            />
                            <span className="text-muted-foreground truncate">{entry.name}</span>
                          </div>
                          <span className="text-foreground font-medium ml-1 shrink-0">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stacked bar: daily if available, monthly otherwise */}
        <div className="flex-1">
          <Card className="bg-gradient-card shadow-card border-border/50 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground">Spend across all services</CardTitle>
              <CardDescription className="text-muted-foreground">
                {showMonthly
                  ? "Monthly cost — last 6 months"
                  : hasDailyData
                  ? `Daily cost — last ${range} days`
                  : monthlyChartData.length > 0
                  ? "Monthly cost — last 6 months"
                  : "No data yet"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!hasAnyData ? (
                <div className="flex items-center justify-center h-[280px]">
                  <p className="text-sm text-muted-foreground text-center">
                    Sync Anthropic or OpenAI to see daily trends,
                    <br />or log costs manually to see monthly history.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={!showMonthly && hasDailyData ? dailyChartData : monthlyChartData}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey={!showMonthly && hasDailyData ? "date" : "month"}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      tickFormatter={(v) => `$${v}`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => `$${v.toFixed(2)}`} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {servicesWithData.map((s, i) => (
                      <Bar
                        key={s.id}
                        dataKey={s.name}
                        stackId="1"
                        fill={COLORS[i % COLORS.length]}
                        fillOpacity={0.85}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <TrendsSection services={services} entries={entries} dailyEntries={dailyEntries} range={range} />
    </div>
  );
}
