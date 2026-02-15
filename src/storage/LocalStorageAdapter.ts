import type { AppState } from '../types/models';

export interface StorageAdapter {
  loadState(): Promise<AppState>;
  saveState(state: AppState): Promise<void>;
}
