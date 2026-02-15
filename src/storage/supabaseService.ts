import { supabase, isSupabaseConfigured } from '../lib/supabase';
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
  AppState,
} from '../types/models';
import {
  roomFromRow,
  bookingFromRow,
  costCatalogFromRow,
  hotelCostFromRow,
  partnerFromRow,
  manualReferralFromRow,
  monthLockFromRow,
  forecastFromRow,
  expenseFromRow,
  roomToRow,
  bookingToRow,
  costCatalogToRow,
  hotelCostToRow,
  partnerToRow,
  manualReferralToRow,
  monthLockToRow,
  forecastToRow,
  expenseToRow,
} from './supabaseMappings';

const ROOMS = 'rooms';
const INCOME_RECORDS = 'income_records';
const ROOM_FINANCIALS = 'room_financials';
const PARTNERS = 'partners';
const TRANSACTIONS = 'transactions';
const MONTHLY_CONTROLS = 'monthly_controls';
const FORECAST_RECORDS = 'forecast_records';
const EXPENSE_RECORDS = 'expense_records';

const ENTITY_COST_CATALOG = 'cost_catalog';
const ENTITY_HOTEL_COST = 'hotel_cost';
const ENTITY_MANUAL_REFERRAL = 'manual_referral';

function toSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    const key = k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    out[key] = v;
  }
  return out;
}

async function selectAll<T>(table: string, fromRow: (r: Record<string, unknown>) => T): Promise<T[]> {
  const { data, error } = await supabase.from(table).select('*');
  if (error) {
    console.error(`supabaseService ${table} getAll failed:`, error.message);
    throw error;
  }
  return (data ?? []).map((r) => fromRow(r as Record<string, unknown>));
}

export async function getAllRooms(): Promise<Room[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    return await selectAll(ROOMS, roomFromRow);
  } catch {
    return [];
  }
}

export async function insertRoom(row: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from(ROOMS).insert(toSnake(row as Record<string, unknown>));
  if (error) {
    console.error('supabaseService rooms insert failed:', error.message);
    throw error;
  }
}

export async function updateRoom(id: string, row: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from(ROOMS).update(toSnake(row as Record<string, unknown>)).eq('id', id);
  if (error) {
    console.error('supabaseService rooms update failed:', error.message);
    throw error;
  }
}

export async function deleteRoom(id: string): Promise<void> {
  const { error } = await supabase.from(ROOMS).delete().eq('id', id);
  if (error) {
    console.error('supabaseService rooms delete failed:', error.message);
    throw error;
  }
}

export async function getAllBookings(): Promise<Booking[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    return await selectAll(INCOME_RECORDS, bookingFromRow);
  } catch {
    return [];
  }
}

export async function insertBooking(row: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from(INCOME_RECORDS).insert(toSnake(row as Record<string, unknown>));
  if (error) {
    console.error('supabaseService income_records insert failed:', error.message);
    throw error;
  }
}

export async function updateBooking(id: string, row: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from(INCOME_RECORDS).update(toSnake(row as Record<string, unknown>)).eq('id', id);
  if (error) {
    console.error('supabaseService income_records update failed:', error.message);
    throw error;
  }
}

export async function deleteBooking(id: string): Promise<void> {
  const { error } = await supabase.from(INCOME_RECORDS).delete().eq('id', id);
  if (error) {
    console.error('supabaseService income_records delete failed:', error.message);
    throw error;
  }
}

export async function getAllCostCatalog(): Promise<CostCatalogItem[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase.from(ROOM_FINANCIALS).select('*').eq('entity_type', ENTITY_COST_CATALOG);
    if (error) {
      const { data: fallback } = await supabase.from(ROOM_FINANCIALS).select('*');
      const rows = (fallback ?? []) as Record<string, unknown>[];
      return rows.filter((r) => (r.entity_type ?? r.entityType) === ENTITY_COST_CATALOG).map((r) => costCatalogFromRow(r));
    }
    return (data ?? []).map((r) => costCatalogFromRow(r as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function insertCostCatalog(row: Record<string, unknown>): Promise<void> {
  const payload = { ...toSnake(row as Record<string, unknown>), entity_type: ENTITY_COST_CATALOG };
  const { error } = await supabase.from(ROOM_FINANCIALS).insert(payload);
  if (error) {
    console.error('supabaseService room_financials cost_catalog insert failed:', error.message);
    throw error;
  }
}

export async function updateCostCatalog(id: string, row: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from(ROOM_FINANCIALS).update(toSnake(row as Record<string, unknown>)).eq('id', id);
  if (error) {
    console.error('supabaseService room_financials cost_catalog update failed:', error.message);
    throw error;
  }
}

export async function deleteCostCatalog(id: string): Promise<void> {
  const { error } = await supabase.from(ROOM_FINANCIALS).delete().eq('id', id);
  if (error) {
    console.error('supabaseService room_financials cost_catalog delete failed:', error.message);
    throw error;
  }
}

export async function getAllHotelCosts(): Promise<HotelCost[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase.from(ROOM_FINANCIALS).select('*').eq('entity_type', ENTITY_HOTEL_COST);
    if (error) {
      const { data: fallback } = await supabase.from(ROOM_FINANCIALS).select('*');
      const rows = (fallback ?? []) as Record<string, unknown>[];
      return rows.filter((r) => (r.entity_type ?? r.entityType) === ENTITY_HOTEL_COST).map((r) => hotelCostFromRow(r));
    }
    return (data ?? []).map((r) => hotelCostFromRow(r as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function insertHotelCost(row: Record<string, unknown>): Promise<void> {
  const payload = { ...toSnake(row as Record<string, unknown>), entity_type: ENTITY_HOTEL_COST };
  const { error } = await supabase.from(ROOM_FINANCIALS).insert(payload);
  if (error) {
    console.error('supabaseService room_financials hotel_cost insert failed:', error.message);
    throw error;
  }
}

export async function updateHotelCost(id: string, row: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from(ROOM_FINANCIALS).update(toSnake(row as Record<string, unknown>)).eq('id', id);
  if (error) {
    console.error('supabaseService room_financials hotel_cost update failed:', error.message);
    throw error;
  }
}

export async function deleteHotelCost(id: string): Promise<void> {
  const { error } = await supabase.from(ROOM_FINANCIALS).delete().eq('id', id);
  if (error) {
    console.error('supabaseService room_financials hotel_cost delete failed:', error.message);
    throw error;
  }
}

export async function getAllPartners(): Promise<Partner[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    return await selectAll(PARTNERS, partnerFromRow);
  } catch {
    return [];
  }
}

export async function insertPartner(row: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from(PARTNERS).insert(toSnake(row as Record<string, unknown>));
  if (error) {
    console.error('supabaseService partners insert failed:', error.message);
    throw error;
  }
}

export async function updatePartner(id: string, row: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from(PARTNERS).update(toSnake(row as Record<string, unknown>)).eq('id', id);
  if (error) {
    console.error('supabaseService partners update failed:', error.message);
    throw error;
  }
}

export async function deletePartner(id: string): Promise<void> {
  const { error } = await supabase.from(PARTNERS).delete().eq('id', id);
  if (error) {
    console.error('supabaseService partners delete failed:', error.message);
    throw error;
  }
}

export async function getAllManualReferrals(): Promise<ManualReferral[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase.from(TRANSACTIONS).select('*').eq('type', ENTITY_MANUAL_REFERRAL);
    if (error) {
      const { data: fallback } = await supabase.from(TRANSACTIONS).select('*');
      const rows = (fallback ?? []) as Record<string, unknown>[];
      return rows.filter((r) => (r.type as string) === ENTITY_MANUAL_REFERRAL).map((r) => manualReferralFromRow(r));
    }
    return (data ?? []).map((r) => manualReferralFromRow(r as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function insertManualReferral(row: Record<string, unknown>): Promise<void> {
  const payload = { ...toSnake(row as Record<string, unknown>), type: ENTITY_MANUAL_REFERRAL };
  const { error } = await supabase.from(TRANSACTIONS).insert(payload);
  if (error) {
    console.error('supabaseService transactions manual_referral insert failed:', error.message);
    throw error;
  }
}

export async function updateManualReferral(id: string, row: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from(TRANSACTIONS).update(toSnake(row as Record<string, unknown>)).eq('id', id);
  if (error) {
    console.error('supabaseService transactions manual_referral update failed:', error.message);
    throw error;
  }
}

export async function deleteManualReferral(id: string): Promise<void> {
  const { error } = await supabase.from(TRANSACTIONS).delete().eq('id', id);
  if (error) {
    console.error('supabaseService transactions manual_referral delete failed:', error.message);
    throw error;
  }
}

export async function getAllMonthLocks(): Promise<Record<string, MonthLock>> {
  if (!isSupabaseConfigured()) return {};
  try {
    const { data, error } = await supabase.from(MONTHLY_CONTROLS).select('*');
    if (error) {
      console.error('supabaseService monthly_controls getAll failed:', error.message);
      throw error;
    }
    const out: Record<string, MonthLock> = {};
    for (const row of (data ?? []) as Record<string, unknown>[]) {
      const m = monthLockFromRow(row);
      out[m.monthKey] = m;
    }
    return out;
  } catch {
    return {};
  }
}

export async function upsertMonthLocks(monthLocks: Record<string, MonthLock>): Promise<void> {
  const rows = Object.values(monthLocks).map((m) => toSnake(monthLockToRow(m) as Record<string, unknown>));
  if (rows.length === 0) return;
  const { error } = await supabase.from(MONTHLY_CONTROLS).upsert(rows, { onConflict: 'month_key' });
  if (error) {
    console.error('supabaseService monthly_controls upsert failed:', error.message);
    throw error;
  }
}

export async function getAllForecasts(): Promise<Forecast[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    return await selectAll(FORECAST_RECORDS, forecastFromRow);
  } catch {
    return [];
  }
}

export async function insertForecast(row: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from(FORECAST_RECORDS).insert(toSnake(row as Record<string, unknown>));
  if (error) {
    console.error('supabaseService forecast_records insert failed:', error.message);
    throw error;
  }
}

export async function updateForecast(id: string, row: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from(FORECAST_RECORDS).update(toSnake(row as Record<string, unknown>)).eq('id', id);
  if (error) {
    console.error('supabaseService forecast_records update failed:', error.message);
    throw error;
  }
}

export async function deleteForecast(id: string): Promise<void> {
  const { error } = await supabase.from(FORECAST_RECORDS).delete().eq('id', id);
  if (error) {
    console.error('supabaseService forecast_records delete failed:', error.message);
    throw error;
  }
}

export async function getAllExpenses(): Promise<Expense[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    return await selectAll(EXPENSE_RECORDS, expenseFromRow);
  } catch {
    return [];
  }
}

export async function insertExpense(row: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from(EXPENSE_RECORDS).insert(toSnake(row as Record<string, unknown>));
  if (error) {
    console.error('supabaseService expense_records insert failed:', error.message);
    throw error;
  }
}

export async function updateExpense(id: string, row: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from(EXPENSE_RECORDS).update(toSnake(row as Record<string, unknown>)).eq('id', id);
  if (error) {
    console.error('supabaseService expense_records update failed:', error.message);
    throw error;
  }
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from(EXPENSE_RECORDS).delete().eq('id', id);
  if (error) {
    console.error('supabaseService expense_records delete failed:', error.message);
    throw error;
  }
}

export async function loadAppState(): Promise<AppState> {
  const empty: AppState = {
    rooms: [],
    bookings: [],
    costCatalog: [],
    hotelCosts: [],
    partners: [],
    manualReferrals: [],
    monthLocks: {},
    forecasts: [],
    expenses: [],
  };
  if (!isSupabaseConfigured()) return empty;
  try {
    const [rooms, bookings, costCatalog, hotelCosts, partners, manualReferrals, monthLocks, forecasts, expenses] =
      await Promise.all([
        getAllRooms(),
        getAllBookings(),
        getAllCostCatalog(),
        getAllHotelCosts(),
        getAllPartners(),
        getAllManualReferrals(),
        getAllMonthLocks(),
        getAllForecasts(),
        getAllExpenses(),
      ]);
    return {
      rooms,
      bookings,
      costCatalog,
      hotelCosts,
      partners,
      manualReferrals,
      monthLocks,
      forecasts,
      expenses,
    };
  } catch (err) {
    console.error('supabaseService loadAppState failed:', err);
    return empty;
  }
}

function stripCategoryFromRow(row: Record<string, unknown>): Record<string, unknown> {
  const { category: _category, ...rest } = row;
  return rest;
}

function buildSavePayload(state: AppState): Record<string, unknown[]> {
  const costRows = state.costCatalog.map((m) => stripCategoryFromRow({ ...toSnake(costCatalogToRow(m) as Record<string, unknown>), entity_type: ENTITY_COST_CATALOG }));
  const hotelRows = state.hotelCosts.map((m) => stripCategoryFromRow({ ...toSnake(hotelCostToRow(m) as Record<string, unknown>), entity_type: ENTITY_HOTEL_COST }));
  const roomFinancials = [...costRows, ...hotelRows];
  const monthlyControls = Object.values(state.monthLocks).map((m) => toSnake(monthLockToRow(m) as Record<string, unknown>));
  const transactions = state.manualReferrals.map((m) => ({ ...toSnake(manualReferralToRow(m) as Record<string, unknown>), type: ENTITY_MANUAL_REFERRAL }));
  return {
    rooms: state.rooms.map((r) => toSnake(roomToRow(r) as Record<string, unknown>)),
    income_records: state.bookings.map((r) => toSnake(bookingToRow(r) as Record<string, unknown>)),
    room_financials: roomFinancials,
    partners: state.partners.map((r) => toSnake(partnerToRow(r) as Record<string, unknown>)),
    transactions,
    monthly_controls: monthlyControls,
    forecast_records: state.forecasts.map((r) => toSnake(forecastToRow(r) as Record<string, unknown>)),
    expense_records: state.expenses.map((r) => toSnake(expenseToRow(r) as Record<string, unknown>)),
  };
}

export async function saveAppState(state: AppState): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const payload = buildSavePayload(state);
  try {
    const { data, error } = await supabase.functions.invoke('save-app-state', { body: payload });
    if (error) {
      console.warn('supabaseService saveAppState Edge Function failed, falling back to client upserts:', error.message);
      await saveAppStateClient(state);
      return;
    }
    if (data?.error) {
      console.warn('supabaseService save-app-state returned error, falling back to client upserts:', data.error);
      await saveAppStateClient(state);
      return;
    }
  } catch (err) {
    console.warn('supabaseService saveAppState Edge Function failed, falling back to client upserts:', err);
    await saveAppStateClient(state);
  }
}

async function saveAppStateClient(state: AppState): Promise<void> {
  try {
    await Promise.all([
      upsertTable(ROOMS, state.rooms.map(roomToRow), 'id'),
      upsertTable(INCOME_RECORDS, state.bookings.map(bookingToRow), 'id'),
      upsertRoomFinancials(state.costCatalog.map(costCatalogToRow), state.hotelCosts.map(hotelCostToRow)),
      upsertTable(PARTNERS, state.partners.map(partnerToRow), 'id'),
      upsertTable(TRANSACTIONS, state.manualReferrals.map((m) => ({ ...manualReferralToRow(m), type: ENTITY_MANUAL_REFERRAL })), 'id'),
      upsertMonthLocks(state.monthLocks),
      upsertTable(FORECAST_RECORDS, state.forecasts.map(forecastToRow), 'id'),
      upsertTable(EXPENSE_RECORDS, state.expenses.map(expenseToRow), 'id'),
    ]);
  } catch (err) {
    console.error('supabaseService saveAppState failed:', err);
    throw err;
  }
}

async function upsertTable(
  table: string,
  rows: Record<string, unknown>[],
  conflictColumn: string
): Promise<void> {
  if (rows.length === 0) return;
  const normalized = rows.map((r) => toSnake(r as Record<string, unknown>));
  const { error } = await supabase.from(table).upsert(normalized, { onConflict: conflictColumn });
  if (error) {
    console.error(`supabaseService ${table} upsert failed:`, error.message);
    throw error;
  }
}

async function upsertRoomFinancials(
  costRows: Record<string, unknown>[],
  hotelRows: Record<string, unknown>[]
): Promise<void> {
  const withCostType = costRows.map((r) => stripCategoryFromRow({ ...toSnake(r as Record<string, unknown>), entity_type: ENTITY_COST_CATALOG }));
  const withHotelType = hotelRows.map((r) => stripCategoryFromRow({ ...toSnake(r as Record<string, unknown>), entity_type: ENTITY_HOTEL_COST }));
  const all = [...withCostType, ...withHotelType];
  if (all.length === 0) return;
  const { error } = await supabase.from(ROOM_FINANCIALS).upsert(all, { onConflict: 'id' });
  if (error) {
    console.error('supabaseService room_financials upsert failed:', error.message);
    throw error;
  }
}
