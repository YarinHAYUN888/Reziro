import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
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
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { useAppStore } from '../../../store/useAppStore';
import { calcNightsCount, calcIncome, calcSelectedCostTotal, createSelectedCostFromCatalog } from '../../../utils/calcEngine';
import type { SelectedCost, Booking, Partner, PartnerReferral } from '../../../types/models';
import { ConfirmDeleteDialog } from '../shared/ConfirmDeleteDialog';
import { BookingConflictDialog } from '../shared/BookingConflictDialog';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon, AlertCircle, Edit2, ArrowRight, Users, Trash2, Plus } from 'lucide-react';
import { cn } from '../ui/utils';
import { toast } from 'sonner';

interface BookingDialogProps {
  open: boolean;
  onClose: () => void;
  roomId?: string;
  bookingId?: string;
}

export function BookingDialog({ open, onClose, roomId: initialRoomId, bookingId }: BookingDialogProps) {
  const { t } = useTranslation();
  const rooms = useAppStore((state) => state.rooms);
  const costCatalog = useAppStore((state) => state.costCatalog);
  const partners = useAppStore((state) => state.partners);
  const bookings = useAppStore((state) => state.bookings);
  const createBooking = useAppStore((state) => state.createBooking);
  const updateBooking = useAppStore((state) => state.updateBooking);
  const deleteBooking = useAppStore((state) => state.deleteBooking);
  const isMonthLocked = useAppStore((state) => state.isMonthLocked);

  const existingBooking = bookingId ? bookings.find((b) => b.id === bookingId) : null;

  const [roomId, setRoomId] = useState(initialRoomId || existingBooking?.roomId || '');
  const [startDate, setStartDate] = useState<Date | undefined>(
    existingBooking ? new Date(existingBooking.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    existingBooking ? new Date(existingBooking.endDate) : undefined
  );
  const [pricePerNight, setPricePerNight] = useState(existingBooking?.pricePerNight || 100);
  const [extraExpenses, setExtraExpenses] = useState(existingBooking?.extraExpenses || 0);
  const [customerName, setCustomerName] = useState(existingBooking?.customer?.customerName || '');
  const [customerEmail, setCustomerEmail] = useState(existingBooking?.customer?.customerEmail || '');
  const [customerPhone, setCustomerPhone] = useState(existingBooking?.customer?.customerPhone || '');
  
  const [selectedRoomCosts, setSelectedRoomCosts] = useState<SelectedCost[]>(
    existingBooking?.selectedRoomCosts || []
  );

  const [partnerReferrals, setPartnerReferrals] = useState<PartnerReferral[]>(
    existingBooking?.partnerReferrals || []
  );
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [referralGuests, setReferralGuests] = useState(1);

  const [currentBookingId, setCurrentBookingId] = useState(bookingId);
  const [viewMode, setViewMode] = useState<'list' | 'form'>(bookingId ? 'form' : 'list');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDeleteId, setBookingToDeleteId] = useState<string | null>(null);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);

  const roomCosts = costCatalog.filter((c) => c.type === 'room' && c.isActive);
  const activePartners = partners.filter((p) => p.isActive);

  const roomBookings = roomId ? bookings.filter((b) => b.roomId === roomId) : [];

  useEffect(() => {
    if (open) {
      const booking = currentBookingId ? bookings.find((b) => b.id === currentBookingId) : null;
      
      if (booking) {
        setRoomId(booking.roomId);
        setStartDate(new Date(booking.startDate));
        setEndDate(new Date(booking.endDate));
        setPricePerNight(booking.pricePerNight);
        setExtraExpenses(booking.extraExpenses);
        setCustomerName(booking.customer?.customerName || '');
        setCustomerEmail(booking.customer?.customerEmail || '');
        setCustomerPhone(booking.customer?.customerPhone || '');
        setSelectedRoomCosts(booking.selectedRoomCosts || []);
        setPartnerReferrals(booking.partnerReferrals || []);
        setViewMode('form');
      } else {
        setRoomId(initialRoomId || '');
        setStartDate(undefined);
        setEndDate(undefined);
        setPricePerNight(100);
        setExtraExpenses(0);
        setCustomerName('');
        setCustomerEmail('');
        setCustomerPhone('');
        setSelectedRoomCosts([]);
        setPartnerReferrals([]);
        setSelectedPartnerId('');
        setReferralGuests(1);
        setCurrentBookingId(undefined);
        setViewMode(initialRoomId && !bookingId ? 'list' : 'form');
      }
    }
  }, [open, currentBookingId, initialRoomId, bookings]);

  const nights = startDate && endDate ? calcNightsCount(format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')) : 0;
  const income = calcIncome(nights, pricePerNight);
  const totalRoomCosts = selectedRoomCosts.reduce((sum, c) => sum + c.total, 0);
  const totalPartnerRevenue = partnerReferrals.reduce((sum, r) => sum + r.commissionEarned, 0);
  const grossProfit = income - totalRoomCosts;
  const netProfit = grossProfit - extraExpenses + totalPartnerRevenue;

  const monthKey = startDate ? format(startDate, 'yyyy-MM') : '';
  const locked = monthKey ? isMonthLocked(monthKey) : false;

  const hasDateConflict = () => {
    if (!roomId || !startDate || !endDate) return false;
    const selectedStart = startDate.getTime();
    const selectedEnd = endDate.getTime();
    const roomBookings = bookings.filter((b) => 
      b.roomId === roomId && (!currentBookingId || b.id !== currentBookingId)
    );
    return roomBookings.some((booking) => {
      const bookingStart = new Date(booking.startDate).getTime();
      const bookingEnd = new Date(booking.endDate).getTime();
      return selectedStart < bookingEnd && selectedEnd > bookingStart;
    });
  };

  const [dateConflict, setDateConflict] = useState(false);

  useEffect(() => {
    setDateConflict(hasDateConflict());
  }, [roomId, startDate, endDate, bookings]);

  const handleToggleRoomCost = (catalogId: string, checked: boolean) => {
    if (checked) {
      const catalogItem = roomCosts.find((c) => c.id === catalogId);
      if (catalogItem) {
        setSelectedRoomCosts([...selectedRoomCosts, createSelectedCostFromCatalog(catalogItem)]);
      }
    } else {
      setSelectedRoomCosts(selectedRoomCosts.filter((c) => c.catalogId !== catalogId));
    }
  };

  const handleUpdateCostQty = (catalogId: string, qty: number) => {
    const updateCost = (cost: SelectedCost) => {
      if (cost.catalogId === catalogId) {
        return {
          ...cost,
          qty,
          total: calcSelectedCostTotal(cost.unitCostSnapshot, qty),
        };
      }
      return cost;
    };

    setSelectedRoomCosts(selectedRoomCosts.map(updateCost));
  };

  const handleAddPartnerReferral = () => {
    if (!selectedPartnerId || referralGuests <= 0) {
      toast.error('נא לבחור שותף וכמות אורחים');
      return;
    }

    const partner = partners.find((p) => p.id === selectedPartnerId);
    if (!partner) return;

    let commissionEarned = 0;
    if (partner.commissionType === 'fixed') {
      commissionEarned = partner.commissionValue * referralGuests;
    } else {
      commissionEarned = income * (partner.commissionValue / 100);
    }

    const newReferral: PartnerReferral = {
      partnerId: partner.id,
      partnerName: partner.name,
      guestsCount: referralGuests,
      commissionEarned,
      date: startDate ? format(startDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    };

    setPartnerReferrals([...partnerReferrals, newReferral]);
    setSelectedPartnerId('');
    setReferralGuests(1);
    toast.success('✅ הפניה נוספה!');
  };

  const handleRemovePartnerReferral = (index: number) => {
    setPartnerReferrals(partnerReferrals.filter((_, i) => i !== index));
    toast.success('✅ הפניה הוסרה!');
  };

  const handleEditBooking = (booking: Booking) => {
    setCurrentBookingId(booking.id);
    setViewMode('form');
  };

  const handleBackToList = () => {
    setCurrentBookingId(undefined);
    setViewMode('list');
    setStartDate(undefined);
    setEndDate(undefined);
    setPricePerNight(100);
    setExtraExpenses(0);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setSelectedRoomCosts([]);
    setPartnerReferrals([]);
    setSelectedPartnerId('');
    setReferralGuests(1);
  };

  const handleCreateNew = () => {
    setCurrentBookingId(undefined);
    setViewMode('form');
    setStartDate(undefined);
    setEndDate(undefined);
    setPricePerNight(100);
    setExtraExpenses(0);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setSelectedRoomCosts([]);
    setPartnerReferrals([]);
    setSelectedPartnerId('');
    setReferralGuests(1);
  };

  const handleSave = () => {
    if (!roomId || !startDate || !endDate) {
      toast.error(t('booking.fillRequired') || 'אנא מלא את כל השדות הנדרשים');
      return;
    }

    if (hasDateConflict()) {
      toast.error(t('rooms.dateConflict') || 'קיימת התנגשות בתאריכים', {
        duration: 5000,
        className: 'glass-card border-destructive/40 bg-destructive/10',
      });
      return;
    }

    if (!currentBookingId && locked) {
      toast.error(t('booking.monthLocked') || 'החודש נעול לעריכה');
      return;
    }

    const bookingData = {
      roomId,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      pricePerNight,
      extraExpenses,
      selectedRoomCosts,
      selectedHotelCosts: [],
      partnerReferrals,
      customer: customerName || customerEmail || customerPhone
        ? { customerName, customerEmail, customerPhone }
        : undefined,
    };

    if (currentBookingId) {
      const existingBooking = bookings.find((b) => b.id === currentBookingId);
      const ok = updateBooking(currentBookingId, {
        ...bookingData,
        createdAt: existingBooking?.createdAt,
      });
      if (!ok) {
        setConflictDialogOpen(true);
        return;
      }
      toast.success('✅ עודכן בהצלחה!', {
        duration: 2000,
        className: 'glass-card border-primary/40 bg-primary/10',
      });
      onClose();
    } else {
      const ok = createBooking(bookingData);
      if (!ok) {
        setConflictDialogOpen(true);
        return;
      }
      toast.success('✅ הזמנה נוצרה בהצלחה!', {
        duration: 2000,
        className: 'glass-card border-primary/40 bg-primary/10',
      });
      onClose();
    }
  };

  const getStatusColor = (booking: Booking) => {
    const now = new Date();
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);

    if (now < start) return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
    if (now >= start && now <= end) return 'text-primary bg-primary/10 border-primary/30';
    return 'text-muted-foreground bg-muted/10 border-muted/30';
  };

  const getStatusText = (booking: Booking) => {
    const now = new Date();
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);

    if (now < start) return 'מאושר';
    if (now >= start && now <= end) return 'פעיל';
    return 'הושלם';
  };

  const handleOpenDeleteDialog = (e: React.MouseEvent, bid: string) => {
    e.stopPropagation();
    setBookingToDeleteId(bid);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDeleteBooking = () => {
    if (bookingToDeleteId) {
      deleteBooking(bookingToDeleteId);
      toast.success('✅ הזמנה נמחקה בהצלחה!');
      setBookingToDeleteId(null);
      if (currentBookingId === bookingToDeleteId) {
        setCurrentBookingId(undefined);
        setViewMode('list');
      }
      if (roomBookings.length <= 1) {
        onClose();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card border-primary/30 shadow-[0_0_40px_rgba(124,255,58,0.2)] w-[95vw] sm:w-[90vw] max-w-7xl h-[95vh] overflow-y-auto p-4 sm:p-6 md:p-8">
        <DialogHeader className="text-center mb-6">
          <DialogTitle className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary drop-shadow-[0_0_15px_rgba(124,255,58,0.6)]">
            {viewMode === 'list' ? 'רשימת הזמנות' : currentBookingId ? t('booking.edit') : t('booking.create')}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-base sm:text-lg md:text-xl mt-3">
            {viewMode === 'list' 
              ? `${roomBookings.length} הזמנות לחדר ${rooms.find(r => r.id === roomId)?.name || ''}`
              : currentBookingId ? t('booking.editDescription') : t('booking.createDescription')
            }
          </DialogDescription>
        </DialogHeader>

        {viewMode === 'list' ? (
          <div className="space-y-6">
            <div className="flex justify-end gap-3">
              <GlowButton
                onClick={handleCreateNew}
                className="h-12 px-6 shadow-[0_0_20px_rgba(124,255,58,0.3)] hover:shadow-[0_0_30px_rgba(124,255,58,0.5)]"
              >
                הזמנה חדשה +
              </GlowButton>
            </div>

            {roomBookings.length === 0 ? (
              <div className="glass-card border-primary/20 p-12 text-center">
                <p className="text-xl text-muted-foreground">אין הזמנות לחדר זה</p>
                <p className="text-sm text-muted-foreground mt-2">לחץ על "הזמנה חדשה" ליצירת הזמנה ראשונה</p>
              </div>
            ) : (
              <div className="space-y-3">
                {roomBookings.map((booking) => (
                  <div
                    key={booking.id}
                    onClick={() => handleEditBooking(booking)}
                    className="glass-card border-primary/20 p-4 rounded-xl hover:border-primary/50 hover:shadow-[0_0_25px_rgba(124,255,58,0.2)] transition-all cursor-pointer group relative"
                  >
                    <button
                      onClick={(e) => handleOpenDeleteDialog(e, booking.id)}
                      className="absolute top-4 left-4 rtl:left-auto rtl:right-4 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-opacity duration-200"
                      aria-label="מחק הזמנה"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="text-xl font-bold text-primary group-hover:underline cursor-pointer flex items-center gap-2">
                            {booking.customer?.customerName || 'אורח'}
                            <Edit2 className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </h4>
                          <span className={cn(
                            'text-xs px-3 py-1 rounded-full font-bold border',
                            getStatusColor(booking)
                          )}>
                            {getStatusText(booking)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{format(new Date(booking.startDate), 'dd/MM/yyyy')}</span>
                          <ArrowRight className="w-4 h-4" />
                          <span>{format(new Date(booking.endDate), 'dd/MM/yyyy')}</span>
                          <span className="text-xs">({calcNightsCount(booking.startDate, booking.endDate)} לילות)</span>
                        </div>

                        {(booking.customer?.customerPhone || booking.customer?.customerEmail) && (
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {booking.customer?.customerPhone && <span>📞 {booking.customer.customerPhone}</span>}
                            {booking.customer?.customerEmail && <span>📧 {booking.customer.customerEmail}</span>}
                          </div>
                        )}
                      </div>

                      <div className="text-left space-y-1">
                        <p className="text-2xl font-bold text-primary">₪{booking.income.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">רווח נקי: ₪{booking.metrics.netProfit.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {roomId && roomBookings.length > 0 && (
              <Button
                variant="ghost"
                onClick={handleBackToList}
                className="text-primary hover:text-primary/80 hover:bg-primary/10"
              >
                ← חזרה לרשימה
              </Button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label className="text-foreground text-sm sm:text-base font-semibold">
                  {t('booking.room')} <span className="text-primary">*</span>
                </Label>
                <Select value={roomId} onValueChange={setRoomId}>
                  <SelectTrigger className="glass-card border-primary/30 hover:border-primary/50 transition-all h-11 sm:h-12 md:h-14 text-base sm:text-lg">
                    <SelectValue placeholder={t('booking.selectRoom')} />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-primary/30">
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name} {room.number ? `(#${room.number})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground text-sm sm:text-base font-semibold">
                  {t('booking.startDate')} <span className="text-primary">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'glass-card border-primary/30 hover:border-primary/50 transition-all w-full h-11 sm:h-12 md:h-14 justify-start text-left font-normal hover:bg-primary/10 text-sm sm:text-base md:text-lg px-3',
                        !startDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="ltr:mr-2 rtl:ml-2 h-4 w-4 text-primary flex-shrink-0" />
                      <span className="truncate">
                        {startDate ? format(startDate, 'PPP') : t('booking.pickDate')}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 glass-card border-primary/30">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground text-sm sm:text-base font-semibold">
                  {t('booking.endDate')} <span className="text-primary">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'glass-card border-primary/30 hover:border-primary/50 transition-all w-full h-11 sm:h-12 md:h-14 justify-start text-left font-normal hover:bg-primary/10 text-sm sm:text-base md:text-lg px-3',
                        !endDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="ltr:mr-2 rtl:ml-2 h-4 w-4 text-primary flex-shrink-0" />
                      <span className="truncate">
                        {endDate ? format(endDate, 'PPP') : t('booking.pickDate')}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 glass-card border-primary/30">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground text-sm sm:text-base font-semibold">
                  {t('booking.pricePerNight')} <span className="text-primary">*</span>
                </Label>
                <Input
                  type="number"
                  value={pricePerNight}
                  onChange={(e) => setPricePerNight(Number(e.target.value))}
                  className="glass-card border-primary/30 hover:border-primary/50 transition-all h-11 sm:h-12 md:h-14 text-base sm:text-lg"
                />
              </div>
            </div>

            {dateConflict && roomId && startDate && endDate && (
              <div className="glass-card border-destructive/40 bg-destructive/10 p-3 sm:p-4 rounded-xl flex items-start gap-3 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-pulse">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-destructive mb-1">{t('rooms.dateConflictTitle')}</p>
                  <p className="text-xs text-destructive/90">{t('rooms.dateConflict')}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h4 className="font-bold text-foreground text-lg sm:text-xl">{t('booking.customerInfo')}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-sm sm:text-base">{t('booking.name')}</Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="glass-card border-primary/30 hover:border-primary/50 transition-all h-11 sm:h-12 md:h-14 text-base sm:text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-sm sm:text-base">{t('booking.email')}</Label>
                  <Input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="glass-card border-primary/30 hover:border-primary/50 transition-all h-11 sm:h-12 md:h-14 text-base sm:text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-sm sm:text-base">{t('booking.phone')}</Label>
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="glass-card border-primary/30 hover:border-primary/50 transition-all h-11 sm:h-12 md:h-14 text-base sm:text-lg"
                  />
                </div>
              </div>
            </div>

            <Separator className="bg-primary/30" />

            <div className="space-y-4">
              <h4 className="font-bold text-foreground text-xl sm:text-2xl text-primary drop-shadow-[0_0_8px_rgba(124,255,58,0.5)]">
                {t('booking.roomCosts')}
              </h4>
              {roomCosts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">אין עלויות חדר זמינות</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {roomCosts.map((cost) => {
                    const selected = selectedRoomCosts.find((c) => c.catalogId === cost.id);
                    return (
                      <div
                        key={cost.id}
                        className="glass-card border-primary/20 p-3 rounded-lg hover:border-primary/40 transition-all duration-200 hover:shadow-[0_0_15px_rgba(124,255,58,0.15)]"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Checkbox
                            checked={!!selected}
                            onCheckedChange={(checked) =>
                              handleToggleRoomCost(cost.id, checked as boolean)
                            }
                            className="border-primary data-[state=checked]:bg-primary data-[state=checked]:shadow-[0_0_8px_rgba(124,255,58,0.5)] w-4 h-4 flex-shrink-0"
                          />
                          <p className="text-xs text-muted-foreground font-medium">
                            ₪{cost.unitCost.toFixed(2)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-foreground leading-tight mb-3">
                          {cost.label}
                        </p>
                        {selected && (
                          <Input
                            type="number"
                            className="w-full h-8 text-xs glass-card border-primary/30 hover:border-primary/50 transition-all"
                            value={selected.qty}
                            onChange={(e) =>
                              handleUpdateCostQty(cost.id, Number(e.target.value))
                            }
                            min={0}
                            placeholder="כמות"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator className="bg-primary/30" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-foreground text-xl sm:text-2xl text-primary drop-shadow-[0_0_8px_rgba(124,255,58,0.5)]">
                  הפניות לשותפים עסקיים
                </h4>
                <Users className="w-6 h-6 text-primary" />
              </div>

              {activePartners.length === 0 ? (
                <div className="glass-card border-primary/20 p-6 rounded-xl text-center">
                  <p className="text-sm text-muted-foreground">אין שותפים עסקיים פעילים</p>
                  <p className="text-xs text-muted-foreground mt-1">הוסף שותפים בעמוד "שותפים"</p>
                </div>
              ) : (
                <>
                  <div className="glass-card border-primary/20 p-4 rounded-xl bg-primary/5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">בחר שותף</Label>
                        <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                          <SelectTrigger className="glass-card border-primary/30 h-10">
                            <SelectValue placeholder="בחר שותף" />
                          </SelectTrigger>
                          <SelectContent className="glass-card border-primary/30">
                            {activePartners.map((partner) => (
                              <SelectItem key={partner.id} value={partner.id}>
                                {partner.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">כמות אורחים</Label>
                        <Input
                          type="number"
                          value={referralGuests}
                          onChange={(e) => setReferralGuests(Number(e.target.value))}
                          min={1}
                          className="glass-card border-primary/30 h-10"
                        />
                      </div>

                      <div className="flex items-end">
                        <GlowButton
                          onClick={handleAddPartnerReferral}
                          className="h-10 w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          הוסף הפניה
                        </GlowButton>
                      </div>
                    </div>
                  </div>

                  {partnerReferrals.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-muted-foreground">הפניות שנבחרו:</p>
                      {partnerReferrals.map((referral, index) => (
                        <div
                          key={index}
                          className="glass-card border-primary/20 p-3 rounded-lg flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-foreground">{referral.partnerName}</p>
                            <p className="text-xs text-muted-foreground">{referral.guestsCount} אורחים</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-base font-bold text-primary">+₪{referral.commissionEarned.toFixed(2)}</span>
                            <button
                              onClick={() => handleRemovePartnerReferral(index)}
                              className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <Separator className="bg-primary/30" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-card border-primary/30 p-5 rounded-2xl text-center space-y-2">
                <p className="text-muted-foreground text-sm">{t('booking.nights')}</p>
                <p className="text-3xl font-bold text-foreground">{nights}</p>
              </div>

              <div className="glass-card border-primary/30 p-5 rounded-2xl text-center space-y-2">
                <p className="text-muted-foreground text-sm">{t('booking.income')}</p>
                <p className="text-3xl font-bold text-primary" dir="ltr">₪{income.toFixed(2)}</p>
              </div>

              <div className="glass-card border-primary/30 p-5 rounded-2xl text-center space-y-2">
                <p className="text-muted-foreground text-sm">{t('booking.roomCosts')}</p>
                <p className="text-xl font-semibold text-destructive" dir="ltr">-₪{totalRoomCosts.toFixed(2)}</p>
              </div>

              <div className="glass-card border-primary/30 p-5 rounded-2xl text-center space-y-2">
                <p className="text-muted-foreground text-sm">הכנסות משותפים</p>
                <p className="text-xl font-semibold text-primary" dir="ltr">+₪{totalPartnerRevenue.toFixed(2)}</p>
              </div>

              <div className="glass-card border-primary/30 p-5 rounded-2xl text-center space-y-3">
                <p className="text-muted-foreground text-sm">{t('booking.extraExpenses')}</p>
                <Input
                  type="number"
                  value={extraExpenses}
                  onChange={(e) => setExtraExpenses(Number(e.target.value))}
                  className="glass-card border-primary/30 text-center"
                  placeholder="0"
                />
              </div>

              <div className="glass-card border-primary/50 p-6 rounded-2xl text-center space-y-2 bg-gradient-to-br from-primary/10 to-transparent shadow-[0_0_25px_rgba(124,255,58,0.25)] sm:col-span-2 lg:col-span-3">
                <p className="text-muted-foreground text-sm">{t('booking.netProfit')}</p>
                <p className="text-4xl font-bold text-primary" dir="ltr">₪{netProfit.toFixed(2)}</p>
              </div>
            </div>

            <DialogFooter className="gap-3 sm:gap-4 pt-6 border-t border-primary/20 flex-col sm:flex-row">
              <Button
                variant="outline"
                onClick={onClose}
                className="glass-button border-primary/30 hover:border-primary/50 transition-all h-11 sm:h-12 md:h-14 px-6 sm:px-8 md:px-10 w-full sm:w-auto text-base sm:text-lg"
              >
                {t('booking.cancel')}
              </Button>
              <GlowButton
                onClick={handleSave}
                disabled={!roomId || !startDate || !endDate}
                className="h-11 sm:h-12 md:h-14 px-6 sm:px-8 md:px-10 w-full sm:w-auto shadow-[0_0_20px_rgba(124,255,58,0.3)] hover:shadow-[0_0_30px_rgba(124,255,58,0.5)] transition-all text-base sm:text-lg"
              >
                {currentBookingId ? t('booking.update') : t('booking.createBtn')}
              </GlowButton>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setBookingToDeleteId(null);
        }}
        title="מחיקת הזמנה"
        description="האם אתה בטוח שברצונך למחוק הזמנה זו?"
        onConfirm={handleConfirmDeleteBooking}
      />
      <BookingConflictDialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen} />
    </Dialog>
  );
}