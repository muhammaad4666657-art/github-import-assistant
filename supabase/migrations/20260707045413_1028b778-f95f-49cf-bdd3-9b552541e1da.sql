ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS referred_by TEXT;
CREATE INDEX IF NOT EXISTS distributors_referred_by_idx ON public.distributors (lower(referred_by));
CREATE INDEX IF NOT EXISTS orders_referral_code_idx ON public.orders (lower(referral_code));