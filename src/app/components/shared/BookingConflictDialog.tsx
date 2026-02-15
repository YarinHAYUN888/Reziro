import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Button } from '../ui/button';

interface BookingConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingConflictDialog({ open, onOpenChange }: BookingConflictDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="glass-card border-primary/30">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold text-foreground">
            הזמנה לא נשמרה
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            החדר תפוס בתאריכים שנבחרו. לא ניתן לשמור הזמנה על טווח זה.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3 sm:gap-3">
          <AlertDialogAction asChild>
            <Button
              onClick={() => onOpenChange(false)}
              className="glass-button border-primary/30 h-12 px-6"
            >
              הבנתי
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
