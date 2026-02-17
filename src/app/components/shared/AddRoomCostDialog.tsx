import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { GlowButton } from './GlowButton';
import { Loader2 } from 'lucide-react';

interface AddRoomCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { label: string; unitCost: number; defaultQty: number }) => void | Promise<void>;
  isLoading?: boolean;
}

export function AddRoomCostDialog({
  open,
  onOpenChange,
  onSave,
  isLoading = false,
}: AddRoomCostDialogProps) {
  const [label, setLabel] = useState('');
  const [unitCost, setUnitCost] = useState<number>(0);
  const [defaultQty, setDefaultQty] = useState<number>(1);

  useEffect(() => {
    if (open) {
      setLabel('');
      setUnitCost(0);
      setDefaultQty(1);
    }
  }, [open]);

  const handleSave = async () => {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) return;
    if (unitCost < 0 || defaultQty < 0) return;
    if (isNaN(unitCost) || isNaN(defaultQty)) return;

    await onSave({
      label: trimmedLabel,
      unitCost: Number(unitCost),
      defaultQty: Math.max(0, Math.floor(Number(defaultQty))),
    });
    onOpenChange(false);
  };

  const isValid =
    label.trim().length > 0 &&
    !isNaN(unitCost) &&
    unitCost >= 0 &&
    !isNaN(defaultQty) &&
    defaultQty >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-primary/30 shadow-[0_0_40px_rgba(124,255,58,0.2)]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
            הוסף עלות חדר
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            הוסף פריט עלות חדש שיופיע בהזמנות
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-foreground font-semibold">
              שם הפריט <span className="text-primary">*</span>
            </Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="לדוגמה: קפה שחור"
              className="glass-card border-primary/30 h-12"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-semibold">
              מחיר ליחידה (₪) <span className="text-primary">*</span>
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={unitCost}
              onChange={(e) => setUnitCost(Number(e.target.value) || 0)}
              placeholder="0.00"
              className="glass-card border-primary/30 h-12"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-semibold">
              כמות ברירת מחדל <span className="text-primary">*</span>
            </Label>
            <Input
              type="number"
              min="0"
              step="1"
              value={defaultQty}
              onChange={(e) => setDefaultQty(Number(e.target.value) || 0)}
              placeholder="1"
              className="glass-card border-primary/30 h-12"
            />
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="glass-button border-primary/30 h-12 px-6"
          >
            ביטול
          </Button>
          <GlowButton
            onClick={handleSave}
            disabled={!isValid || isLoading}
            className="h-12 px-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin ltr:mr-2 rtl:ml-2" />
                שומר...
              </>
            ) : (
              'שמור'
            )}
          </GlowButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
