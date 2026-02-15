-- Ensure room_financials has category and default_qty (for cost_catalog and hotel_cost)
-- Fixes "Could not find the 'category' / 'default_qty' column of 'room_financials' in the schema cache"

ALTER TABLE public.room_financials
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS default_qty INTEGER NOT NULL DEFAULT 1;
