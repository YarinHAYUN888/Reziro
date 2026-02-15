import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import { GlowButton } from '../shared/GlowButton';
import { useAppStore } from '../../../store/useAppStore';
import { toast } from 'sonner';
import { Home } from 'lucide-react';

interface RoomDialogProps {
  open: boolean;
  onClose: () => void;
  roomId?: string;
}

export function RoomDialog({ open, onClose, roomId }: RoomDialogProps) {
  const { t } = useTranslation();
  const rooms = useAppStore((state) => state.rooms);
  const addRoom = useAppStore((state) => state.addRoom);
  const updateRoom = useAppStore((state) => state.updateRoom);

  const existingRoom = roomId ? rooms.find((r) => r.id === roomId) : null;

  const [roomName, setRoomName] = useState(existingRoom?.name || '');
  const [roomNumber, setRoomNumber] = useState(existingRoom?.number || '');

  useEffect(() => {
    if (open) {
      if (existingRoom) {
        setRoomName(existingRoom.name);
        setRoomNumber(existingRoom.number || '');
      } else {
        setRoomName('');
        setRoomNumber('');
      }
    }
  }, [open, existingRoom]);

  const handleSave = () => {
    toast.info('🔥 כפתור נלחץ!');
    
    if (!roomName.trim()) {
      toast.error(t('room.fillRequired') || 'נא למלא שם חדר');
      return;
    }

    if (roomId && existingRoom) {
      toast.info('🔄 מעדכן חדר...');
      updateRoom(roomId, {
        name: roomName.trim(),
        number: roomNumber.trim(),
      });
      toast.success('✅ חדר עודכן בהצלחה!');
    } else {
      toast.info('🔄 יוצר חדר חדש...');
      addRoom({
        name: roomName.trim(),
        number: roomNumber.trim(),
      });
      toast.success('✅ חדר נוצר בהצלחה!');
    }

    setTimeout(() => {
      onClose();
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card border-primary/30 max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full glass-card border-primary/40 flex items-center justify-center">
              <Home className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-green-400 bg-clip-text text-transparent text-center">
            {roomId ? t('room.edit') : t('room.create')}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {roomId ? t('room.editDescription') : t('room.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label className="text-foreground">
              {t('room.name')} {t('common.required')}
            </Label>
            <Input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder={t('room.namePlaceholder')}
              className="glass-card border-primary/30 text-base h-11"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">{t('room.number')}</Label>
            <Input
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder={t('room.numberPlaceholder')}
              className="glass-card border-primary/30 text-base h-11"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="glass-button border-primary/30 flex-1"
          >
            {t('room.cancel')}
          </Button>
          <GlowButton
            onClick={handleSave}
            disabled={!roomName.trim()}
            className="flex-1"
          >
            {roomId ? t('room.update') : t('room.createBtn')}
          </GlowButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}