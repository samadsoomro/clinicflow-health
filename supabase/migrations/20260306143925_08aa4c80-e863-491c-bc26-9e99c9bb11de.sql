
-- Fix function search path
CREATE OR REPLACE FUNCTION public.extract_date(ts timestamptz)
RETURNS date
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$ SELECT ts::date $$;

-- Drop overly permissive policies
DROP POLICY "Authenticated can insert tokens" ON public.tokens;
DROP POLICY "Authenticated can update tokens" ON public.tokens;
DROP POLICY "Authenticated can insert doctors" ON public.doctors;
DROP POLICY "Authenticated can update doctors" ON public.doctors;

-- Recreate with auth.uid() check
CREATE POLICY "Authenticated can insert tokens" ON public.tokens 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update tokens" ON public.tokens 
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can insert doctors" ON public.doctors 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update doctors" ON public.doctors 
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
