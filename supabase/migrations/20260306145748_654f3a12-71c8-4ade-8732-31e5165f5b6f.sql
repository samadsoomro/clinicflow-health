-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('clinic-assets', 'clinic-assets', true);

-- Storage RLS policies
CREATE POLICY "Public read clinic-assets" ON storage.objects FOR SELECT USING (bucket_id = 'clinic-assets');
CREATE POLICY "Authenticated upload clinic-assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'clinic-assets');
CREATE POLICY "Authenticated update clinic-assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'clinic-assets');
CREATE POLICY "Authenticated delete clinic-assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'clinic-assets');

-- Add INSERT policy for profiles (needed by trigger)
CREATE POLICY "System can insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);