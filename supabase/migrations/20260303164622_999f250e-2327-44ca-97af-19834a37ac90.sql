
-- Drop restrictive policies
DROP POLICY IF EXISTS "Admins can manage notification settings" ON public.staff_notification_settings;
DROP POLICY IF EXISTS "Authenticated users can view notification settings" ON public.staff_notification_settings;

-- Create permissive policies (app uses custom auth, not Supabase Auth)
CREATE POLICY "Allow all select on notification settings"
ON public.staff_notification_settings
FOR SELECT
USING (true);

CREATE POLICY "Allow all insert on notification settings"
ON public.staff_notification_settings
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow all update on notification settings"
ON public.staff_notification_settings
FOR UPDATE
USING (true);

CREATE POLICY "Allow all delete on notification settings"
ON public.staff_notification_settings
FOR DELETE
USING (true);
