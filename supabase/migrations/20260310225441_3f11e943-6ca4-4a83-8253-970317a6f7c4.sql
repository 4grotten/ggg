
-- Seed welcome message templates into admin_settings (editable via admin panel)
-- Using 'description' field for the full message text, 'value' as a placeholder (1 = enabled)
INSERT INTO public.admin_settings (category, key, value, description)
VALUES 
  ('notifications', 'welcome_message_en', 1, 'Hello and welcome to uEasyCard! 🎉
We are very pleased that you chose our service. We will always stay in touch with you here in this chat.

If you have any questions, feel free to write here anytime — our support is available 24/7.

In your Settings, you can also connect your Email and Telegram to receive transaction reports, notifications, and communicate with us in the way that is most convenient for you.'),
  ('notifications', 'welcome_message_ru', 1, 'Здравствуйте и добро пожаловать в uEasyCard! 🎉
Нам очень приятно, что вы выбрали наш сервис. Мы всегда будем на связи с вами в этом чате.

Если у вас возникнут любые вопросы, вы можете написать сюда в любое время — поддержка работает 24/7.

Также в настройках вы можете подключить Email и Telegram, чтобы получать отчёты по транзакциям, уведомления и связываться с нами удобным для вас способом.')
ON CONFLICT (category, key) DO NOTHING;
