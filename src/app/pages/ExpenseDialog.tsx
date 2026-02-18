import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { GlowButton } from '../components/shared/GlowButton';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAppStore } from '../../store/useAppStore';
import { createSelectedCostFromCatalog, calcSelectedCostTotal } from '../../utils/calcEngine';
import type { SelectedCost } from '../../types/models';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { UnsavedChangesConfirmDialog } from '../components/shared/UnsavedChangesConfirmDialog';
import { CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ExpenseDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ExpenseDialog({ open, onClose }: ExpenseDialogProps) {
  const rooms = useAppStore((state) => state.rooms);
  const bookings = useAppStore((state) => state.bookings);
  const costCatalog = useAppStore((state) => state.costCatalog);
  const addExpense = useAppStore((state) => state.addExpense);

  const [expenseType, setExpenseType] = useState<'booking' | 'room' | 'hotel' | 'custom'>('hotel');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState<Date>(new Date());
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState('');
  
  const [selectedRoomCosts, setSelectedRoomCosts] = useState<SelectedCost[]>([]);
  const [selectedHotelCosts, setSelectedHotelCosts] = useState<SelectedCost[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const roomCosts = costCatalog.filter((c) => c.type === 'room' && c.isActive);
  const hotelCosts = costCatalog.filter((c) => c.type === 'hotel' && c.isActive);

  const roomBookings = selectedRoomId 
    ? bookings.filter((b) => b.roomId === selectedRoomId)
    : [];

  useEffect(() => {
    if (open) {
      setExpenseType('hotel');
      setDescription('');
      setAmount(0);
      setDate(new Date());
      setSelectedRoomId('');
      setSelectedBookingId('');
      setSelectedRoomCosts([]);
      setSelectedHotelCosts([]);
      setIsDirty(false);
      setShowConfirm(false);
    }
  }, [open]);

  const handleClose = () => {
    if (isDirty) {
      setShowConfirm(true);
    } else {
      onClose();
    }
  };

  const handleToggleRoomCost = (catalogId: string, checked: boolean) => {
    setIsDirty(true);
    if (checked) {
      const catalogItem = roomCosts.find((c) => c.id === catalogId);
      if (catalogItem) {
        setSelectedRoomCosts([...selectedRoomCosts, createSelectedCostFromCatalog(catalogItem)]);
      }
    } else {
      setSelectedRoomCosts(selectedRoomCosts.filter((c) => c.catalogId !== catalogId));
    }
  };

  const handleToggleHotelCost = (catalogId: string, checked: boolean) => {
    setIsDirty(true);
    if (checked) {
      const catalogItem = hotelCosts.find((c) => c.id === catalogId);
      if (catalogItem) {
        setSelectedHotelCosts([...selectedHotelCosts, createSelectedCostFromCatalog(catalogItem)]);
      }
    } else {
      setSelectedHotelCosts(selectedHotelCosts.filter((c) => c.catalogId !== catalogId));
    }
  };

  const handleUpdateCostQty = (catalogId: string, type: 'room' | 'hotel', qty: number) => {
    setIsDirty(true);
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

    if (type === 'room') {
      setSelectedRoomCosts(selectedRoomCosts.map(updateCost));
    } else {
      setSelectedHotelCosts(selectedHotelCosts.map(updateCost));
    }
  };

  const totalFromCosts = 
    selectedRoomCosts.reduce((sum, c) => sum + c.total, 0) +
    selectedHotelCosts.reduce((sum, c) => sum + c.total, 0);

  const finalAmount = amount + totalFromCosts;

  const handleSave = () => {
    if (expenseType === 'custom' && !description.trim()) {
      toast.error('נא למלא תיאור להוצאה');
      return;
    }

    if (finalAmount <= 0) {
      toast.error('נא למלא סכום או לבחור עלויות');
      return;
    }

    if (expenseType === 'booking' && !selectedBookingId) {
      toast.error('נא לבחור הזמנה');
      return;
    }

    if (expenseType === 'room' && !selectedRoomId) {
      toast.error('נא לבחור חדר');
      return;
    }

    const expenseDescription = 
      expenseType === 'custom' 
        ? description
        : expenseType === 'booking'
        ? `הוצאה להזמנה`
        : expenseType === 'room'
        ? `הוצאה לחדר ${rooms.find((r) => r.id === selectedRoomId)?.name || ''}`
        : 'הוצאה כללית למלון';

    addExpense({
      type: expenseType,
      description: expenseDescription,
      amount: finalAmount,
      date: format(date, 'yyyy-MM-dd'),
      roomId: expenseType === 'room' || expenseType === 'booking' ? selectedRoomId : undefined,
      bookingId: expenseType === 'booking' ? selectedBookingId : undefined,
      selectedRoomCosts,
      selectedHotelCosts,
    });

    toast.success('✅ הוצאה נוספה בהצלחה!', {
      duration: 2000,
      className: 'glass-card border-primary/40 bg-primary/10',
    });

    setIsDirty(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) handleClose(); }}>
      <DialogContent
        className="glass-card border-primary/30  w-[95vw] sm:w-[90vw] max-w-6xl max-h-[95vh] overflow-y-auto p-4 sm:p-6 md:p-8"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center mb-6">
          <DialogTitle className="text-3xl sm:text-4xl font-bold text-primary ">
            הוסף הוצאה
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-base mt-3">
            הוסף הוצאה חדשה למערכת
          </DialogDescription>
        </DialogHeader>

        <Tabs value={expenseType} onValueChange={(v) => { setExpenseType(v as any); setIsDirty(true); }} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 h-12 glass-card border-2 border-primary/30 p-1">
            <TabsTrigger 
              value="hotel" 
              className="text-sm font-bold data-[state=active]:bg-primary/25 data-[state=active]:text-primary"
            >
              הוצאה כללית
            </TabsTrigger>
            <TabsTrigger 
              value="room" 
              className="text-sm font-bold data-[state=active]:bg-primary/25 data-[state=active]:text-primary"
            >
              לפי חדר
            </TabsTrigger>
            <TabsTrigger 
              value="booking" 
              className="text-sm font-bold data-[state=active]:bg-primary/25 data-[state=active]:text-primary"
            >
              לפי הזמנה
            </TabsTrigger>
            <TabsTrigger 
              value="custom" 
              className="text-sm font-bold data-[state=active]:bg-primary/25 data-[state=active]:text-primary"
            >
              מותאם אישית
            </TabsTrigger>
          </TabsList>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-foreground font-semibold">
                  תאריך <span className="text-primary">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="glass-card border-primary/30 w-full h-12 justify-start"
                    >
                      <CalendarIcon className="ml-2 h-4 w-4 text-primary" />
                      {format(date, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 glass-card border-primary/30">
                    <Calendar mode="single" selected={date} onSelect={(d) => { if (d) { setDate(d); setIsDirty(true); } }} />
                  </PopoverContent>
                </Popover>
              </div>

              {expenseType === 'custom' && (
                <div className="space-y-2">
                  <Label className="text-foreground font-semibold">
                    תיאור <span className="text-primary">*</span>
                  </Label>
                  <Input
                    value={description}
                    onChange={(e) => { setDescription(e.target.value); setIsDirty(true); }}
                    placeholder="תיאור ההוצאה"
                    className="glass-card border-primary/30 h-12"
                  />
                </div>
              )}

              {(expenseType === 'room' || expenseType === 'booking') && (
                <div className="space-y-2">
                  <Label className="text-foreground font-semibold">
                    חדר <span className="text-primary">*</span>
                  </Label>
                  <Select value={selectedRoomId} onValueChange={(v) => { setSelectedRoomId(v); setIsDirty(true); }}>
                    <SelectTrigger className="glass-card border-primary/30 h-12">
                      <SelectValue placeholder="בחר חדר" />
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
              )}

              {expenseType === 'booking' && selectedRoomId && (
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-foreground font-semibold">
                    הזמנה <span className="text-primary">*</span>
                  </Label>
                  <Select value={selectedBookingId} onValueChange={(v) => { setSelectedBookingId(v); setIsDirty(true); }}>
                    <SelectTrigger className="glass-card border-primary/30 h-12">
                      <SelectValue placeholder="בחר הזמנה" />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-primary/30">
                      {roomBookings.map((booking) => (
                        <SelectItem key={booking.id} value={booking.id}>
                          {format(new Date(booking.startDate), 'dd/MM/yyyy')} - {format(new Date(booking.endDate), 'dd/MM/yyyy')}
                          {booking.customer?.customerName && ` (${booking.customer.customerName})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-foreground font-semibold">
                  סכום נוסף (אופציונלי)
                </Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => { setAmount(Number(e.target.value)); setIsDirty(true); }}
                  placeholder="0"
                  className="glass-card border-primary/30 h-12"
                />
              </div>
            </div>

            {(expenseType === 'booking' || expenseType === 'room' || expenseType === 'hotel') && (
              <>
                <Separator className="bg-primary/30" />

                <div className="space-y-4">
                  <h4 className="font-bold text-xl text-primary">עלויות חדר</h4>
                  {roomCosts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">אין עלויות חדר זמינות</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {roomCosts.map((cost) => {
                        const selected = selectedRoomCosts.find((c) => c.catalogId === cost.id);
                        return (
                          <div key={cost.id} className="glass-card border-primary/20 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <Checkbox
                                checked={!!selected}
                                onCheckedChange={(checked) => handleToggleRoomCost(cost.id, checked as boolean)}
                                className="border-primary"
                              />
                              <p className="text-xs text-muted-foreground">₪{cost.unitCost.toFixed(2)}</p>
                            </div>
                            <p className="text-sm font-semibold mb-2">{cost.label}</p>
                            {selected && (
                              <Input
                                type="number"
                                value={selected.qty}
                                onChange={(e) => handleUpdateCostQty(cost.id, 'room', Number(e.target.value))}
                                className="w-full h-8 text-xs"
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
                  <h4 className="font-bold text-xl text-primary">עלויות מלון</h4>
                  {hotelCosts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">אין עלויות מלון זמינות</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {hotelCosts.map((cost) => {
                        const selected = selectedHotelCosts.find((c) => c.catalogId === cost.id);
                        return (
                          <div key={cost.id} className="glass-card border-primary/20 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <Checkbox
                                checked={!!selected}
                                onCheckedChange={(checked) => handleToggleHotelCost(cost.id, checked as boolean)}
                                className="border-primary"
                              />
                              <p className="text-xs text-muted-foreground">₪{cost.unitCost.toFixed(2)}</p>
                            </div>
                            <p className="text-sm font-semibold mb-2">{cost.label}</p>
                            {selected && (
                              <Input
                                type="number"
                                value={selected.qty}
                                onChange={(e) => handleUpdateCostQty(cost.id, 'hotel', Number(e.target.value))}
                                className="w-full h-8 text-xs"
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
              </>
            )}

            <div className="glass-card border-primary/40 p-6 rounded-xl bg-primary/5">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">סה"כ הוצאה:</span>
                <span className="text-3xl font-bold text-primary">₪{finalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Tabs>

        <DialogFooter className="gap-3 pt-6 border-t border-primary/20">
          <Button variant="outline" onClick={handleClose} className="glass-button border-primary/30 h-12 px-8">
            ביטול
          </Button>
          <GlowButton onClick={handleSave} className="h-12 px-8">
            שמור הוצאה
          </GlowButton>
        </DialogFooter>
      </DialogContent>
      <UnsavedChangesConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        onConfirmLeave={() => { setShowConfirm(false); onClose(); }}
      />
    </Dialog>
  );
}