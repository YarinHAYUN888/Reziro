-- income_records only: user_id + RLS with single FOR ALL policy. Do not touch other tables.

ALTER TABLE public.income_records
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

ALTER TABLE public.income_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own income_records" ON public.income_records;
DROP POLICY IF EXISTS "Users can view own income_records" ON public.income_records;
DROP POLICY IF EXISTS "Users can insert own income_records" ON public.income_records;
DROP POLICY IF EXISTS "Users can update own income_records" ON public.income_records;
DROP POLICY IF EXISTS "Users can delete own income_records" ON public.income_records;

CREATE POLICY "Users can manage own income_records"
  ON public.income_records FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
