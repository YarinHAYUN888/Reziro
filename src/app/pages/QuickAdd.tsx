import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/layout/PageHeader';
import { GlassCard } from '../components/shared/GlassCard';
import { CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { GlowButton } from '../components/shared/GlowButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAppStore } from '../../store/useAppStore';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Button } from '../components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { cn } from '../components/ui/utils';

export function QuickAdd() {
  const { t } = useTranslation();
  const rooms = useAppStore((state) => state.rooms);
  const addRoom = useAppStore((state) => state.addRoom);
  const createBooking = useAppStore((state) => state.createBooking);
  const addForecast = useAppStore((state) => state.addForecast);

  // Room form
  const [roomName, setRoomName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  // Booking form
  const [bookingRoomId, setBookingRoomId] = useState('');
  const [bookingStartDate, setBookingStartDate] = useState<Date | undefined>();
  const [bookingEndDate, setBookingEndDate] = useState<Date | undefined>();
  const [bookingPrice, setBookingPrice] = useState(100);

  // Forecast form
  const [forecastMonth, setForecastMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [forecastCategory, setForecastCategory] = useState('');
  const [forecastAmount, setForecastAmount] = useState(0);
  const [forecastConfidence, setForecastConfidence] = useState(80);

  const handleCreateRoom = () => {
    if (!roomName) {
      toast.error(t('quickAdd.enterRoomName'));
      return;
    }

    addRoom({ name: roomName, number: roomNumber || undefined });
    toast.success(t('quickAdd.roomCreated'));
    setRoomName('');
    setRoomNumber('');
  };

  const handleCreateBooking = () => {
    if (!bookingRoomId || !bookingStartDate || !bookingEndDate) {
      toast.error(t('quickAdd.fillRequired'));
      return;
    }

    createBooking({
      roomId: bookingRoomId,
      startDate: format(bookingStartDate, 'yyyy-MM-dd'),
      endDate: format(bookingEndDate, 'yyyy-MM-dd'),
      pricePerNight: bookingPrice,
      extraExpenses: 0,
      selectedRoomCosts: [],
      selectedHotelCosts: [],
    });

    toast.success(t('quickAdd.bookingCreated'));
    setBookingRoomId('');
    setBookingStartDate(undefined);
    setBookingEndDate(undefined);
    setBookingPrice(100);
  };

  const handleCreateForecast = () => {
    if (!forecastCategory || forecastAmount <= 0) {
      toast.error(t('quickAdd.fillRequired'));
      return;
    }

    addForecast({
      monthKey: forecastMonth,
      category: forecastCategory,
      expectedAmount: forecastAmount,
      confidence: forecastConfidence,
    });

    toast.success(t('quickAdd.forecastCreated'));
    setForecastCategory('');
    setForecastAmount(0);
    setForecastConfidence(80);
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title={t('quickAdd.title')}
        description={t('quickAdd.description')}
      />

      <div className="container mx-auto px-6 py-6">
        <Tabs defaultValue="room" className="max-w-2xl mx-auto">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="room">{t('quickAdd.room')}</TabsTrigger>
            <TabsTrigger value="booking">{t('quickAdd.booking')}</TabsTrigger>
            <TabsTrigger value="forecast">{t('quickAdd.forecast')}</TabsTrigger>
          </TabsList>

          <TabsContent value="room">
            <GlassCard>
              <CardHeader>
                <CardTitle>{t('quickAdd.createRoom')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{t('quickAdd.roomName')} {t('common.required')}</Label>
                  <Input
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder={t('quickAdd.roomPlaceholder')}
                  />
                </div>
                <div>
                  <Label>{t('quickAdd.roomNumber')}</Label>
                  <Input
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder={t('quickAdd.roomNumberPlaceholder')}
                  />
                </div>
                <GlowButton onClick={handleCreateRoom} className="w-full">
                  {t('quickAdd.createRoomBtn')}
                </GlowButton>
              </CardContent>
            </GlassCard>
          </TabsContent>

          <TabsContent value="booking">
            <GlassCard>
              <CardHeader>
                <CardTitle>{t('quickAdd.createBooking')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{t('quickAdd.selectRoom')} {t('common.required')}</Label>
                  <Select value={bookingRoomId} onValueChange={setBookingRoomId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('quickAdd.selectRoom')} />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.name} {room.number ? `(#${room.number})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('quickAdd.startDate')} {t('common.required')}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !bookingStartDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                          {bookingStartDate ? format(bookingStartDate, 'PPP') : t('quickAdd.pickDate')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 glass-card border-primary/30">
                        <Calendar
                          mode="single"
                          selected={bookingStartDate}
                          onSelect={setBookingStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>{t('quickAdd.endDate')} {t('common.required')}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !bookingEndDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                          {bookingEndDate ? format(bookingEndDate, 'PPP') : t('quickAdd.pickDate')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 glass-card border-primary/30">
                        <Calendar
                          mode="single"
                          selected={bookingEndDate}
                          onSelect={setBookingEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div>
                  <Label>{t('quickAdd.pricePerNight')} {t('common.required')}</Label>
                  <Input
                    type="number"
                    value={bookingPrice}
                    onChange={(e) => setBookingPrice(Number(e.target.value))}
                  />
                </div>

                <GlowButton
                  onClick={handleCreateBooking}
                  className="w-full"
                  disabled={rooms.length === 0}
                >
                  {t('quickAdd.createBookingBtn')}
                </GlowButton>

                {rooms.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    {t('quickAdd.createRoomFirst')}
                  </p>
                )}
              </CardContent>
            </GlassCard>
          </TabsContent>

          <TabsContent value="forecast">
            <GlassCard>
              <CardHeader>
                <CardTitle>{t('quickAdd.createForecast')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{t('quickAdd.month')} {t('common.required')}</Label>
                  <Input
                    type="month"
                    value={forecastMonth}
                    onChange={(e) => setForecastMonth(e.target.value)}
                  />
                </div>

                <div>
                  <Label>{t('quickAdd.category')} {t('common.required')}</Label>
                  <Input
                    value={forecastCategory}
                    onChange={(e) => setForecastCategory(e.target.value)}
                    placeholder={t('quickAdd.categoryPlaceholder')}
                  />
                </div>

                <div>
                  <Label>{t('quickAdd.expectedAmount')} {t('common.required')}</Label>
                  <Input
                    type="number"
                    value={forecastAmount}
                    onChange={(e) => setForecastAmount(Number(e.target.value))}
                  />
                </div>

                <div>
                  <Label>{t('quickAdd.confidence')} {t('common.required')}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={forecastConfidence}
                    onChange={(e) => setForecastConfidence(Number(e.target.value))}
                  />
                </div>

                <GlowButton onClick={handleCreateForecast} className="w-full">
                  {t('quickAdd.createForecastBtn')}
                </GlowButton>
              </CardContent>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}