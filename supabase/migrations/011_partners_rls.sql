-- Partners only: user_id + RLS with single FOR ALL policy. Do not touch other tables.

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own partners" ON public.partners;
DROP POLICY IF EXISTS "Users can view own partners" ON public.partners;
DROP POLICY IF EXISTS "Users can insert own partners" ON public.partners;
DROP POLICY IF EXISTS "Users can update own partners" ON public.partners;
DROP POLICY IF EXISTS "Users can delete own partners" ON public.partners;

CREATE POLICY "Users can manage own partners"
  ON public.partners FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
