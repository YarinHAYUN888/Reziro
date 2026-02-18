import { format, differenceInCalendarDays, parseISO } from 'date-fns';
import type { Booking, SelectedCost, CostCatalogItem, PartnerReferral } from '../types/models';

/**
 * Calculation Engine for GEST'S Financial CRM
 * 
 * Excel is the source of truth. All formulas here must match the Excel model.
 * Adjust these functions only when Excel formulas change.
 */

/**
 * Convert ISO date string to monthKey format YYYY-MM
 */
export function toMonthKey(dateISO: string): string {
  const date = parseISO(dateISO);
  return format(date, 'yyyy-MM');
}

/**
 * Get week of month (1-4) using simple 4-week model
 * Days 1-7 = Week 1
 * Days 8-14 = Week 2
 * Days 15-21 = Week 3
 * Days 22+ = Week 4
 */
export function getWeekOfMonth4(dateISO: string): 1 | 2 | 3 | 4 {
  const date = parseISO(dateISO);
  const day = date.getDate();
  
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}

/**
 * Calculate number of nights
 * Hotel checkout style: nights = end date - start date
 * Example: Jan 1 to Jan 3 = 2 nights (stay on Jan 1 and Jan 2, checkout Jan 3)
 */
export function calcNightsCount(startDate: string, endDate: string): number {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const nights = differenceInCalendarDays(end, start);
  return Math.max(0, nights); // Ensure non-negative
}

/**
 * Calculate income from nights and price per night
 */
export function calcIncome(nights: number, pricePerNight: number): number {
  return nights * pricePerNight;
}

/**
 * Calculate totals from selected costs
 */
export function calcSelectedCostsTotals(
  selectedRoomCosts: SelectedCost[],
  selectedHotelCosts: SelectedCost[]
): {
  totalRoomCosts: number;
  totalHotelCosts: number;
  totalOrderExpenses: number;
} {
  const totalRoomCosts = selectedRoomCosts.reduce((sum, cost) => sum + cost.total, 0);
  const totalHotelCosts = selectedHotelCosts.reduce((sum, cost) => sum + cost.total, 0);
  const totalOrderExpenses = totalRoomCosts + totalHotelCosts;

  return {
    totalRoomCosts,
    totalHotelCosts,
    totalOrderExpenses,
  };
}

/**
 * Calculate Potential Profit
 * Formula: income - (totalRoomCosts + totalHotelCosts)
 */
export function calcPotentialProfit(
  income: number,
  totalRoomCosts: number,
  totalHotelCosts: number
): number {
  return income - (totalRoomCosts + totalHotelCosts);
}

/**
 * Calculate Gross Profit
 * Formula: income - totalRoomCosts (treating room costs as COGS)
 */
export function calcGrossProfit(income: number, totalRoomCosts: number): number {
  return income - totalRoomCosts;
}

/**
 * Calculate Net Profit
 * Formula: grossProfit - (totalHotelCosts + extraExpenses)
 */
export function calcNetProfit(
  grossProfit: number,
  totalHotelCosts: number,
  extraExpenses: number
): number {
  return grossProfit - (totalHotelCosts + extraExpenses);
}

/**
 * Main normalization function
 * Takes draft booking input and computes all derived fields
 */
export interface BookingInput {
  id?: string;
  roomId: string;
  startDate: string;
  endDate: string;
  pricePerNight: number;
  extraExpenses: number;
  selectedRoomCosts: SelectedCost[];
  selectedHotelCosts: SelectedCost[];
  partnerReferrals?: PartnerReferral[];
  vatEnabled?: boolean;
  customer?: {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
  };
  createdAt?: string;
}

export function normalizeAndComputeBooking(input: BookingInput): Booking {
  const now = new Date().toISOString();
  
  // Derive date-based fields
  const monthKey = toMonthKey(input.startDate);
  const weekOfMonth = getWeekOfMonth4(input.startDate);
  const nightsCount = calcNightsCount(input.startDate, input.endDate);
  const income = calcIncome(nightsCount, input.pricePerNight);

  // Calculate cost totals
  const totals = calcSelectedCostsTotals(input.selectedRoomCosts, input.selectedHotelCosts);

  // Calculate metrics (gross = income - room costs; base net = gross - hotel costs - extra)
  const potentialProfit = calcPotentialProfit(income, totals.totalRoomCosts, totals.totalHotelCosts);
  const grossProfit = calcGrossProfit(income, totals.totalRoomCosts);
  const baseNetProfit = calcNetProfit(grossProfit, totals.totalHotelCosts, input.extraExpenses);
  const totalPartnerRevenue = (input.partnerReferrals ?? []).reduce((sum, r) => sum + r.commissionEarned, 0);
  const netProfit = baseNetProfit + totalPartnerRevenue;

  const VAT_RATE = 0.18;
  const vatEnabled = input.vatEnabled === true;
  const vatAmount = vatEnabled ? Math.round(income * VAT_RATE * 100) / 100 : 0;
  const totalAmount = vatEnabled ? Math.round(income * (1 + VAT_RATE) * 100) / 100 : income;

  return {
    id: input.id || crypto.randomUUID(),
    roomId: input.roomId,
    startDate: input.startDate,
    endDate: input.endDate,
    monthKey,
    weekOfMonth,
    pricePerNight: input.pricePerNight,
    nightsCount,
    income,
    vatEnabled: vatEnabled || undefined,
    vatAmount: vatEnabled ? vatAmount : undefined,
    totalAmount: vatEnabled ? totalAmount : income,
    extraExpenses: input.extraExpenses,
    selectedRoomCosts: input.selectedRoomCosts,
    selectedHotelCosts: input.selectedHotelCosts,
    partnerReferrals: input.partnerReferrals ?? undefined,
    totals,
    metrics: {
      potentialProfit,
      grossProfit,
      netProfit,
    },
    customer: input.customer,
    createdAt: input.createdAt || now,
    updatedAt: now,
  };
}

/**
 * Helper to recalculate selected cost total
 */
export function calcSelectedCostTotal(unitCost: number, qty: number): number {
  return unitCost * qty;
}

/**
 * Helper to create SelectedCost from catalog item
 */
export function createSelectedCostFromCatalog(catalogItem: CostCatalogItem, qty?: number): SelectedCost {
  const quantity = qty ?? catalogItem.defaultQty;
  return {
    catalogId: catalogItem.id,
    labelSnapshot: catalogItem.label,
    unitCostSnapshot: catalogItem.unitCost,
    qty: quantity,
    total: calcSelectedCostTotal(catalogItem.unitCost, quantity),
  };
}