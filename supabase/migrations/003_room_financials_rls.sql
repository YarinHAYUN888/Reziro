-- Add user_id to room_financials (if missing) and enable RLS so rows are scoped per user

ALTER TABLE public.room_financials
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_room_financials_user_id ON public.room_financials(user_id);

ALTER TABLE public.room_financials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own room_financials"
  ON public.room_financials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own room_financials"
  ON public.room_financials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own room_financials"
  ON public.room_financials FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own room_financials"
  ON public.room_financials FOR DELETE
  USING (auth.uid() = user_id);
