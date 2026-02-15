-- room_financials: add columns needed for hotel costs (amount, created_at, updated_at)
-- cost_catalog uses unit_cost; hotel_cost uses amount. Both use created_at/updated_at.

ALTER TABLE public.room_financials
  ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
