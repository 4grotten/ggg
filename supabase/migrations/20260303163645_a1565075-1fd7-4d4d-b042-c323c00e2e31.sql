
-- Table to store notification channel settings for staff members
-- Only Root users can manage these settings
CREATE TABLE IF NOT EXISTS public.staff_notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_user_id TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'telegram', 'email')),
    contact_value TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(staff_user_id, channel)
);

CREATE INDEX idx_staff_notif_user ON public.staff_notification_settings(staff_user_id);

-- RLS
ALTER TABLE public.staff_notification_settings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read (admins need to see)
CREATE POLICY "Authenticated users can view notification settings"
ON public.staff_notification_settings FOR SELECT TO authenticated
USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage notification settings"
ON public.staff_notification_settings FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
