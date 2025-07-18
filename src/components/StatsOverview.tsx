import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Calendar, CreditCard } from "lucide-react";
import { AIService } from "./AIServiceCard";

interface StatsOverviewProps {
  services: AIService[];
}

export function StatsOverview({ services }: StatsOverviewProps) {
  const totalMonthly = services
    .filter(s => s.billingCycle === 'monthly')
    .reduce((sum, s) => sum + s.amount, 0);

  const totalYearly = services
    .filter(s => s.billingCycle === 'yearly')
    .reduce((sum, s) => sum + s.amount, 0);

  const totalOneTime = services
    .filter(s => s.billingCycle === 'one-time')
    .reduce((sum, s) => sum + s.amount, 0);

  const totalAnnualizedCost = totalMonthly * 12 + totalYearly + totalOneTime;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const stats = [
    {
      title: "Monthly Spending",
      value: formatCurrency(totalMonthly),
      icon: Calendar,
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "Annual Cost",
      value: formatCurrency(totalAnnualizedCost),
      icon: DollarSign,
      trend: "+8%",
      trendUp: true,
    },
    {
      title: "Active Services",
      value: services.length.toString(),
      icon: CreditCard,
      trend: "+2",
      trendUp: true,
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-gradient-card shadow-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground mb-1">
              {stat.value}
            </div>
            <div className="flex items-center text-xs">
              {stat.trendUp ? (
                <TrendingUp className="h-3 w-3 text-primary mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive mr-1" />
              )}
              <span className={stat.trendUp ? "text-primary" : "text-destructive"}>
                {stat.trend}
              </span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}