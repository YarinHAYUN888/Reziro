import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Button } from '../ui/button';

interface UnsavedChangesConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmLeave: () => void;
}

export function UnsavedChangesConfirmDialog({
  open,
  onOpenChange,
  onConfirmLeave,
}: UnsavedChangesConfirmDialogProps) {
  const handleLeave = () => {
    onConfirmLeave();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="glass-card border-primary/30" dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold text-foreground">
            יציאה ללא שמירה
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            יש שינויים שלא נשמרו. האם לצאת בלי לשמור?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="glass-button border-primary/30 h-12 px-6"
          >
            חזור לעריכה
          </Button>
          <Button
            variant="destructive"
            onClick={handleLeave}
            className="h-12 px-6 hover:bg-destructive/90"
          >
            צא בלי לשמור
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
