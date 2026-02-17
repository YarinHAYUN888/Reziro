import { create } from 'zustand';
import { format, parseISO } from 'date-fns';
import type { User } from '@supabase/supabase-js';
import type { Room, Booking, CostCatalogItem, MonthLock, Forecast, Expense, HotelCost, Partner, ManualReferral, PartnerStats, AppState, UIState, SelectedCost, PartnerReferral } from '../types/models';
import type { StorageAdapter } from '../storage/LocalStorageAdapter';
import { SupabaseAdapter } from '../storage/SupabaseAdapter';
import { DEFAULT_ROOM_COSTS } from '../data/defaultRoomCosts';
import { normalizeAndComputeBooking } from '../utils/calcEngine';

interface BookingInput {
  roomId: string;
  startDate: string;
  endDate: string;
  pricePerNight: number;
  extraExpenses: number;
  selectedRoomCosts: SelectedCost[];
  selectedHotelCosts: SelectedCost[];
  partnerReferrals?: PartnerReferral[]; // 🆕 NEW
  customer?: {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
  };
  createdAt?: string;
}

export type ProfileData = { first_name?: string; last_name?: string; hotel_role?: string } | null;

interface StoreState extends AppState, UIState {
  [x: string]: any;
  user: User | null;
  profile: ProfileData;
  setUser: (user: User | null) => void;
  setProfile: (profile: ProfileData) => void;
  storage: StorageAdapter;
  setSelectedMonthKey: (key: string) => void;
  addRoom: (data: { name: string; number?: string }) => void;
  updateRoom: (id: string, data: { name: string; number?: string }) => void;
  deleteRoom: (id: string) => void;
  createBooking: (input: BookingInput) => boolean;
  updateBooking: (id: string, input: Partial<BookingInput>) => boolean;
  deleteBooking: (id: string) => void;
  monthlyBanksExpense: number;
monthlyEmployeesExpense: number;

setMonthlyBanksExpense: (amount: number) => void;
setMonthlyEmployeesExpense: (amount: number) => void;
  toggleMonthLock: (monthKey: string) => void;
  isMonthLocked: (monthKey: string) => boolean;
  addForecast: (data: {
    monthKey: string;
    category: string;
    expectedAmount: number;
    confidence: number;
    period?: 'monthly' | 'quarterly' | 'yearly';
    type?: 'income' | 'expense';
  }) => void;  
  deleteExpense: (id: string) => void;
  addHotelCost: (data: { label: string; amount: number; category: HotelCost['category']; frequencyType?: HotelCost['frequencyType']; periodKey?: string }) => void;
  updateHotelCost: (id: string, data: { label: string; amount: number; category: HotelCost['category'] }) => void;
  toggleHotelCostActive: (id: string) => void;
  deleteHotelCost: (id: string) => void;

  updateCostCatalogItem: (id: string, data: { label?: string; unitCost?: number; defaultQty?: number; isActive?: boolean }) => void;
  deleteCostCatalogItem: (id: string) => void;
  addCostCatalogItem: (item: CostCatalogItem) => void;

  // 🆕 NEW: Partner functions
  addPartner: (data: { 
    name: string; 
    type: Partner['type'];
    phone: string; 
    email: string; 
    commissionType: 'percentage' | 'fixed';
    commissionValue: number;
    discountForGuests?: number;
    location?: string;
    notes?: string;
  }) => void;
  updatePartner: (id: string, data: { 
    name: string; 
    type: Partner['type'];
    phone: string; 
    email: string; 
    commissionType: 'percentage' | 'fixed';
    commissionValue: number;
    discountForGuests?: number;
    location?: string;
    notes?: string;
  }) => void;
  togglePartnerActive: (id: string) => void;
  deletePartner: (id: string) => void;
  
  // 🆕 NEW: Manual Referral functions
  addManualReferral: (data: {
    partnerId: string;
    guestsCount: number;
    date: string;
    notes?: string;
    orderAmount?: number;
    commissionEarned?: number;
  }) => void;  
  deleteManualReferral: (id: string) => void;
  
  // 🆕 NEW: Partner statistics
  getPartnerStats: (partnerId: string, monthKey?: string) => PartnerStats;
  getAllPartnersStats: (monthKey?: string) => PartnerStats[];
  
}

const storage = new SupabaseAdapter();

function hasBookingConflict(
  bookings: Booking[],
  roomId: string,
  startDate: string,
  endDate: string,
  excludeId?: string
): boolean {
  const candidates = bookings.filter(
    (b) => b.roomId === roomId && (!excludeId || b.id !== excludeId)
  );
  return candidates.some(
    (b) => startDate < b.endDate && endDate > b.startDate
  );
}

export const useAppStore = create<StoreState>((set, get) => ({
  user: null,
  profile: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  storage,
  rooms: [],
  bookings: [],
  monthlyBanksExpense: 0,
monthlyEmployeesExpense: 0,
  costCatalog: DEFAULT_ROOM_COSTS,
  hotelCosts: [],
  partners: [],
  manualReferrals: [], // 🆕 NEW
  monthLocks: {},
  forecasts: [],
  expenses: [],
  selectedMonthKey: format(new Date(), 'yyyy-MM'),
  selectedRoomId: undefined,
  isHydrated: false,

  setSelectedMonthKey: (key) => set({ selectedMonthKey: key }),

  addRoom: (data) => {
    const newRoom: Room = {
      id: crypto.randomUUID(),
      name: data.name,
      number: data.number,
      createdAt: new Date().toISOString(),
    };
    
    set((state) => {
      const rooms = [...state.rooms, newRoom];
      const newState = { ...state, rooms };
      
      const storage = get().storage;
      if (storage?.saveState) {
        storage.saveState(newState).catch((err) => console.error('❌ Save failed:', err));
      }
      
      return newState;
    });
  },

  updateRoom: (id, data) => {
    set((state) => {
      const rooms = state.rooms.map((r) =>
        r.id === id ? { ...r, name: data.name, number: data.number } : r
      );
      const newState = { ...state, rooms };
      
      const storage = get().storage;
      if (storage?.saveState) {
        storage.saveState(newState).catch((err) => console.error('❌ Save failed:', err));
      }
      
      return newState;
    });
  },

  deleteRoom: (id) => {
    set((state) => {
      const rooms = state.rooms.filter((r) => r.id !== id);
      const bookings = state.bookings.filter((b) => b.roomId !== id);
      const newState = { ...state, rooms, bookings };
      
      const storage = get().storage;
      if (storage?.saveState) {
        storage.saveState(newState).catch((err) => console.error('❌ Save failed:', err));
      }
      
      return newState;
    });
  },

  createBooking: (input) => {
    if (get().isMonthLocked(input.startDate.substring(0, 7))) {
      return false;
    }
    if (hasBookingConflict(get().bookings, input.roomId, input.startDate, input.endDate)) {
      return false;
    }
    const booking = normalizeAndComputeBooking(input);
    set((state) => {
      const bookings = [...state.bookings, booking];
      const newState = { ...state, bookings };
      const storage = get().storage;
      if (storage?.saveState) {
        storage.saveState(newState).catch((err) => console.error('❌ Save failed:', err));
      }
      return newState;
    });
    return true;
  },

  updateBooking: (id, input) => {
    const existing = get().bookings.find((b) => b.id === id);
    if (!existing) return false;

    const mergedInput: BookingInput = {
      roomId: input.roomId ?? existing.roomId,
      startDate: input.startDate ?? existing.startDate,
      endDate: input.endDate ?? existing.endDate,
      pricePerNight: input.pricePerNight ?? existing.pricePerNight,
      extraExpenses: input.extraExpenses ?? existing.extraExpenses,
      selectedRoomCosts: input.selectedRoomCosts ?? existing.selectedRoomCosts,
      selectedHotelCosts: input.selectedHotelCosts ?? existing.selectedHotelCosts,
      partnerReferrals: input.partnerReferrals ?? existing.partnerReferrals,
      customer: input.customer ?? existing.customer,
      createdAt: input.createdAt ?? existing.createdAt,
    };

    if (hasBookingConflict(get().bookings, mergedInput.roomId, mergedInput.startDate, mergedInput.endDate, id)) {
      return false;
    }

    const recomputed = normalizeAndComputeBooking(mergedInput);
    const finalBooking: Booking = { ...recomputed, id };

    set((state) => {
      const bookings = state.bookings.map((b) => (b.id === id ? finalBooking : b));
      const newState = { ...state, bookings };
      const storage = get().storage;
      if (storage?.saveState) {
        storage.saveState(newState).catch((err) => console.error('❌ Save failed:', err));
      }
      return newState;
    });
    return true;
  },

  deleteBooking: (id) => {
    set((state) => {
      const bookings = state.bookings.filter((b) => b.id !== id);
      const newState = { ...state, bookings };
      
      const storage = get().storage;
      if (storage?.saveState) {
        storage.saveState(newState).catch((err) => console.error('❌ Save failed:', err));
      }
      
      return newState;
    });
  },

  toggleMonthLock: (monthKey) => {
    set((state) => {
      const currentLock = state.monthLocks[monthKey];
      const isLocked = currentLock?.isLocked ?? false;
      const monthLocks = {
        ...state.monthLocks,
        [monthKey]: {
          monthKey,
          isLocked: !isLocked,
          lockedAt: !isLocked ? new Date().toISOString() : undefined,
        },
      };
      const newState = { ...state, monthLocks };
      
      const storage = get().storage;
      if (storage?.saveState) {
        storage.saveState(newState).catch((err) => console.error('❌ Save failed:', err));
      }
      
      return newState;
    });
  },

  isMonthLocked: (monthKey) => {
    return get().monthLocks[monthKey]?.isLocked ?? false;
  },

  addForecast: (data: {
    monthKey: string;
    category: string;
    expectedAmount: number;
    confidence: number;
    period?: 'monthly' | 'quarterly' | 'yearly';
    type?: 'income' | 'expense'; //
  }) => {
    const forecast: Forecast = {
      id: crypto.randomUUID(),
      monthKey: data.monthKey,
      category: data.category,
      expectedAmount: data.expectedAmount,
      confidence: data.confidence,
      period: data.period ?? 'monthly',
      type: data.type ?? 'income', //
      createdAt: new Date().toISOString(),
    };
  
    set((state) => {
      const forecasts = [...state.forecasts, forecast];
      const newState = { ...state, forecasts };
      
      const storage = get().storage;
      if (storage?.saveState) {
        storage.saveState(newState).catch((err) => console.error('❌ Save failed:', err));
      }
      
      return newState;
    });
  },
  
setMonthlyBanksExpense: (amount: number) =>
  set({ monthlyBanksExpense: amount }),

setMonthlyEmployeesExpense: (amount: number) =>
  set({ monthlyEmployeesExpense: amount }),

  deleteForecast: (id) => {
    set((state) => {
      const forecasts = state.forecasts.filter((f) => f.id !== id);
      const newState = { ...state, forecasts };
      
      const storage = get().storage;
      if (storage?.saveState) {
        storage.saveState(newState).catch((err) => console.error('❌ Save failed:', err));
      }
      
      return newState;
    });
  },

  addExpense: (input) => {
    const expense: Expense = {
      id: crypto.randomUUID(),
      type: input.type,
      description: input.description,
      amount: input.amount,
      date: input.date,
      monthKey: format(parseISO(input.date), 'yyyy-MM'),
      roomId: input.roomId,
      bookingId: input.bookingId,
      selectedRoomCosts: input.selectedRoomCosts || [],
      selectedHotelCosts: input.selectedHotelCosts || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => {
      const expenses = [...state.expenses, expense];
      let newState = { ...state, expenses };

      if (input.bookingId) {
        const bookings = state.bookings.map((b) => {
          if (b.id === input.bookingId) {
            const newRoomCosts = [...b.selectedRoomCosts, ...(input.selectedRoomCosts || [])];
            const newHotelCosts = [...b.selectedHotelCosts, ...(input.selectedHotelCosts || [])];
            const totalRoomCosts = newRoomCosts.reduce((sum, c) => sum + c.total, 0);
            const totalHotelCosts = newHotelCosts.reduce((sum, c) => sum + c.total, 0);
            const totalOrderExpenses = totalRoomCosts + totalHotelCosts;
            const potentialProfit = b.income - totalRoomCosts;
            const grossProfit = potentialProfit;
            const netProfit = grossProfit - (totalHotelCosts + b.extraExpenses + input.amount);

            return {
              ...b,
              selectedRoomCosts: newRoomCosts,
              selectedHotelCosts: newHotelCosts,
              extraExpenses: b.extraExpenses + input.amount,
              totals: {
                totalRoomCosts,
                totalHotelCosts,
                totalOrderExpenses: totalOrderExpenses + input.amount,
              },
              metrics: {
                potentialProfit,
                grossProfit,
                netProfit,
              },
              updatedAt: new Date().toISOString(),
            };
          }
          return b;
        });

        newState = { ...newState, bookings };
      }

      const storage = get().storage;
      if (storage?.saveState) {
        storage.saveState(newState).catch((err) => console.error('❌ Save failed:', err));
      }

      return newState;
    });
  },

  deleteExpense: (id) => {
    set((state) => {
      const expenses = state.expenses.filter((e) => e.id !== id);
      const newState = { ...state, expenses };

      const storage = get().storage;
      if (storage?.deleteExpenseNow) storage.deleteExpenseNow(id).catch((err) => console.error('❌ Delete expense failed:', err));
      if (storage?.saveState) storage.saveState(newState).catch((err) => console.error('❌ Save failed:', err));

      return newState;
    });
  },

  addHotelCost: (data) => {
    const selectedMonthKey = get().selectedMonthKey;
    const frequencyType = data.frequencyType ?? 'monthly';
    const periodKey = data.periodKey ?? (frequencyType === 'yearly' ? selectedMonthKey.slice(0, 4) : frequencyType === 'quarterly' ? `${selectedMonthKey.slice(0, 4)}-Q${Math.ceil(parseInt(selectedMonthKey.slice(5, 7), 10) / 3)}` : selectedMonthKey);
    const newHotelCost: HotelCost = {
      id: crypto.randomUUID(),
      label: data.label,
      amount: data.amount,
      category: data.category,
      isActive: true,
      frequencyType,
      periodKey,
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      const hotelCosts = [...state.hotelCosts, newHotelCost];
      const newState = { ...state, hotelCosts };
      
      const storage = get().storage;
      if (storage?.saveState) {
        storage.saveState(newState).catch((err) => console.error('❌ Save failed:', err));
      }
      
      return newState;
    });
  },

  updateHotelCost: (id, data) => {
    set((state) => {
      const hotelCosts = state.hotelCosts.map((cost) =>
        cost.id === id
          ? { ...cost, label: data.label, amount: data.amount, category: data.category, updatedAt: new Date().toISOString() }
          : cost
      );
      const newState = { ...state, hotelCosts };
      
      const storage = get().storage;
      if (storage?.saveState) {
        storage.saveState(newState).catch((err) => console.error('❌ Save failed:', err));
      }
      
      return newState;
    });
  },

  toggleHotelCostActive: (id) => {
    set((state) => {
      const hotelCosts = state.hotelCosts.map((cost) =>
        cost.id === id ? { ...cost, isActive: !cost.isActive, updatedAt: new Date().toISOString() } : cost
      );
      const newState = { ...state, hotelCosts };
      
      const storage = get().storage;
      if (storage?.saveState) {
        storage.saveState(newState).catch((err) => console.error('❌ Save failed:', err));
      }
      
      return newState;
    });
  },

  deleteHotelCost: (id) => {
    set((state) => {
      const hotelCosts = state.hotelCosts.filter((cost) => cost.id !== id);
      const newState = { ...state, hotelCosts };

      const storage = get().storage;
      if (storage?.saveState) {
        storage.saveState(newState).catch((err) => console.error('❌ Save failed:', err));
      }

      return newState;
    });
  },

  updateCostCatalogItem: (id, data) => {
    set((state) => {
      const costCatalog = state.costCatalog.map((item) =>
        item.id === id
          ? {
              ...item,
              ...(data.label !== undefined && { label: data.label }),
              ...(data.unitCost !== undefined && { unitCost: data.unitCost }),
              ...(data.defaultQty !== undefined && { defaultQty: data.defaultQty }),
              ...(data.isActive !== undefined && { isActive: data.isActive }),
            }
          : item
      );
      const newState = { ...state, costCatalog };

      const storage = get().storage;
      if (storage?.saveState) {
        storage.saveState(newState).catch((err) => console.error('❌ Save failed:', err));
      }

      return newState;
    });
  },

  deleteCostCatalogItem: (id) => {
    set((state) => {
      const costCatalog = state.costCatalog.filter((item) => item.id !== id);
      const newState = { ...state, costCatalog };

      const storage = get().storage;
      if (storage?.saveState) {
        storage.saveState(newState).catch((err) => console.error('❌ Save failed:', err));
      }

      return newState;
    });
  },

  addCostCatalogItem: (item) => {
    set((state) => {
      const costCatalog = [...state.costCatalog, item];
      const newState = { ...state, costCatalog };
      const storage = get().storage;
      if (storage?.saveState) {
        storage.saveState(newState).catch((err) => console.error('❌ Save failed:', err));
      }
      return newState;
    });
  },

  // 🆕 NEW: Partner CRUD operations
  addPartner: (data) => {
    const newPartner: Partner = {
      id: crypto.randomUUID(),
      name: data.name,
      type: data.type,
      phone: data.phone,
      email: data.email,
      commissionType: data.commissionType,
      commissionValue: data.commissionValue,
      discountForGuests: data.discountForGuests,
      location: data.location,
      notes: data.notes,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      const partners = [...state.partners, newPartner];
      const newState = { ...state, partners };
      const storage = get().storage;
      if (storage?.savePartnersNow) storage.savePartnersNow(newState).catch((err) => console.error('❌ Partners save failed:', err));
      if (storage?.saveState) storage.saveState(newState).catch((err) => console.error('❌ Save failed:', err));
      return newState;
    });
  },

  updatePartner: (id, data) => {
    set((state) => {
      const partners = state.partners.map((partner) =>
        partner.id === id
          ? { 
              ...partner, 
              name: data.name,
              type: data.type,
              phone: data.phone, 
              email: data.email, 
              commissionType: data.commissionType,
              commissionValue: data.commissionValue,
              discountForGuests: data.discountForGuests,
              location: data.location,
              notes: data.notes,
              updatedAt: new Date().toISOString() 
            }
          : partner
      );
      const newState = { ...state, partners };
      const storage = get().storage;
      if (storage?.savePartnersNow) storage.savePartnersNow(newState).catch((err) => console.error('❌ Partners save failed:', err));
      if (storage?.saveState) storage.saveState(newState).catch((err) => console.error('❌ Save failed:', err));
      return newState;
    });
  },

  togglePartnerActive: (id) => {
    set((state) => {
      const partners = state.partners.map((partner) =>
        partner.id === id ? { ...partner, isActive: !partner.isActive, updatedAt: new Date().toISOString() } : partner
      );
      const newState = { ...state, partners };
      const storage = get().storage;
      if (storage?.savePartnersNow) storage.savePartnersNow(newState).catch((err) => console.error('❌ Partners save failed:', err));
      if (storage?.saveState) storage.saveState(newState).catch((err) => console.error('❌ Save failed:', err));
      return newState;
    });
  },

  deletePartner: (id) => {
    set((state) => {
      const partners = state.partners.filter((partner) => partner.id !== id);
      const newState = { ...state, partners };
      const storage = get().storage;
      if (storage?.deletePartnerNow) storage.deletePartnerNow(id).catch((err) => console.error('❌ Delete partner failed:', err));
      if (storage?.savePartnersNow) storage.savePartnersNow(newState).catch((err) => console.error('❌ Partners save failed:', err));
      if (storage?.saveState) storage.saveState(newState).catch((err) => console.error('❌ Save failed:', err));
      return newState;
    });
  },

  // 🆕 NEW: Manual Referral operations
  addManualReferral: (data) => {
    const partner = get().partners.find((p) => p.id === data.partnerId);
    if (!partner) return;

    let commissionEarned = 0;
    if (partner.commissionType === 'fixed') {
      commissionEarned = partner.commissionValue * data.guestsCount;
    } else {
      const orderAmount = data.orderAmount ?? 0;
      const orderTotal = data.guestsCount * orderAmount;
      commissionEarned = orderTotal * (partner.commissionValue / 100);
    }

    const newReferral: ManualReferral = {
      id: crypto.randomUUID(),
      partnerId: data.partnerId,
      guestsCount: data.guestsCount,
      date: data.date,
      notes: data.notes,
      commissionEarned,
      monthKey: format(parseISO(data.date), 'yyyy-MM'),
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      const manualReferrals = [...state.manualReferrals, newReferral];
      const newState = { ...state, manualReferrals };
      const storage = get().storage;
      if (storage?.saveManualReferralsNow) storage.saveManualReferralsNow(newState).catch((err) => console.error('❌ Referrals save failed:', err));
      if (storage?.saveState) storage.saveState(newState).catch((err) => console.error('❌ Save failed:', err));
      return newState;
    });
  },

  deleteManualReferral: (id) => {
    set((state) => {
      const manualReferrals = state.manualReferrals.filter((r) => r.id !== id);
      const newState = { ...state, manualReferrals };
      const storage = get().storage;
      if (storage?.deleteManualReferralNow) storage.deleteManualReferralNow(id).catch((err) => console.error('❌ Delete referral failed:', err));
      if (storage?.saveManualReferralsNow) storage.saveManualReferralsNow(newState).catch((err) => console.error('❌ Referrals save failed:', err));
      if (storage?.saveState) storage.saveState(newState).catch((err) => console.error('❌ Save failed:', err));
      return newState;
    });
  },

  // 🆕 NEW: Partner statistics calculators
  getPartnerStats: (partnerId, monthKey) => {
    const state = get();
    
    // Get referrals from bookings
    let bookingReferrals: PartnerReferral[] = [];
    state.bookings.forEach((booking) => {
      if (booking.partnerReferrals) {
        const partnerRefs = booking.partnerReferrals.filter((r) => r.partnerId === partnerId);
        if (!monthKey || booking.monthKey === monthKey) {
          bookingReferrals = [...bookingReferrals, ...partnerRefs];
        }
      }
    });

    // Get manual referrals
    let manualRefs = state.manualReferrals.filter((r) => r.partnerId === partnerId);
    if (monthKey) {
      manualRefs = manualRefs.filter((r) => r.monthKey === monthKey);
    }

    const totalRevenue = 
      bookingReferrals.reduce((sum, r) => sum + r.commissionEarned, 0) +
      manualRefs.reduce((sum, r) => sum + r.commissionEarned, 0);
    
    const totalReferrals = bookingReferrals.length + manualRefs.length;
    
    const totalGuests = 
      bookingReferrals.reduce((sum, r) => sum + r.guestsCount, 0) +
      manualRefs.reduce((sum, r) => sum + r.guestsCount, 0);

    return {
      partnerId,
      totalRevenue,
      totalReferrals,
      totalGuests,
    };
  },

  getAllPartnersStats: (monthKey) => {
    const state = get();
    return state.partners.map((partner) => get().getPartnerStats(partner.id, monthKey));
  },
}));