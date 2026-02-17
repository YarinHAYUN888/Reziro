import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/shared/StatCard';
import { MonthSelector } from '../components/shared/MonthSelector';
import { GlassCard } from '../components/shared/GlassCard';
import { GlowButton } from '../components/shared/GlowButton';
import { EmptyState } from '../components/shared/EmptyState';
import { ExpenseDialog } from './ExpenseDialog';
import { useAppStore } from '../../store/useAppStore';
import { DollarSign, TrendingUp, TrendingDown, Plus, BarChart3, PieChart, Filter, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { ConfirmDeleteDialog } from '../components/shared/ConfirmDeleteDialog';
import { toast } from 'sonner';
import { hotelCostMatchesPeriod } from '../../utils/periodUtils';

export function Financial() {
  const selectedMonthKey = useAppStore((state) => state.selectedMonthKey);
  const bookings = useAppStore((state) => state.bookings);
  const expenses = useAppStore((state) => state.expenses);
  const rooms = useAppStore((state) => state.rooms);
  const hotelCosts = useAppStore((state) => state.hotelCosts);

  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'room' | 'hotel' | 'extra' | 'custom'>('all');
  const [deleteExpenseDialogOpen, setDeleteExpenseDialogOpen] = useState(false);
  const [expenseToDeleteId, setExpenseToDeleteId] = useState<string | null>(null);

  const deleteExpense = useAppStore((state) => state.deleteExpense);

  const monthBookings = useMemo(() => {
    return bookings.filter((b) => b.monthKey === selectedMonthKey);
  }, [bookings, selectedMonthKey]);

  const monthExpenses = useMemo(() => {
    return expenses.filter((e) => e.monthKey === selectedMonthKey);
  }, [expenses, selectedMonthKey]);

  const monthlyHotelCosts = useMemo(() => {
    return hotelCosts
      .filter((c) => c.isActive && hotelCostMatchesPeriod(c, selectedMonthKey))
      .reduce((sum, c) => sum + c.amount, 0);
  }, [hotelCosts, selectedMonthKey]);

  const totalIncome = useMemo(() => {
    return monthBookings.reduce((sum, b) => sum + b.income, 0);
  }, [monthBookings]);

  const totalRoomExpenses = useMemo(() => {
    return monthBookings.reduce((sum, b) => {
      const roomCosts = b.selectedRoomCosts.reduce((s, c) => s + c.total, 0);
      return sum + roomCosts;
    }, 0);
  }, [monthBookings]);

  const totalHotelExpenses = useMemo(() => {
    return monthBookings.reduce((sum, b) => {
      const hotelCosts = b.selectedHotelCosts.reduce((s, c) => s + c.total, 0);
      return sum + hotelCosts;
    }, 0);
  }, [monthBookings]);

  const totalExtraExpenses = useMemo(() => {
    return monthBookings.reduce((sum, b) => sum + b.extraExpenses, 0);
  }, [monthBookings]);

  const totalExpensesFromExpenses = useMemo(() => {
    return monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [monthExpenses]);

  const totalExpenses = totalRoomExpenses + totalHotelExpenses + totalExtraExpenses + totalExpensesFromExpenses + monthlyHotelCosts;
  const netProfit = totalIncome - totalExpenses;

  const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0.0';

  // 🆕 Build expense rows with filtering
  const expenseRows = useMemo(() => {
    const rows: Array<{
      id: string;
      description: string;
      category: string;
      amount: number;
      date: string;
      type: 'room' | 'hotel' | 'extra' | 'custom' | 'monthly';
      roomName?: string;
      bookingCustomer?: string;
    }> = [];

    // Room costs from bookings
    monthBookings.forEach((booking) => {
      booking.selectedRoomCosts.forEach((cost, idx) => {
        rows.push({
          id: `room-${booking.id}-${idx}`,
          description: cost.labelSnapshot,
          category: 'עלויות חדר',
          amount: cost.total,
          date: booking.startDate,
          type: 'room',
          roomName: rooms.find((r) => r.id === booking.roomId)?.name,
          bookingCustomer: booking.customer?.customerName || 'אורח',
        });
      });
    });

    // Hotel costs from bookings
    monthBookings.forEach((booking) => {
      booking.selectedHotelCosts.forEach((cost, idx) => {
        rows.push({
          id: `hotel-${booking.id}-${idx}`,
          description: cost.labelSnapshot,
          category: 'עלויות מלון',
          amount: cost.total,
          date: booking.startDate,
          type: 'hotel',
          roomName: rooms.find((r) => r.id === booking.roomId)?.name,
          bookingCustomer: booking.customer?.customerName || 'אורח',
        });
      });
    });

    // Extra expenses from bookings
    monthBookings.forEach((booking) => {
      if (booking.extraExpenses > 0) {
        rows.push({
          id: `extra-${booking.id}`,
          description: 'הוצאות נוספות',
          category: 'הוצאות נוספות',
          amount: booking.extraExpenses,
          date: booking.startDate,
          type: 'extra',
          roomName: rooms.find((r) => r.id === booking.roomId)?.name,
          bookingCustomer: booking.customer?.customerName || 'אורח',
        });
      }
    });

    // Custom expenses
    monthExpenses.forEach((expense) => {
      rows.push({
        id: `expense-${expense.id}`,
        description: expense.description,
        category: expense.type === 'hotel' ? 'הוצאה כללית' : expense.type === 'room' ? 'הוצאת חדר' : expense.type === 'booking' ? 'הוצאת הזמנה' : 'מותאם אישית',
        amount: expense.amount,
        date: expense.date,
        type: 'custom',
        roomName: expense.roomId ? rooms.find((r) => r.id === expense.roomId)?.name : undefined,
      });
    });

    // Filter rows
    if (filterType === 'all') {
      return rows;
    }
    return rows.filter((row) => row.type === filterType);
  }, [monthBookings, monthExpenses, rooms, filterType]);

  const handleOpenDeleteExpense = (rowId: string) => {
    if (rowId.startsWith('expense-')) {
      setExpenseToDeleteId(rowId.replace('expense-', ''));
      setDeleteExpenseDialogOpen(true);
    }
  };

  const handleConfirmDeleteExpense = () => {
    if (expenseToDeleteId) {
      deleteExpense(expenseToDeleteId);
      toast.success('✅ הוצאה נמחקה בהצלחה!');
      setExpenseToDeleteId(null);
    }
  };

  const getCategoryBadgeColor = (type: string) => {
    switch (type) {
      case 'room':
        return 'bg-blue-400/10 text-blue-400 border-blue-400/30';
      case 'hotel':
        return 'bg-purple-400/10 text-purple-400 border-purple-400/30';
      case 'extra':
        return 'bg-orange-400/10 text-orange-400 border-orange-400/30';
      case 'custom':
        return 'bg-primary/10 text-primary border-primary/30';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/30';
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="ניהול פיננסי"
        description="סקירה מלאה של הכנסות והוצאות"
      >
        <MonthSelector />
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="הכנסות"
          value={`₪${totalIncome.toFixed(2)}`}
          icon={DollarSign}
        />
        <StatCard
          title="הוצאות"
          value={`₪${totalExpenses.toFixed(2)}`}
          icon={TrendingDown}
        />
        <StatCard
          title="רווח נקי"
          value={`₪${netProfit.toFixed(2)}`}
          icon={TrendingUp}
        />
        <StatCard
          title="שולי רווח"
          value={`${profitMargin}%`}
          icon={BarChart3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard className="p-8 space-y-6 border-primary/25 ">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-foreground tracking-wide">ניתוח הכנסות</h3>
              <p className="text-sm text-muted-foreground mt-1">אנליטיקס</p>
            </div>
            <div className="glass-card p-4 rounded-xl border-primary/30">
              <PieChart className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="space-y-4 mt-6">
            <div className="glass-card p-6 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">הכנסות</span>
                <span className="text-2xl font-bold text-primary ">
                  ₪{totalIncome.toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                הזמנות: {monthBookings.length}
              </div>
            </div>

            <div className="h-48 glass-card rounded-xl border-primary/20 flex items-center justify-center bg-gradient-to-br from-background to-primary/5">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-primary/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">אנליטיקס</p>
                <p className="text-xs text-muted-foreground mt-1">UI Placeholder</p>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-8 space-y-6 border-primary/25 ">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-foreground tracking-wide">ניתוח הוצאות</h3>
              <p className="text-sm text-muted-foreground mt-1">אנליטיקס</p>
            </div>
            <div className="glass-card p-4 rounded-xl border-primary/30">
              <TrendingDown className="w-8 h-8 text-destructive" />
            </div>
          </div>

          <div className="space-y-3 mt-6">
            <div className="glass-card p-5 rounded-lg border-primary/20 hover:border-primary/30 transition-all">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">עלויות חדר</span>
                <span className="text-lg font-bold text-destructive">₪{totalRoomExpenses.toFixed(2)}</span>
              </div>
            </div>

            <div className="glass-card p-5 rounded-lg border-primary/20 hover:border-primary/30 transition-all">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">עלויות מלון בהזמנות</span>
                <span className="text-lg font-bold text-destructive">₪{totalHotelExpenses.toFixed(2)}</span>
              </div>
            </div>

            <div className="glass-card p-5 rounded-lg border-primary/20 hover:border-primary/30 transition-all">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">עלויות מלון חודשיות</span>
                <span className="text-lg font-bold text-destructive">₪{monthlyHotelCosts.toFixed(2)}</span>
              </div>
            </div>

            <div className="glass-card p-5 rounded-lg border-primary/20 hover:border-primary/30 transition-all">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">הוצאות נוספות</span>
                <span className="text-lg font-bold text-destructive">₪{totalExtraExpenses.toFixed(2)}</span>
              </div>
            </div>

            <div className="glass-card p-5 rounded-lg border-primary/20 hover:border-primary/30 transition-all">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">הוצאות ידניות</span>
                <span className="text-lg font-bold text-destructive">₪{totalExpensesFromExpenses.toFixed(2)}</span>
              </div>
            </div>

            <div className="glass-card p-5 rounded-xl bg-gradient-to-br from-destructive/5 to-transparent border-destructive/30 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-base font-semibold text-foreground">סה"כ הוצאות</span>
                <span className="text-2xl font-bold text-destructive">₪{totalExpenses.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-8 border-primary/25 ">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-foreground tracking-wide">הוצאות</h3>
            <p className="text-sm text-muted-foreground mt-1">ניהול פיננסי מלא</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                <SelectTrigger className="glass-card border-primary/30 h-10 w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card border-primary/30">
                  <SelectItem value="all">הכל</SelectItem>
                  <SelectItem value="room">עלויות חדר</SelectItem>
                  <SelectItem value="hotel">עלויות מלון</SelectItem>
                  <SelectItem value="extra">הוצאות נוספות</SelectItem>
                  <SelectItem value="custom">הוצאות ידניות</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <GlowButton 
              onClick={() => setIsExpenseDialogOpen(true)}
              className=""
            >
              <Plus className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
              הוסף הוצאה
            </GlowButton>
          </div>
        </div>

        {expenseRows.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="אין הוצאות"
            description="התחל בהוספת הוצאות חדשות"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary/20">
                  <th className="text-right rtl:text-left px-4 py-4 text-sm font-semibold text-muted-foreground tracking-wide w-12">
                    {' '}
                  </th>
                  <th className="text-right rtl:text-left px-4 py-4 text-sm font-semibold text-muted-foreground tracking-wide">
                    תיאור
                  </th>
                  <th className="text-right rtl:text-left px-4 py-4 text-sm font-semibold text-muted-foreground tracking-wide">
                    קטגוריה
                  </th>
                  <th className="text-right rtl:text-left px-4 py-4 text-sm font-semibold text-muted-foreground tracking-wide">
                    חדר / אורח
                  </th>
                  <th className="text-right rtl:text-left px-4 py-4 text-sm font-semibold text-muted-foreground tracking-wide">
                    סכום
                  </th>
                  <th className="text-right rtl:text-left px-4 py-4 text-sm font-semibold text-muted-foreground tracking-wide">
                    תאריך
                  </th>
                </tr>
              </thead>
              <tbody>
                {expenseRows.map((row) => (
                  <tr 
                    key={row.id} 
                    className={`border-b border-primary/10 hover:bg-primary/5 transition-colors group ${row.type === 'custom' ? 'bg-primary/5' : ''}`}
                  >
                    <td className="px-4 py-4">
                      {row.type === 'custom' && row.id.startsWith('expense-') ? (
                        <button
                          onClick={() => handleOpenDeleteExpense(row.id)}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-opacity duration-200"
                          aria-label="מחק הוצאה"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      ) : (
                        <span className="w-6 inline-block" />
                      )}
                    </td>
                    <td className="px-4 py-4 text-foreground font-medium">{row.description}</td>
                    <td className="px-4 py-4">
                      <Badge className={`${getCategoryBadgeColor(row.type)} border`}>
                        {row.category}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground text-sm">
                      {row.roomName && <span className="font-medium">{row.roomName}</span>}
                      {row.bookingCustomer && <span className="text-xs block">{row.bookingCustomer}</span>}
                      {!row.roomName && !row.bookingCustomer && '-'}
                    </td>
                    <td className="px-4 py-4 text-destructive font-bold">₪{row.amount.toFixed(2)}</td>
                    <td className="px-4 py-4 text-muted-foreground text-sm">{format(new Date(row.date), 'dd/MM/yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-8 border-primary/40  bg-gradient-to-br from-primary/8 via-primary/4 to-transparent">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-primary tracking-wide ">
              סקירת רווחיות
            </h3>
            <p className="text-sm text-muted-foreground mt-1">רווח חודשי</p>
          </div>
          <div className="glass-card p-4 rounded-xl border-primary/40">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-xl border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
            <p className="text-sm text-muted-foreground mb-2">הכנסות</p>
            <p className="text-3xl font-bold text-primary ">
              ₪{totalIncome.toFixed(2)}
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl border-destructive/30 bg-gradient-to-br from-destructive/10 to-transparent">
            <p className="text-sm text-muted-foreground mb-2">הוצאות</p>
            <p className="text-3xl font-bold text-destructive">
              ₪{totalExpenses.toFixed(2)}
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl border-primary/40 bg-gradient-to-br from-primary/15 to-transparent">
            <p className="text-sm text-muted-foreground mb-2">רווח</p>
            <p className="text-4xl font-bold text-primary ">
              ₪{netProfit.toFixed(2)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {netProfit > 0 ? (
                <TrendingUp className="w-4 h-4 text-primary" />
              ) : netProfit < 0 ? (
                <TrendingDown className="w-4 h-4 text-destructive" />
              ) : null}
              <span className="text-xs text-muted-foreground">{profitMargin}%</span>
            </div>
          </div>
        </div>
      </GlassCard>

      <ExpenseDialog
        open={isExpenseDialogOpen}
        onClose={() => setIsExpenseDialogOpen(false)}
      />
      <ConfirmDeleteDialog
        open={deleteExpenseDialogOpen}
        onOpenChange={(open) => {
          setDeleteExpenseDialogOpen(open);
          if (!open) setExpenseToDeleteId(null);
        }}
        title="מחיקת הוצאה"
        description="האם אתה בטוח שברצונך למחוק הוצאה זו?"
        onConfirm={handleConfirmDeleteExpense}
      />
    </div>
  );
}