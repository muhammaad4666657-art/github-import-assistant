
-- Fix search_path on set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Restrict SECURITY DEFINER function execution
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, app_role) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Require authenticated for order placement (login required for checkout)
DROP POLICY IF EXISTS "anyone create order" ON public.orders;
DROP POLICY IF EXISTS "anyone insert order items" ON public.order_items;
CREATE POLICY "auth users create own order" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "auth users insert items for own order" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- ============ SEED CATEGORIES ============
INSERT INTO public.categories (slug, name, description, sort_order) VALUES
('skincare','Skincare','Premium serums, creams, cleansers and oils for glowing skin',1),
('home-care','Home Care','Luxurious diffusers, candles and home fragrances',2),
('fragrances','Fragrances','Signature perfumes and attars',3),
('hair-care','Hair Care','Nourishing oils, shampoos and treatments',4);

-- ============ SEED PRODUCTS ============
WITH c AS (SELECT id, slug FROM public.categories)
INSERT INTO public.products (slug, name, short_description, description, price, sale_price, stock, image_url, category_id, featured, is_new, tag) VALUES
('radiance-glow-serum','Radiance Glow Serum','Vitamin C brightening serum with hyaluronic acid','A powerful blend of Vitamin C, niacinamide and hyaluronic acid that brightens dull skin, fades dark spots and restores a youthful glow. Suitable for all skin types. Apply 2-3 drops morning and night.',4200,3450,45,'/src/assets/product-serum.jpg',(SELECT id FROM c WHERE slug='skincare'),true,false,'Best Seller'),
('hydra-soft-night-cream','Hydra-Soft Night Cream','Intensive overnight hydration with ceramides',E'Wake up to plump, deeply nourished skin. Our night cream combines ceramides, peptides and shea butter to repair and restore while you sleep.\n\n- 50ml jar\n- Cruelty-free\n- For dry to normal skin',2890,NULL,60,'/src/assets/product-cream.jpg',(SELECT id FROM c WHERE slug='skincare'),true,true,'New'),
('pure-cleansing-oil','Pure Cleansing Oil','Gentle makeup-melting cleansing oil',E'Melts away makeup, sunscreen and impurities without stripping skin. Infused with jojoba and rosehip oils.',2600,2150,80,'/src/assets/product-oil.jpg',(SELECT id FROM c WHERE slug='skincare'),true,false,'-18%'),
('amber-home-diffuser','Amber Home Diffuser','Luxury reed diffuser with amber & oud',E'Transform any room with the warm, rich aroma of amber, oud and sandalwood. Long-lasting fragrance for up to 90 days.',3950,NULL,25,'/src/assets/product-diffuser.jpg',(SELECT id FROM c WHERE slug='home-care'),true,false,'Limited'),
('rose-petal-toner','Rose Petal Hydrating Toner','Alcohol-free toner with damask rose','A refreshing mist that balances pH, hydrates and preps skin for serums. Made with steam-distilled damask rose water.',1850,1550,100,'/src/assets/product-serum.jpg',(SELECT id FROM c WHERE slug='skincare'),false,true,'New'),
('velvet-body-butter','Velvet Body Butter','Whipped body butter with shea & cocoa','Indulgent body butter that deeply moisturises and leaves skin silky soft. Lightly scented with vanilla.',2450,NULL,70,'/src/assets/product-cream.jpg',(SELECT id FROM c WHERE slug='skincare'),false,true,'New'),
('signature-oud-attar','Signature Oud Attar','Long-lasting alcohol-free attar 12ml','A regal blend of pure oud, rose and amber. Concentrated, alcohol-free attar that lasts all day.',5500,4800,30,'/src/assets/product-oil.jpg',(SELECT id FROM c WHERE slug='fragrances'),true,false,'Best Seller'),
('lavender-candle','Lavender Soy Candle','Hand-poured 200g soy wax candle','Calming French lavender candle. 40+ hour burn time, clean-burning soy wax.',1950,NULL,55,'/src/assets/product-diffuser.jpg',(SELECT id FROM c WHERE slug='home-care'),false,false,NULL);
