import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, AlertTriangle, PlusCircle, BarChart2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AnomalyResult, CostEntry } from "@/lib/types";
import { SyncButton } from "@/components/SyncButton";
import { isSyncable } from "@/lib/providerKey";

export interface AIService {
  id: string;
  name: string;
  provider: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly' | 'one-time';
  category: 'subscription' | 'usage' | 'credits';
  color: string;
  nextBilling?: Date;
  expectedMonthlyBudget?: number;
  baselineDailyCost?: number;
  keyLabel?: string;
  keyStatus?: 'healthy' | 'warning' | 'compromised';
}

interface AIServiceCardProps {
  service: AIService;
  onEdit: (service: AIService) => void;
  onDelete: (id: string) => void;
  onOpen?: (service: AIService) => void;
  onLogCost?: (service: AIService) => void;
  onSaveEntry?: (entry: Omit<CostEntry, "id" | "loggedAt">) => void;
  yearMonth?: string;
  anomaly?: AnomalyResult | null;
}

const getProviderColor = (provider: string) => {
  const colors: Record<string, string> = {
    'OpenAI': 'openai',
    'Anthropic': 'anthropic',
    'Google': 'google',
    'Microsoft': 'microsoft',
    'Midjourney': 'midjourney',
    'GitHub': 'github',
    'Replicate': 'replicate',
    'Stability AI': 'stability',
    'ElevenLabs': 'primary',
    'AssemblyAI': 'google',
    'HeyGen': 'replicate',
    'Replit': 'github',
    'Lovable': 'anthropic',
  };
  return colors[provider] || 'primary';
};

export function AIServiceCard({ service, onEdit, onDelete, onOpen, onLogCost, onSaveEntry, yearMonth, anomaly }: AIServiceCardProps) {
  const currentYearMonth = yearMonth ?? new Date().toISOString().slice(0, 7);
  const providerColor = getProviderColor(service.provider);
  const status = service.keyStatus ?? 'healthy';
  const statusStyles: Record<string, string> = {
    healthy: 'bg-primary/10 text-primary border-primary/20',
    warning: 'bg-anthropic/10 text-anthropic border-anthropic/20',
    compromised: 'bg-destructive/15 text-destructive border-destructive/30',
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getBillingText = () => {
    if (service.billingCycle === 'one-time') return 'One-time';
    if (service.billingCycle === 'yearly') return '/year';
    return '/month';
  };

  return (
    <Card
      onClick={() => onOpen?.(service)}
      className="bg-gradient-card shadow-card hover:shadow-glow transition-all duration-300 border-border/50 cursor-pointer"
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-foreground">
            {service.name}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className={`bg-${providerColor}/10 text-${providerColor} border-${providerColor}/20`}
            >
              {service.provider}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {service.category}
            </Badge>
            {status !== 'healthy' && (
              <Badge variant="outline" className={`text-xs ${statusStyles[status]}`}>
                {status}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {anomaly?.isAnomaly && (
            <AlertTriangle
              className={`h-4 w-4 ${anomaly.severity === 'critical' ? 'text-destructive' : 'text-yellow-500'}`}
            />
          )}
          {isSyncable(service.provider) && onSaveEntry && (
            <SyncButton service={service} yearMonth={currentYearMonth} onSave={onSaveEntry} />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border">
              <DropdownMenuItem onClick={() => onLogCost?.(service)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Log Cost
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(service)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpen?.(service)}>
                <BarChart2 className="mr-2 h-4 w-4" />
                View Trend
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(service.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-primary mb-1">
          {formatAmount(service.amount)}
          <span className="text-sm font-normal text-muted-foreground">
            {getBillingText()}
          </span>
        </div>
        {anomaly?.isAnomaly && (
          <p className={`text-xs font-medium mb-1 ${anomaly.severity === 'critical' ? 'text-destructive' : 'text-yellow-500'}`}>
            {anomaly.deviationPct > 0 ? '+' : ''}{anomaly.deviationPct.toFixed(0)}% vs baseline
          </p>
        )}
        {service.keyLabel && (
          <p className="text-xs text-muted-foreground font-mono">{service.keyLabel}</p>
        )}
        {service.nextBilling && (
          <p className="text-xs text-muted-foreground">
            Next billing: {service.nextBilling.toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
