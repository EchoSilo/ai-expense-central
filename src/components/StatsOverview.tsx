import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Calendar, CreditCard, AlertTriangle } from "lucide-react";
import { AIService } from "./AIServiceCard";
import { CostEntry } from "@/lib/types";

interface StatsOverviewProps {
  services: AIService[];
  alertCount: number;
  entries: CostEntry[];
}

export function StatsOverview({ services, alertCount = 0, entries }: StatsOverviewProps) {
  const now = new Date();
  const currentYM = now.toISOString().slice(0, 7);
  const prevYM = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);

  const thisMonth = entries
    .filter((e) => e.yearMonth === currentYM)
    .reduce((sum, e) => sum + e.amount, 0);

  const lastMonth = entries
    .filter((e) => e.yearMonth === prevYM)
    .reduce((sum, e) => sum + e.amount, 0);

  const pct = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

  // Annual cost: annualize this month's real spend, plus any fixed yearly/one-time services
  const fixedYearly = services
    .filter((s) => s.billingCycle === "yearly")
    .reduce((sum, s) => sum + s.amount, 0);
  const fixedOneTime = services
    .filter((s) => s.billingCycle === "one-time")
    .reduce((sum, s) => sum + s.amount, 0);
  const annualCost = thisMonth * 12 + fixedYearly + fixedOneTime;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const pctStr = (p: number) => `${p >= 0 ? "+" : ""}${p.toFixed(1)}%`;

  const hasMoMData = lastMonth > 0 || thisMonth > 0;

  const stats = [
    {
      title: "Monthly Spending",
      value: formatCurrency(thisMonth),
      icon: Calendar,
      trend: hasMoMData ? pctStr(pct) : "No data yet",
      trendUp: pct >= 0,
      destructive: false,
      empty: thisMonth === 0,
    },
    {
      title: "Annual Cost",
      value: formatCurrency(annualCost),
      icon: DollarSign,
      trend: hasMoMData ? pctStr(pct) : "No data yet",
      trendUp: pct >= 0,
      destructive: false,
      empty: annualCost === 0,
    },
    {
      title: "Active Services",
      value: services.length.toString(),
      icon: CreditCard,
      trend: `${services.length}`,
      trendUp: true,
      destructive: false,
      empty: false,
    },
    {
      title: "Active Alerts",
      value: alertCount.toString(),
      icon: AlertTriangle,
      trend: alertCount > 0 ? "needs review" : "all clear",
      trendUp: alertCount === 0,
      destructive: alertCount > 0,
      empty: false,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className={`bg-gradient-card shadow-card border-border/50 ${
            stat.destructive ? "border-destructive/40" : ""
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon
              className={`h-4 w-4 ${
                stat.destructive ? "text-destructive" : "text-muted-foreground"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold mb-1 ${
                stat.destructive
                  ? "text-destructive"
                  : stat.empty
                  ? "text-muted-foreground"
                  : "text-foreground"
              }`}
            >
              {stat.value}
            </div>
            <div className="flex items-center text-xs">
              {stat.destructive ? (
                <AlertTriangle className="h-3 w-3 text-destructive mr-1" />
              ) : stat.trendUp ? (
                <TrendingUp className="h-3 w-3 text-primary mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive mr-1" />
              )}
              <span
                className={
                  stat.destructive
                    ? "text-destructive"
                    : stat.trendUp
                    ? "text-primary"
                    : "text-destructive"
                }
              >
                {stat.trend}
              </span>
              {!stat.destructive && hasMoMData && (
                <span className="text-muted-foreground ml-1">vs last month</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
