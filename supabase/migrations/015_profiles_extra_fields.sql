-- Add registration fields to public.profiles only. Do not remove existing columns. Do not change RLS.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS hotel_role TEXT;
