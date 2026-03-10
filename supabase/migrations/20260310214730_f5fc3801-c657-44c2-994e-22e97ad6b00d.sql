CREATE TABLE public.telegram_user_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_username text,
  telegram_chat_id text,
  backend_user_id text NOT NULL,
  backend_token text NOT NULL,
  first_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(telegram_username),
  UNIQUE(telegram_chat_id)
);

ALTER TABLE public.telegram_user_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.telegram_user_links
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Anon can read" ON public.telegram_user_links
  FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can insert" ON public.telegram_user_links
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update" ON public.telegram_user_links
  FOR UPDATE TO anon USING (true);