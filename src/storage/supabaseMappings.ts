/**
 * Table–entity mapping and row transformers for Supabase.
 * Column names in DB are snake_case; app models use camelCase.
 * JSON fields (totals, metrics, customer, selectedRoomCosts, etc.) stored as JSONB.
 *
 * Tables used (create in Supabase if missing): rooms, bookings, cost_catalog,
 * hotel_costs, partners, manual_referrals, monthly_controls, forecast_records, expense_records.
 */

import type {
  Room,
  Booking,
  CostCatalogItem,
  HotelCost,
  Partner,
  ManualReferral,
  MonthLock,
  Forecast,
  Expense,
} from '../types/models';

// --- Helpers: snake_case <-> camelCase ---

function toSnake(s: string): string {
  return s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function toCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

export function rowToApp<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    const key = toCamel(k);
    out[key] = v;
  }
  return out;
}

export function appToRow(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    out[toSnake(k)] = v;
  }
  return out;
}

export const TABLE = {
  rooms: 'rooms',
  bookings: 'income_records',
  costCatalog: 'room_financials',
  hotelCosts: 'room_financials',
  partners: 'partners',
  manualReferrals: 'transactions',
  monthLocks: 'monthly_controls',
  forecasts: 'forecast_records',
  expenses: 'expense_records',
} as const;

// --- Row transformers: DB row -> App model ---

export function roomFromRow(row: Record<string, unknown>): Room {
  const r = rowToApp(row) as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    name: String(r.name ?? ''),
    number: r.number != null ? String(r.number) : undefined,
    createdAt: String(r.createdAt ?? r.created_at ?? ''),
  };
}

export function bookingFromRow(row: Record<string, unknown>): Booking {
  const r = rowToApp(row) as Record<string, unknown>;
  const selectedRoomCosts = (r.selectedRoomCosts ?? r.selected_room_costs) as unknown;
  const selectedHotelCosts = (r.selectedHotelCosts ?? r.selected_hotel_costs) as unknown;
  const totals = (r.totals ?? {}) as { totalRoomCosts?: number; totalHotelCosts?: number; totalOrderExpenses?: number };
  const metrics = (r.metrics ?? {}) as { potentialProfit?: number; grossProfit?: number; netProfit?: number };
  const customer = (r.customer ?? {}) as { customerName?: string; customerPhone?: string; customerEmail?: string };
  const partnerReferrals = (r.partnerReferrals ?? r.partner_referrals ?? []) as Booking['partnerReferrals'];
  return {
    id: String(r.id ?? ''),
    roomId: String(r.roomId ?? r.room_id ?? ''),
    startDate: String(r.startDate ?? r.start_date ?? ''),
    endDate: String(r.endDate ?? r.end_date ?? ''),
    monthKey: String(r.monthKey ?? r.month_key ?? ''),
    weekOfMonth: (r.weekOfMonth ?? r.week_of_month ?? 1) as 1 | 2 | 3 | 4,
    pricePerNight: Number(r.pricePerNight ?? r.price_per_night ?? 0),
    nightsCount: Number(r.nightsCount ?? r.nights_count ?? 0),
    income: Number(r.income ?? 0),
    extraExpenses: Number(r.extraExpenses ?? r.extra_expenses ?? 0),
    selectedRoomCosts: Array.isArray(selectedRoomCosts) ? selectedRoomCosts : [],
    selectedHotelCosts: Array.isArray(selectedHotelCosts) ? selectedHotelCosts : [],
    partnerReferrals: Array.isArray(partnerReferrals) ? partnerReferrals : undefined,
    totals: {
      totalRoomCosts: totals?.totalRoomCosts ?? totals?.total_room_costs ?? 0,
      totalHotelCosts: totals?.totalHotelCosts ?? totals?.total_hotel_costs ?? 0,
      totalOrderExpenses: totals?.totalOrderExpenses ?? totals?.total_order_expenses ?? 0,
    },
    metrics: {
      potentialProfit: metrics?.potentialProfit ?? metrics?.potential_profit ?? 0,
      grossProfit: metrics?.grossProfit ?? metrics?.gross_profit ?? 0,
      netProfit: metrics?.netProfit ?? metrics?.net_profit ?? 0,
    },
    customer: customer?.customerName || customer?.customerPhone || customer?.customerEmail ? customer : undefined,
    createdAt: String(r.createdAt ?? r.created_at ?? ''),
    updatedAt: String(r.updatedAt ?? r.updated_at ?? ''),
  };
}

export function costCatalogFromRow(row: Record<string, unknown>): CostCatalogItem {
  const r = rowToApp(row) as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    type: (r.type === 'hotel' ? 'hotel' : 'room') as 'room' | 'hotel',
    category: r.category as CostCatalogItem['category'] | undefined,
    label: String(r.label ?? ''),
    unitCost: Number(r.unitCost ?? r.unit_cost ?? 0),
    defaultQty: Number(r.defaultQty ?? r.default_qty ?? 0),
    isActive: Boolean(r.isActive ?? r.is_active ?? true),
  };
}

export function hotelCostFromRow(row: Record<string, unknown>): HotelCost {
  const r = rowToApp(row) as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    label: String(r.label ?? ''),
    amount: Number(r.amount ?? 0),
    category: (r.category ?? 'other') as HotelCost['category'],
    isActive: Boolean(r.isActive ?? r.is_active ?? true),
    createdAt: String(r.createdAt ?? r.created_at ?? ''),
    updatedAt: r.updatedAt != null || r.updated_at != null ? String(r.updatedAt ?? r.updated_at) : undefined,
  };
}

export function partnerFromRow(row: Record<string, unknown>): Partner {
  const r = rowToApp(row) as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    name: String(r.name ?? ''),
    type: (r.type ?? 'other') as Partner['type'],
    phone: String(r.phone ?? ''),
    email: String(r.email ?? ''),
    commissionType: (r.commissionType ?? r.commission_type ?? 'percentage') as 'percentage' | 'fixed',
    commissionValue: Number(r.commissionValue ?? r.commission_value ?? 0),
    discountForGuests: r.discountForGuests ?? r.discount_for_guests != null ? Number(r.discountForGuests ?? r.discount_for_guests) : undefined,
    location: r.location != null ? String(r.location) : undefined,
    notes: r.notes != null ? String(r.notes) : undefined,
    isActive: Boolean(r.isActive ?? r.is_active ?? true),
    createdAt: String(r.createdAt ?? r.created_at ?? ''),
    updatedAt: r.updatedAt != null || r.updated_at != null ? String(r.updatedAt ?? r.updated_at) : undefined,
  };
}

export function manualReferralFromRow(row: Record<string, unknown>): ManualReferral {
  const r = rowToApp(row) as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    partnerId: String(r.partnerId ?? r.partner_id ?? ''),
    guestsCount: Number(r.guestsCount ?? r.guests_count ?? 0),
    date: String(r.date ?? ''),
    notes: r.notes != null ? String(r.notes) : undefined,
    commissionEarned: Number(r.commissionEarned ?? r.commission_earned ?? 0),
    monthKey: String(r.monthKey ?? r.month_key ?? ''),
    createdAt: String(r.createdAt ?? r.created_at ?? ''),
  };
}

export function monthLockFromRow(row: Record<string, unknown>): MonthLock {
  const r = rowToApp(row) as Record<string, unknown>;
  return {
    monthKey: String(r.monthKey ?? r.month_key ?? ''),
    isLocked: Boolean(r.isLocked ?? r.is_locked ?? false),
    lockedAt: r.lockedAt != null || r.locked_at != null ? String(r.lockedAt ?? r.locked_at) : undefined,
  };
}

export function forecastFromRow(row: Record<string, unknown>): Forecast {
  const r = rowToApp(row) as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    monthKey: String(r.monthKey ?? r.month_key ?? ''),
    category: String(r.category ?? ''),
    expectedAmount: Number(r.expectedAmount ?? r.expected_amount ?? 0),
    confidence: Number(r.confidence ?? 0),
    period: (r.period ?? 'monthly') as 'monthly' | 'quarterly' | 'yearly',
    type: (r.type ?? 'expense') as 'income' | 'expense',
    createdAt: String(r.createdAt ?? r.created_at ?? ''),
  };
}

export function expenseFromRow(row: Record<string, unknown>): Expense {
  const r = rowToApp(row) as Record<string, unknown>;
  const selectedRoomCosts = (r.selectedRoomCosts ?? r.selected_room_costs) as unknown;
  const selectedHotelCosts = (r.selectedHotelCosts ?? r.selected_hotel_costs) as unknown;
  return {
    id: String(r.id ?? ''),
    type: (r.type ?? 'custom') as Expense['type'],
    description: String(r.description ?? ''),
    amount: Number(r.amount ?? 0),
    date: String(r.date ?? ''),
    monthKey: String(r.monthKey ?? r.month_key ?? ''),
    roomId: r.roomId != null || r.room_id != null ? String(r.roomId ?? r.room_id) : undefined,
    bookingId: r.bookingId != null || r.booking_id != null ? String(r.bookingId ?? r.booking_id) : undefined,
    selectedRoomCosts: Array.isArray(selectedRoomCosts) ? selectedRoomCosts : undefined,
    selectedHotelCosts: Array.isArray(selectedHotelCosts) ? selectedHotelCosts : undefined,
    createdAt: String(r.createdAt ?? r.created_at ?? ''),
    updatedAt: String(r.updatedAt ?? r.updated_at ?? ''),
  };
}

// --- App model -> DB row (for insert/upsert) ---

export function roomToRow(m: Room): Record<string, unknown> {
  return appToRow({
    id: m.id,
    name: m.name,
    number: m.number ?? null,
    createdAt: m.createdAt,
  });
}

export function bookingToRow(m: Booking): Record<string, unknown> {
  return appToRow({
    id: m.id,
    roomId: m.roomId,
    startDate: m.startDate,
    endDate: m.endDate,
    monthKey: m.monthKey,
    weekOfMonth: m.weekOfMonth,
    pricePerNight: m.pricePerNight,
    nightsCount: m.nightsCount,
    income: m.income,
    extraExpenses: m.extraExpenses,
    selectedRoomCosts: m.selectedRoomCosts,
    selectedHotelCosts: m.selectedHotelCosts,
    partnerReferrals: m.partnerReferrals ?? null,
    totals: m.totals,
    metrics: m.metrics,
    customer: m.customer ?? null,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  });
}

export function costCatalogToRow(m: CostCatalogItem): Record<string, unknown> {
  return appToRow({
    id: m.id,
    type: m.type,
    category: m.category ?? null,
    label: m.label,
    unitCost: m.unitCost,
    defaultQty: m.defaultQty,
    isActive: m.isActive,
  });
}

export function hotelCostToRow(m: HotelCost): Record<string, unknown> {
  return appToRow({
    id: m.id,
    label: m.label,
    amount: m.amount,
    category: m.category,
    isActive: m.isActive,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt ?? null,
  });
}

export function partnerToRow(m: Partner): Record<string, unknown> {
  return appToRow({
    id: m.id,
    name: m.name,
    type: m.type,
    phone: m.phone,
    email: m.email,
    commissionType: m.commissionType,
    commissionValue: m.commissionValue,
    discountForGuests: m.discountForGuests ?? null,
    location: m.location ?? null,
    notes: m.notes ?? null,
    isActive: m.isActive,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt ?? null,
  });
}

export function manualReferralToRow(m: ManualReferral): Record<string, unknown> {
  return appToRow({
    id: m.id,
    partnerId: m.partnerId,
    guestsCount: m.guestsCount,
    date: m.date,
    notes: m.notes ?? null,
    commissionEarned: m.commissionEarned,
    monthKey: m.monthKey,
    createdAt: m.createdAt,
  });
}

export function monthLockToRow(m: MonthLock): Record<string, unknown> {
  return appToRow({
    monthKey: m.monthKey,
    isLocked: m.isLocked,
    lockedAt: m.lockedAt ?? null,
  });
}

export function forecastToRow(m: Forecast): Record<string, unknown> {
  return appToRow({
    id: m.id,
    monthKey: m.monthKey,
    category: m.category,
    expectedAmount: m.expectedAmount,
    confidence: m.confidence,
    period: m.period,
    type: m.type,
    createdAt: m.createdAt,
  });
}

export function expenseToRow(m: Expense): Record<string, unknown> {
  return appToRow({
    id: m.id,
    type: m.type,
    description: m.description,
    amount: m.amount,
    date: m.date,
    monthKey: m.monthKey,
    roomId: m.roomId ?? null,
    bookingId: m.bookingId ?? null,
    selectedRoomCosts: m.selectedRoomCosts ?? null,
    selectedHotelCosts: m.selectedHotelCosts ?? null,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  });
}
