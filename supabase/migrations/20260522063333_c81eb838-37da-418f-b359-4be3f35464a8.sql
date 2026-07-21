ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS shipping_fee_lahore numeric NOT NULL DEFAULT 200,
  ADD COLUMN IF NOT EXISTS shipping_fee_other numeric NOT NULL DEFAULT 300;