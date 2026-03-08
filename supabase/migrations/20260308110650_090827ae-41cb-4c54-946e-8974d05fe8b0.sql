-- Allow clinic admins to delete patients from their clinic
CREATE POLICY "Clinic admin can delete clinic patients"
ON public.patients
FOR DELETE
TO authenticated
USING (has_clinic_role(auth.uid(), 'clinic_admin'::app_role, clinic_id));

-- Allow super admin to delete any patient
CREATE POLICY "Super admin can delete patients"
ON public.patients
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow clinic admin to update patients
CREATE POLICY "Clinic admin can update clinic patients"
ON public.patients
FOR UPDATE
TO authenticated
USING (has_clinic_role(auth.uid(), 'clinic_admin'::app_role, clinic_id))
WITH CHECK (has_clinic_role(auth.uid(), 'clinic_admin'::app_role, clinic_id));