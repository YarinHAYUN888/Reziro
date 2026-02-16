-- Ensure room_financials has all columns with safe defaults (Costs page: cost catalog + hotel costs).
-- Run in Supabase SQL Editor or: npm run supabase:db:push

ALTER TABLE public.room_financials
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'room',
  ADD COLUMN IF NOT EXISTS entity_type TEXT DEFAULT 'cost_catalog',
  ADD COLUMN IF NOT EXISTS label TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS unit_cost NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS default_qty INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Ensure NOT NULL columns have defaults (for existing tables that may have been created strict)
ALTER TABLE public.room_financials ALTER COLUMN type SET DEFAULT 'room';
ALTER TABLE public.room_financials ALTER COLUMN entity_type SET DEFAULT 'cost_catalog';
ALTER TABLE public.room_financials ALTER COLUMN label SET DEFAULT '';
ALTER TABLE public.room_financials ALTER COLUMN unit_cost SET DEFAULT 0;
ALTER TABLE public.room_financials ALTER COLUMN default_qty SET DEFAULT 1;
ALTER TABLE public.room_financials ALTER COLUMN is_active SET DEFAULT true;
ALTER TABLE public.room_financials ALTER COLUMN amount SET DEFAULT 0;
