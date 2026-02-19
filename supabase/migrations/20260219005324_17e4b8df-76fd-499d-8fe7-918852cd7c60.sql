
-- Add new columns to members table for member registration
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS membership_reason text;

-- Make fingerprint_id have a default so member self-registration works
ALTER TABLE public.members 
ALTER COLUMN fingerprint_id SET DEFAULT gen_random_uuid()::text;

-- Allow anonymous (unauthenticated) users to insert into members for self-registration
CREATE POLICY "Anyone can register as member"
ON public.members
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon to insert alerts (for notification on registration)
CREATE POLICY "Anyone can create alerts"
ON public.alerts
FOR INSERT
TO anon
WITH CHECK (true);
