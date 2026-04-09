
-- Change fingerprint_id default to empty and make nullable for new members before enrollment
ALTER TABLE public.members ALTER COLUMN fingerprint_id DROP DEFAULT;
ALTER TABLE public.members ALTER COLUMN fingerprint_id DROP NOT NULL;

-- Allow anon to insert attendance (for ESP32 device)
CREATE POLICY "Anon can insert attendance"
ON public.attendance
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon to read attendance (for ESP32 to check duplicates)
CREATE POLICY "Anon can read attendance"
ON public.attendance
FOR SELECT
TO anon
USING (true);
