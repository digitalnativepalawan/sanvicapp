
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}'::text[];

CREATE POLICY "Anyone can update businesses (admin mode)"
ON public.businesses FOR UPDATE
USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can insert businesses (admin mode)"
ON public.businesses FOR INSERT
WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('business-images', 'business-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read business images"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-images');

CREATE POLICY "Anyone can upload business images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'business-images');

CREATE POLICY "Anyone can update business images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'business-images');
