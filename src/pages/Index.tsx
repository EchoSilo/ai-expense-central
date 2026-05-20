import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Bot, TrendingUp } from "lucide-react";
import { AIService, AIServiceCard } from "@/components/AIServiceCard";
import { AddServiceDialog } from "@/components/AddServiceDialog";
import { StatsOverview } from "@/components/StatsOverview";
import { SpendingChart } from "@/components/SpendingChart";
import { AlertsBanner } from "@/components/AlertsBanner";
import { AlertsDrawer } from "@/components/AlertsDrawer";
import { ServiceDetailDrawer } from "@/components/ServiceDetailDrawer";
import { LogCostDialog } from "@/components/LogCostDialog";
import { detectAlerts } from "@/lib/mockUsage";
import { useToast } from "@/hooks/use-toast";
import { useCostHistory } from "@/hooks/use-cost-history";

const Index = () => {
  const [services, setServices] = useState<AIService[]>([
    {
      id: "1",
      name: "ChatGPT Plus",
      provider: "OpenAI",
      amount: 20,
      billingCycle: "monthly",
      category: "subscription",
      color: "#10a37f",
      nextBilling: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      expectedMonthlyBudget: 30,
      baselineDailyCost: 0.8,
      keyLabel: "sk-…4f2a",
      keyStatus: "compromised",
    },
    {
      id: "2",
      name: "Claude Pro",
      provider: "Anthropic",
      amount: 20,
      billingCycle: "monthly",
      category: "subscription",
      color: "#ff6b35",
      nextBilling: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      expectedMonthlyBudget: 25,
      baselineDailyCost: 0.7,
      keyLabel: "sk-ant-…91c",
      keyStatus: "healthy",
    },
    {
      id: "3",
      name: "GitHub Copilot",
      provider: "GitHub",
      amount: 10,
      billingCycle: "monthly",
      category: "subscription",
      color: "#24292e",
      nextBilling: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
      expectedMonthlyBudget: 12,
      baselineDailyCost: 0.35,
      keyLabel: "ghp_…7d3",
      keyStatus: "healthy",
    },
    {
      id: "4",
      name: "API Credits",
      provider: "OpenAI",
      amount: 50,
      billingCycle: "one-time",
      category: "credits",
      color: "#10a37f",
      expectedMonthlyBudget: 40,
      baselineDailyCost: 1.5,
      keyLabel: "sk-…b18e",
      keyStatus: "warning",
    },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<AIService | undefined>();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [detailService, setDetailService] = useState<AIService | null>(null);
  const [logCostService, setLogCostService] = useState<AIService | null>(null);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const {
    entries,
    addOrUpdateEntry,
    getEntriesForService,
    getLatestAnomalyForService,
    getBaselineForService,
  } = useCostHistory();

  const anomalyMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getLatestAnomalyForService>>();
    for (const s of services) map.set(s.id, getLatestAnomalyForService(s.id));
    return map;
  }, [services, entries, getLatestAnomalyForService]);

  const alerts = useMemo(
    () => detectAlerts(services).filter((a) => !dismissedAlertIds.has(a.id)),
    [services, dismissedAlertIds]
  );

  const handleAddService = (newService: Omit<AIService, "id">) => {
    if (editingService) {
      setServices((prev) =>
        prev.map((s) =>
          s.id === editingService.id ? { ...newService, id: editingService.id } : s
        )
      );
      toast({ title: "Service updated", description: "Your AI service has been updated." });
      setEditingService(undefined);
    } else {
      const service: AIService = {
        ...newService,
        id: Date.now().toString(),
        keyStatus: "healthy",
      };
      setServices((prev) => [...prev, service]);
      toast({ title: "Service added", description: "Your AI service has been added." });
    }
  };

  const handleEditService = (service: AIService) => {
    setEditingService(service);
    setDialogOpen(true);
  };

  const handleDeleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    toast({ title: "Service deleted", variant: "destructive" });
  };

  const handleRotateKey = (id: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, keyStatus: "healthy" } : s))
    );
    setDismissedAlertIds((prev) => {
      const next = new Set(prev);
      alerts.filter((a) => a.serviceId === id).forEach((a) => next.add(a.id));
      return next;
    });
    toast({ title: "Key rotated", description: "Service marked as healthy." });
  };

  return (
    <div className="min-h-screen bg-background">
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
        <AlertsBanner alerts={alerts} onOpen={() => setAlertsOpen(true)} />

        <StatsOverview services={services} alertCount={alerts.length} />

        <SpendingChart services={services} />

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
              <p className="text-muted-foreground mb-4">
                Start tracking your AI costs by adding your first service.
              </p>
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
                  onOpen={setDetailService}
                  onLogCost={setLogCostService}
                  anomaly={anomalyMap.get(service.id)}
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

      <AlertsDrawer
        open={alertsOpen}
        onOpenChange={setAlertsOpen}
        alerts={alerts}
        services={services}
        onRotateKey={handleRotateKey}
        onDismiss={(id) =>
          setDismissedAlertIds((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
          })
        }
      />

      <ServiceDetailDrawer
        service={detailService}
        open={!!detailService}
        onOpenChange={(open) => !open && setDetailService(null)}
        onRotateKey={handleRotateKey}
        costEntries={detailService ? getEntriesForService(detailService.id) : []}
        onLogCost={setLogCostService}
      />

      <LogCostDialog
        service={logCostService}
        open={!!logCostService}
        onOpenChange={(open) => !open && setLogCostService(null)}
        existingEntry={
          logCostService
            ? getEntriesForService(logCostService.id).find(
                (e) => e.yearMonth === new Date().toISOString().slice(0, 7)
              )
            : undefined
        }
        baseline={logCostService ? getBaselineForService(logCostService.id) : 0}
        onSave={addOrUpdateEntry}
      />
    </div>
  );
};

export default Index;
