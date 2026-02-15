import type { AppState } from '../types/models';
import { loadAppState, saveAppState } from '../storage/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';

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

export class LocalStorageAdapter {
  async loadState(): Promise<AppState> {
    if (!isSupabaseConfigured()) return getEmptyState();
    try {
      return await loadAppState();
    } catch (err) {
      console.error('LocalStorageAdapter.loadState failed:', err);
      return getEmptyState();
    }
  }

  saveState(state: Partial<AppState>): void {
    if (!isSupabaseConfigured()) return;
    const full: AppState = {
      rooms: state.rooms ?? [],
      bookings: state.bookings ?? [],
      costCatalog: state.costCatalog ?? [],
      hotelCosts: state.hotelCosts ?? [],
      partners: state.partners ?? [],
      manualReferrals: state.manualReferrals ?? [],
      monthLocks: state.monthLocks ?? {},
      forecasts: state.forecasts ?? [],
      expenses: state.expenses ?? [],
    };
    saveAppState(full).catch((err) => console.error('LocalStorageAdapter.saveState failed:', err));
  }

  hydrateFromStorage(): Partial<AppState> | null {
    return null;
  }

  clearStorage(): void {}
}
