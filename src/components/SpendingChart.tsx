import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { AIService } from "./AIServiceCard";
import { TrendsSection } from "./TrendsSection";

interface SpendingChartProps {
  services: AIService[];
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

export function SpendingChart({ services }: SpendingChartProps) {
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

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-card shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">Spending by Provider</CardTitle>
          <CardDescription className="text-muted-foreground">
            Monthly breakdown of AI service costs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={providerData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                dataKey="value"
                className="text-xs"
              >
                {providerData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
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

      <TrendsSection services={services} />
    </div>
  );
}
