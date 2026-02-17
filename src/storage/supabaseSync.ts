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
    'price_per_night', 'nights_count', 'income', 'amount', 'extra_expenses',
    'selected_room_costs', 'selected_hotel_costs', 'partner_referrals',
    'totals', 'metrics', 'customer', 'created_at', 'updated_at',
  ],
  [ROOM_FINANCIALS]: ['id', 'user_id', 'room_id', 'type', 'entity_type', 'label', 'unit_cost', 'default_qty', 'is_active', 'category', 'amount', 'created_at', 'updated_at'],
  [PARTNERS]: [
    'id', 'user_id', 'name', 'business_name', 'type', 'phone', 'email', 'commission_type', 'commission_value',
    'is_active', 'created_at', 'updated_at',
  ],
  [TRANSACTIONS]: ['id', 'user_id', 'partner_id', 'guests_count', 'date', 'notes', 'commission_earned', 'month_key', 'created_at', 'type', 'amount'],
  [MONTHLY_CONTROLS]: ['month_key', 'user_id', 'is_locked', 'locked_at'],
  [FORECAST_RECORDS]: ['id', 'user_id', 'month_key', 'category', 'expected_amount', 'confidence', 'period', 'type', 'created_at'],
  [EXPENSE_RECORDS]: [
    'id', 'user_id', 'type', 'description', 'amount', 'date', 'month_key', 'room_id', 'booking_id',
    'selected_room_costs', 'selected_hotel_costs', 'created_at', 'updated_at',
  ],
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUUID(s: string): boolean {
  return UUID_REGEX.test(s);
}

/** Deterministic UUID from string seed (for room_financials so same catalog item always gets same id for upsert). */
function deterministicUUID(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  const toHex = (n: number, len: number) => ('0'.repeat(len) + ((n >>> 0) & 0xffffffff).toString(16)).slice(-len);
  const h1 = toHex(h, 8);
  const h2 = toHex(Math.imul(h, 31), 4);
  const h3 = toHex(Math.imul(h, 37), 4);
  const h4 = toHex(Math.imul(h, 41), 4);
  const h5 = toHex(Math.imul(h, 43), 4) + toHex(h + seed.length, 8);
  return `${h1}-${h2}-4${h3}-8${h4}-${h5}`;
}

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

/**
 * Delete room rows that exist in DB for this user but are not in current state (sync deletions).
 * RLS ensures only own rows are visible/deletable. Must be awaited before upserting rooms.
 */
async function deleteRoomsNotInState(userId: string, stateRoomIds: Set<string>): Promise<void> {
  const { data, error: fetchError } = await supabase
    .from(ROOMS)
    .select('id')
    .eq('user_id', userId);
  if (fetchError) {
    console.error('[supabaseSync] rooms fetch for sync-delete failed:', fetchError.message);
    throw fetchError;
  }
  const existingIds = (data ?? []).map((r: { id: string }) => r.id);
  const toDelete = existingIds.filter((id) => !stateRoomIds.has(id));
  if (toDelete.length === 0) return;
  const { error: deleteError } = await supabase
    .from(ROOMS)
    .delete()
    .eq('user_id', userId)
    .in('id', toDelete);
  if (deleteError) {
    console.error('[supabaseSync] rooms delete (sync) failed:', deleteError.message);
    throw deleteError;
  }
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
      .filter((r: Record<string, unknown>) => {
        const t = r.type as string;
        return t === ENTITY_MANUAL_REFERRAL || t === 'income';
      })
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

/**
 * Build one room_financials row with UUID id and room_id. Never use catalog string ids (e.g. rc-001) as id.
 * Uses deterministic UUID from entity_type:itemId so same catalog item upserts to same row.
 */
function roomFinancialsRowForDb(
  row: Record<string, unknown>,
  entityType: string,
  itemId: string,
  firstRoomId: string
): Record<string, unknown> {
  const id = isUUID(String(row.id ?? '')) ? String(row.id) : deterministicUUID(`${entityType}:${itemId}`);
  return {
    ...row,
    id,
    room_id: firstRoomId,
  };
}

/** Build partner rows for DB (shared by savePartnersOnly and saveState). */
function buildPartnerRows(state: AppState, userId: string): Record<string, unknown>[] {
  return state.partners.map((r) => ({
    ...toSnake(partnerToRow(r) as Record<string, unknown>),
    user_id: userId,
    name: r.name ?? '',
    business_name: r.name ?? '',
    type: r.type ?? 'other',
    commission_type: r.commissionType ?? 'percentage',
    commission_value: r.commissionValue ?? 0,
    is_active: r.isActive ?? true,
    phone: r.phone ?? '',
    email: r.email ?? '',
  }));
}

/**
 * Save only partners to Supabase (no debounce). Use after add/update/delete partner so data persists immediately.
 */
export async function savePartnersOnly(state: AppState): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');
  const userId = session.user.id;
  const partnerRows = buildPartnerRows(state, userId);
  if (partnerRows.length === 0) return;
  await saveEntity(PARTNERS, partnerRows, 'id');
}

/**
 * Delete one partner row in Supabase (for deletePartner). RLS ensures only own row can be deleted.
 */
export async function deletePartnerInDb(partnerId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');
  const { error } = await supabase.from(PARTNERS).delete().eq('id', partnerId).eq('user_id', session.user.id);
  if (error) {
    console.error('[supabaseSync] delete partner failed:', error.message);
    throw error;
  }
}

/** Build transaction rows for manual referrals (shared by saveManualReferralsOnly and saveState). */
function buildTransactionRows(state: AppState, userId: string): Record<string, unknown>[] {
  return state.manualReferrals.map((m) => {
    const row = {
      ...toSnake(manualReferralToRow(m) as Record<string, unknown>),
      type: 'income' as const,
      user_id: userId,
      partner_id: m.partnerId ?? '',
      guests_count: m.guestsCount ?? 0,
      date: m.date ?? '',
      commission_earned: m.commissionEarned ?? 0,
      month_key: m.monthKey ?? '',
      amount: m.commissionEarned ?? 0,
    };
    const id = row.id != null && isUUID(String(row.id)) ? String(row.id) : crypto.randomUUID();
    return { ...row, id };
  });
}

/**
 * Save only manual referrals (transactions) to Supabase. Use after add/delete referral so data persists immediately.
 */
export async function saveManualReferralsOnly(state: AppState): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');
  const userId = session.user.id;
  const transactionRows = buildTransactionRows(state, userId);
  if (transactionRows.length === 0) return;
  await saveEntity(TRANSACTIONS, transactionRows, 'id');
}

/**
 * Delete one transaction (manual referral) in Supabase.
 */
export async function deleteManualReferralInDb(transactionId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');
  const { error } = await supabase.from(TRANSACTIONS).delete().eq('id', transactionId).eq('user_id', session.user.id);
  if (error) {
    console.error('[supabaseSync] delete manual referral failed:', error.message);
    throw error;
  }
}

/**
 * Delete one expense in Supabase. RLS ensures only own row can be deleted (auth.uid() = user_id).
 */
export async function deleteExpenseInDb(expenseId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');
  const { error } = await supabase.from(EXPENSE_RECORDS).delete().eq('id', expenseId);
  if (error) {
    console.error('[supabaseSync] delete expense failed:', error.message);
    throw error;
  }
}

/**
 * Persist full app state to Supabase. All 8 tables; injects user_id for RLS.
 * Saves each table separately so one failure (e.g. room_financials UUID) does not block partners and others.
 */
export async function saveState(state: AppState): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');
  const userId = session.user.id;

  const roomRows = state.rooms.map((r) => ({ ...(roomToRow(r) as Record<string, unknown>), user_id: userId }));
  const bookingRows = state.bookings.map((r) => {
    const row = {
      ...toSnake(bookingToRow(r) as Record<string, unknown>),
      user_id: userId,
      amount: r.income ?? 0,
    };
    const id = row.id != null && isUUID(String(row.id)) ? String(row.id) : crypto.randomUUID();
    return { ...row, id };
  });

  const firstRoomId = state.rooms[0]?.id;
  let roomFinancialsRows: Record<string, unknown>[] = [];
  if (firstRoomId && isUUID(firstRoomId)) {
    const costRows = state.costCatalog.map((m) =>
      roomFinancialsRowForDb(
        {
          ...toSnake(costCatalogToRow(m) as Record<string, unknown>),
          entity_type: ENTITY_COST_CATALOG,
          user_id: userId,
          amount: 0,
        },
        ENTITY_COST_CATALOG,
        m.id,
        firstRoomId
      )
    );
    const hotelRows = state.hotelCosts.map((m) =>
      roomFinancialsRowForDb(
        {
          ...toSnake(hotelCostToRow(m) as Record<string, unknown>),
          type: 'hotel',
          entity_type: ENTITY_HOTEL_COST,
          user_id: userId,
          unit_cost: 0,
          default_qty: 1,
        },
        ENTITY_HOTEL_COST,
        m.id,
        firstRoomId
      )
    );
    roomFinancialsRows = [...costRows, ...hotelRows];
  }
  const partnerRows = buildPartnerRows(state, userId);
  const transactionRows = buildTransactionRows(state, userId);
  const monthlyRows = Object.values(state.monthLocks).map((m) => ({
    ...toSnake(monthLockToRow(m) as Record<string, unknown>),
    user_id: userId,
    month_key: m.monthKey ?? '',
    is_locked: m.isLocked ?? false,
  }));
  const forecastRows = state.forecasts.map((r) => ({
    ...toSnake(forecastToRow(r) as Record<string, unknown>),
    user_id: userId,
    month_key: r.monthKey ?? '',
    category: r.category ?? '',
    expected_amount: r.expectedAmount ?? 0,
    confidence: r.confidence ?? 0,
    period: r.period ?? 'monthly',
    type: r.type ?? 'expense',
  }));
  const expenseRows = state.expenses.map((r) => {
    const row = {
      ...toSnake(expenseToRow(r) as Record<string, unknown>),
      user_id: userId,
      type: r.type ?? 'custom',
      description: r.description ?? '',
      amount: r.amount ?? 0,
      date: r.date ?? '',
      month_key: r.monthKey ?? '',
    };
    const id = row.id != null && isUUID(String(row.id)) ? String(row.id) : crypto.randomUUID();
    return { ...row, id };
  });

  const stateRoomIds = new Set(state.rooms.map((r) => r.id));
  const tasks: { name: string; run: () => Promise<void> }[] = [
    {
      name: ROOMS,
      run: async () => {
        await deleteRoomsNotInState(userId, stateRoomIds);
        await saveEntity(ROOMS, roomRows, 'id');
      },
    },
    { name: INCOME_RECORDS, run: () => saveEntity(INCOME_RECORDS, bookingRows, 'id') },
    { name: ROOM_FINANCIALS, run: () => saveEntity(ROOM_FINANCIALS, roomFinancialsRows, 'id') },
    { name: PARTNERS, run: () => saveEntity(PARTNERS, partnerRows, 'id') },
    { name: TRANSACTIONS, run: () => saveEntity(TRANSACTIONS, transactionRows, 'id') },
    { name: MONTHLY_CONTROLS, run: () => saveEntity(MONTHLY_CONTROLS, monthlyRows, 'user_id,month_key') },
    { name: FORECAST_RECORDS, run: () => saveEntity(FORECAST_RECORDS, forecastRows, 'id') },
    { name: EXPENSE_RECORDS, run: () => saveEntity(EXPENSE_RECORDS, expenseRows, 'id') },
  ];

  const failed: string[] = [];
  for (const { name, run } of tasks) {
    try {
      await run();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[supabaseSync] ${name} save failed:`, msg);
      failed.push(name);
    }
  }
  if (failed.length > 0) {
    throw new Error(`Failed to save: ${failed.join(', ')}`);
  }
}
