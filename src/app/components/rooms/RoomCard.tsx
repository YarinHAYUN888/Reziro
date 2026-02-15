import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, Calendar, DollarSign, Trash2 } from 'lucide-react';
import { GlassCard } from '../shared/GlassCard';
import { CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ConfirmDeleteDialog } from '../shared/ConfirmDeleteDialog';
import { useAppStore } from '../../../store/useAppStore';
import type { Room, Booking } from '../../../types/models';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface RoomCardProps {
  room: Room;
  bookings: Booking[];
  monthKey: string;
  onBookingClick?: (bookingId: string) => void;
}

export function RoomCard({ room, bookings, monthKey, onBookingClick }: RoomCardProps) {
  const { t } = useTranslation();
  const deleteRoom = useAppStore((state) => state.deleteRoom);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const monthBookings = bookings.filter((b) => b.roomId === room.id && b.monthKey === monthKey);
  const totalNights = monthBookings.reduce((sum, b) => sum + b.nightsCount, 0);
  const totalIncome = monthBookings.reduce((sum, b) => sum + b.income, 0);
  const totalNetProfit = monthBookings.reduce((sum, b) => sum + b.metrics.netProfit, 0);

  const nextBooking = monthBookings.length > 0 ? monthBookings[0] : null;

  const handleDeleteRoom = () => {
    deleteRoom(room.id);
    toast.success('✅ חדר נמחק בהצלחה!');
  };

  return (
    <div 
      onClick={() => {
        if (nextBooking && onBookingClick) {
          onBookingClick(nextBooking.id);
        }
      }}
      className="cursor-pointer group relative"
    >
      <GlassCard className="transition-all duration-200 hover:border-primary/40">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteDialogOpen(true);
              }}
              className="absolute top-4 right-4 rtl:right-auto rtl:left-4 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:border-destructive/30 transition-opacity duration-200 z-10"
              aria-label="מחק חדר"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </button>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Home className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{room.name}</CardTitle>
                {room.number && (
                  <p className="text-sm text-muted-foreground">#{room.number}</p>
                )}
              </div>
            </div>
            <Badge variant={monthBookings.length > 0 ? 'default' : 'secondary'}>
              {monthBookings.length} {t('dashboard.bookings')}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('rooms.occupied')}</p>
                <p className="text-sm font-semibold">{totalNights} {t('common.nights')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('dashboard.netProfit')}</p>
                <p className="text-sm font-semibold text-primary ">
                  ₪{totalNetProfit.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {nextBooking && (
            <div className="pt-3 border-t border-primary/20">
              <p className="text-xs text-muted-foreground mb-1">{t('rooms.nextBooking')}:</p>
              <p className="text-sm font-medium">
                {format(parseISO(nextBooking.startDate), 'MMM d')} - {format(parseISO(nextBooking.endDate), 'MMM d')}
              </p>
              {nextBooking.customer?.customerName && (
                <p className="text-xs text-muted-foreground mt-1">
                  {nextBooking.customer.customerName}
                </p>
              )}
            </div>
          )}

          {monthBookings.length === 0 && (
            <div className="pt-3 border-t border-primary/20">
              <p className="text-sm text-muted-foreground italic">{t('rooms.noBookings')}</p>
            </div>
          )}
        </CardContent>
      </GlassCard>
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="מחיקת חדר"
        description="האם אתה בטוח שברצונך למחוק חדר זה? כל ההזמנות הקשורות יימחקו."
        onConfirm={handleDeleteRoom}
      />
    </div>
  );
}