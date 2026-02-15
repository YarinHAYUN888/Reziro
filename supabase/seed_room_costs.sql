INSERT INTO room_financials (id, "type", entity_type, label, unit_cost, default_qty, is_active)
VALUES
  ('rc-001', 'room', 'cost_catalog', 'נעלי בית', 2.99, 2, true),
  ('rc-002', 'room', 'cost_catalog', 'ערכת טיפוח', 0.649, 1, true),
  ('rc-003', 'room', 'cost_catalog', 'קרם גוף', 1.416, 1, true),
  ('rc-004', 'room', 'cost_catalog', 'סבונים', 0.912, 2, true),
  ('rc-005', 'room', 'cost_catalog', 'קפסולות', 1.99, 4, true),
  ('rc-006', 'room', 'cost_catalog', 'חטיפים', 0.575, 2, true),
  ('rc-007', 'room', 'cost_catalog', 'סוכריות', 0.69, 2, true),
  ('rc-008', 'room', 'cost_catalog', 'קנקן אמבט', 2.87, 1, true),
  ('rc-009', 'room', 'cost_catalog', 'בקבוק מיץ מעובד', 52, 1, true),
  ('rc-010', 'room', 'cost_catalog', 'חומרי ניקיון', 5, 1, true),
  ('rc-011', 'room', 'cost_catalog', 'פחי טואלט', 1, 2, true),
  ('rc-012', 'room', 'cost_catalog', 'סט מצעים קומפלט (6 קילו)', 36, 1, true)
ON CONFLICT (id) DO UPDATE SET
  "type" = EXCLUDED."type",
  entity_type = EXCLUDED.entity_type,
  label = EXCLUDED.label,
  unit_cost = EXCLUDED.unit_cost,
  default_qty = EXCLUDED.default_qty,
  is_active = EXCLUDED.is_active;
