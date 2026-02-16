-- expense_records only: user_id + RLS with single FOR ALL policy. Do not touch other tables.

ALTER TABLE public.expense_records
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

ALTER TABLE public.expense_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own expense_records" ON public.expense_records;
DROP POLICY IF EXISTS "Users can view own expense_records" ON public.expense_records;
DROP POLICY IF EXISTS "Users can insert own expense_records" ON public.expense_records;
DROP POLICY IF EXISTS "Users can update own expense_records" ON public.expense_records;
DROP POLICY IF EXISTS "Users can delete own expense_records" ON public.expense_records;

CREATE POLICY "Users can manage own expense_records"
  ON public.expense_records FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
