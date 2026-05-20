import { AlertTriangle, ChevronRight } from "lucide-react";
import { Alert } from "@/lib/mockUsage";
import { Button } from "@/components/ui/button";

interface Props {
  alerts: Alert[];
  onOpen: () => void;
}

export function AlertsBanner({ alerts, onOpen }: Props) {
  if (!alerts.length) return null;
  const top = alerts[0];
  return (
    <div className="border border-destructive/40 bg-destructive/10 rounded-lg p-4 flex items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">
            {alerts.length === 1
              ? `Unusual activity on ${top.serviceName}`
              : `${alerts.length} active alerts — top: ${top.serviceName}`}
          </p>
          <p className="text-xs text-muted-foreground">
            {top.reason} · {top.detail}
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={onOpen} className="border-destructive/40">
        Review
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
