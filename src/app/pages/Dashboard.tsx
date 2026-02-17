import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, TrendingUp, TrendingDown, Activity, Sparkles, BarChart3, PieChart, Download, RefreshCw, Zap, AlertCircle, Lightbulb, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { MonthSelector } from '../components/shared/MonthSelector';
import { StatCard } from '../components/shared/StatCard';
import { GlassCard } from '../components/shared/GlassCard';
import { CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAppStore } from '../../store/useAppStore';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subMonths, parseISO } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { GlowButton } from '../components/shared/GlowButton';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

interface ProfitTrendDataPoint {
  month: string;
  profit: number;
  income: number;
  expenses: number;
}

export function Dashboard() {
  const { t } = useTranslation();
  const profile = useAppStore((state) => state.profile);
  const selectedMonthKey = useAppStore((state) => state.selectedMonthKey);
  const bookings = useAppStore((state) => state.bookings);
  const rooms = useAppStore((state) => state.rooms);
  const forecasts = useAppStore((state) => state.forecasts);
  const expenses = useAppStore((state) => state.expenses);
  const hotelCosts = useAppStore((state) => state.hotelCosts);
  const partners = useAppStore((state) => state.partners);
  const manualReferrals = useAppStore((state) => state.manualReferrals);
  const getAllPartnersStats = useAppStore((state) => state.getAllPartnersStats);
  const addRoom = useAppStore((state) => state.addRoom);
  const addForecast = useAppStore((state) => state.addForecast);

  const [roomName, setRoomName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [forecastMonth, setForecastMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [forecastCategory, setForecastCategory] = useState('');
  const [forecastAmount, setForecastAmount] = useState(0);
  const [forecastConfidence, setForecastConfidence] = useState(80);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);

  const [animatedIncome, setAnimatedIncome] = useState(0);
  const [animatedExpenses, setAnimatedExpenses] = useState(0);
  const [animatedProfit, setAnimatedProfit] = useState(0);
  const [animatedForecast, setAnimatedForecast] = useState(0);

  const monthBookings = bookings.filter((b) => b.monthKey === selectedMonthKey);
  const monthExpenses = expenses.filter((e) => e.monthKey === selectedMonthKey);
  
  const monthlyHotelCosts = hotelCosts
    .filter((c) => c.isActive)
    .reduce((sum, c) => sum + c.amount, 0);
  
  const totalIncome = monthBookings.reduce((sum, b) => sum + b.income, 0);
  const bookingExpenses = monthBookings.reduce(
    (sum, b) => sum + b.totals.totalOrderExpenses + b.extraExpenses,
    0
  );
  const additionalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = bookingExpenses + additionalExpenses + monthlyHotelCosts;
  const totalNetProfit = totalIncome - totalExpenses;
  
  const monthForecasts = forecasts.filter((f) => f.monthKey === selectedMonthKey);
  const totalForecast = monthForecasts.reduce((sum, f) => sum + f.expectedAmount, 0);

  const previousMonth = format(subMonths(parseISO(selectedMonthKey + '-01'), 1), 'yyyy-MM');
  const previousMonthBookings = bookings.filter((b) => b.monthKey === previousMonth);
  const previousMonthExpenses = expenses.filter((e) => e.monthKey === previousMonth);
  
  const previousIncome = previousMonthBookings.reduce((sum, b) => sum + b.income, 0);
  const previousBookingExpenses = previousMonthBookings.reduce((sum, b) => sum + b.totals.totalOrderExpenses + b.extraExpenses, 0);
  const previousAdditionalExpenses = previousMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const previousExpenses = previousBookingExpenses + previousAdditionalExpenses + monthlyHotelCosts;
  const previousProfit = previousIncome - previousExpenses;

  const incomeChange = previousIncome > 0 ? ((totalIncome - previousIncome) / previousIncome) * 100 : 0;
  const expensesChange = previousExpenses > 0 ? ((totalExpenses - previousExpenses) / previousExpenses) * 100 : 0;
  const profitChange = previousProfit !== 0 ? ((totalNetProfit - previousProfit) / Math.abs(previousProfit)) * 100 : 0;

  const hasPreviousData = previousIncome > 0 || previousExpenses > 0;

  // 🆕 FIXED: Partner statistics with proper dependencies
  const partnerStats = useMemo(() => {
    const allStats = getAllPartnersStats(selectedMonthKey);
    const totalRevenue = allStats.reduce((sum, s) => sum + s.totalRevenue, 0);
    const totalReferrals = allStats.reduce((sum, s) => sum + s.totalReferrals, 0);
    const topPartnerStat = [...allStats].sort((a, b) => b.totalRevenue - a.totalRevenue)[0];
    const topPartner = topPartnerStat ? partners.find((p) => p.id === topPartnerStat.partnerId) : null;
    
    return {
      totalRevenue,
      totalReferrals,
      topPartner,
      activePartners: partners.filter((p) => p.isActive).length,
    };
  }, [partners, bookings, manualReferrals, selectedMonthKey, getAllPartnersStats]);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      
      setAnimatedIncome(totalIncome * progress);
      setAnimatedExpenses(totalExpenses * progress);
      setAnimatedProfit(totalNetProfit * progress);
      setAnimatedForecast(totalForecast * progress);

      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [totalIncome, totalExpenses, totalNetProfit, totalForecast]);

  const incomeVsExpensesData = [
    {
      name: t('common.income'),
      value: totalIncome,
    },
    {
      name: t('common.expenses'),
      value: totalExpenses,
    },
    {
      name: t('common.profit'),
      value: totalNetProfit,
    },
  ];

  const expensesPieData = [
    { name: 'עלויות חדר', value: monthBookings.reduce((sum, b) => sum + b.totals.totalRoomCosts, 0), color: '#7CFF3A' },
    { name: 'עלויות מלון בהזמנות', value: monthBookings.reduce((sum, b) => sum + b.totals.totalHotelCosts, 0), color: '#5FE89D' },
    { name: 'עלויות מלון חודשיות', value: monthlyHotelCosts, color: '#45D9A8' },
    { name: 'הוצאות נוספות', value: monthBookings.reduce((sum, b) => sum + b.extraExpenses, 0) + additionalExpenses, color: '#3BC9B0' },
  ];

  const profitTrendData = useMemo<ProfitTrendDataPoint[]>(() => {
    const months: ProfitTrendDataPoint[] = [];
    const currentDate = parseISO(selectedMonthKey + '-01');
    
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(currentDate, i);
      const monthKey = format(date, 'yyyy-MM');
      const monthBookings = bookings.filter((b) => b.monthKey === monthKey);
      const monthExpenses = expenses.filter((e) => e.monthKey === monthKey);
      
      const income = monthBookings.reduce((sum, b) => sum + b.income, 0);
      const bookingExpenses = monthBookings.reduce((sum, b) => sum + b.totals.totalOrderExpenses + b.extraExpenses, 0);
      const additionalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      const totalExpenses = bookingExpenses + additionalExpenses + monthlyHotelCosts;
      const netProfit = income - totalExpenses;

      months.push({
        month: format(date, 'MMM yy'),
        profit: netProfit,
        income: income,
        expenses: totalExpenses,
      });
    }

    return months;
  }, [selectedMonthKey, bookings, expenses, monthlyHotelCosts]);

  const topRooms = useMemo(() => {
    const roomStats = rooms.map((room) => {
      const roomBookings = monthBookings.filter((b) => b.roomId === room.id);
      const roomExpenses = monthExpenses.filter((e) => e.roomId === room.id);
      
      const income = roomBookings.reduce((sum, b) => sum + b.income, 0);
      const bookingExpenses = roomBookings.reduce((sum, b) => sum + b.totals.totalOrderExpenses + b.extraExpenses, 0);
      const additionalExpenses = roomExpenses.reduce((sum, e) => sum + e.amount, 0);
      const expenses = bookingExpenses + additionalExpenses;
      const netProfit = income - expenses;
      const bookingCount = roomBookings.length;
      
      return {
        room,
        netProfit,
        bookingCount,
        income,
        expenses,
      };
    });
    
    return roomStats.sort((a, b) => b.netProfit - a.netProfit);
  }, [rooms, monthBookings, monthExpenses]);

  const bestRoom = topRooms[0];
  const totalBookingsCount = monthBookings.length;
  const avgBookingValue = totalBookingsCount > 0 ? totalIncome / totalBookingsCount : 0;

  const sparklineData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subMonths(parseISO(selectedMonthKey + '-01'), 6 - i);
      const monthKey = format(date, 'yyyy-MM');
      const monthBookings = bookings.filter((b) => b.monthKey === monthKey);
      const monthExpenses = expenses.filter((e) => e.monthKey === monthKey);
      
      const income = monthBookings.reduce((sum, b) => sum + b.income, 0);
      const bookingExpenses = monthBookings.reduce((sum, b) => sum + b.totals.totalOrderExpenses + b.extraExpenses, 0);
      const additionalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      return income - (bookingExpenses + additionalExpenses + monthlyHotelCosts);
    });
  }, [selectedMonthKey, bookings, expenses, monthlyHotelCosts]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-4 animate-in fade-in duration-200">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{payload[0].name}</p>
          <p className="text-3xl font-bold text-primary tabular-nums">₪{payload[0].value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  const handleCreateRoom = () => {
    if (!roomName) {
      toast.error(t('quickAdd.enterRoomName'));
      return;
    }
    addRoom({ name: roomName, number: roomNumber || undefined });
    toast.success('✅ חדר נוצר בהצלחה!', {
      icon: '🎉',
      duration: 3000,
    });
    setRoomName('');
    setRoomNumber('');
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
    toast.success('✅ תחזית נוצרה בהצלחה!', {
      icon: '📊',
      duration: 3000,
    });
    setForecastCategory('');
    setForecastAmount(0);
    setForecastConfidence(80);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    toast.info('🔄 מרענן נתונים...', { duration: 1000 });
    
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('✅ הנתונים עודכנו!', { duration: 2000 });
    }, 1500);
  };

  const handleExport = () => {
    toast.success('📥 הנתונים יוצאו בהצלחה!', {
      description: 'הקובץ נשמר בהורדות',
      duration: 3000,
    });
  };

  const greeting = profile?.first_name ? `שלום, ${profile.first_name}` : 'שלום';

  return (
    <div className="min-h-screen pb-16 bg-gradient-to-b from-background via-background to-background/95">
      <PageHeader
        title={t('dashboard.title')}
        description={greeting}
        action={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              רענן
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="h-10"
            >
              <Download className="w-4 h-4 mr-2" />
              ייצא
            </Button>
            <MonthSelector />
          </div>
        }
      />

      <div className="container mx-auto px-4 lg:px-8 xl:px-12 2xl:px-16 py-10 max-w-[2200px]">
        <div className="space-y-12">
          
          {monthBookings.length > 0 && bestRoom && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <GlassCard className=" animate-in slide-in-from-bottom duration-700">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/15">
                      <Lightbulb className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">תובנה חכמה</p>
                  </div>
                  <p className="text-lg font-bold text-foreground leading-relaxed">
                    החדר הכי רווחי החודש: <span className="text-primary ">{bestRoom.room.name}</span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    רווח של ₪{bestRoom.netProfit.toFixed(2)} מ-{bestRoom.bookingCount} הזמנות
                  </p>
                </CardContent>
              </GlassCard>

              <GlassCard className=" animate-in slide-in-from-bottom duration-700 delay-100">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/15">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">סטטיסטיקה</p>
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    ממוצע ערך הזמנה: <span className="text-primary ">₪{avgBookingValue.toFixed(2)}</span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    מתוך סך {totalBookingsCount} הזמנות החודש
                  </p>
                </CardContent>
              </GlassCard>

              {hasPreviousData && profitChange !== 0 && (
                <GlassCard className=" animate-in slide-in-from-bottom duration-700 delay-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${profitChange > 0 ? 'bg-primary/15' : 'bg-destructive/15'}`}>
                        {profitChange > 0 ? <TrendingUp className="w-5 h-5 text-primary" /> : <TrendingDown className="w-5 h-5 text-destructive" />}
                      </div>
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">מגמה</p>
                    </div>
                    <p className="text-lg font-bold text-foreground">
                      רווחיות {profitChange > 0 ? 'עלתה' : 'ירדה'} ב-
                      <span className={profitChange > 0 ? 'text-primary' : 'text-destructive'}>
                        {Math.abs(profitChange).toFixed(1)}%
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      לעומת החודש הקודם
                    </p>
                  </CardContent>
                </GlassCard>
              )}

              {/* 🆕 FIXED: Partners Widget */}
              <GlassCard className=" animate-in slide-in-from-bottom duration-700 delay-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/15">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">שותפים עסקיים</p>
                  </div>
                  {partnerStats.activePartners > 0 ? (
                    <>
                      <p className="text-lg font-bold text-foreground leading-relaxed">
                        הכנסות מלון: <span className="text-primary ">₪{partnerStats.totalRevenue.toFixed(2)}</span>
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {partnerStats.totalReferrals} הפניות החודש
                      </p>
                      {partnerStats.topPartner && (
                        <p className="text-xs text-muted-foreground mt-1">
                          מוביל: {partnerStats.topPartner.name}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">אין שותפים פעילים</p>
                  )}
                </CardContent>
              </GlassCard>
            </div>
          )}

          <GlassCard className="border-primary/40  transition-all duration-500">
            <CardHeader className="pb-8 border-b border-primary/30">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/15 ">
                  <Sparkles className="w-6 h-6 text-primary " />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold text-primary tracking-tight ">
                    {t('quickAdd.title')}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">יצירה מהירה של פריטים חדשים במערכת</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8">
              <Tabs defaultValue="room" className="w-full">
                <TabsList className="grid w-full max-w-lg grid-cols-2 mb-10 h-14 glass-card border-2 border-primary/30 p-1.5">
                  <TabsTrigger 
                    value="room" 
                    className="text-base font-bold data-[state=active]:bg-primary/25 data-[state=active]:text-primary  transition-all duration-300"
                  >
                    {t('quickAdd.room')}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="forecast" 
                    className="text-base font-bold data-[state=active]:bg-primary/25 data-[state=active]:text-primary  transition-all duration-300"
                  >
                    {t('quickAdd.forecast')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="room" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 items-end">
                    <div className="space-y-3">
                      <Label className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                        {t('quickAdd.roomName')} 
                        <span className="text-primary ">*</span>
                      </Label>
                      <Input
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder={t('quickAdd.roomPlaceholder')}
                        className="h-14 glass-card border-2 border-primary/30 focus:border-primary/70  text-base font-medium transition-all duration-300"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-bold text-foreground uppercase tracking-wider">{t('quickAdd.roomNumber')}</Label>
                      <Input
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        placeholder={t('quickAdd.roomNumberPlaceholder')}
                        className="h-14 glass-card border-2 border-primary/30 focus:border-primary/70  text-base font-medium transition-all duration-300"
                      />
                    </div>
                    <div className="md:col-span-2 xl:col-span-1">
                      <GlowButton onClick={handleCreateRoom} className="h-14 w-full text-base font-bold ">
                        {t('quickAdd.createRoomBtn')}
                      </GlowButton>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="forecast" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-8 items-end">
                    <div className="space-y-3">
                      <Label className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                        {t('quickAdd.month')} 
                        <span className="text-primary ">*</span>
                      </Label>
                      <Input
                        type="month"
                        value={forecastMonth}
                        onChange={(e) => setForecastMonth(e.target.value)}
                        className="h-14 glass-card border-2 border-primary/30 focus:border-primary/70  text-base font-medium transition-all duration-300"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                        {t('quickAdd.category')} 
                        <span className="text-primary ">*</span>
                      </Label>
                      <Input
                        value={forecastCategory}
                        onChange={(e) => setForecastCategory(e.target.value)}
                        placeholder={t('quickAdd.categoryPlaceholder')}
                        className="h-14 glass-card border-2 border-primary/30 focus:border-primary/70  text-base font-medium transition-all duration-300"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                        {t('quickAdd.expectedAmount')} 
                        <span className="text-primary ">*</span>
                      </Label>
                      <Input
                        type="number"
                        value={forecastAmount}
                        onChange={(e) => setForecastAmount(Number(e.target.value))}
                        className="h-14 glass-card border-2 border-primary/30 focus:border-primary/70  text-base font-medium transition-all duration-300"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                        {t('quickAdd.confidence')} 
                        <span className="text-primary ">*</span>
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={forecastConfidence}
                        onChange={(e) => setForecastConfidence(Number(e.target.value))}
                        className="h-14 glass-card border-2 border-primary/30 focus:border-primary/70  text-base font-medium transition-all duration-300"
                      />
                    </div>
                    <div>
                      <GlowButton onClick={handleCreateForecast} className="h-14 w-full text-base font-bold ">
                        {t('quickAdd.createForecastBtn')}
                      </GlowButton>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </GlassCard>

          <div>
            <div className="mb-8 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/15 ">
                <PieChart className="w-7 h-7 text-primary " />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-primary tracking-tight ">סקירה פיננסית</h2>
                <p className="text-sm text-muted-foreground mt-1">מדדי ביצועים עיקריים לחודש הנוכחי</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
              <StatCard
                title={t('dashboard.totalIncome')}
                value={`₪${animatedIncome.toFixed(2)}`}
                icon={DollarSign}
                sparklineData={sparklineData}
                trend={hasPreviousData && incomeChange !== 0 ? { value: incomeChange, isPositive: incomeChange > 0 } : undefined}
              />
              <StatCard
                title={t('dashboard.totalExpenses')}
                value={`₪${animatedExpenses.toFixed(2)}`}
                icon={TrendingDown}
                sparklineData={sparklineData}
                trend={hasPreviousData && expensesChange !== 0 ? { value: expensesChange, isPositive: expensesChange < 0 } : undefined}
              />
              <StatCard
                title={t('dashboard.netProfit')}
                value={`₪${animatedProfit.toFixed(2)}`}
                icon={TrendingUp}
                sparklineData={sparklineData}
                trend={hasPreviousData && profitChange !== 0 ? { value: profitChange, isPositive: profitChange > 0 } : undefined}
              />
              <StatCard
                title={t('dashboard.forecastTotal')}
                value={`₪${animatedForecast.toFixed(2)}`}
                icon={Activity}
                sparklineData={sparklineData}
              />
            </div>
          </div>

          {monthBookings.length > 0 ? (
            <>
              <div>
                <div className="mb-8 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/15 ">
                    <BarChart3 className="w-7 h-7 text-primary " />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-primary tracking-tight ">ביצועים אחרונים</h2>
                    <p className="text-sm text-muted-foreground mt-1">ניתוח מגמות והשוואות תקופתיות</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                  <GlassCard className="border-primary/40  transition-all duration-500">
                    <CardHeader className="pb-8">
                      <CardTitle className="text-xl font-bold text-foreground">הכנסות מול הוצאות</CardTitle>
                      <p className="text-sm text-muted-foreground mt-2">פילוח הכנסות והוצאות לחודש הנוכחי</p>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={incomeVsExpensesData} margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeWidth={1.5} />
                          <XAxis 
                            dataKey="name" 
                            stroke="#8A9A94" 
                            fontSize={14} 
                            fontWeight={700}
                            tickLine={{ stroke: '#7CFF3A', strokeWidth: 2 }}
                          />
                          <YAxis 
                            stroke="#8A9A94" 
                            fontSize={14} 
                            fontWeight={700}
                            tickLine={{ stroke: '#7CFF3A', strokeWidth: 2 }}
                          />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                          <Bar 
                            dataKey="value" 
                            fill="url(#neonGradient)" 
                            radius={[12, 12, 0, 0]}
                            maxBarSize={100}
                          />
                          <defs>
                            <linearGradient id="neonGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#7CFF3A" stopOpacity={1} />
                              <stop offset="100%" stopColor="#5FE89D" stopOpacity={0.85} />
                            </linearGradient>
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </GlassCard>

                  <GlassCard className="border-primary/40  transition-all duration-500">
                    <CardHeader className="pb-8">
                      <CardTitle className="text-xl font-bold text-foreground">מגמת רווחיות</CardTitle>
                      <p className="text-sm text-muted-foreground mt-2">הכנסות והוצאות לאורך זמן</p>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={profitTrendData} margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeWidth={1.5} />
                          <XAxis 
                            dataKey="month" 
                            stroke="#8A9A94" 
                            fontSize={14} 
                            fontWeight={700}
                            tickLine={{ stroke: '#7CFF3A', strokeWidth: 2 }}
                          />
                          <YAxis 
                            stroke="#8A9A94" 
                            fontSize={14} 
                            fontWeight={700}
                            tickLine={{ stroke: '#7CFF3A', strokeWidth: 2 }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Area
                            type="monotone"
                            dataKey="income"
                            stroke="#7CFF3A"
                            fill="url(#incomeGradient)"
                            strokeWidth={3}
                          />
                          <Area
                            type="monotone"
                            dataKey="expenses"
                            stroke="#EF4444"
                            fill="url(#expensesGradient)"
                            strokeWidth={3}
                          />
                          <defs>
                            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#7CFF3A" stopOpacity={0.6} />
                              <stop offset="100%" stopColor="#7CFF3A" stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#EF4444" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="#EF4444" stopOpacity={0.05} />
                            </linearGradient>
                          </defs>
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </GlassCard>

                  <GlassCard className="border-primary/40  transition-all duration-500">
                    <CardHeader className="pb-8">
                      <CardTitle className="text-xl font-bold text-foreground">פילוח הוצאות</CardTitle>
                      <p className="text-sm text-muted-foreground mt-2">התפלגות סוגי העלויות</p>
                    </CardHeader>
                    <CardContent className="pt-2 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height={350}>
                        <RechartsPie>
                          <Pie
                            data={expensesPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            label={(entry) => `₪${entry.value.toFixed(0)}`}
                          >
                            {expensesPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </CardContent>
                  </GlassCard>
                </div>
              </div>

              <GlassCard className="border-primary/40  transition-all duration-500">
                <CardHeader className="pb-8 border-b border-primary/30">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/15 ">
                      <TrendingUp className="w-6 h-6 text-primary " />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-foreground">ביצועי חדרים</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">דירוג חדרים לפי רווחיות - לחץ להרחבה</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-primary/30">
                          <th className="text-start py-6 px-8 text-xs font-black text-muted-foreground uppercase tracking-widest">
                            {t('dashboard.room')}
                          </th>
                          <th className="text-start py-6 px-8 text-xs font-black text-muted-foreground uppercase tracking-widest">
                            {t('dashboard.bookings')}
                          </th>
                          <th className="text-end py-6 px-8 text-xs font-black text-muted-foreground uppercase tracking-widest">
                            {t('dashboard.netProfit')}
                          </th>
                          <th className="text-center py-6 px-8 text-xs font-black text-muted-foreground uppercase tracking-widest">
                            פעולות
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {topRooms.map(({ room, netProfit, bookingCount, income, expenses }, index) => (
                          <React.Fragment key={room.id}>
                            <tr 
                              className="border-b border-border/40 hover:bg-primary/5 transition-all duration-300 group cursor-pointer"
                              onClick={() => setExpandedRoom(expandedRoom === room.id ? null : room.id)}
                            >
                              <td className="py-6 px-8">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center  transition-all duration-300">
                                    <span className="text-xl font-black text-primary">#{index + 1}</span>
                                  </div>
                                  <div>
                                    <p className="font-bold text-foreground text-lg">{room.name}</p>
                                    {room.number && (
                                      <p className="text-sm text-muted-foreground mt-1 font-medium">חדר #{room.number}</p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-6 px-8">
                                <span className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-primary/15 text-base font-black text-primary  transition-all duration-300">
                                  {bookingCount}
                                </span>
                              </td>
                              <td className="py-6 px-8 text-end">
                                <span className="font-black text-2xl text-primary tabular-nums  transition-all duration-300">
                                  ₪{netProfit.toFixed(2)}
                                </span>
                              </td>
                              <td className="py-6 px-8 text-center">
                                {expandedRoom === room.id ? (
                                  <ChevronUp className="w-5 h-5 text-primary mx-auto" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-muted-foreground mx-auto" />
                                )}
                              </td>
                            </tr>
                            {expandedRoom === room.id && (
                              <tr className="bg-primary/5 border-b border-border/40">
                                <td colSpan={4} className="py-6 px-8">
                                  <div className="grid grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-300">
                                    <div className="glass-card p-4 rounded-lg border border-primary/20">
                                      <p className="text-xs font-bold text-muted-foreground uppercase mb-2">הכנסות</p>
                                      <p className="text-2xl font-black text-primary">₪{income.toFixed(2)}</p>
                                    </div>
                                    <div className="glass-card p-4 rounded-lg border border-primary/20">
                                      <p className="text-xs font-bold text-muted-foreground uppercase mb-2">הוצאות</p>
                                      <p className="text-2xl font-black text-destructive">₪{expenses.toFixed(2)}</p>
                                    </div>
                                    <div className="glass-card p-4 rounded-lg border border-primary/20">
                                      <p className="text-xs font-bold text-muted-foreground uppercase mb-2">שולי רווח</p>
                                      <p className="text-2xl font-black text-primary">{income > 0 ? ((netProfit / income) * 100).toFixed(1) : 0}%</p>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </GlassCard>
            </>
          ) : (
            <GlassCard className="border-primary/40 ">
              <CardContent className="py-32 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-8  animate-pulse">
                    <Activity className="w-16 h-16 text-primary " />
                  </div>
                  <h3 className="text-3xl font-bold text-primary mb-4 ">
                    {t('dashboard.noData')}
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {t('rooms.noRoomsDesc')}
                  </p>
                </div>
              </CardContent>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}