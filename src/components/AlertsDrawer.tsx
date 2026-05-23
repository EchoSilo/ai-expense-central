import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, KeyRound, X } from "lucide-react";
import { Alert, getProviderKeyDocsUrl } from "@/lib/mockUsage";
import { AIService } from "./AIServiceCard";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  alerts: Alert[];
  services: AIService[];
  onRotateKey: (serviceId: string) => void;
  onDismiss: (alertId: string) => void;
}

export function AlertsDrawer({
  open,
  onOpenChange,
  alerts,
  services,
  onRotateKey,
  onDismiss,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground">Active alerts</SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Cost anomalies detected on your services.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {alerts.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No active alerts. All services within baseline.
            </p>
          )}
          {alerts.map((a) => {
            const svc = services.find((s) => s.id === a.serviceId);
            return (
              <div
                key={a.id}
                className="border border-destructive/30 bg-destructive/5 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{a.serviceName}</p>
                      <Badge
                        variant="outline"
                        className={
                          a.severity === "critical"
                            ? "border-destructive/40 text-destructive bg-destructive/10"
                            : "border-anthropic/40 text-anthropic bg-anthropic/10"
                        }
                      >
                        {a.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground mt-1">{a.reason}</p>
                    <p className="text-xs text-muted-foreground">{a.detail}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onDismiss(a.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {svc?.keyLabel && (
                  <p className="text-xs text-muted-foreground font-mono">
                    Key: {svc.keyLabel}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      window.open(getProviderKeyDocsUrl(svc?.provider ?? ""), "_blank");
                      onRotateKey(a.serviceId);
                    }}
                  >
                    <KeyRound className="h-4 w-4 mr-1" />
                    Rotate key
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onDismiss(a.id)}>
                    Dismiss
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
