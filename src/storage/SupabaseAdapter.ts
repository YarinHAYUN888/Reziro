import { toast } from 'sonner';
import type { AppState, Booking } from '../types/models';
import type { StorageAdapter } from './LocalStorageAdapter';
import { isSupabaseConfigured } from '../lib/supabase';
import { loadState, saveState, savePartnersOnly, deletePartnerInDb, saveManualReferralsOnly, deleteManualReferralInDb, deleteExpenseInDb, insertRoomCostInDb, updateIncomeRecordInDb } from './supabaseSync';
import { bookingFromRow } from './supabaseMappings';
import type { CostCatalogItem } from '../types/models';

function getEmptyState(): AppState {
  return {
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
}

export class SupabaseAdapter implements StorageAdapter {
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly debounceMs = 300;

  async loadState(): Promise<AppState> {
    if (!isSupabaseConfigured()) {
      console.warn('SupabaseAdapter.loadState: Supabase not configured (missing env).');
      return getEmptyState();
    }
    return loadState();
  }

  async updateBookingNow(booking: Booking): Promise<Booking | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;
      const row = await updateIncomeRecordInDb(booking, session.user.id);
      return bookingFromRow(row);
    } catch (err) {
      console.error('SupabaseAdapter.updateBookingNow failed:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update booking');
      return null;
    }
  }

  async saveState(state: AppState): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.warn('SupabaseAdapter.saveState: Supabase not configured (missing env).');
      return;
    }
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      saveState(state).catch((err) => {
        const raw = typeof err === 'object' && err && 'message' in err ? (err as Error).message : err;
        const msg = typeof raw === 'string' ? raw : String(raw ?? '');
        const isSchemaOrDbError = /room_financials|schema cache|column.*does not exist|could not find.*column|column.*in the schema|discount_for_guests|invalid input syntax for type uuid/i.test(msg);
        console.error('SupabaseAdapter.saveState failed:', err);
        if (!isSchemaOrDbError) {
          toast.error(msg || 'Failed to save');
        }
      });
    }, this.debounceMs);
  }

  async savePartnersNow(state: AppState): Promise<void> {
    if (!isSupabaseConfigured()) return;
    savePartnersOnly(state).catch((err) => {
      const msg = typeof (err && (err as { message?: unknown }).message) === 'string' ? (err as { message: string }).message : (err instanceof Error ? err.message : 'Failed to save partners');
      console.error('SupabaseAdapter.savePartnersNow failed:', err);
      toast.error(msg || 'Failed to save partners');
    });
  }

  async deletePartnerNow(partnerId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    deletePartnerInDb(partnerId).catch((err) => {
      const msg = typeof (err && (err as { message?: unknown }).message) === 'string' ? (err as { message: string }).message : (err instanceof Error ? err.message : 'Failed to delete partner');
      console.error('SupabaseAdapter.deletePartnerNow failed:', err);
      toast.error(msg || 'Failed to delete partner');
    });
  }

  async saveManualReferralsNow(state: AppState): Promise<void> {
    if (!isSupabaseConfigured()) return;
    saveManualReferralsOnly(state).catch((err) => {
      const msg = typeof (err && (err as { message?: unknown }).message) === 'string' ? (err as { message: string }).message : (err instanceof Error ? err.message : 'Failed to save referral');
      console.error('SupabaseAdapter.saveManualReferralsNow failed:', err);
      toast.error(msg || 'Failed to save referral');
    });
  }

  async deleteManualReferralNow(transactionId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    deleteManualReferralInDb(transactionId).catch((err) => {
      const msg = typeof (err && (err as { message?: unknown }).message) === 'string' ? (err as { message: string }).message : (err instanceof Error ? err.message : 'Failed to delete referral');
      console.error('SupabaseAdapter.deleteManualReferralNow failed:', err);
      toast.error(msg || 'Failed to delete referral');
    });
  }

  async deleteExpenseNow(expenseId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    deleteExpenseInDb(expenseId).catch((err) => {
      const msg = typeof (err && (err as { message?: unknown }).message) === 'string' ? (err as { message: string }).message : (err instanceof Error ? err.message : 'Failed to delete expense');
      console.error('SupabaseAdapter.deleteExpenseNow failed:', err);
      toast.error(msg || 'Failed to delete expense');
    });
  }

  async addRoomCostNow(item: CostCatalogItem, firstRoomId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
      await insertRoomCostInDb(firstRoomId, item);
    } catch (err) {
      const msg = typeof (err && (err as { message?: unknown }).message) === 'string' ? (err as { message: string }).message : (err instanceof Error ? err.message : 'Failed to add cost');
      console.error('SupabaseAdapter.addRoomCostNow failed:', err);
      toast.error(msg || 'Failed to add cost');
      throw err;
    }
  }
}
