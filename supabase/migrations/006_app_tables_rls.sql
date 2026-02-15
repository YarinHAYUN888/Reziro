-- RLS for app tables: users can only access their own rows (user_id = auth.uid()).
-- Run after 005_app_tables.sql. room_financials and profiles already have RLS.

-- rooms
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own rooms" ON public.rooms;
CREATE POLICY "Users can manage own rooms" ON public.rooms FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- income_records (bookings)
ALTER TABLE public.income_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own income_records" ON public.income_records;
CREATE POLICY "Users can manage own income_records" ON public.income_records FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- partners
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own partners" ON public.partners;
CREATE POLICY "Users can manage own partners" ON public.partners FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own transactions" ON public.transactions;
CREATE POLICY "Users can manage own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- monthly_controls
ALTER TABLE public.monthly_controls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own monthly_controls" ON public.monthly_controls;
CREATE POLICY "Users can manage own monthly_controls" ON public.monthly_controls FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- forecast_records
ALTER TABLE public.forecast_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own forecast_records" ON public.forecast_records;
CREATE POLICY "Users can manage own forecast_records" ON public.forecast_records FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- expense_records
ALTER TABLE public.expense_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own expense_records" ON public.expense_records;
CREATE POLICY "Users can manage own expense_records" ON public.expense_records FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
