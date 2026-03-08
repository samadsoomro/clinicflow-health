-- Allow clinic_admin to update their own clinic
CREATE POLICY "Clinic admin can update own clinic"
ON public.clinics
FOR UPDATE
TO authenticated
USING (has_clinic_role(auth.uid(), 'clinic_admin'::app_role, id))
WITH CHECK (has_clinic_role(auth.uid(), 'clinic_admin'::app_role, id));

-- Allow clinic_admin to upload to clinic-assets storage bucket
CREATE POLICY "Clinic admin can upload assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'clinic-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT ur.clinic_id::text FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'clinic_admin'
  )
);

-- Allow clinic_admin to read their own assets
CREATE POLICY "Clinic admin can read own assets"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'clinic-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT ur.clinic_id::text FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'clinic_admin'
  )
);

-- Allow clinic_admin to update/overwrite their own assets
CREATE POLICY "Clinic admin can update own assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'clinic-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT ur.clinic_id::text FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'clinic_admin'
  )
);

-- Public read for clinic-assets (logos need to be publicly visible)
CREATE POLICY "Public can read clinic assets"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'clinic-assets');