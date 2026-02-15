import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { MonthSelector } from '../components/shared/MonthSelector';
import { useState } from 'react';
import { GlassCard } from '../components/shared/GlassCard';
import { EmptyState } from '../components/shared/EmptyState';
import { CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAppStore } from '../../store/useAppStore';
import { TrendingUp, Trash2, Plus, X, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { GlowButton } from '../components/shared/GlowButton';

export function Forecasts() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const selectedMonthKey = useAppStore((state) => state.selectedMonthKey);
  const forecasts = useAppStore((state) => state.forecasts);
  const deleteForecast = useAppStore((state) => state.deleteForecast);
  const addForecast = useAppStore((state) => state.addForecast);
  const monthlyBanksExpense = useAppStore((state) => state.monthlyBanksExpense);
  const monthlyEmployeesExpense = useAppStore((state) => state.monthlyEmployeesExpense);
  const expenses = useAppStore((state) => state.expenses);

  // Form state for new forecast
  const [category, setCategory] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState(0);
  const [months, setMonths] = useState<1 | 3 | 12>(1);
  const [forecastType, setForecastType] = useState<'income' | 'expense'>('income');

  const monthForecasts = forecasts.filter((f) => f.monthKey === selectedMonthKey);
  const monthExpenses = expenses.filter(
    (e) => e.monthKey === selectedMonthKey
  );
  const totalExpensesAmount = monthExpenses.reduce(
    (sum, e) => sum + e.amount,
    0
  );    

  const handleDelete = (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק תחזית זו?')) {
      deleteForecast(id);
      toast.success('✅ התחזית נמחקה בהצלחה!');
    }
  };

  const handleCreateForecast = () => {
    if (!category || monthlyAmount <= 0) {
      toast.error('נא למלא את כל השדות');
      return;
    }

    // Calculate total amount: monthlyAmount × months
    const expectedAmount = monthlyAmount * months;

    // Determine period based on months
    let period: 'monthly' | 'quarterly' | 'yearly' = 'monthly';
    if (months === 3) period = 'quarterly';
    if (months === 12) period = 'yearly';

    addForecast({
      monthKey: selectedMonthKey,
      category,
      expectedAmount,
      confidence: 80,
      period,
      type: forecastType, // 🆕 NEW: Pass the type!
    });

    toast.success(`✅ תחזית ${forecastType === 'income' ? 'הכנסה' : 'הוצאה'} נוצרה בהצלחה!`);
    
    // Reset form
    setCategory('');
    setMonthlyAmount(0);
    setMonths(1);
    setForecastType('income');
    setIsOpen(false);
  };

  // ✅ FIX: Calculate income and expenses separately!
  const totalForecastIncome = monthForecasts
    .filter(f => f.type === 'income')
    .reduce((sum, forecast) => sum + forecast.expectedAmount, 0);

  const totalForecastExpense = monthForecasts
    .filter(f => f.type === 'expense')
    .reduce((sum, forecast) => sum + forecast.expectedAmount, 0);

  const totalForecastAmount = totalForecastIncome;
  
  const totalWithFixedExpenses =
    totalForecastAmount +
    monthlyBanksExpense +
    monthlyEmployeesExpense;  
  
  // ✅ FIX: Subtract expenses from income!
  const totalAmount = totalForecastIncome - totalForecastExpense - totalExpensesAmount;
  const avgConfidence = monthForecasts.reduce((sum, f) => sum + f.confidence, 0) / monthForecasts.length;

  return (
    <div className="min-h-screen">
      <PageHeader
        title={t('forecasts.title')}
        description={t('forecasts.description')}
        action={
          <GlowButton
            onClick={() => setIsOpen(true)}
            className=""
          >
            <Plus className="w-5 h-5 ml-2" />
            הוסף תחזית
          </GlowButton>
        }        
      />

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-xl bg-card p-6 border">
            <p className="text-sm text-muted-foreground">סה״כ תחזיות הכנסה</p>
            <p className="text-2xl font-bold text-green-500">
              ₪ {totalForecastIncome.toFixed(2)}
            </p>
          </div>

          <div className="rounded-xl bg-card p-6 border">
            <p className="text-sm text-muted-foreground">סה״כ תחזיות הוצאה</p>
            <p className="text-2xl font-bold text-red-500">
              ₪ {totalForecastExpense.toFixed(2)}
            </p>
          </div>

          <div className="rounded-xl bg-card p-6 border">
            <p className="text-sm text-muted-foreground">רווח צפוי</p>
            <p
              className={`text-2xl font-bold ${
                totalAmount >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              ₪ {totalAmount.toFixed(2)}
            </p>
          </div>
        </div>

        {monthForecasts.length === 0 ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6 ">
                <TrendingUp className="w-12 h-12 text-primary " />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-3 ">
                אין תחזיות עדיין
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                צור תחזית בהוספה מהירה כדי לעקוב אחר ההכנסות הצפויות שלך
              </p>
              <GlowButton
                onClick={() => setIsOpen(true)}
                className=""
              >
                <Plus className="w-5 h-5 ml-2" />
               הוסף תחזית ראשונה
              </GlowButton>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <GlassCard key={selectedMonthKey}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {format(parseISO(selectedMonthKey + '-01'), 'MMMM yyyy')}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {monthForecasts.length} {t('forecasts.title')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      ₪{totalAmount.toFixed(2)}
                      <p className="text-sm text-muted-foreground mt-1">
                        הוצאות חודשיות: ₪{totalExpensesAmount.toFixed(2)}
                      </p>
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      {avgConfidence.toFixed(0)}% {t('forecasts.confidence')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Monthly Fixed Expenses */}
                  <div className="p-4 rounded-lg bg-muted/20 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">הוצאות בנקים</p>
                      <p className="text-sm text-muted-foreground">קבוע חודשי</p>
                    </div>
                    <p className="text-lg font-semibold text-primary">
                      ₪{monthlyBanksExpense.toFixed(2)}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/20 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">הוצאות עובדים</p>
                      <p className="text-sm text-muted-foreground">קבוע חודשי</p>
                    </div>
                    <p className="text-lg font-semibold text-primary">
                      ₪{monthlyEmployeesExpense.toFixed(2)}
                    </p>
                  </div>

                  {monthForecasts.map((forecast) => (
                    <div
                      key={forecast.id}
                      className="p-4 rounded-lg bg-muted/30 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {/* 🆕 NEW: Show income/expense icon */}
                        {forecast.type === 'income' ? (
                          <ArrowUpCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <ArrowDownCircle className="w-5 h-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-semibold">{forecast.category}</p>
                          <p className="text-xs text-muted-foreground">
                            {forecast.period === 'monthly' && 'חודשי'}
                            {forecast.period === 'quarterly' && 'רבעוני'}
                            {forecast.period === 'yearly' && 'שנתי'}
                            {' • '}
                            {forecast.type === 'income' ? 'הכנסה' : 'הוצאה'}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {t('forecasts.confidence')}: {forecast.confidence}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className={`text-lg font-semibold ${forecast.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                          {forecast.type === 'expense' && '-'}₪{forecast.expectedAmount.toFixed(2)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(forecast.id)}
                          className="hover:bg-destructive/20 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </GlassCard>
          </div>
        )}
      </div>

      {/* Create Forecast Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card border-primary/30  max-w-md w-full mx-4 rounded-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-primary/20">
              <div>
                <h2 className="text-2xl font-bold text-primary ">הוספת תחזית חדשה</h2>
                <p className="text-sm text-muted-foreground mt-1">צור תחזית הכנסה או הוצאה עתידית</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-5">
              {/* Forecast Type Selection */}
              <div className="space-y-3">
                <Label className="text-foreground font-semibold">
                  סוג תחזית <span className="text-primary">*</span>
                </Label>
                <RadioGroup value={forecastType} onValueChange={(v) => setForecastType(v as 'income' | 'expense')}>
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <RadioGroupItem value="income" id="income" />
                    <Label htmlFor="income" className="cursor-pointer font-medium">הכנסה</Label>
                  </div>
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <RadioGroupItem value="expense" id="expense" />
                    <Label htmlFor="expense" className="cursor-pointer font-medium">הוצאה</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-semibold">
                  קטגוריה <span className="text-primary">*</span>
                </Label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder={forecastType === 'income' ? 'לדוגמה: הכנסות מאירועים' : 'לדוגמה: שכר עובדים'}
                  className="glass-card border-primary/30 h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-semibold">
                  סכום חודשי (₪) <span className="text-primary">*</span>
                </Label>
                <Input
                  type="number"
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                  placeholder="0"
                  className="glass-card border-primary/30 h-12"
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-semibold">
                  תקופה <span className="text-primary">*</span>
                </Label>
                <Select 
                  value={months.toString()} 
                  onValueChange={(v) => setMonths(Number(v) as 1 | 3 | 12)}
                >
                  <SelectTrigger className="glass-card border-primary/30 h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-primary/30">
                    <SelectItem value="1">חודש (1)</SelectItem>
                    <SelectItem value="3">רבעון (3)</SelectItem>
                    <SelectItem value="12">שנה (12)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Preview */}
              {monthlyAmount > 0 && (
                <div className="glass-card border-primary/20 p-4 rounded-lg bg-primary/5">
                  <p className="text-sm text-muted-foreground mb-2">סכום כולל ({forecastType === 'income' ? 'הכנסה' : 'הוצאה'}):</p>
                  <p className={`text-3xl font-bold ${forecastType === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                    {forecastType === 'expense' && '-'}₪{(monthlyAmount * months).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ₪{monthlyAmount.toFixed(2)} × {months} חודשים
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-primary/20">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1 glass-button border-primary/30 h-12"
              >
                ביטול
              </Button>
              <GlowButton
                onClick={handleCreateForecast}
                className="flex-1 h-12 "
              >
                צור תחזית
              </GlowButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}