import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AIService } from "./AIServiceCard";

interface AddServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (service: Omit<AIService, 'id'>) => void;
  editingService?: AIService;
}

const AI_PROVIDERS = [
  'OpenAI',
  'Anthropic',
  'Google',
  'Microsoft',
  'Midjourney',
  'GitHub',
  'Replicate',
  'Stability AI',
  'Other'
];

export function AddServiceDialog({ open, onOpenChange, onAdd, editingService }: AddServiceDialogProps) {
  const [formData, setFormData] = useState({
    name: editingService?.name || '',
    provider: editingService?.provider || '',
    amount: editingService?.amount?.toString() || '',
    billingCycle: editingService?.billingCycle || 'monthly' as const,
    category: editingService?.category || 'subscription' as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.provider || !formData.amount) {
      return;
    }

    const nextBilling = formData.billingCycle !== 'one-time' 
      ? new Date(Date.now() + (formData.billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000)
      : undefined;

    onAdd({
      name: formData.name,
      provider: formData.provider,
      amount: parseFloat(formData.amount),
      billingCycle: formData.billingCycle,
      category: formData.category,
      color: '#00ff00', // This will be overridden by the provider color
      nextBilling,
    });

    // Reset form
    setFormData({
      name: '',
      provider: '',
      amount: '',
      billingCycle: 'monthly',
      category: 'subscription',
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {editingService ? 'Edit AI Service' : 'Add AI Service'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Track your AI-related expenses in one place.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Service Name</Label>
            <Input
              id="name"
              placeholder="e.g., ChatGPT Plus, Claude Pro"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="bg-input border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select 
              value={formData.provider} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, provider: value }))}
            >
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {AI_PROVIDERS.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="20.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing">Billing</Label>
              <Select 
                value={formData.billingCycle} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, billingCycle: value as any }))}
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="one-time">One-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as any }))}
            >
              <SelectTrigger className="bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="subscription">Subscription</SelectItem>
                <SelectItem value="usage">Usage-based</SelectItem>
                <SelectItem value="credits">Credits/Tokens</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-primary">
              {editingService ? 'Update' : 'Add'} Service
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}