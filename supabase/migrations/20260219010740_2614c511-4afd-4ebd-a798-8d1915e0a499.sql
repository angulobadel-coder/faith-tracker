
-- Fix: Drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Anyone can register as member" ON public.members;
DROP POLICY IF EXISTS "Anyone can create alerts" ON public.alerts;

CREATE POLICY "Anyone can register as member"
ON public.members FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Anyone can create alerts"
ON public.alerts FOR INSERT
TO anon
WITH CHECK (true);
