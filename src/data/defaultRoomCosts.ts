import type { CostCatalogItem } from '../types/models';

/** Default room cost items (name, cost_per_unit, quantity). Persisted in Supabase room_financials per user. */
export const DEFAULT_ROOM_COSTS: CostCatalogItem[] = [
  { id: 'rc-001', type: 'room', label: 'נעלי בית', unitCost: 2.99, defaultQty: 2, isActive: true },
  { id: 'rc-002', type: 'room', label: 'ערכת טיפוח', unitCost: 0.649, defaultQty: 1, isActive: true },
  { id: 'rc-003', type: 'room', label: 'קרם גוף', unitCost: 1.416, defaultQty: 1, isActive: true },
  { id: 'rc-004', type: 'room', label: 'סבונים', unitCost: 0.912, defaultQty: 2, isActive: true },
  { id: 'rc-005', type: 'room', label: 'קפה', unitCost: 1.99, defaultQty: 4, isActive: true },
  { id: 'rc-006', type: 'room', label: 'סוכריות', unitCost: 0.575, defaultQty: 2, isActive: true },
  { id: 'rc-007', type: 'room', label: 'חטיפים', unitCost: 0.69, defaultQty: 2, isActive: true },
  { id: 'rc-008', type: 'room', label: 'קפסולות', unitCost: 2.87, defaultQty: 1, isActive: true },
  { id: 'rc-009', type: 'room', label: 'מוצרי ניקיון', unitCost: 52, defaultQty: 1, isActive: true },
  { id: 'rc-010', type: 'room', label: 'טישו טואלט', unitCost: 6, defaultQty: 2, isActive: true },
  { id: 'rc-011', type: 'room', label: 'מים מינרליים', unitCost: 36, defaultQty: 1, isActive: true },
  { id: 'rc-012', type: 'room', label: 'קרטיבים', unitCost: 7.08, defaultQty: 1, isActive: true },
];
