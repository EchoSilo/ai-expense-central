import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { AIService } from "./AIServiceCard";

interface SpendingChartProps {
  services: AIService[];
}

const COLORS = [
  'hsl(var(--openai))',
  'hsl(var(--anthropic))',
  'hsl(var(--google))',
  'hsl(var(--microsoft))',
  'hsl(var(--midjourney))',
  'hsl(var(--github))',
  'hsl(var(--replicate))',
  'hsl(var(--stability))',
];

export function SpendingChart({ services }: SpendingChartProps) {
  // Group by provider for pie chart
  const providerData = services.reduce((acc, service) => {
    const existing = acc.find(item => item.name === service.provider);
    const monthlyAmount = service.billingCycle === 'yearly' 
      ? service.amount / 12 
      : service.billingCycle === 'one-time' 
        ? service.amount / 12 // Amortize one-time over a year
        : service.amount;
    
    if (existing) {
      existing.value += monthlyAmount;
    } else {
      acc.push({
        name: service.provider,
        value: monthlyAmount,
      });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Monthly spending trend (mock data for now)
  const trendData = [
    { month: 'Jan', spending: 45 },
    { month: 'Feb', spending: 52 },
    { month: 'Mar', spending: 48 },
    { month: 'Apr', spending: 61 },
    { month: 'May', spending: 55 },
    { month: 'Jun', spending: 67 },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-foreground font-medium">{payload[0].payload.name}</p>
          <p className="text-primary font-bold">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="bg-gradient-card shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">Spending by Provider</CardTitle>
          <CardDescription className="text-muted-foreground">
            Monthly breakdown of AI service costs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={providerData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                className="text-xs"
              >
                {providerData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">Spending Trend</CardTitle>
          <CardDescription className="text-muted-foreground">
            Monthly AI spending over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trendData}>
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                        <p className="text-foreground font-medium">{label}</p>
                        <p className="text-primary font-bold">
                          {formatCurrency(payload[0].value as number)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="spending" 
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}