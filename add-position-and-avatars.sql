-- Add position columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_x INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_y INTEGER;

-- Create avatars storage bucket (run this in Supabase Dashboard > Storage)
-- Or use the Storage API to create the bucket

-- Make sure the bucket is public for avatar access
-- In Supabase Dashboard > Storage > avatars > Policies:
-- 1. Enable public access for SELECT
-- 2. Enable authenticated users to INSERT/UPDATE their own files

-- If you prefer SQL policies:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Policy for public read access
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- Policy for authenticated upload
-- CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
