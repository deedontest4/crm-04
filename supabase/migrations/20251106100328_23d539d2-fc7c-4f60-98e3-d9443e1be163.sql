-- Create storage bucket for asset images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('asset-images', 'asset-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for asset images
CREATE POLICY "Anyone can view asset images"
ON storage.objects FOR SELECT
USING (bucket_id = 'asset-images');

CREATE POLICY "Authenticated users can upload asset images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'asset-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update their asset images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'asset-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete asset images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'asset-images' 
  AND auth.role() = 'authenticated'
);