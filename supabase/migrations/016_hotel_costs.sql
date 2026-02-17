-- Hotel costs table: period-based, user-scoped. Do not modify room_financials or other tables.

CREATE TABLE IF NOT EXISTS public.hotel_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'other',
  label TEXT NOT NULL DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 0,
  frequency_type TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency_type IN ('monthly', 'quarterly', 'yearly')),
  period_key TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hotel_costs_user_id ON public.hotel_costs(user_id);
CREATE INDEX IF NOT EXISTS idx_hotel_costs_period_key ON public.hotel_costs(period_key);

ALTER TABLE public.hotel_costs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hotel_costs_select_own" ON public.hotel_costs;
CREATE POLICY "hotel_costs_select_own" ON public.hotel_costs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "hotel_costs_insert_own" ON public.hotel_costs;
CREATE POLICY "hotel_costs_insert_own" ON public.hotel_costs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "hotel_costs_update_own" ON public.hotel_costs;
CREATE POLICY "hotel_costs_update_own" ON public.hotel_costs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "hotel_costs_delete_own" ON public.hotel_costs;
CREATE POLICY "hotel_costs_delete_own" ON public.hotel_costs
  FOR DELETE USING (auth.uid() = user_id);
