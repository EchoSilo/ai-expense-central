import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useSyncQuery, SyncResult } from "@/hooks/use-sync";
import { AIService } from "@/components/AIServiceCard";
import { CostEntry } from "@/lib/types";

interface SyncButtonProps {
  service: AIService;
  yearMonth: string;
  onSave: (entry: Omit<CostEntry, "id" | "loggedAt">) => void;
}

export function SyncButton({ service, yearMonth, onSave }: SyncButtonProps) {
  const [enabled, setEnabled] = useState(false);

  const { data, error, isFetching, isSuccess, isError } = useSyncQuery(
    service.provider,
    yearMonth,
    enabled
  );

  useEffect(() => {
    if (!isSuccess && !isError) return;
    setEnabled(false);

    if (isError) {
      const code = (error as any)?.code;
      if (code === "MISSING_API_KEY") {
        toast.error(`Add ${service.provider.toUpperCase()}_API_KEY to .env and restart the server`);
      } else if (code === "API_ERROR") {
        toast.error(`${service.provider} API error — check your key permissions`);
      } else {
        toast.error("Backend not reachable — run npm run dev");
      }
      return;
    }

    const result = data as SyncResult;

    if (!result.supported) {
      toast.info(result.note);
      return;
    }

    if (result.amount > 0) {
      onSave({ serviceId: service.id, yearMonth, amount: result.amount, note: result.note });
      toast.success(`${service.provider} synced: $${result.amount.toFixed(2)}`);
    } else {
      toast.info(result.note);
    }
  }, [isSuccess, isError]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      title={`Sync ${service.provider} costs`}
      onClick={(e) => {
        e.stopPropagation();
        setEnabled(true);
      }}
      disabled={isFetching}
    >
      <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
    </Button>
  );
}
