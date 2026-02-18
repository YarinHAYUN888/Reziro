-- VAT support for income_records (bookings). Add columns only; no RLS or other table changes.
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS vat_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS vat_amount NUMERIC;
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS total_amount NUMERIC;
