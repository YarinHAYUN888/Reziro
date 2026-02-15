-- Ensure room_financials has category column (for cost_catalog and hotel_cost)
-- Fixes "Could not find the 'category' column of 'room_financials' in the schema cache"

ALTER TABLE public.room_financials
  ADD COLUMN IF NOT EXISTS category TEXT;
