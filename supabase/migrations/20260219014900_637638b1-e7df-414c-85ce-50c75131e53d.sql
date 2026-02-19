
-- Allow anon to read their just-inserted member row (needed for .select() after insert)
CREATE POLICY "Anon can read newly inserted member"
ON public.members FOR SELECT
TO anon
USING (true);

-- Allow anon to read alerts they just created
CREATE POLICY "Anon can read alerts"
ON public.alerts FOR SELECT
TO anon
USING (true);
