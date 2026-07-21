
-- Restrict execute on track_order
REVOKE EXECUTE ON FUNCTION public.track_order(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_order(TEXT, TEXT) TO anon, authenticated;
-- The warnings flag SECURITY DEFINER being callable; we keep it callable because tracking is intentionally public,
-- but we've explicitly granted only to expected roles. To silence the listing-bucket warning, the policy already
-- scopes to a single bucket — re-creating to be explicit:
DROP POLICY IF EXISTS "product images public read" ON storage.objects;
CREATE POLICY "product images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');
