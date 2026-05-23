import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AIService } from './AIServiceCard';
import { CostEntry } from '@/lib/types';

interface Props {
  service: AIService | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existingEntry?: CostEntry;
  baseline: number;
  onSave: (entry: Omit<CostEntry, 'id' | 'loggedAt'>) => void;
}

export function LogCostDialog({ service, open, onOpenChange, existingEntry, baseline, onSave }: Props) {
  const currentYearMonth = format(new Date(), 'yyyy-MM');
  const [yearMonth, setYearMonth] = useState(currentYearMonth);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setYearMonth(existingEntry?.yearMonth ?? currentYearMonth);
      setAmount(existingEntry ? String(existingEntry.amount) : '');
      setNote(existingEntry?.note ?? '');
    }
  }, [open, existingEntry]);

  if (!service) return null;

  const amountNum = parseFloat(amount);
  const hasBaseline = baseline > 0;
  const deviationPct =
    hasBaseline && !isNaN(amountNum)
      ? ((amountNum - baseline) / baseline) * 100
      : null;
  const looksAnomaly = deviationPct !== null && deviationPct > 50;

  const handleSave = () => {
    if (!yearMonth || isNaN(amountNum) || amountNum < 0) return;
    onSave({ serviceId: service.id, yearMonth, amount: amountNum, note: note || undefined });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Log Cost — {service.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm text-foreground">Month</Label>
            <Input
              type="month"
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
              className="bg-input border-border"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-foreground">Actual Amount (USD)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-input border-border"
            />
            {deviationPct !== null && hasBaseline && (
              <p
                className={`text-xs flex items-center gap-1 ${
                  looksAnomaly
                    ? 'text-destructive'
                    : deviationPct < 0
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {deviationPct > 0 ? (
                  <TrendingUp className="h-3 w-3 shrink-0" />
                ) : deviationPct < 0 ? (
                  <TrendingDown className="h-3 w-3 shrink-0" />
                ) : (
                  <Minus className="h-3 w-3 shrink-0" />
                )}
                Expected ~${baseline.toFixed(2)} ·{' '}
                {deviationPct > 0 ? '+' : ''}
                {deviationPct.toFixed(0)}%
                {looksAnomaly ? ' — looks anomalous' : ' vs baseline'}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-foreground">
              Note{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Investigating spike, price change..."
              className="bg-input border-border min-h-[70px] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!yearMonth || !amount || isNaN(amountNum) || amountNum < 0}
            className="bg-gradient-primary shadow-glow"
          >
            {existingEntry ? 'Update' : 'Log Cost'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
