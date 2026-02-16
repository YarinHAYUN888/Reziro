-- Ensure all app tables have required columns with safe defaults (partners, transactions, monthly_controls, forecast_records, expense_records).
-- Run in Supabase SQL Editor or: npm run supabase:db:push

-- partners
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS commission_type TEXT DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS commission_value NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.partners ALTER COLUMN name SET DEFAULT '';
ALTER TABLE public.partners ALTER COLUMN type SET DEFAULT 'other';
ALTER TABLE public.partners ALTER COLUMN commission_type SET DEFAULT 'percentage';
ALTER TABLE public.partners ALTER COLUMN commission_value SET DEFAULT 0;
ALTER TABLE public.partners ALTER COLUMN is_active SET DEFAULT true;

-- transactions
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS partner_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS guests_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS date TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS commission_earned NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS month_key TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'manual_referral';
ALTER TABLE public.transactions ALTER COLUMN partner_id SET DEFAULT '';
ALTER TABLE public.transactions ALTER COLUMN guests_count SET DEFAULT 0;
-- date: skip SET DEFAULT '' (column may be DATE type in existing DBs)
ALTER TABLE public.transactions ALTER COLUMN commission_earned SET DEFAULT 0;
ALTER TABLE public.transactions ALTER COLUMN month_key SET DEFAULT '';
ALTER TABLE public.transactions ALTER COLUMN type SET DEFAULT 'manual_referral';

-- monthly_controls
ALTER TABLE public.monthly_controls
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS month_key TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;
ALTER TABLE public.monthly_controls ALTER COLUMN is_locked SET DEFAULT false;

-- forecast_records
ALTER TABLE public.forecast_records
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS month_key TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS expected_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS confidence NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS period TEXT DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'expense',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.forecast_records ALTER COLUMN month_key SET DEFAULT '';
ALTER TABLE public.forecast_records ALTER COLUMN category SET DEFAULT '';
ALTER TABLE public.forecast_records ALTER COLUMN expected_amount SET DEFAULT 0;
ALTER TABLE public.forecast_records ALTER COLUMN confidence SET DEFAULT 0;
ALTER TABLE public.forecast_records ALTER COLUMN period SET DEFAULT 'monthly';
ALTER TABLE public.forecast_records ALTER COLUMN type SET DEFAULT 'expense';

-- expense_records
ALTER TABLE public.expense_records
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS date TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS month_key TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.expense_records ALTER COLUMN type SET DEFAULT 'custom';
ALTER TABLE public.expense_records ALTER COLUMN description SET DEFAULT '';
ALTER TABLE public.expense_records ALTER COLUMN amount SET DEFAULT 0;
-- date: skip SET DEFAULT '' (column may be DATE type in existing DBs)
ALTER TABLE public.expense_records ALTER COLUMN month_key SET DEFAULT '';
