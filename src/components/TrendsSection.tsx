import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  Legend,
  CartesianGrid,
  Scatter,
  ComposedChart,
} from "recharts";
import { AIService } from "./AIServiceCard";
import {
  getStackedDaily,
  getDailyTotals,
  getBaselineStats,
  getHourlyHeatmap,
} from "@/lib/mockUsage";

const SERIES_COLORS = [
  "hsl(var(--openai))",
  "hsl(var(--anthropic))",
  "hsl(var(--google))",
  "hsl(var(--microsoft))",
  "hsl(var(--midjourney))",
  "hsl(var(--replicate))",
  "hsl(var(--stability))",
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fmt(v: number) {
  return `$${v.toFixed(2)}`;
}

interface Props {
  services: AIService[];
}

export function TrendsSection({ services }: Props) {
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const [selectedId, setSelectedId] = useState<string>(services[0]?.id ?? "");

  const stacked = useMemo(() => getStackedDaily(services, range), [services, range]);

  const selectedService = services.find((s) => s.id === selectedId) ?? services[0];

  const lineData = useMemo(() => {
    if (!selectedService) return [];
    return getDailyTotals(selectedService, range).map((d) => ({
      date: d.date.slice(5),
      cost: Number(d.cost.toFixed(2)),
      anomalyCost: d.anomaly ? Number(d.cost.toFixed(2)) : null,
    }));
  }, [selectedService, range]);

  const baseline = useMemo(
    () => (selectedService ? getBaselineStats(selectedService) : { mean: 0, upper: 0, lower: 0, std: 0 }),
    [selectedService]
  );

  const heatmap = useMemo(
    () => (selectedService ? getHourlyHeatmap(selectedService) : []),
    [selectedService]
  );

  const heatMax = Math.max(0.01, ...heatmap.flat());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-semibold text-foreground">Cost trends</h2>
        <div className="flex gap-1 bg-muted rounded-md p-1">
          {[7, 30, 90].map((d) => (
            <Button
              key={d}
              size="sm"
              variant={range === d ? "default" : "ghost"}
              className="h-7 px-3 text-xs"
              onClick={() => setRange(d as 7 | 30 | 90)}
            >
              {d}d
            </Button>
          ))}
        </div>
      </div>

      <Card className="bg-gradient-card shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">Spend across all services</CardTitle>
          <CardDescription className="text-muted-foreground">
            Stacked daily cost — last {range} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={stacked}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickFormatter={(v) => String(v).slice(5)}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickFormatter={(v) => `$${v}`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                }}
                formatter={(v: number) => fmt(v)}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {services.map((s, i) => (
                <Area
                  key={s.id}
                  type="monotone"
                  dataKey={s.name}
                  stackId="1"
                  stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                  fill={SERIES_COLORS[i % SERIES_COLORS.length]}
                  fillOpacity={0.5}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-gradient-card shadow-card border-border/50">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-foreground">Per-service trend</CardTitle>
              <CardDescription className="text-muted-foreground">
                Daily cost vs baseline (±2σ band)
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
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={lineData}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
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
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                  formatter={(v: number) => fmt(v)}
                />
                <ReferenceArea
                  y1={baseline.lower}
                  y2={baseline.upper}
                  fill="hsl(var(--primary))"
                  fillOpacity={0.08}
                />
                <ReferenceLine
                  y={baseline.mean}
                  stroke="hsl(var(--primary))"
                  strokeDasharray="4 4"
                  label={{
                    value: `baseline ${fmt(baseline.mean)}`,
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 10,
                    position: "insideTopRight",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
                <Scatter
                  dataKey="anomalyCost"
                  fill="hsl(var(--destructive))"
                  shape="circle"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground">Hour-of-day pattern</CardTitle>
            <CardDescription className="text-muted-foreground">
              Average spend by weekday × hour — odd-hour activity is suspicious
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                <div className="flex gap-1 pl-10 mb-1">
                  {Array.from({ length: 24 }).map((_, h) => (
                    <div
                      key={h}
                      className="w-3 text-[9px] text-muted-foreground text-center"
                    >
                      {h % 6 === 0 ? h : ""}
                    </div>
                  ))}
                </div>
                {heatmap.map((row, d) => (
                  <div key={d} className="flex items-center gap-1 mb-1">
                    <div className="w-8 text-[10px] text-muted-foreground">
                      {DAYS_OF_WEEK[d]}
                    </div>
                    {row.map((v, h) => {
                      const intensity = v / heatMax;
                      return (
                        <div
                          key={h}
                          title={`${DAYS_OF_WEEK[d]} ${h}:00 — ${fmt(v)}`}
                          className="w-3 h-5 rounded-sm"
                          style={{
                            background: `hsl(var(--primary) / ${0.08 + intensity * 0.85})`,
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
