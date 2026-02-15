import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { MonthSelector } from '../components/shared/MonthSelector';
import { GlowButton } from '../components/shared/GlowButton';
import { RoomCard } from '../components/rooms/RoomCard';
import { BookingDialog } from '../components/bookings/BookingDialog';
import { RoomDialog } from '../components/rooms/RoomDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { GlassCard } from '../components/shared/GlassCard';
import { CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAppStore } from '../../store/useAppStore';
import { ConfirmDeleteDialog } from '../components/shared/ConfirmDeleteDialog';
import { Home, Trash2 } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

export function Rooms() {
  const { t } = useTranslation();
  const rooms = useAppStore((state) => state.rooms);
  const bookings = useAppStore((state) => state.bookings);
  const selectedMonthKey = useAppStore((state) => state.selectedMonthKey);

  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>();
  const [selectedBookingId, setSelectedBookingId] = useState<string | undefined>();
  const [deleteBookingDialogOpen, setDeleteBookingDialogOpen] = useState(false);
  const [bookingToDeleteId, setBookingToDeleteId] = useState<string | undefined>();

  const deleteBooking = useAppStore((state) => state.deleteBooking);

  const monthBookings = bookings.filter((b) => b.monthKey === selectedMonthKey);

  const handleAddBooking = () => {
    setSelectedRoomId(undefined);
    setSelectedBookingId(undefined);
    setBookingDialogOpen(true);
  };

  const handleAddRoom = () => {
    setRoomDialogOpen(true);
  };

  const bookingsByWeek = {
    1: monthBookings.filter((b) => b.weekOfMonth === 1),
    2: monthBookings.filter((b) => b.weekOfMonth === 2),
    3: monthBookings.filter((b) => b.weekOfMonth === 3),
    4: monthBookings.filter((b) => b.weekOfMonth === 4),
  };

  const handleOpenDeleteBooking = (e: React.MouseEvent, bid: string) => {
    e.stopPropagation();
    setBookingToDeleteId(bid);
    setDeleteBookingDialogOpen(true);
  };

  const handleConfirmDeleteBooking = () => {
    if (bookingToDeleteId) {
      deleteBooking(bookingToDeleteId);
      toast.success('✅ הזמנה נמחקה בהצלחה!');
      setBookingToDeleteId(undefined);
    }
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title={t('rooms.title')}
        description={t('rooms.description')}
        action={
          <div className="flex items-center gap-4">
            <MonthSelector />
            <GlowButton onClick={handleAddBooking}>
              <Plus className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
              {t('rooms.addBooking')}
            </GlowButton>
            <GlowButton onClick={handleAddRoom}>
              <Plus className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
              {t('rooms.addRoom')}
            </GlowButton>
          </div>
        }
      />

      <div className="container mx-auto px-6 py-6">
        {rooms.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <GlassCard className="max-w-md mx-auto">
              <CardContent className="py-12 text-center">
                <Home className="w-16 h-16 text-primary/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-primary mb-2">
                  {t('rooms.noRooms')}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {t('room.createDescription')}
                </p>
                <GlowButton onClick={handleAddRoom}>
                  <Plus className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                  {t('rooms.addRoom')}
                </GlowButton>
              </CardContent>
            </GlassCard>
          </div>
        ) : (
          <Tabs defaultValue="month" className="space-y-6">
            <TabsList className="glass-card border-primary/30">
              <TabsTrigger value="month">{t('rooms.byMonth')}</TabsTrigger>
              <TabsTrigger value="weeks">{t('rooms.byWeeks')}</TabsTrigger>
            </TabsList>

            <TabsContent value="month" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => {
                  // 🔥 Force re-render by creating unique key each time bookings change
                  const roomBookings = bookings.filter((b) => b.roomId === room.id && b.monthKey === selectedMonthKey);
                  const bookingsHash = roomBookings.map(b => `${b.id}-${b.updatedAt}`).join('|');
                  
                  return (
                    <RoomCard
                      key={`${room.id}-${bookingsHash}`}
                      room={room}
                      bookings={bookings}
                      monthKey={selectedMonthKey}
                      onBookingClick={(bookingId) => {
                        setSelectedRoomId(room.id);
                        setSelectedBookingId(bookingId);
                        setBookingDialogOpen(true);
                      }}
                    />
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="weeks" className="space-y-6">
              {[1, 2, 3, 4].map((week) => (
                <GlassCard key={week} className="border-primary/20 ">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-primary tracking-wide">{t('rooms.week')} {week}</CardTitle>
                      <Badge variant="secondary">
                        {bookingsByWeek[week as 1 | 2 | 3 | 4].length} {t('dashboard.bookings')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {bookingsByWeek[week as 1 | 2 | 3 | 4].length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        {t('rooms.noBookingsInWeek')} {week}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {bookingsByWeek[week as 1 | 2 | 3 | 4].map((booking) => {
                          const room = rooms.find((r) => r.id === booking.roomId);
                          return (
                            <div
                              key={booking.id}
                              className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group relative"
                              onClick={() => {
                                setSelectedRoomId(booking.roomId);
                                setSelectedBookingId(booking.id);
                                setBookingDialogOpen(true);
                              }}
                            >
                              <button
                                onClick={(e) => handleOpenDeleteBooking(e, booking.id)}
                                className="absolute top-4 right-4 rtl:right-auto rtl:left-4 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-opacity duration-200"
                                aria-label="מחק הזמנה"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </button>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold">{room?.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {format(parseISO(booking.startDate), 'MMM d')} -{' '}
                                    {format(parseISO(booking.endDate), 'MMM d')} ({booking.nightsCount}{' '}
                                    nights)
                                  </p>
                                  {booking.customer?.customerName && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {booking.customer.customerName}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-primary ">
                                    ₪{booking.metrics.netProfit.toFixed(2)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{t('dashboard.netProfit')}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </GlassCard>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <BookingDialog
        open={bookingDialogOpen}
        onClose={() => {
          setBookingDialogOpen(false);
          setSelectedRoomId(undefined);
          setSelectedBookingId(undefined);
        }}
        roomId={selectedRoomId}
        bookingId={selectedBookingId}
      />
      <RoomDialog
        open={roomDialogOpen}
        onClose={() => {
          setRoomDialogOpen(false);
        }}
      />
      <ConfirmDeleteDialog
        open={deleteBookingDialogOpen}
        onOpenChange={(open) => {
          setDeleteBookingDialogOpen(open);
          if (!open) setBookingToDeleteId(undefined);
        }}
        title="מחיקת הזמנה"
        description="האם אתה בטוח שברצונך למחוק הזמנה זו?"
        onConfirm={handleConfirmDeleteBooking}
      />
    </div>
  );
}