/**
 * Central Supabase sync: schema-strict persistence.
 * All writes go through saveEntity; load/save only from Supabase. No Edge Function, no localStorage.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { AppState } from '../types/models';
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

type TableName =
  | typeof ROOMS
  | typeof INCOME_RECORDS
  | typeof ROOM_FINANCIALS
  | typeof PARTNERS
  | typeof TRANSACTIONS
  | typeof MONTHLY_CONTROLS
  | typeof FORECAST_RECORDS
  | typeof EXPENSE_RECORDS;

/** Allowed columns per table (actual Supabase schema). Unknown keys are stripped. Includes user_id for RLS. */
const ALLOWED_COLUMNS: Record<TableName, readonly string[]> = {
  [ROOMS]: ['id', 'user_id', 'room_name', 'room_number', 'created_at'],
  [INCOME_RECORDS]: [
    'id', 'user_id', 'room_id', 'start_date', 'end_date', 'month_key', 'week_of_month',
    'price_per_night', 'nights_count', 'income', 'extra_expenses',
    'selected_room_costs', 'selected_hotel_costs', 'partner_referrals',
    'totals', 'metrics', 'customer', 'created_at', 'updated_at',
  ],
  [ROOM_FINANCIALS]: ['id', 'user_id', 'type', 'entity_type', 'label', 'unit_cost', 'default_qty', 'is_active', 'category', 'amount', 'created_at', 'updated_at'],
  [PARTNERS]: [
    'id', 'user_id', 'name', 'type', 'phone', 'email', 'commission_type', 'commission_value',
    'discount_for_guests', 'location', 'notes', 'is_active', 'created_at', 'updated_at',
  ],
  [TRANSACTIONS]: ['id', 'user_id', 'partner_id', 'guests_count', 'date', 'notes', 'commission_earned', 'month_key', 'created_at', 'type'],
  [MONTHLY_CONTROLS]: ['month_key', 'user_id', 'is_locked', 'locked_at'],
  [FORECAST_RECORDS]: ['id', 'user_id', 'month_key', 'category', 'expected_amount', 'confidence', 'period', 'type', 'created_at'],
  [EXPENSE_RECORDS]: [
    'id', 'user_id', 'type', 'description', 'amount', 'date', 'month_key', 'room_id', 'booking_id',
    'selected_room_costs', 'selected_hotel_costs', 'created_at', 'updated_at',
  ],
};

function toSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    const key = k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    out[key] = v;
  }
  return out;
}

function sanitizeRow(tableName: TableName, row: Record<string, unknown>): Record<string, unknown> {
  const allowed = new Set(ALLOWED_COLUMNS[tableName]);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (allowed.has(key)) {
      out[key] = value;
    } else {
      console.warn(`[supabaseSync] Stripped unknown key '${key}' for table '${tableName}'`);
    }
  }
  return out;
}

/**
 * Upsert rows for one table. Validates keys, strips unknown, throws on error.
 * conflictColumn may be a single column or comma-separated for composite key (e.g. 'user_id,month_key').
 */
export function saveEntity(
  tableName: TableName,
  rows: Record<string, unknown>[],
  conflictColumn: string
): Promise<void> {
  if (rows.length === 0) return Promise.resolve();
  const sanitized = rows.map((r) => sanitizeRow(tableName, r as Record<string, unknown>));
  const conflictColumns = conflictColumn.split(',').map((c) => c.trim());
  for (let i = 0; i < sanitized.length; i++) {
    const row = sanitized[i];
    for (const col of conflictColumns) {
      if (row[col] === undefined || row[col] === null) {
        console.error(`[supabaseSync] Missing required key '${col}' for table '${tableName}' (row ${i})`);
        throw new Error(`Missing required key '${col}' for table '${tableName}'`);
      }
    }
  }
  return supabase
    .from(tableName)
    .upsert(sanitized, { onConflict: conflictColumn })
    .then(({ error }) => {
      if (error) {
        console.error(`[supabaseSync] ${tableName} upsert failed:`, error.message);
        throw error;
      }
    });
}

const EMPTY_STATE: AppState = {
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

/**
 * Load full app state from Supabase. Requires authenticated user; filters by user_id. Returns empty when not configured; throws when not authenticated or on error.
 */
export async function loadState(): Promise<AppState> {
  if (!isSupabaseConfigured()) return EMPTY_STATE;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');
  const userId = session.user.id;
  try {
    const [roomsData, incomeData, roomFinancialsData, partnersData, transactionsData, monthlyData, forecastsData, expensesData] = await Promise.all([
      supabase.from(ROOMS).select('*').eq('user_id', userId),
      supabase.from(INCOME_RECORDS).select('*').eq('user_id', userId),
      supabase.from(ROOM_FINANCIALS).select('*').eq('user_id', userId),
      supabase.from(PARTNERS).select('*').eq('user_id', userId),
      supabase.from(TRANSACTIONS).select('*').eq('user_id', userId),
      supabase.from(MONTHLY_CONTROLS).select('*').eq('user_id', userId),
      supabase.from(FORECAST_RECORDS).select('*').eq('user_id', userId),
      supabase.from(EXPENSE_RECORDS).select('*').eq('user_id', userId),
    ]);
    if (roomsData.error) throw roomsData.error;
    if (incomeData.error) throw incomeData.error;
    if (roomFinancialsData.error) throw roomFinancialsData.error;
    if (partnersData.error) throw partnersData.error;
    if (transactionsData.error) throw transactionsData.error;
    if (monthlyData.error) throw monthlyData.error;
    if (forecastsData.error) throw forecastsData.error;
    if (expensesData.error) throw expensesData.error;

    const rooms = (roomsData.data ?? []).map((r) => roomFromRow(r as Record<string, unknown>));
    const bookings = (incomeData.data ?? []).map((r) => bookingFromRow(r as Record<string, unknown>));
    const roomFinancials = (roomFinancialsData.data ?? []) as Record<string, unknown>[];
    const costCatalog = roomFinancials
      .filter((r) => (r.entity_type ?? r.entityType) === ENTITY_COST_CATALOG)
      .map((r) => costCatalogFromRow(r));
    const hotelCosts = roomFinancials
      .filter((r) => (r.entity_type ?? r.entityType) === ENTITY_HOTEL_COST)
      .map((r) => hotelCostFromRow(r));
    const partners = (partnersData.data ?? []).map((r) => partnerFromRow(r as Record<string, unknown>));
    const manualReferrals = (transactionsData.data ?? [])
      .filter((r: Record<string, unknown>) => (r.type as string) === ENTITY_MANUAL_REFERRAL)
      .map((r: Record<string, unknown>) => manualReferralFromRow(r));
    const monthLocks: Record<string, { monthKey: string; isLocked: boolean; lockedAt?: string }> = {};
    for (const row of monthlyData.data ?? []) {
      const m = monthLockFromRow(row as Record<string, unknown>);
      monthLocks[m.monthKey] = m;
    }
    const forecasts = (forecastsData.data ?? []).map((r) => forecastFromRow(r as Record<string, unknown>));
    const expenses = (expensesData.data ?? []).map((r) => expenseFromRow(r as Record<string, unknown>));

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
    console.error('[supabaseSync] loadState failed:', err);
    throw err;
  }
}

/** Pass through room_financials row; DB has category, default_qty, amount, created_at, updated_at. */
function roomFinancialsRowForDb(row: Record<string, unknown>): Record<string, unknown> {
  return row;
}

/**
 * Persist full app state to Supabase. All 8 tables; injects user_id for RLS. Any failure throws (no partial save).
 */
export async function saveState(state: AppState): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');
  const userId = session.user.id;

  const roomRows = state.rooms.map((r) => ({ ...(roomToRow(r) as Record<string, unknown>), user_id: userId }));
  const bookingRows = state.bookings.map((r) => ({ ...toSnake(bookingToRow(r) as Record<string, unknown>), user_id: userId }));
  const costRows = state.costCatalog.map((m) =>
    roomFinancialsRowForDb({ ...toSnake(costCatalogToRow(m) as Record<string, unknown>), entity_type: ENTITY_COST_CATALOG, user_id: userId })
  );
  const hotelRows = state.hotelCosts.map((m) =>
    roomFinancialsRowForDb({ ...toSnake(hotelCostToRow(m) as Record<string, unknown>), type: 'hotel', entity_type: ENTITY_HOTEL_COST, user_id: userId })
  );
  const roomFinancialsRows = [...costRows, ...hotelRows];
  const partnerRows = state.partners.map((r) => ({ ...toSnake(partnerToRow(r) as Record<string, unknown>), user_id: userId }));
  const transactionRows = state.manualReferrals.map((m) => ({
    ...toSnake(manualReferralToRow(m) as Record<string, unknown>),
    type: ENTITY_MANUAL_REFERRAL,
    user_id: userId,
  }));
  const monthlyRows = Object.values(state.monthLocks).map((m) => ({ ...toSnake(monthLockToRow(m) as Record<string, unknown>), user_id: userId }));
  const forecastRows = state.forecasts.map((r) => ({ ...toSnake(forecastToRow(r) as Record<string, unknown>), user_id: userId }));
  const expenseRows = state.expenses.map((r) => ({ ...toSnake(expenseToRow(r) as Record<string, unknown>), user_id: userId }));

  await saveEntity(ROOMS, roomRows, 'id');
  await saveEntity(INCOME_RECORDS, bookingRows, 'id');
  await saveEntity(ROOM_FINANCIALS, roomFinancialsRows, 'id');
  await saveEntity(PARTNERS, partnerRows, 'id');
  await saveEntity(TRANSACTIONS, transactionRows, 'id');
  await saveEntity(MONTHLY_CONTROLS, monthlyRows, 'user_id,month_key');
  await saveEntity(FORECAST_RECORDS, forecastRows, 'id');
  await saveEntity(EXPENSE_RECORDS, expenseRows, 'id');
}
