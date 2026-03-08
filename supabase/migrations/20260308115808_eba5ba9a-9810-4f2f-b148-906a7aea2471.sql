
-- Create contact_messages table
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Public can insert (submit contact form)
CREATE POLICY "Public can insert contact messages"
ON public.contact_messages FOR INSERT
WITH CHECK (true);

-- Clinic admin can read their clinic's messages
CREATE POLICY "Clinic admin can read contact messages"
ON public.contact_messages FOR SELECT
USING (has_clinic_role(auth.uid(), 'clinic_admin'::app_role, clinic_id));

-- Clinic admin can update (mark read/unread)
CREATE POLICY "Clinic admin can update contact messages"
ON public.contact_messages FOR UPDATE
USING (has_clinic_role(auth.uid(), 'clinic_admin'::app_role, clinic_id));

-- Clinic admin can delete
CREATE POLICY "Clinic admin can delete contact messages"
ON public.contact_messages FOR DELETE
USING (has_clinic_role(auth.uid(), 'clinic_admin'::app_role, clinic_id));

-- Super admin can manage all
CREATE POLICY "Super admin can manage contact messages"
ON public.contact_messages FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_messages;
