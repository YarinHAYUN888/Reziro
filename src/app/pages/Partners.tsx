import React, { useState, useMemo } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { GlassCard } from '../components/shared/GlassCard';
import { GlowButton } from '../components/shared/GlowButton';
import { StatCard } from '../components/shared/StatCard';
import { useAppStore } from '../../store/useAppStore';
import { Plus, Edit2, Power, Trash2, Users, DollarSign, TrendingUp, Award, Phone, Mail, MapPin, Percent, Store, Utensils, Sparkles, ShoppingBag, Compass, Flag } from 'lucide-react';
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
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import type { Partner } from '../../types/models';
import { format } from 'date-fns';
import { UnsavedChangesConfirmDialog } from '../components/shared/UnsavedChangesConfirmDialog';

const partnerTypeIcons = {
  restaurant: Utensils,
  spa: Sparkles,
  shop: ShoppingBag,
  tour: Compass,
  attraction: Flag,
  other: Store,
};

const partnerTypeLabels = {
  restaurant: 'מסעדה',
  spa: 'ספא',
  shop: 'חנות',
  tour: 'סיור',
  attraction: 'אטרקציה',
  other: 'אחר',
};

// --- כאן בוצע השינוי: הוספת המילה default ---
export default function Partners() {
  const partners = useAppStore((state) => state.partners);
  const bookings = useAppStore((state) => state.bookings);
  const manualReferrals = useAppStore((state) => state.manualReferrals);
  const addPartner = useAppStore((state) => state.addPartner);
  const updatePartner = useAppStore((state) => state.updatePartner);
  const togglePartnerActive = useAppStore((state) => state.togglePartnerActive);
  const deletePartner = useAppStore((state) => state.deletePartner);
  const getAllPartnersStats = useAppStore((state) => state.getAllPartnersStats);
  const addManualReferral = useAppStore((state) => state.addManualReferral);
  const selectedMonthKey = useAppStore((state) => state.selectedMonthKey);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [referralDialogOpen, setReferralDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  
  // Partner form fields
  const [name, setName] = useState('');
  const [type, setType] = useState<Partner['type']>('restaurant');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [commissionType, setCommissionType] = useState<'percentage' | 'fixed'>('fixed');
  const [commissionValue, setCommissionValue] = useState(50);
  const [discountForGuests, setDiscountForGuests] = useState(0);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  // Manual referral fields
  const [referralPartnerId, setReferralPartnerId] = useState('');
  const [referralGuests, setReferralGuests] = useState(1);
  const [referralDate, setReferralDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [referralNotes, setReferralNotes] = useState('');
  const [orderAmount, setOrderAmount] = useState(0);

  const [partnerDialogDirty, setPartnerDialogDirty] = useState(false);
  const [partnerConfirmOpen, setPartnerConfirmOpen] = useState(false);
  const [referralDialogDirty, setReferralDialogDirty] = useState(false);
  const [referralConfirmOpen, setReferralConfirmOpen] = useState(false);

  // Calculate statistics with proper dependencies
  const allStats = useMemo(() => {
    return getAllPartnersStats(selectedMonthKey);
  }, [partners, bookings, manualReferrals, selectedMonthKey, getAllPartnersStats]);

  const totalPartners = partners.filter((p) => p.isActive).length;
  const totalRevenue = allStats.reduce((sum, s) => sum + s.totalRevenue, 0);
  const totalReferrals = allStats.reduce((sum, s) => sum + s.totalReferrals, 0);
  
  const topPartner = useMemo(() => {
    const sorted = [...allStats].sort((a, b) => b.totalRevenue - a.totalRevenue);
    if (sorted.length === 0) return null;
    const partnerId = sorted[0].partnerId;
    return partners.find((p) => p.id === partnerId);
  }, [allStats, partners]);

  // Calculate commission preview
  const commissionPreview = useMemo(() => {
    if (!referralPartnerId || referralGuests <= 0) return 0;
    
    const partner = partners.find((p) => p.id === referralPartnerId);
    if (!partner) return 0;

    if (partner.commissionType === 'fixed') {
      return partner.commissionValue * referralGuests;
    } else {
      if (orderAmount <= 0) return 0;
      const totalOrderAmount = orderAmount * referralGuests;
      return totalOrderAmount * (partner.commissionValue / 100);
    }
  }, [referralPartnerId, referralGuests, partners, orderAmount]);

  const selectedPartner = useMemo(() => {
    return partners.find((p) => p.id === referralPartnerId);
  }, [referralPartnerId, partners]);

  const handleOpenDialog = (partner?: Partner) => {
    if (partner) {
      setEditingPartner(partner);
      setName(partner.name);
      setType(partner.type);
      setPhone(partner.phone);
      setEmail(partner.email);
      setCommissionType(partner.commissionType);
      setCommissionValue(partner.commissionValue);
      setDiscountForGuests(partner.discountForGuests || 0);
      setLocation(partner.location || '');
      setNotes(partner.notes || '');
    } else {
      setEditingPartner(null);
      setName('');
      setType('restaurant');
      setPhone('');
      setEmail('');
      setCommissionType('fixed');
      setCommissionValue(50);
      setDiscountForGuests(0);
      setLocation('');
      setNotes('');
    }
    setPartnerDialogDirty(false);
    setPartnerConfirmOpen(false);
    setDialogOpen(true);
  };

  const handleClosePartnerDialog = () => {
    if (partnerDialogDirty) {
      setPartnerConfirmOpen(true);
    } else {
      setDialogOpen(false);
    }
  };

  const handleSave = () => {
    if (!name || !phone || !email) {
      toast.error('נא למלא את כל השדות הנדרשים');
      return;
    }

    if (commissionValue < 0) {
      toast.error('ערך עמלה חייב להיות חיובי');
      return;
    }

    if (editingPartner) {
      updatePartner(editingPartner.id, { 
        name, 
        type,
        phone, 
        email, 
        commissionType,
        commissionValue,
        discountForGuests: discountForGuests > 0 ? discountForGuests : undefined,
        location: location || undefined,
        notes: notes || undefined,
      });
      toast.success('✅ שותף עסקי עודכן בהצלחה!');
    } else {
      addPartner({ 
        name, 
        type,
        phone, 
        email, 
        commissionType,
        commissionValue,
        discountForGuests: discountForGuests > 0 ? discountForGuests : undefined,
        location: location || undefined,
        notes: notes || undefined,
      });
      toast.success('✅ שותף עסקי נוסף בהצלחה!');
    }

    setPartnerDialogDirty(false);
    setDialogOpen(false);
  };

  const handleToggleActive = (id: string) => {
    togglePartnerActive(id);
    toast.success('✅ סטטוס עודכן!');
  };

  const handleDelete = (id: string) => {
    if (confirm('האם למחוק שותף זה?')) {
      deletePartner(id);
      toast.success('✅ שותף נמחק!');
    }
  };

  const handleOpenReferralDialog = () => {
    setReferralPartnerId('');
    setReferralGuests(1);
    setReferralDate(format(new Date(), 'yyyy-MM-dd'));
    setReferralNotes('');
    setOrderAmount(0);
    setReferralDialogDirty(false);
    setReferralConfirmOpen(false);
    setReferralDialogOpen(true);
  };

  const handleCloseReferralDialog = () => {
    if (referralDialogDirty) {
      setReferralConfirmOpen(true);
    } else {
      setReferralDialogOpen(false);
    }
  };

  const handleSaveReferral = () => {
    if (!referralPartnerId || referralGuests <= 0) {
      toast.error('נא למלא את כל השדות הנדרשים');
      return;
    }

    const partner = partners.find((p) => p.id === referralPartnerId);
    if (partner && partner.commissionType === 'percentage' && orderAmount <= 0) {
      toast.error('נא להזין סכום הזמנה');
      return;
    }

    const orderTotal = orderAmount * referralGuests;

    addManualReferral({
      partnerId: referralPartnerId,
      guestsCount: referralGuests,
      date: referralDate,
      notes: referralNotes || undefined,
      orderAmount: orderAmount > 0 ? orderAmount : undefined,
      commissionEarned: commissionPreview,
    });    
  

    toast.success('✅ הפניה נרשמה בהצלחה!');
    setReferralDialogDirty(false);
    setReferralDialogOpen(false);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="שותפים עסקיים"
        description="המלון מרוויח מהפניות לשותפים"
      />

      {/* Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="סה״כ שותפים"
          value={totalPartners.toString()}
          icon={Users}
        />
        <StatCard
          title="הכנסות מלון משותפים"
          value={`₪${totalRevenue.toFixed(2)}`}
          icon={DollarSign}
        />
        <StatCard
          title="סה״כ הפניות"
          value={totalReferrals.toString()}
          icon={TrendingUp}
        />
        <StatCard
          title="שותף מוביל"
          value={topPartner?.name || '-'}
          icon={Award}
        />
      </div>

      {/* Partners Table */}
      <GlassCard className="border-primary/30  p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-primary ">
              רשימת שותפים עסקיים
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              עסקים שהמלון מפנה אליהם אורחים ומרוויח עמלה
            </p>
          </div>
          <div className="flex gap-3">
            <GlowButton
              onClick={handleOpenReferralDialog}
              className="h-12 px-6 shadow-[0_0_20px_rgba(124,255,58,0.3)] hover:shadow-[0_0_30px_rgba(124,255,58,0.5)] cursor-pointer font-bold"
            >
              <Plus className="w-5 h-5 mr-2" />
              רשום הפניה
            </GlowButton>
            <GlowButton
              onClick={() => handleOpenDialog()}
              className="h-12 px-6 shadow-[0_0_20px_rgba(124,255,58,0.3)] hover:shadow-[0_0_30px_rgba(124,255,58,0.5)] cursor-pointer font-bold"
            >
              <Plus className="w-5 h-5 mr-2" />
              הוסף שותף
            </GlowButton>
          </div>
        </div>

        {partners.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-primary/30 mx-auto mb-4" />
            <p className="text-xl text-muted-foreground mb-2">אין שותפים עסקיים</p>
            <p className="text-sm text-muted-foreground">התחל בהוספת שותף עסקי ראשון</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-primary/30">
                  <th className="text-start py-6 px-6 text-xs font-black text-muted-foreground uppercase tracking-widest">
                    שם העסק
                  </th>
                  <th className="text-start py-6 px-6 text-xs font-black text-muted-foreground uppercase tracking-widest">
                    סוג
                  </th>
                  <th className="text-start py-6 px-6 text-xs font-black text-muted-foreground uppercase tracking-widest">
                    פרטי התקשרות
                  </th>
                  <th className="text-center py-6 px-6 text-xs font-black text-muted-foreground uppercase tracking-widest">
                    עמלה למלון
                  </th>
                  <th className="text-end py-6 px-6 text-xs font-black text-muted-foreground uppercase tracking-widest">
                    הכנסות מלון
                  </th>
                  <th className="text-center py-6 px-6 text-xs font-black text-muted-foreground uppercase tracking-widest">
                    הפניות
                  </th>
                  <th className="text-center py-6 px-6 text-xs font-black text-muted-foreground uppercase tracking-widest">
                    סטטוס
                  </th>
                  <th className="text-center py-6 px-6 text-xs font-black text-muted-foreground uppercase tracking-widest">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody>
                {partners.map((partner) => {
                  const stats = allStats.find((s) => s.partnerId === partner.id);
                  const TypeIcon = partnerTypeIcons[partner.type];
                  return (
                    <tr
                      key={partner.id}
                      className={`border-b border-border/40 hover:bg-primary/5 transition-all duration-300 ${
                        !partner.isActive ? 'opacity-50' : ''
                      }`}
                    >
                      <td className="py-6 px-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
                            <TypeIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-lg">{partner.name}</p>
                            {partner.location && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <MapPin className="w-3 h-3" />
                                <span>{partner.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-6">
                        <Badge className="bg-primary/10 text-primary border-primary/30">
                          {partnerTypeLabels[partner.type]}
                        </Badge>
                      </td>
                      <td className="py-6 px-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            <span>{partner.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[200px]">{partner.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-6 text-center">
                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/30">
                          {partner.commissionType === 'percentage' ? (
                            <>
                              <Percent className="w-3 h-3 text-primary" />
                              <span className="font-bold text-primary">{partner.commissionValue}%</span>
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-3 h-3 text-primary" />
                              <span className="font-bold text-primary">₪{partner.commissionValue}</span>
                            </>
                          )}
                        </div>
                        {partner.discountForGuests && partner.discountForGuests > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            הנחה: {partner.discountForGuests}%
                          </p>
                        )}
                      </td>
                      <td className="py-6 px-6 text-end">
                        <span className="font-black text-xl text-primary tabular-nums">
                          ₪{stats?.totalRevenue.toFixed(2) || '0.00'}
                        </span>
                      </td>
                      <td className="py-6 px-6 text-center">
                        <div className="space-y-1">
                          <span className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-primary/15 text-base font-black text-primary">
                            {stats?.totalReferrals || 0}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {stats?.totalGuests || 0} אורחים
                          </p>
                        </div>
                      </td>
                      <td className="py-6 px-6 text-center">
                        <Badge
                          className={
                            partner.isActive
                              ? 'bg-primary/10 text-primary border-primary/30'
                              : 'bg-muted/10 text-muted-foreground border-muted/30'
                          }
                        >
                          {partner.isActive ? 'פעיל' : 'לא פעיל'}
                        </Badge>
                      </td>
                      <td className="py-6 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenDialog(partner)}
                            className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
                            title="עריכה"
                          >
                            <Edit2 className="w-4 h-4 text-primary" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(partner.id)}
                            className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
                            title={partner.isActive ? 'השבת' : 'הפעל'}
                          >
                            <Power
                              className={`w-4 h-4 ${
                                partner.isActive ? 'text-primary' : 'text-muted-foreground'
                              }`}
                            />
                          </button>
                          <button
                            onClick={() => handleDelete(partner.id)}
                            className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                            title="מחק"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Add/Edit Partner Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(nextOpen) => { if (!nextOpen) handleClosePartnerDialog(); }}>
        <DialogContent
          className="glass-card border-primary/30  max-w-3xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">
              {editingPartner ? 'עריכת שותף עסקי' : 'הוספת שותף עסקי חדש'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              עסק שהמלון מפנה אליו אורחים ומרוויח עמלה
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground font-semibold">
                  שם העסק <span className="text-primary">*</span>
                </Label>
                <Input
                  value={name}
                  onChange={(e) => { setName(e.target.value); setPartnerDialogDirty(true); }}
                  placeholder="מסעדת טאבון"
                  className="glass-card border-primary/30 h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-semibold">
                  סוג עסק <span className="text-primary">*</span>
                </Label>
                <Select value={type} onValueChange={(v) => { setType(v as Partner['type']); setPartnerDialogDirty(true); }}>
                  <SelectTrigger className="glass-card border-primary/30 h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-primary/30">
                    {Object.entries(partnerTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground font-semibold">
                  טלפון <span className="text-primary">*</span>
                </Label>
                <Input
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setPartnerDialogDirty(true); }}
                  placeholder="054-XXXXXXX"
                  className="glass-card border-primary/30 h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-semibold">
                  אימייל <span className="text-primary">*</span>
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setPartnerDialogDirty(true); }}
                  placeholder="business@email.com"
                  className="glass-card border-primary/30 h-12"
                />
              </div>
            </div>

            <div className="space-y-4 glass-card border-primary/20 p-4 rounded-xl bg-primary/5">
              <Label className="text-foreground font-bold text-base">
                עמלה שהמלון מרוויח <span className="text-primary">*</span>
              </Label>
              
              <RadioGroup value={commissionType} onValueChange={(v) => { setCommissionType(v as 'percentage' | 'fixed'); setPartnerDialogDirty(true); }}>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="fixed" id="fixed" />
                  <Label htmlFor="fixed" className="cursor-pointer">סכום קבוע (₪) להפניה</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="percentage" id="percentage" />
                  <Label htmlFor="percentage" className="cursor-pointer">אחוזים (%) מההזמנה</Label>
                </div>
              </RadioGroup>

              <div className="space-y-2">
                <Label className="text-foreground font-semibold">
                  {commissionType === 'fixed' ? 'סכום (₪)' : 'אחוזים (%)'}
                </Label>
                <Input
                  type="number"
                  value={commissionValue}
                  onChange={(e) => { setCommissionValue(Number(e.target.value)); setPartnerDialogDirty(true); }}
                  placeholder={commissionType === 'fixed' ? '50' : '15'}
                  className="glass-card border-primary/30 h-12"
                  min={0}
                />
                <p className="text-xs text-muted-foreground">
                  {commissionType === 'fixed' 
                    ? `המלון ירוויח ₪${commissionValue} על כל הפניה`
                    : `המלון ירוויח ${commissionValue}% מסכום ההזמנה`
                  }
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-semibold">
                הנחה לאורחים (%) - אופציונלי
              </Label>
              <Input
                type="number"
                value={discountForGuests}
                onChange={(e) => { setDiscountForGuests(Number(e.target.value)); setPartnerDialogDirty(true); }}
                placeholder="10"
                className="glass-card border-primary/30 h-12"
                min={0}
                max={100}
              />
              <p className="text-xs text-muted-foreground">
                {discountForGuests > 0 
                  ? `האורחים יקבלו ${discountForGuests}% הנחה בעסק`
                  : 'אין הנחה לאורחים'
                }
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-semibold">מיקום (אופציונלי)</Label>
            <Input
              value={location}
              onChange={(e) => { setLocation(e.target.value); setPartnerDialogDirty(true); }}
              placeholder="רחוב בן יהודה 15, ירושלים"
                className="glass-card border-primary/30 h-12"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-semibold">הערות (אופציונלי)</Label>
              <Textarea
                value={notes}
                onChange={(e) => { setNotes(e.target.value); setPartnerDialogDirty(true); }}
                placeholder="הערות נוספות על השותף..."
                className="glass-card border-primary/30 min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={handleClosePartnerDialog}
              className="glass-button border-primary/30 h-12 px-6"
            >
              ביטול
            </Button>
            <GlowButton onClick={handleSave} className="h-12 px-6">
              {editingPartner ? 'עדכן' : 'הוסף'}
            </GlowButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UnsavedChangesConfirmDialog
        open={partnerConfirmOpen}
        onOpenChange={setPartnerConfirmOpen}
        onConfirmLeave={() => { setPartnerConfirmOpen(false); setDialogOpen(false); }}
      />

      {/* Manual Referral Dialog */}
      <Dialog open={referralDialogOpen} onOpenChange={(nextOpen) => { if (!nextOpen) handleCloseReferralDialog(); }}>
        <DialogContent
          className="glass-card border-primary/30  max-w-xl"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">
              רישום הפניה ידנית
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              רשום הפניה שלא קשורה להזמנה ספציפית
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-foreground font-semibold">
                בחר שותף <span className="text-primary">*</span>
              </Label>
              <Select value={referralPartnerId} onValueChange={(v) => { setReferralPartnerId(v); setReferralDialogDirty(true); }}>
                <SelectTrigger className="glass-card border-primary/30 h-12">
                  <SelectValue placeholder="בחר שותף עסקי" />
                </SelectTrigger>
                <SelectContent className="glass-card border-primary/30">
                  {partners.filter((p) => p.isActive).map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.name} ({partnerTypeLabels[partner.type]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground font-semibold">
                  כמות אורחים <span className="text-primary">*</span>
                </Label>
                <Input
                  type="number"
                  value={referralGuests}
                  onChange={(e) => { setReferralGuests(Number(e.target.value)); setReferralDialogDirty(true); }}
                  min={1}
                  className="glass-card border-primary/30 h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-semibold">
                  תאריך <span className="text-primary">*</span>
                </Label>
                <Input
                  type="date"
                  value={referralDate}
                  onChange={(e) => { setReferralDate(e.target.value); setReferralDialogDirty(true); }}
                  className="glass-card border-primary/30 h-12"
                />
              </div>
            </div>

            {selectedPartner && selectedPartner.commissionType === 'percentage' && (
              <div className="space-y-2">
                <Label className="text-foreground font-semibold">
                  סכום הזמנה לאורח (₪) <span className="text-primary">*</span>
                </Label>
                <Input
                  type="number"
                  value={orderAmount}
                  onChange={(e) => { setOrderAmount(Number(e.target.value)); setReferralDialogDirty(true); }}
                  min={0}
                  placeholder="100"
                  className="glass-card border-primary/30 h-12"
                />
                <p className="text-xs text-muted-foreground">
                  כמה כל אורח הוציא בעסק? (יוכפל במספר האורחים)
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-foreground font-semibold">הערות (אופציונלי)</Label>
              <Textarea
                value={referralNotes}
                onChange={(e) => { setReferralNotes(e.target.value); setReferralDialogDirty(true); }}
                placeholder="הערות על ההפניה..."
                className="glass-card border-primary/30 min-h-[60px]"
              />
            </div>

            {selectedPartner && commissionPreview > 0 && (
              <div className="glass-card border-primary/20 p-4 rounded-lg bg-primary/5">
                <p className="text-sm text-muted-foreground mb-2">עמלה למלון:</p>
                <p className="text-3xl font-bold text-primary">
                  ₪{commissionPreview.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedPartner.commissionType === 'fixed' 
                    ? `₪${selectedPartner.commissionValue} × ${referralGuests} אורחים`
                    : `(₪${orderAmount} × ${referralGuests} אורחים) × ${selectedPartner.commissionValue}%`
                  }
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={handleCloseReferralDialog}
              className="glass-button border-primary/30 h-12 px-6"
            >
              ביטול
            </Button>
            <GlowButton onClick={handleSaveReferral} className="h-12 px-6">
              רשום הפניה
            </GlowButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UnsavedChangesConfirmDialog
        open={referralConfirmOpen}
        onOpenChange={setReferralConfirmOpen}
        onConfirmLeave={() => { setReferralConfirmOpen(false); setReferralDialogOpen(false); }}
      />
    </div>
  );
}