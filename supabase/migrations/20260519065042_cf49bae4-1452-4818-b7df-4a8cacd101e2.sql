
-- Allow upsert(onConflict: product_id,user_id) used by the product page review form
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_product_user_unique;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_product_user_unique UNIQUE (product_id, user_id);

-- Speed up admin dashboard / orders list
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_status_featured ON public.products(status, featured);
