
-- Storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "product images public read" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "admins upload product images" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update product images" ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete product images" ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- Site settings (single row)
CREATE TABLE public.site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  site_name TEXT NOT NULL DEFAULT 'ALM International',
  whatsapp_number TEXT NOT NULL DEFAULT '923264465422',
  contact_phone TEXT NOT NULL DEFAULT '+92 326 4465422',
  contact_email TEXT,
  shipping_fee NUMERIC NOT NULL DEFAULT 250,
  hero_headline TEXT,
  hero_subtext TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  tiktok_url TEXT,
  announcement TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "admins update settings" ON public.site_settings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins insert settings" ON public.site_settings FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Wishlist
CREATE TABLE public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own wishlist" ON public.wishlist_items FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Public order tracking via order_number + phone (security definer)
CREATE OR REPLACE FUNCTION public.track_order(_order_number TEXT, _phone TEXT)
RETURNS TABLE (
  order_number TEXT, status order_status, customer_name TEXT,
  shipping_address TEXT, shipping_city TEXT, total NUMERIC, created_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.order_number, o.status, o.customer_name,
         o.shipping_address, o.shipping_city, o.total, o.created_at
  FROM public.orders o
  WHERE o.order_number = _order_number
    AND regexp_replace(o.customer_phone, '\D', '', 'g') = regexp_replace(_phone, '\D', '', 'g')
  LIMIT 1
$$;
