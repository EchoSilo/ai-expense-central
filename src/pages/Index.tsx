import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Bot, TrendingUp, RefreshCw } from "lucide-react";
import { toProviderKey, isSyncable } from "@/lib/providerKey";
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
import { useDailyHistory } from "@/hooks/use-daily-history";

const SERVICES_STORAGE_KEY = "ai-expense-central-services";
const SERVICES_SEEDED_KEY = "ai-expense-central-seeded";

const DEFAULT_SERVICES: AIService[] = [
  {
    id: "openai",
    name: "OpenAI API",
    provider: "OpenAI",
    amount: 0,
    billingCycle: "monthly",
    category: "usage",
    color: "#10a37f",
    keyLabel: "sk-admin-…vgA",
    keyStatus: "healthy",
  },
  {
    id: "anthropic",
    name: "Anthropic API",
    provider: "Anthropic",
    amount: 0,
    billingCycle: "monthly",
    category: "usage",
    color: "#ff6b35",
    keyLabel: "sk-ant-…AAA",
    keyStatus: "healthy",
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    provider: "ElevenLabs",
    amount: 0,
    billingCycle: "monthly",
    category: "usage",
    color: "#6366f1",
    keyLabel: "sk_…05e",
    keyStatus: "healthy",
  },
  {
    id: "assemblyai",
    name: "AssemblyAI",
    provider: "AssemblyAI",
    amount: 0,
    billingCycle: "monthly",
    category: "usage",
    color: "#f59e0b",
    keyLabel: "6a5b…18d",
    keyStatus: "healthy",
  },
  {
    id: "heygen",
    name: "HeyGen",
    provider: "HeyGen",
    amount: 0,
    billingCycle: "monthly",
    category: "usage",
    color: "#3b82f6",
    keyLabel: "sk_V2_…OTB",
    keyStatus: "healthy",
  },
];

function loadServices(): AIService[] {
  try {
    const seeded = localStorage.getItem(SERVICES_SEEDED_KEY);
    if (!seeded) {
      localStorage.setItem(SERVICES_SEEDED_KEY, "1");
      return DEFAULT_SERVICES;
    }
    const raw = localStorage.getItem(SERVICES_STORAGE_KEY);
    if (!raw) return DEFAULT_SERVICES;
    const parsed = JSON.parse(raw) as AIService[];
    return parsed.map((s) => ({
      ...s,
      nextBilling: s.nextBilling ? new Date(s.nextBilling) : undefined,
    }));
  } catch {
    return DEFAULT_SERVICES;
  }
}

const Index = () => {
  const [services, setServices] = useState<AIService[]>(loadServices);

  useEffect(() => {
    localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(services));
  }, [services]);

  const [syncing, setSyncing] = useState(false);
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

  const { entries: dailyEntries, upsertDailyEntries } = useDailyHistory();

  const anomalyMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getLatestAnomalyForService>>();
    for (const s of services) map.set(s.id, getLatestAnomalyForService(s.id));
    return map;
  }, [services, entries, getLatestAnomalyForService]);

  const alerts = useMemo(
    () => detectAlerts(services, entries).filter((a) => !dismissedAlertIds.has(a.id)),
    [services, entries, dismissedAlertIds]
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

  const currentYearMonth = new Date().toISOString().slice(0, 7);

  const handleSyncAll = async () => {
    setSyncing(true);
    const syncable = services.filter((s) => isSyncable(s.provider));
    if (syncable.length === 0) {
      toast({ title: "No syncable services", description: "Add OpenAI, Anthropic, ElevenLabs, AssemblyAI, or HeyGen services first." });
      setSyncing(false);
      return;
    }
    const results = await Promise.allSettled(
      syncable.map(async (s) => {
        const key = toProviderKey(s.provider);
        const res = await fetch(`/api/sync/${key}?yearMonth=${currentYearMonth}`);
        const json: any = await res.json();
        if (!res.ok) throw { ...json, provider: s.provider };
        return { service: s, result: json };
      })
    );
    let responded = 0;
    for (const r of results) {
      if (r.status === "fulfilled") {
        responded++;
        const { service, result } = r.value;
        if (result.supported && result.amount > 0) {
          addOrUpdateEntry({
            serviceId: service.id,
            yearMonth: currentYearMonth,
            amount: result.amount,
            note: result.note,
          });
          setServices((prev) =>
            prev.map((s) => (s.id === service.id ? { ...s, amount: result.amount } : s))
          );
        }
        if (result.dailyAmounts?.length) {
          upsertDailyEntries(service.id, result.dailyAmounts);
        }
      }
    }
    const failedServices = results
      .map((r, i) => (r.status === "rejected" ? syncable[i].name : null))
      .filter(Boolean) as string[];
    if (responded > 0) toast({ title: `Synced ${responded} service${responded > 1 ? "s" : ""}` });
    if (failedServices.length > 0)
      toast({
        title: `${failedServices.join(", ")} failed to sync`,
        description: "Check .env API keys and restart the server.",
        variant: "destructive",
      });
    if (responded === 0 && failedServices.length === 0)
      toast({ title: "No services responded", description: "Check API key permissions." });
    setSyncing(false);
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

        <StatsOverview services={services} alertCount={alerts.length} entries={entries} />

        <SpendingChart services={services} entries={entries} dailyEntries={dailyEntries} />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Your AI Services</h2>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                {services.length} active services
              </span>
              <Button variant="outline" size="sm" onClick={handleSyncAll} disabled={syncing} className="gap-1">
                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing…" : "Sync All"}
              </Button>
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
                  onSaveEntry={addOrUpdateEntry}
                  yearMonth={currentYearMonth}
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
        dailyEntries={detailService ? dailyEntries.filter((e) => e.serviceId === detailService.id) : []}
        onLogCost={setLogCostService}
      />

      <LogCostDialog
        service={logCostService}
        open={!!logCostService}
        onOpenChange={(open) => !open && setLogCostService(null)}
        existingEntry={
          logCostService
            ? getEntriesForService(logCostService.id).find(
                (e) => e.yearMonth === currentYearMonth
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
