import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Calendar, CreditCard, AlertTriangle } from "lucide-react";
import { AIService } from "./AIServiceCard";
import { getMonthOverMonth } from "@/lib/mockUsage";

interface StatsOverviewProps {
  services: AIService[];
  alertCount: number;
}

export function StatsOverview({ services, alertCount }: StatsOverviewProps) {
  const totalMonthly = services
    .filter((s) => s.billingCycle === "monthly")
    .reduce((sum, s) => sum + s.amount, 0);

  const totalYearly = services
    .filter((s) => s.billingCycle === "yearly")
    .reduce((sum, s) => sum + s.amount, 0);

  const totalOneTime = services
    .filter((s) => s.billingCycle === "one-time")
    .reduce((sum, s) => sum + s.amount, 0);

  const totalAnnualizedCost = totalMonthly * 12 + totalYearly + totalOneTime;

  const mom = getMonthOverMonth(services);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const pctStr = (p: number) => `${p >= 0 ? "+" : ""}${p.toFixed(1)}%`;

  const stats = [
    {
      title: "Monthly Spending",
      value: formatCurrency(mom.thisMonth || totalMonthly),
      icon: Calendar,
      trend: pctStr(mom.pct),
      trendUp: mom.pct >= 0,
      destructive: false,
    },
    {
      title: "Annual Cost",
      value: formatCurrency(totalAnnualizedCost),
      icon: DollarSign,
      trend: pctStr(mom.pct),
      trendUp: mom.pct >= 0,
      destructive: false,
    },
    {
      title: "Active Services",
      value: services.length.toString(),
      icon: CreditCard,
      trend: `${services.length}`,
      trendUp: true,
      destructive: false,
    },
    {
      title: "Active Alerts",
      value: alertCount.toString(),
      icon: AlertTriangle,
      trend: alertCount > 0 ? "needs review" : "all clear",
      trendUp: alertCount === 0,
      destructive: alertCount > 0,
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
                stat.destructive ? "text-destructive" : "text-foreground"
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
              {!stat.destructive && (
                <span className="text-muted-foreground ml-1">vs last month</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
