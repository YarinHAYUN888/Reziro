-- RLS for all app tables EXCEPT rooms and partners (user_id = auth.uid()).
-- Run in Supabase SQL Editor or via: npm run supabase:db:push

-- room_financials
ALTER TABLE public.room_financials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own room_financials" ON public.room_financials;
DROP POLICY IF EXISTS "Users can insert own room_financials" ON public.room_financials;
DROP POLICY IF EXISTS "Users can update own room_financials" ON public.room_financials;
DROP POLICY IF EXISTS "Users can delete own room_financials" ON public.room_financials;
DROP POLICY IF EXISTS "Users can manage own room_financials" ON public.room_financials;
CREATE POLICY "Users can manage own room_financials" ON public.room_financials FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- income_records
ALTER TABLE public.income_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own income_records" ON public.income_records;
CREATE POLICY "Users can manage own income_records" ON public.income_records FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

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

-- profiles (id = auth.uid(), not user_id)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
