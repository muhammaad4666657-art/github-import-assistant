
-- Add media + verified fields to reviews
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS media jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;

-- Switch new reviews to require admin approval
ALTER TABLE public.reviews ALTER COLUMN approved SET DEFAULT false;

-- Create public bucket for review media
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-media', 'review-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for review-media
DROP POLICY IF EXISTS "review media public read" ON storage.objects;
CREATE POLICY "review media public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'review-media');

DROP POLICY IF EXISTS "users upload own review media" ON storage.objects;
CREATE POLICY "users upload own review media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'review-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "users delete own review media" ON storage.objects;
CREATE POLICY "users delete own review media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'review-media'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin'))
  );
