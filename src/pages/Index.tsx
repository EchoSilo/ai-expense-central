// Update this page (the content is just a fallback if you fail to update the page)

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Bot, TrendingUp } from "lucide-react";
import { AIService, AIServiceCard } from "@/components/AIServiceCard";
import { AddServiceDialog } from "@/components/AddServiceDialog";
import { StatsOverview } from "@/components/StatsOverview";
import { SpendingChart } from "@/components/SpendingChart";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [services, setServices] = useState<AIService[]>([
    {
      id: '1',
      name: 'ChatGPT Plus',
      provider: 'OpenAI',
      amount: 20,
      billingCycle: 'monthly',
      category: 'subscription',
      color: '#10a37f',
      nextBilling: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    },
    {
      id: '2',
      name: 'Claude Pro',
      provider: 'Anthropic',
      amount: 20,
      billingCycle: 'monthly',
      category: 'subscription',
      color: '#ff6b35',
      nextBilling: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    },
    {
      id: '3',
      name: 'GitHub Copilot',
      provider: 'GitHub',
      amount: 10,
      billingCycle: 'monthly',
      category: 'subscription',
      color: '#24292e',
      nextBilling: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
    },
    {
      id: '4',
      name: 'API Credits',
      provider: 'OpenAI',
      amount: 50,
      billingCycle: 'one-time',
      category: 'credits',
      color: '#10a37f',
    },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<AIService | undefined>();
  const { toast } = useToast();

  const handleAddService = (newService: Omit<AIService, 'id'>) => {
    if (editingService) {
      setServices(prev => prev.map(s => 
        s.id === editingService.id 
          ? { ...newService, id: editingService.id }
          : s
      ));
      toast({
        title: "Service updated",
        description: "Your AI service has been updated successfully.",
      });
      setEditingService(undefined);
    } else {
      const service: AIService = {
        ...newService,
        id: Date.now().toString(),
      };
      setServices(prev => [...prev, service]);
      toast({
        title: "Service added",
        description: "Your AI service has been added to the tracker.",
      });
    }
  };

  const handleEditService = (service: AIService) => {
    setEditingService(service);
    setDialogOpen(true);
  };

  const handleDeleteService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
    toast({
      title: "Service deleted",
      description: "The AI service has been removed from your tracker.",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-gradient-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-primary p-2 rounded-lg">
                <Bot className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">AI Cost Tracker</h1>
                <p className="text-muted-foreground">Track all your AI expenses in one place</p>
              </div>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="bg-gradient-primary shadow-glow">
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Overview */}
        <StatsOverview services={services} />

        {/* Charts */}
        <SpendingChart services={services} />

        {/* Services Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Your AI Services</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              {services.length} active services
            </div>
          </div>
          
          {services.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No AI services yet</h3>
              <p className="text-muted-foreground mb-4">Start tracking your AI costs by adding your first service.</p>
              <Button onClick={() => setDialogOpen(true)} className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Service
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <AIServiceCard
                  key={service.id}
                  service={service}
                  onEdit={handleEditService}
                  onDelete={handleDeleteService}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddServiceDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingService(undefined);
        }}
        onAdd={handleAddService}
        editingService={editingService}
      />
    </div>
  );
};

export default Index;
