
-- Create immutable date extraction function
CREATE OR REPLACE FUNCTION public.extract_date(ts timestamptz)
RETURNS date
LANGUAGE sql
IMMUTABLE
AS $$ SELECT ts::date $$;

-- Create clinics table
CREATE TABLE public.clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_name text NOT NULL,
  subdomain text UNIQUE NOT NULL,
  logo_url text DEFAULT '',
  theme_color text DEFAULT '#0ea5e9',
  address text DEFAULT '',
  latitude double precision DEFAULT 0,
  longitude double precision DEFAULT 0,
  contact_phone text DEFAULT '',
  contact_email text DEFAULT '',
  working_hours text DEFAULT '',
  emergency_contact text DEFAULT '',
  terms_conditions text DEFAULT '',
  card_background_color text DEFAULT '#1e293b',
  qr_base_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create doctors table
CREATE TABLE public.doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  specialization text NOT NULL,
  image_url text DEFAULT '',
  status text CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Create tokens table
CREATE TABLE public.tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  doctor_id uuid REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
  token_number integer NOT NULL,
  patient_name text NOT NULL,
  status text CHECK (status IN ('waiting', 'live', 'completed')) DEFAULT 'waiting',
  created_at timestamptz DEFAULT now()
);

-- Unique constraint using immutable function
CREATE UNIQUE INDEX tokens_clinic_number_day_idx ON public.tokens (clinic_id, token_number, public.extract_date(created_at));

-- Enable RLS
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;

-- Clinics: public read
CREATE POLICY "Public can read clinics" ON public.clinics FOR SELECT TO anon, authenticated USING (true);

-- Doctors: public read
CREATE POLICY "Public can read doctors" ON public.doctors FOR SELECT TO anon, authenticated USING (true);

-- Tokens: public read
CREATE POLICY "Public can read tokens" ON public.tokens FOR SELECT TO anon, authenticated USING (true);

-- Tokens: authenticated can insert
CREATE POLICY "Authenticated can insert tokens" ON public.tokens FOR INSERT TO authenticated WITH CHECK (true);

-- Tokens: authenticated can update
CREATE POLICY "Authenticated can update tokens" ON public.tokens FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Doctors: authenticated can manage
CREATE POLICY "Authenticated can insert doctors" ON public.doctors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update doctors" ON public.doctors FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Enable realtime for tokens
ALTER PUBLICATION supabase_realtime ADD TABLE public.tokens;
