CREATE TABLE public.messenger_chat_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('telegram', 'whatsapp')),
  platform_chat_id TEXT NOT NULL,
  user_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_messenger_chat_platform_chat ON public.messenger_chat_history (platform, platform_chat_id, created_at DESC);

ALTER TABLE public.messenger_chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on messenger_chat_history"
  ON public.messenger_chat_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on messenger_chat_history"
  ON public.messenger_chat_history
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);