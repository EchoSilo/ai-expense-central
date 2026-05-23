import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { AIService } from "./AIServiceCard";
import { CostEntry, DailyEntry } from "@/lib/types";

const TOOLTIP_STYLE = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  color: "hsl(var(--popover-foreground))",
};

interface Props {
  services: AIService[];
  entries: CostEntry[];
  dailyEntries: DailyEntry[];
  range: 7 | 30 | 90 | "monthly";
}

function fmt(v: number) {
  return `$${v.toFixed(2)}`;
}

export function TrendsSection({ services, entries, dailyEntries, range }: Props) {
  const [selectedId, setSelectedId] = useState<string>(services[0]?.id ?? "");
  const selectedService = services.find((s) => s.id === selectedId) ?? services[0];

  const showMonthly = range === "monthly";
  const cutoffDate = showMonthly
    ? ""
    : new Date(Date.now() - range * 86400_000).toISOString().slice(0, 10);

  // Daily data for selected service
  const serviceDailyEntries = useMemo(
    () =>
      showMonthly
        ? []
        : dailyEntries
            .filter((e) => e.serviceId === selectedId && e.date >= cutoffDate)
            .sort((a, b) => a.date.localeCompare(b.date)),
    [dailyEntries, selectedId, cutoffDate, showMonthly]
  );

  // Monthly data for selected service
  const serviceMonthlyEntries = useMemo(
    () =>
      entries
        .filter((e) => e.serviceId === selectedId)
        .sort((a, b) => a.yearMonth.localeCompare(b.yearMonth))
        .slice(-12),
    [entries, selectedId]
  );

  const hasDailyData = serviceDailyEntries.length > 0;
  const hasMonthlyData = serviceMonthlyEntries.length > 0;

  // Mean for reference line
  const monthlyMean = useMemo(() => {
    if (serviceMonthlyEntries.length < 2) return 0;
    const prior = serviceMonthlyEntries.slice(0, -1);
    return prior.reduce((s, e) => s + e.amount, 0) / prior.length;
  }, [serviceMonthlyEntries]);

  // MoM table
  const momData = useMemo(() => {
    return serviceMonthlyEntries.slice(-6).map((e, i, arr) => {
      const prev = arr[i - 1];
      const pct = prev && prev.amount > 0 ? ((e.amount - prev.amount) / prev.amount) * 100 : null;
      return { month: e.yearMonth, amount: e.amount, pct };
    });
  }, [serviceMonthlyEntries]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Per-service trend */}
        <Card className="bg-gradient-card shadow-card border-border/50">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-foreground">Per-service trend</CardTitle>
              <CardDescription className="text-muted-foreground">
                {hasDailyData ? `Daily cost — last ${range} days` : "Monthly cost history"}
              </CardDescription>
            </div>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="w-[180px] bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {!hasDailyData && !hasMonthlyData ? (
              <div className="flex items-center justify-center h-[260px]">
                <p className="text-sm text-muted-foreground text-center">
                  No data for {selectedService?.name ?? "this service"} yet.
                  <br />Sync or log a cost to see trends.
                </p>
              </div>
            ) : hasDailyData ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={serviceDailyEntries.map((e) => ({ date: e.date.slice(5), amount: e.amount }))}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => fmt(v)} />
                  <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={serviceMonthlyEntries.map((e) => ({ month: e.yearMonth, amount: e.amount }))}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => fmt(v)} />
                  {monthlyMean > 0 && (
                    <ReferenceLine y={monthlyMean} stroke="hsl(var(--primary))" strokeDasharray="4 4"
                      label={{ value: `avg ${fmt(monthlyMean)}`, fill: "hsl(var(--muted-foreground))", fontSize: 10, position: "insideTopRight" }}
                    />
                  )}
                  <Bar dataKey="amount" fill="hsl(var(--primary))" fillOpacity={0.8} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Month-over-month table */}
        <Card className="bg-gradient-card shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground">Month-over-month</CardTitle>
            <CardDescription className="text-muted-foreground">
              {selectedService?.name ?? "Service"} — last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            {momData.length === 0 ? (
              <div className="flex items-center justify-center h-[200px]">
                <p className="text-sm text-muted-foreground text-center">
                  Log at least 2 months of costs to see month-over-month changes.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {momData.map(({ month, amount, pct }) => (
                  <div key={month} className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/20 text-sm">
                    <span className="text-muted-foreground w-24 shrink-0">{month}</span>
                    <span className="font-medium text-foreground">{fmt(amount)}</span>
                    <span
                      className={`w-20 text-right ${
                        pct === null
                          ? "text-muted-foreground"
                          : pct > 0
                          ? "text-destructive"
                          : "text-primary"
                      }`}
                    >
                      {pct === null ? "—" : `${pct > 0 ? "+" : ""}${pct.toFixed(0)}%`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
