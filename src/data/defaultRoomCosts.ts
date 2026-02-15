import type { CostCatalogItem } from '../types/models';

export const DEFAULT_ROOM_COSTS: CostCatalogItem[] = [
  { id: 'rc-001', type: 'room', label: 'נעלי בית', unitCost: 2.99, defaultQty: 2, isActive: true },
  { id: 'rc-002', type: 'room', label: 'ערכת טיפוח', unitCost: 0.649, defaultQty: 1, isActive: true },
  { id: 'rc-003', type: 'room', label: 'קרם גוף', unitCost: 1.416, defaultQty: 1, isActive: true },
  { id: 'rc-004', type: 'room', label: 'סבונים', unitCost: 0.912, defaultQty: 2, isActive: true },
  { id: 'rc-005', type: 'room', label: 'קפסולות', unitCost: 1.99, defaultQty: 4, isActive: true },
  { id: 'rc-006', type: 'room', label: 'חטיפים', unitCost: 0.575, defaultQty: 2, isActive: true },
  { id: 'rc-007', type: 'room', label: 'סוכריות', unitCost: 0.69, defaultQty: 2, isActive: true },
  { id: 'rc-008', type: 'room', label: 'קנקן אמבט', unitCost: 2.87, defaultQty: 1, isActive: true },
  { id: 'rc-009', type: 'room', label: 'בקבוק מיץ מעובד', unitCost: 52, defaultQty: 1, isActive: true },
  { id: 'rc-010', type: 'room', label: 'חומרי ניקיון', unitCost: 5, defaultQty: 1, isActive: true },
  { id: 'rc-011', type: 'room', label: 'פחי טואלט', unitCost: 1, defaultQty: 2, isActive: true },
  { id: 'rc-012', type: 'room', label: 'סט מצעים קומפלט (6 קילו)', unitCost: 36, defaultQty: 1, isActive: true },
];
