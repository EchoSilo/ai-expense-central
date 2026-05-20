import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { AIService } from "./AIServiceCard";
import { TrendsSection } from "./TrendsSection";
import { getStackedDaily } from "@/lib/mockUsage";

interface SpendingChartProps {
  services: AIService[];
}

const PIE_COLORS = [
  "hsl(var(--openai))",
  "hsl(var(--anthropic))",
  "hsl(var(--google))",
  "hsl(var(--microsoft))",
  "hsl(var(--midjourney))",
  "hsl(var(--github))",
  "hsl(var(--replicate))",
  "hsl(var(--stability))",
];

const SERIES_COLORS = [
  "hsl(var(--openai))",
  "hsl(var(--anthropic))",
  "hsl(var(--google))",
  "hsl(var(--microsoft))",
  "hsl(var(--midjourney))",
  "hsl(var(--replicate))",
  "hsl(var(--stability))",
];

export function SpendingChart({ services }: SpendingChartProps) {
  const [range, setRange] = useState<7 | 30 | 90>(30);

  const providerData = services.reduce((acc, service) => {
    const existing = acc.find((item) => item.name === service.provider);
    const monthlyAmount =
      service.billingCycle === "yearly"
        ? service.amount / 12
        : service.billingCycle === "one-time"
        ? service.amount / 12
        : service.amount;
    if (existing) existing.value += monthlyAmount;
    else acc.push({ name: service.provider, value: monthlyAmount });
    return acc;
  }, [] as { name: string; value: number }[]);

  const stacked = useMemo(() => getStackedDaily(services, range), [services, range]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

  return (
    <div className="space-y-4">
      {/* Range selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Cost trends</h2>
        <div className="flex gap-1 bg-muted rounded-md p-1">
          {([7, 30, 90] as const).map((d) => (
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
        </div>
      </div>

      {/* Pie (20%) + Stacked area (80%) side by side */}
      <div className="flex gap-4 items-stretch">
        <div className="w-[20%] shrink-0">
          <Card className="bg-gradient-card shadow-card border-border/50 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-sm">Spending by Provider</CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                Monthly breakdown
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={providerData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      percent > 0.08 ? `${name} ${(percent * 100).toFixed(0)}%` : ""
                    }
                    outerRadius="45%"
                    dataKey="value"
                    className="text-[10px]"
                  >
                    {providerData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1">
          <Card className="bg-gradient-card shadow-card border-border/50 h-full">
            <CardHeader className="pb-2">
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
                    formatter={(v: number) => `$${v.toFixed(2)}`}
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
        </div>
      </div>

      <TrendsSection services={services} range={range} />
    </div>
  );
}
