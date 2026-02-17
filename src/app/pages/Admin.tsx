import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Unlock, Plus, Edit2, Check, X } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { GlassCard } from '../components/shared/GlassCard';
import { CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { GlowButton } from '../components/shared/GlowButton';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAppStore } from '../../store/useAppStore';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function Admin() {
  const { t } = useTranslation();
  const monthLocks = useAppStore((state) => state.monthLocks);
  const costCatalog = useAppStore((state) => state.costCatalog);
  const lockMonth = useAppStore((state) => state.lockMonth);
  const unlockMonth = useAppStore((state) => state.unlockMonth);
  const toggleCostActive = useAppStore((state) => state.toggleCostActive);
  const updateCost = useAppStore((state) => state.updateCost);
  const addCost = useAppStore((state) => state.addCost);

  const [lockMonthKey, setLockMonthKey] = useState(format(new Date(), 'yyyy-MM'));
  
  // New cost form
  const [newCostType, setNewCostType] = useState<'room' | 'hotel'>('room');
  const [newCostLabel, setNewCostLabel] = useState('');
  const [newCostUnitCost, setNewCostUnitCost] = useState(0);
  const [newCostDefaultQty, setNewCostDefaultQty] = useState(1);

  // Edit cost
  const [editingCostId, setEditingCostId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editUnitCost, setEditUnitCost] = useState(0);
  const [editDefaultQty, setEditDefaultQty] = useState(1);

  const handleLockToggle = () => {
    const isLocked = monthLocks[lockMonthKey]?.isLocked;
    if (isLocked) {
      unlockMonth(lockMonthKey);
      toast.success(t('admin.monthUnlocked'));
    } else {
      lockMonth(lockMonthKey);
      toast.success(t('admin.monthLocked'));
    }
  };

  const handleAddCost = () => {
    if (!newCostLabel || newCostUnitCost <= 0) {
      toast.error(t('quickAdd.fillRequired'));
      return;
    }

    addCost({
      type: newCostType,
      label: newCostLabel,
      unitCost: newCostUnitCost,
      defaultQty: newCostDefaultQty,
      isActive: true,
    });

    toast.success(t('admin.costAdded'));
    setNewCostLabel('');
    setNewCostUnitCost(0);
    setNewCostDefaultQty(1);
  };

  const handleStartEdit = (cost: typeof costCatalog[0]) => {
    setEditingCostId(cost.id);
    setEditLabel(cost.label);
    setEditUnitCost(cost.unitCost);
    setEditDefaultQty(cost.defaultQty);
  };

  const handleSaveEdit = () => {
    if (editingCostId) {
      updateCost(editingCostId, {
        label: editLabel,
        unitCost: editUnitCost,
        defaultQty: editDefaultQty,
      });
      toast.success(t('admin.costUpdated'));
      setEditingCostId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingCostId(null);
  };

  const roomCosts = costCatalog.filter((c) => c.type === 'room');
  const hotelCosts = costCatalog.filter((c) => c.type === 'hotel');

  const isLocked = monthLocks[lockMonthKey]?.isLocked;

  return (
    <div className="min-h-screen">
      <PageHeader
        title={t('admin.title')}
        description={t('admin.description')}
      />

      <div className="container mx-auto px-6 py-6">
        <Tabs defaultValue="locks" className="space-y-6">
          <TabsList>
            <TabsTrigger value="locks">{t('admin.monthLocks')}</TabsTrigger>
            <TabsTrigger value="costs">{t('admin.costCatalog')}</TabsTrigger>
          </TabsList>

          <TabsContent value="locks">
            <div className="max-w-2xl mx-auto">
              <GlassCard>
                <CardHeader>
                  <CardTitle>{t('admin.lockManagement')}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {t('admin.lockDesc')}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>{t('admin.selectMonth')}</Label>
                    <Input
                      type="month"
                      value={lockMonthKey}
                      onChange={(e) => setLockMonthKey(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      {isLocked ? (
                        <Lock className="w-5 h-5 text-destructive" />
                      ) : (
                        <Unlock className="w-5 h-5 text-primary" />
                      )}
                      <div>
                        <p className="font-semibold">
                          {format(new Date(lockMonthKey + '-01'), 'MMMM yyyy')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {isLocked ? t('admin.locked') : t('admin.unlocked')}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <button
                        type="button"
                        onClick={handleLockToggle}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer"
                      >
                        {isLocked ? (
                          <>
                            <Unlock className="w-4 h-4" />
                            {t('admin.unlock')}
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            {t('admin.lock')}
                          </>
                        )}
                      </button>
                      <span className="text-[11px] text-muted-foreground text-center leading-tight max-w-[140px]">
                        יעודכן בגרסת V2
                      </span>
                    </div>
                  </div>

                  {Object.keys(monthLocks).length > 0 && (
                    <div className="pt-4 border-t border-border">
                      <h4 className="font-semibold mb-3">{t('admin.allLockedMonths')}</h4>
                      <div className="space-y-2">
                        {Object.values(monthLocks)
                          .filter((lock) => lock.isLocked)
                          .map((lock) => (
                            <div
                              key={lock.monthKey}
                              className="flex items-center justify-between p-3 bg-muted/20 rounded-lg"
                            >
                              <span>{format(new Date(lock.monthKey + '-01'), 'MMMM yyyy')}</span>
                              <Badge variant="destructive">{t('admin.locked')}</Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </GlassCard>
            </div>
          </TabsContent>

          <TabsContent value="costs" className="space-y-6">
            {/* Add New Cost */}
            <GlassCard>
              <CardHeader>
                <CardTitle>{t('admin.addCost')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('admin.type')}</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant={newCostType === 'room' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewCostType('room')}
                      >
                        {t('admin.roomCost')}
                      </Button>
                      <Button
                        variant={newCostType === 'hotel' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewCostType('hotel')}
                      >
                        {t('admin.hotelCost')}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>{t('admin.label')}</Label>
                    <Input
                      value={newCostLabel}
                      onChange={(e) => setNewCostLabel(e.target.value)}
                      placeholder="e.g., Cleaning"
                    />
                  </div>

                  <div>
                    <Label>{t('admin.unitCost')}</Label>
                    <Input
                      type="number"
                      value={newCostUnitCost}
                      onChange={(e) => setNewCostUnitCost(Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label>{t('admin.defaultQty')}</Label>
                    <Input
                      type="number"
                      value={newCostDefaultQty}
                      onChange={(e) => setNewCostDefaultQty(Number(e.target.value))}
                      min={1}
                    />
                  </div>

                  <div className="col-span-2">
                    <GlowButton onClick={handleAddCost} className="w-full">
                      <Plus className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                      {t('admin.addCostBtn')}
                    </GlowButton>
                  </div>
                </div>
              </CardContent>
            </GlassCard>

            {/* Room Costs */}
            <GlassCard>
              <CardHeader>
                <CardTitle>{t('admin.roomCosts')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {roomCosts.map((cost) => (
                    <div
                      key={cost.id}
                      className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg"
                    >
                      {editingCostId === cost.id ? (
                        <>
                          <Input
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            value={editUnitCost}
                            onChange={(e) => setEditUnitCost(Number(e.target.value))}
                            className="w-24"
                          />
                          <Input
                            type="number"
                            value={editDefaultQty}
                            onChange={(e) => setEditDefaultQty(Number(e.target.value))}
                            className="w-20"
                          />
                          <Button size="icon" variant="ghost" onClick={handleSaveEdit}>
                            <Check className="w-4 h-4 text-primary" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
                            <X className="w-4 h-4 text-destructive" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1">
                            <p className="font-semibold">{cost.label}</p>
                            <p className="text-sm text-muted-foreground">
                              ₪{cost.unitCost} × {cost.defaultQty} default
                            </p>
                          </div>
                          <Switch
                            checked={cost.isActive}
                            onCheckedChange={(checked) => toggleCostActive(cost.id, checked)}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleStartEdit(cost)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </GlassCard>

            {/* Hotel Costs */}
            <GlassCard>
              <CardHeader>
                <CardTitle>{t('admin.hotelCosts')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {hotelCosts.map((cost) => (
                    <div
                      key={cost.id}
                      className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg"
                    >
                      {editingCostId === cost.id ? (
                        <>
                          <Input
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            value={editUnitCost}
                            onChange={(e) => setEditUnitCost(Number(e.target.value))}
                            className="w-24"
                          />
                          <Input
                            type="number"
                            value={editDefaultQty}
                            onChange={(e) => setEditDefaultQty(Number(e.target.value))}
                            className="w-20"
                          />
                          <Button size="icon" variant="ghost" onClick={handleSaveEdit}>
                            <Check className="w-4 h-4 text-primary" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
                            <X className="w-4 h-4 text-destructive" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1">
                            <p className="font-semibold">{cost.label}</p>
                            <p className="text-sm text-muted-foreground">
                              ₪{cost.unitCost} × {cost.defaultQty} default
                            </p>
                          </div>
                          <Switch
                            checked={cost.isActive}
                            onCheckedChange={(checked) => toggleCostActive(cost.id, checked)}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleStartEdit(cost)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}