import type { AppState } from '../types/models';
import type { StorageAdapter } from './LocalStorageAdapter';
import { isSupabaseConfigured } from '../lib/supabase';
import { loadAppState, saveAppState } from './supabaseService';

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
    try {
      return await loadAppState();
    } catch (err) {
      console.error('SupabaseAdapter.loadState failed:', err);
      return getEmptyState();
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
      saveAppState(state).catch((err) => console.error('SupabaseAdapter.saveState failed:', err));
    }, this.debounceMs);
  }
}
