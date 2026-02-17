import type { HotelCost, HotelCostFrequency } from '../types/models';

/**
 * Derive period_key from a month key (yyyy-MM) and frequency.
 * - monthly: "2026-02"
 * - quarterly: "2026-Q1" (Q1=Jan-Mar, Q2=Apr-Jun, Q3=Jul-Sep, Q4=Oct-Dec)
 * - yearly: "2026"
 */
export function getPeriodKeyFromMonth(monthKey: string, frequency: HotelCostFrequency): string {
  if (!monthKey || monthKey.length < 7) return monthKey;
  if (frequency === 'yearly') return monthKey.slice(0, 4);
  if (frequency === 'quarterly') {
    const month = parseInt(monthKey.slice(5, 7), 10);
    const q = Math.ceil(month / 3);
    return `${monthKey.slice(0, 4)}-Q${q}`;
  }
  return monthKey;
}

/**
 * True if this hotel cost's period applies to the selected month.
 */
export function hotelCostMatchesPeriod(cost: HotelCost, selectedMonthKey: string): boolean {
  const key = selectedMonthKey;
  if (!key || key.length < 7) return false;
  if (cost.frequencyType === 'monthly') return cost.periodKey === key;
  if (cost.frequencyType === 'yearly') return cost.periodKey === key.slice(0, 4);
  if (cost.frequencyType === 'quarterly') {
    const periodKey = getPeriodKeyFromMonth(key, 'quarterly');
    return cost.periodKey === periodKey;
  }
  return false;
}

export const FREQUENCY_LABELS: Record<HotelCostFrequency, string> = {
  monthly: 'חודשי',
  quarterly: 'רבעוני',
  yearly: 'שנתי',
};
