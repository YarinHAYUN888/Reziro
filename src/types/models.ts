// Core data models for GEST'S Financial CRM

export interface Room {
  id: string;
  name: string;
  number?: string;
  createdAt: string;
}

export interface SelectedCost {
  catalogId: string;
  labelSnapshot: string;
  unitCostSnapshot: number;
  qty: number;
  total: number;
}

// 🆕 NEW: Partner Referral
export interface PartnerReferral {
  partnerId: string;
  partnerName: string; // snapshot
  guestsCount: number;
  commissionEarned: number;
  date: string;
}

export interface Booking {
  id: string;
  roomId: string;
  startDate: string; // ISO: YYYY-MM-DD
  endDate: string; // ISO: YYYY-MM-DD
  monthKey: string; // derived: YYYY-MM from startDate
  weekOfMonth: 1 | 2 | 3 | 4; // derived from startDate
  pricePerNight: number;
  nightsCount: number; // derived from date range
  income: number; // default = nightsCount * pricePerNight
  extraExpenses: number; // manual extra expenses
  selectedRoomCosts: SelectedCost[];
  selectedHotelCosts: SelectedCost[];
  partnerReferrals?: PartnerReferral[]; // 🆕 NEW: הפניות לשותפים
  totals: {
    totalRoomCosts: number;
    totalHotelCosts: number;
    totalOrderExpenses: number;
  };
  metrics: {
    potentialProfit: number;
    grossProfit: number;
    netProfit: number;
  };
  customer?: {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CostCatalogItem {
  id: string;
  type: 'room' | 'hotel';
  category?: 'base' | 'treat' | 'extra';
  label: string;
  unitCost: number;
  defaultQty: number;
  isActive: boolean;
}

export interface MonthLock {
  monthKey: string;
  isLocked: boolean;
  lockedAt?: string;
}

export interface Forecast {
  id: string;
  monthKey: string;
  category: string;
  expectedAmount: number;
  confidence: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  type: 'income' | 'expense';
  createdAt: string;
}

export interface Expense {
  id: string;
  type: 'booking' | 'room' | 'hotel' | 'custom';
  description: string;
  amount: number;
  date: string;
  monthKey: string;
  roomId?: string;
  bookingId?: string;
  selectedRoomCosts?: SelectedCost[];
  selectedHotelCosts?: SelectedCost[];
  createdAt: string;
  updatedAt: string;
}

export type HotelCostFrequency = 'monthly' | 'quarterly' | 'yearly';

export interface HotelCost {
  id: string;
  label: string;
  amount: number;
  category: 'employees' | 'arnona' | 'electricity' | 'water' | 'maintenance' | 'cleaning' | 'room_rent' | 'other';
  isActive: boolean;
  frequencyType: HotelCostFrequency;
  periodKey: string;
  createdAt: string;
  updatedAt?: string;
}

// 🆕 NEW: Business Partner (המלון מרוויח מהם!)
export interface Partner {
  id: string;
  name: string; // שם העסק
  type: 'restaurant' | 'spa' | 'shop' | 'tour' | 'attraction' | 'other';
  phone: string;
  email: string;
  
  // עמלה שהמלון מרוויח:
  commissionType: 'percentage' | 'fixed'; // אחוזים או סכום קבוע
  commissionValue: number; // 15% או ₪50
  
  // אופציות נוספות:
  discountForGuests?: number; // הנחה שהשותף נותן לאורחים (%)
  location?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

// 🆕 NEW: Manual Partner Referral (הפניה שלא קשורה להזמנה)
export interface ManualReferral {
  id: string;
  partnerId: string;
  guestsCount: number;
  date: string;
  notes?: string;
  commissionEarned: number;
  monthKey: string;
  createdAt: string;
}

// 🆕 NEW: Partner statistics interface
export interface PartnerStats {
  partnerId: string;
  totalRevenue: number; // כמה המלון הרוויח מהשותף
  totalReferrals: number; // כמה הפניות
  totalGuests: number; // כמה אורחים
}

export interface AppState {
  rooms: Room[];
  bookings: Booking[];
  costCatalog: CostCatalogItem[];
  hotelCosts: HotelCost[];
  partners: Partner[];
  manualReferrals: ManualReferral[]; // 🆕 NEW
  monthLocks: Record<string, MonthLock>;
  forecasts: Forecast[];
  expenses: Expense[];
}

export interface UIState {
  selectedMonthKey: string;
  selectedRoomId?: string;
  isHydrated: boolean;
}