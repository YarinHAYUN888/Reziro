import { toast } from 'sonner';
import type { AppState } from '../types/models';
import type { StorageAdapter } from './LocalStorageAdapter';
import { isSupabaseConfigured } from '../lib/supabase';
import { loadState, saveState } from './supabaseSync';

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

  async saveState(state: AppState): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.warn('SupabaseAdapter.saveState: Supabase not configured (missing env).');
      return;
    }
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      saveState(state).catch((err) => {
        const msg = typeof err === 'object' && err && 'message' in err
          ? String((err as Error).message)
          : String(err ?? '');
        const isSchemaOrDbError = /room_financials|schema cache|column.*does not exist|could not find.*column|column.*in the schema/i.test(msg);
        console.error('SupabaseAdapter.saveState failed:', err);
        if (!isSchemaOrDbError) {
          toast.error(msg || 'Failed to save');
        }
      });
    }, this.debounceMs);
  }
}
