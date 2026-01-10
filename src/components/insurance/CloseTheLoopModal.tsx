import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { InsuranceSettings } from '@/types/insurance';

interface CloseTheLoopModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: InsuranceSettings | null;
  onConfirm: (policyNumber?: string, updates?: Partial<InsuranceSettings>) => Promise<void>;
}

export function CloseTheLoopModal({
  open,
  onOpenChange,
  onConfirm,
}: CloseTheLoopModalProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close the Loop</DialogTitle>
          <DialogDescription>
            Confirm that your insurance broker has processed all equipment changes and your policy is up to date.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="confirmed"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
            />
            <label
              htmlFor="confirmed"
              className="text-sm leading-relaxed cursor-pointer"
            >
              I confirm that my broker has processed all pending equipment changes and my insurance policy reflects my current fleet.
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!confirmed || saving}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {saving ? 'Confirming...' : 'Confirm & Close Loop'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
