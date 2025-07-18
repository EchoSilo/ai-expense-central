import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface AIService {
  id: string;
  name: string;
  provider: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly' | 'one-time';
  category: 'subscription' | 'usage' | 'credits';
  color: string;
  nextBilling?: Date;
}

interface AIServiceCardProps {
  service: AIService;
  onEdit: (service: AIService) => void;
  onDelete: (id: string) => void;
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
  };
  return colors[provider] || 'primary';
};

export function AIServiceCard({ service, onEdit, onDelete }: AIServiceCardProps) {
  const providerColor = getProviderColor(service.provider);
  
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
    <Card className="bg-gradient-card shadow-card hover:shadow-glow transition-all duration-300 border-border/50">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-foreground">
            {service.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={`bg-${providerColor}/10 text-${providerColor} border-${providerColor}/20`}
            >
              {service.provider}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {service.category}
            </Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border">
            <DropdownMenuItem onClick={() => onEdit(service)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(service.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-primary mb-1">
          {formatAmount(service.amount)}
          <span className="text-sm font-normal text-muted-foreground">
            {getBillingText()}
          </span>
        </div>
        {service.nextBilling && (
          <p className="text-xs text-muted-foreground">
            Next billing: {service.nextBilling.toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}