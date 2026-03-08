
CREATE TABLE public.homepage_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  section_name text NOT NULL,
  content_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_enabled boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(clinic_id, section_name)
);

ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read homepage sections"
  ON public.homepage_sections FOR SELECT
  USING (true);

CREATE POLICY "Clinic admin can manage homepage sections"
  ON public.homepage_sections FOR ALL
  USING (has_clinic_role(auth.uid(), 'clinic_admin'::app_role, clinic_id));

CREATE POLICY "Super admin can manage all homepage sections"
  ON public.homepage_sections FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));
