-- Create room_financials table with schema expected by the app
-- Run in Supabase Dashboard → SQL Editor before seed_room_costs.sql

CREATE TABLE IF NOT EXISTS room_financials (
  id TEXT PRIMARY KEY,
  "type" TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  label TEXT NOT NULL,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  default_qty INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  category TEXT
);

CREATE INDEX IF NOT EXISTS idx_room_financials_entity_type ON room_financials(entity_type);
