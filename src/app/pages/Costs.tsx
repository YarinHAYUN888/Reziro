import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/layout/PageHeader';
import { MonthSelector } from '../components/shared/MonthSelector';
import { GlassCard } from '../components/shared/GlassCard';
import { GlowButton } from '../components/shared/GlowButton';
import { ConfirmDeleteDialog } from '../components/shared/ConfirmDeleteDialog';
import { EditRoomCostDialog } from '../components/shared/EditRoomCostDialog';
import { AddRoomCostDialog } from '../components/shared/AddRoomCostDialog';
import { UnsavedChangesConfirmDialog } from '../components/shared/UnsavedChangesConfirmDialog';
import { useAppStore } from '../../store/useAppStore';
import { Plus, Edit2, Power, Trash2, Building2, Users, Zap, Droplet, Wrench, Sparkles, MoreHorizontal } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import type { HotelCost, CostCatalogItem } from '../../types/models';
import { DEFAULT_ROOM_COSTS } from '../../data/defaultRoomCosts';
import { hotelCostMatchesPeriod, getPeriodKeyFromMonth, FREQUENCY_LABELS } from '../../utils/periodUtils';
import type { HotelCostFrequency } from '../../types/models';

const categoryIcons: Record<HotelCost['category'], any> = {
  employees: Users,
  arnona: Building2,
  electricity: Zap,
  water: Droplet,
  maintenance: Wrench,
  cleaning: Sparkles,
  room_rent: Building2,
  other: MoreHorizontal,
};

const categoryLabels: Record<HotelCost['category'], string> = {
  employees: 'עובדים',
  arnona: 'ארנונה',
  electricity: 'חשמל',
  water: 'מים',
  maintenance: 'תחזוקה',
  cleaning: 'ניקיון',
  room_rent: 'שכירות חדר',
  other: 'אחר',
};

const categoryColors: Record<HotelCost['category'], string> = {
  employees: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  arnona: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
  electricity: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  water: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
  maintenance: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
  cleaning: 'text-green-400 border-green-400/30 bg-green-400/10',
  room_rent: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  other: 'text-gray-400 border-gray-400/30 bg-gray-400/10',
};

export function Costs() {
  const { t } = useTranslation();
  const costCatalog = useAppStore((state) => state.costCatalog);
  const hotelCosts = useAppStore((state) => state.hotelCosts);
  const selectedMonthKey = useAppStore((state) => state.selectedMonthKey);
  const addHotelCost = useAppStore((state) => state.addHotelCost);
  const updateHotelCost = useAppStore((state) => state.updateHotelCost);
  const toggleHotelCostActive = useAppStore((state) => state.toggleHotelCostActive);
  const deleteHotelCost = useAppStore((state) => state.deleteHotelCost);
  const updateCostCatalogItem = useAppStore((state) => state.updateCostCatalogItem);
  const deleteCostCatalogItem = useAppStore((state) => state.deleteCostCatalogItem);
  const addCostCatalogItem = useAppStore((state) => state.addCostCatalogItem);
  const rooms = useAppStore((state) => state.rooms);
  const storage = useAppStore((state) => state.storage);

  const hotelCostsForPeriod = hotelCosts.filter((c) => hotelCostMatchesPeriod(c, selectedMonthKey));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [addRoomCostDialogOpen, setAddRoomCostDialogOpen] = useState(false);
  const [addRoomCostLoading, setAddRoomCostLoading] = useState(false);
  const [roomCostEditDialogOpen, setRoomCostEditDialogOpen] = useState(false);
  const [editingRoomCost, setEditingRoomCost] = useState<CostCatalogItem | null>(null);
  const [hotelCostDeleteDialogOpen, setHotelCostDeleteDialogOpen] = useState(false);
  const [deletingHotelCostId, setDeletingHotelCostId] = useState<string | null>(null);
  const [roomCostDeleteDialogOpen, setRoomCostDeleteDialogOpen] = useState(false);
  const [deletingRoomCostId, setDeletingRoomCostId] = useState<string | null>(null);
  const [editingCost, setEditingCost] = useState<HotelCost | null>(null);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState<HotelCost['category']>('other');
  const [frequencyType, setFrequencyType] = useState<HotelCostFrequency>('monthly');
  const [hotelCostDialogDirty, setHotelCostDialogDirty] = useState(false);
  const [hotelCostConfirmOpen, setHotelCostConfirmOpen] = useState(false);

  const roomCosts = (costCatalog.length > 0 ? costCatalog : DEFAULT_ROOM_COSTS).filter(
    (c) => c.type === 'room'
  );

  useEffect(() => {
    if (costCatalog.length === 0 && rooms.length > 0) {
      useAppStore.setState({ costCatalog: DEFAULT_ROOM_COSTS });
      useAppStore.getState().storage?.saveState?.(useAppStore.getState());
    }
  }, [costCatalog.length, rooms.length]);  
  const totalMonthlyHotelCosts = hotelCostsForPeriod
    .filter((c) => c.isActive)
    .reduce((sum, c) => sum + c.amount, 0);

  const handleOpenDialog = (cost?: HotelCost) => {
    if (cost) {
      setEditingCost(cost);
      setLabel(cost.label);
      setAmount(cost.amount);
      setCategory(cost.category);
      setFrequencyType(cost.frequencyType ?? 'monthly');
    } else {
      setEditingCost(null);
      setLabel('');
      setAmount(0);
      setCategory('other');
      setFrequencyType('monthly');
    }
    setHotelCostDialogDirty(false);
    setHotelCostConfirmOpen(false);
    setDialogOpen(true);
  };

  const handleCloseHotelCostDialog = () => {
    if (hotelCostDialogDirty) {
      setHotelCostConfirmOpen(true);
    } else {
      setDialogOpen(false);
    }
  };

  const handleSave = () => {
    if (!label || amount <= 0) {
      toast.error('נא למלא את כל השדות');
      return;
    }

    if (editingCost) {
      updateHotelCost(editingCost.id, { label, amount, category });
      toast.success('✅ עלות עודכנה בהצלחה!');
    } else {
      const periodKey = getPeriodKeyFromMonth(selectedMonthKey, frequencyType);
      addHotelCost({ label, amount, category, frequencyType, periodKey });
      toast.success('✅ עלות נוספה בהצלחה!');
    }

    setHotelCostDialogDirty(false);
    setDialogOpen(false);
  };

  const handleToggleActive = (id: string) => {
    toggleHotelCostActive(id);
    toast.success('✅ סטטוס עודכן!');
  };

  const handleOpenHotelCostDelete = (id: string) => {
    setDeletingHotelCostId(id);
    setHotelCostDeleteDialogOpen(true);
  };

  const handleConfirmHotelCostDelete = () => {
    if (deletingHotelCostId) {
      deleteHotelCost(deletingHotelCostId);
      toast.success('✅ עלות נמחקה!');
      setDeletingHotelCostId(null);
    }
  };

  const handleOpenRoomCostEdit = (cost: CostCatalogItem) => {
    setEditingRoomCost(cost);
    setRoomCostEditDialogOpen(true);
  };

  const handleSaveRoomCost = (data: { label: string; unitCost: number; defaultQty: number }) => {
    if (!editingRoomCost) return;
    updateCostCatalogItem(editingRoomCost.id, data);
    toast.success('✅ עלות חדר עודכנה בהצלחה!');
    setEditingRoomCost(null);
  };

  const handleOpenRoomCostDelete = (id: string) => {
    setDeletingRoomCostId(id);
    setRoomCostDeleteDialogOpen(true);
  };

  const handleConfirmRoomCostDelete = () => {
    if (deletingRoomCostId) {
      deleteCostCatalogItem(deletingRoomCostId);
      toast.success('✅ עלות חדר נמחקה!');
      setDeletingRoomCostId(null);
    }
  };

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const handleAddRoomCostSave = async (data: { label: string; unitCost: number; defaultQty: number }) => {
    const firstRoomId = rooms[0]?.id;
    if (!firstRoomId || !UUID_REGEX.test(firstRoomId)) {
      toast.error('צור לפחות חדר אחד לפני הוספת עלות חדר');
      return;
    }
    const item: CostCatalogItem = {
      id: crypto.randomUUID(),
      type: 'room',
      label: data.label,
      unitCost: data.unitCost,
      defaultQty: data.defaultQty,
      isActive: true,
    };
    setAddRoomCostLoading(true);
    try {
      if (storage?.addRoomCostNow) {
        await storage.addRoomCostNow(item, firstRoomId);
      }
      addCostCatalogItem(item);
      toast.success('✅ עלות חדר נוספה בהצלחה!');
      setAddRoomCostDialogOpen(false);
    } catch {
      // toast already shown by adapter
    } finally {
      setAddRoomCostLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="עלויות חדר ומלון"
        description="ניהול עלויות לפי חדר ועלויות כלליות למלון"
        action={<MonthSelector />}
      />

      <div className="container mx-auto px-4 lg:px-8 xl:px-12 2xl:px-16 max-w-[2200px]">
        <div className="space-y-12">
          
          {/* Room Costs Section */}
          <GlassCard className="border-primary/30  p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-primary ">
                  עלויות חדר
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  עלויות שמוחלות לכל הזמנה בנפרד
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddRoomCostDialogOpen(true)}
                className="inline-flex items-center justify-center w-11 h-11 rounded-full glass-card border border-primary/30 hover:border-primary/50 hover:bg-primary/10 text-primary transition-all duration-200 hover:scale-105 shadow-[0_0_15px_rgba(124,255,58,0.2)] hover:shadow-[0_0_25px_rgba(124,255,58,0.4)]"
                aria-label="הוסף עלות"
                title="הוסף עלות"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            

            {roomCosts.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">אין עלויות חדר פעילות</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {roomCosts.map((cost) => (
                  <div
                    key={cost.id}
                    className="glass-card border-primary/20 p-4 rounded-xl hover:border-primary/30 transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleOpenRoomCostEdit(cost)}
                          className="inline-flex items-center justify-center p-2 rounded-lg border border-primary/20 hover:border-primary/40 hover:bg-primary/10 text-primary transition-all duration-200"
                          aria-label="ערוך"
                          title="ערוך"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenRoomCostDelete(cost.id)}
                          className="inline-flex items-center justify-center p-2 rounded-lg border border-destructive/20 hover:border-destructive/40 hover:bg-destructive/10 text-destructive transition-all duration-200"
                          aria-label="מחק"
                          title="מחק"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">לכל יחידה</span>
                    </div>
                    <div className="text-right rtl:text-left mb-1">
                      <span className="text-xl font-bold text-primary">₪{cost.unitCost.toFixed(2)}</span>
                    </div>
                    <h3 className="text-base font-semibold text-foreground">{cost.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1">כמות ברירת מחדל: {cost.defaultQty}</p>
                  </div>
                ))}
              </div>
            )}
            <AddRoomCostDialog
              open={addRoomCostDialogOpen}
              onOpenChange={setAddRoomCostDialogOpen}
              onSave={handleAddRoomCostSave}
              isLoading={addRoomCostLoading}
            />
          </GlassCard>

          {/* Hotel Costs Section */}
          <GlassCard className="border-primary/30  p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-primary ">
                  עלויות מלון
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  עלויות חודשיות קבועות למלון
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="glass-card border-primary/40 px-6 py-3 rounded-xl">
                  <p className="text-xs text-muted-foreground">סה"כ חודשי</p>
                  <p className="text-2xl font-bold text-primary">₪{totalMonthlyHotelCosts.toFixed(2)}</p>
                </div>
                <GlowButton
                  onClick={() => handleOpenDialog()}
                  className=""
                >
                  <Plus className="w-5 h-5 mr-2" />
                  הוסף עלות
                </GlowButton>
              </div>
            </div>

            {hotelCostsForPeriod.length === 0 ? (
              <div className="text-center py-20">
                <Building2 className="w-16 h-16 text-primary/30 mx-auto mb-4" />
                <p className="text-xl text-muted-foreground mb-2">אין עלויות מלון</p>
                <p className="text-sm text-muted-foreground">התחל בהוספת עלויות חודשיות למלון</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {hotelCostsForPeriod.map((cost) => {
                  const Icon = categoryIcons[cost.category];
                  const colorClass = categoryColors[cost.category];
                  
                  return (
                    <div
                      key={cost.id}
                      className={`glass-card border rounded-xl p-5 transition-all ${
                        cost.isActive
                          ? 'border-primary/30 hover:border-primary/40'
                          : 'border-muted/20 opacity-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-2 rounded-lg border ${colorClass}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenDialog(cost)}
                            className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                          >
                            <Edit2 className="w-4 h-4 text-primary" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(cost.id)}
                            className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                          >
                            <Power className={`w-4 h-4 ${cost.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                          </button>
                          <button
                            onClick={() => handleOpenHotelCostDelete(cost.id)}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-foreground mb-1">{cost.label}</h3>
                      <p className="text-xs text-muted-foreground mb-3">{categoryLabels[cost.category]}</p>
                      
                      <div className="flex flex-col gap-0.5">
                        <span className="text-2xl font-bold text-primary">₪{cost.amount.toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground opacity-80">{FREQUENCY_LABELS[cost.frequencyType ?? 'monthly']}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(nextOpen) => { if (!nextOpen) handleCloseHotelCostDialog(); }}>
        <DialogContent
          className="glass-card border-primary/30 "
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">
              {editingCost ? 'עריכת עלות' : 'הוספת עלות חדשה'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              הוסף עלות חודשית קבועה למלון
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-foreground font-semibold">
                שם העלות <span className="text-primary">*</span>
              </Label>
              <Input
                value={label}
                onChange={(e) => { setLabel(e.target.value); setHotelCostDialogDirty(true); }}
                placeholder="לדוגמה: משכורות עובדים"
                className="glass-card border-primary/30 h-12"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-semibold">
                סכום חודשי <span className="text-primary">*</span>
              </Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => { setAmount(Number(e.target.value)); setHotelCostDialogDirty(true); }}
                placeholder="0"
                className="glass-card border-primary/30 h-12"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-semibold">
                קטגוריה <span className="text-primary">*</span>
              </Label>
              <Select value={category} onValueChange={(v) => { setCategory(v as HotelCost['category']); setHotelCostDialogDirty(true); }}>
                <SelectTrigger className="glass-card border-primary/30 h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card border-primary/30">
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!editingCost && (
              <div className="space-y-2">
                <Label className="text-foreground font-semibold">תדירות</Label>
                <div className="flex gap-2 p-1 rounded-xl glass-card border border-primary/20">
                  {(['monthly', 'quarterly', 'yearly'] as const).map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => { setFrequencyType(freq); setHotelCostDialogDirty(true); }}
                      className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        frequencyType === freq
                          ? 'bg-primary/20 text-primary border border-primary/40 shadow-[0_0_12px_rgba(124,255,58,0.2)]'
                          : 'text-muted-foreground hover:bg-primary/10 hover:text-primary border border-transparent'
                      }`}
                    >
                      {FREQUENCY_LABELS[freq]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={handleCloseHotelCostDialog}
              className="glass-button border-primary/30 h-12 px-6"
            >
              ביטול
            </Button>
            <GlowButton onClick={handleSave} className="h-12 px-6">
              {editingCost ? 'עדכן' : 'הוסף'}
            </GlowButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UnsavedChangesConfirmDialog
        open={hotelCostConfirmOpen}
        onOpenChange={setHotelCostConfirmOpen}
        onConfirmLeave={() => { setHotelCostConfirmOpen(false); setDialogOpen(false); }}
      />

      <EditRoomCostDialog
        open={roomCostEditDialogOpen}
        onOpenChange={setRoomCostEditDialogOpen}
        item={editingRoomCost}
        onSave={handleSaveRoomCost}
      />

      <ConfirmDeleteDialog
        open={hotelCostDeleteDialogOpen}
        onOpenChange={(open) => {
          setHotelCostDeleteDialogOpen(open);
          if (!open) setDeletingHotelCostId(null);
        }}
        title="מחיקת עלות מלון"
        description="האם אתה בטוח שברצונך למחוק עלות זו?"
        onConfirm={handleConfirmHotelCostDelete}
      />

      <ConfirmDeleteDialog
        open={roomCostDeleteDialogOpen}
        onOpenChange={(open) => {
          setRoomCostDeleteDialogOpen(open);
          if (!open) setDeletingRoomCostId(null);
        }}
        title="מחיקת עלות חדר"
        description="האם אתה בטוח שברצונך למחוק פריט זה?"
        onConfirm={handleConfirmRoomCostDelete}
      />
    </div>
  );
}