
-- Drop all restrictive policies
DROP POLICY IF EXISTS "Allow all select on notification settings" ON public.staff_notification_settings;
DROP POLICY IF EXISTS "Allow all insert on notification settings" ON public.staff_notification_settings;
DROP POLICY IF EXISTS "Allow all update on notification settings" ON public.staff_notification_settings;
DROP POLICY IF EXISTS "Allow all delete on notification settings" ON public.staff_notification_settings;

-- Recreate as PERMISSIVE (default)
CREATE POLICY "Allow all select on notification settings" 
ON public.staff_notification_settings FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow all insert on notification settings" 
ON public.staff_notification_settings FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow all update on notification settings" 
ON public.staff_notification_settings FOR UPDATE
TO public
USING (true);

CREATE POLICY "Allow all delete on notification settings" 
ON public.staff_notification_settings FOR DELETE
TO public
USING (true);
