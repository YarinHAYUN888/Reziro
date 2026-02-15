import type { AppState } from '../types/models';
import { loadAppState, saveAppState } from './supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';

export interface StorageAdapter {
  loadState(): Promise<AppState>;
  saveState(state: AppState): Promise<void>;
}

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

export class LocalStorageAdapter implements StorageAdapter {
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly debounceMs = 300;

  async loadState(): Promise<AppState> {
    if (!isSupabaseConfigured()) return getEmptyState();
    try {
      return await loadAppState();
    } catch (err) {
      console.error('LocalStorageAdapter.loadState failed:', err);
      return getEmptyState();
    }
  }

  async saveState(state: AppState): Promise<void> {
    if (!isSupabaseConfigured()) return;
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      saveAppState(state).catch((err) => console.error('LocalStorageAdapter.saveState failed:', err));
    }, this.debounceMs);
  }
}
