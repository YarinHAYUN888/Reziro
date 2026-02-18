import type { AppState, Booking } from '../types/models';

export interface StorageAdapter {
  loadState(): Promise<AppState>;
  saveState(state: AppState): Promise<void>;
  /** Optional: update one booking in DB and return updated row for local state sync (Supabase). */
  updateBookingNow?(booking: Booking): Promise<Booking | null>;
  /** Optional: immediate save of partners only (Supabase). No-op if not implemented. */
  savePartnersNow?(state: AppState): Promise<void>;
  /** Optional: delete one partner in DB (Supabase). No-op if not implemented. */
  deletePartnerNow?(partnerId: string): Promise<void>;
  /** Optional: immediate save of manual referrals only (Supabase). */
  saveManualReferralsNow?(state: AppState): Promise<void>;
  /** Optional: delete one manual referral in DB (Supabase). */
  deleteManualReferralNow?(transactionId: string): Promise<void>;
  /** Optional: delete one expense in DB (Supabase). */
  deleteExpenseNow?(expenseId: string): Promise<void>;
  /** Optional: insert one room cost into DB (Supabase). */
  addRoomCostNow?(item: import('../types/models').CostCatalogItem, firstRoomId: string): Promise<void>;
}
