-- Create app tables with user_id for RLS. Run after 001–004.

-- rooms
CREATE TABLE IF NOT EXISTS public.rooms (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  room_name TEXT NOT NULL DEFAULT '',
  room_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rooms_user_id ON public.rooms(user_id);

-- income_records (bookings)
CREATE TABLE IF NOT EXISTS public.income_records (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  room_id TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  month_key TEXT NOT NULL,
  week_of_month INTEGER NOT NULL DEFAULT 1,
  price_per_night NUMERIC NOT NULL DEFAULT 0,
  nights_count INTEGER NOT NULL DEFAULT 0,
  income NUMERIC NOT NULL DEFAULT 0,
  extra_expenses NUMERIC NOT NULL DEFAULT 0,
  selected_room_costs JSONB DEFAULT '[]',
  selected_hotel_costs JSONB DEFAULT '[]',
  partner_referrals JSONB,
  totals JSONB,
  metrics JSONB,
  customer JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- Ensure columns exist on income_records if table was created manually with different schema
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS month_key TEXT NOT NULL DEFAULT '2000-01';
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS room_id TEXT;
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS start_date TEXT;
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS end_date TEXT;
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS week_of_month INTEGER DEFAULT 1;
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS price_per_night NUMERIC DEFAULT 0;
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS nights_count INTEGER DEFAULT 0;
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS income NUMERIC DEFAULT 0;
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS extra_expenses NUMERIC DEFAULT 0;
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS selected_room_costs JSONB DEFAULT '[]';
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS selected_hotel_costs JSONB DEFAULT '[]';
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS partner_referrals JSONB;
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS totals JSONB;
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS metrics JSONB;
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS customer JSONB;
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_income_records_user_id ON public.income_records(user_id);
CREATE INDEX IF NOT EXISTS idx_income_records_month_key ON public.income_records(month_key);

-- partners
CREATE TABLE IF NOT EXISTS public.partners (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'other',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  commission_type TEXT NOT NULL DEFAULT 'percentage',
  commission_value NUMERIC NOT NULL DEFAULT 0,
  discount_for_guests NUMERIC,
  location TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_partners_user_id ON public.partners(user_id);

-- transactions (manual_referrals stored with type = 'manual_referral')
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  partner_id TEXT NOT NULL,
  guests_count INTEGER NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  notes TEXT,
  commission_earned NUMERIC NOT NULL DEFAULT 0,
  month_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  type TEXT NOT NULL DEFAULT 'manual_referral'
);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);

-- monthly_controls (month locks; one row per user per month)
CREATE TABLE IF NOT EXISTS public.monthly_controls (
  month_key TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  is_locked BOOLEAN NOT NULL DEFAULT false,
  locked_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, month_key)
);
CREATE INDEX IF NOT EXISTS idx_monthly_controls_user_id ON public.monthly_controls(user_id);

-- forecast_records
CREATE TABLE IF NOT EXISTS public.forecast_records (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  month_key TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  expected_amount NUMERIC NOT NULL DEFAULT 0,
  confidence NUMERIC NOT NULL DEFAULT 0,
  period TEXT NOT NULL DEFAULT 'monthly',
  type TEXT NOT NULL DEFAULT 'expense',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_forecast_records_user_id ON public.forecast_records(user_id);

-- expense_records
CREATE TABLE IF NOT EXISTS public.expense_records (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL DEFAULT 'custom',
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  month_key TEXT NOT NULL,
  room_id TEXT,
  booking_id TEXT,
  selected_room_costs JSONB,
  selected_hotel_costs JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- Ensure columns exist on expense_records if table was created manually with different schema
ALTER TABLE public.expense_records ADD COLUMN IF NOT EXISTS month_key TEXT NOT NULL DEFAULT '2000-01';
ALTER TABLE public.expense_records ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.expense_records ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'custom';
ALTER TABLE public.expense_records ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.expense_records ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0;
ALTER TABLE public.expense_records ADD COLUMN IF NOT EXISTS date TEXT;
ALTER TABLE public.expense_records ADD COLUMN IF NOT EXISTS room_id TEXT;
ALTER TABLE public.expense_records ADD COLUMN IF NOT EXISTS booking_id TEXT;
ALTER TABLE public.expense_records ADD COLUMN IF NOT EXISTS selected_room_costs JSONB;
ALTER TABLE public.expense_records ADD COLUMN IF NOT EXISTS selected_hotel_costs JSONB;
ALTER TABLE public.expense_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.expense_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_expense_records_user_id ON public.expense_records(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_records_month_key ON public.expense_records(month_key);

-- Ensure user_id exists on tables that may have been created manually (no-op if 005 created them)
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.monthly_controls ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.forecast_records ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.expense_records ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
