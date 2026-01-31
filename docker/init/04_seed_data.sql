-- ================================================
-- Seed Data: Exchange Rates, Fees, Limits
-- Based on Mind Map specifications
-- ================================================

-- EXCHANGE RATES
INSERT INTO admin_settings (category, key, value, description) VALUES
    ('exchange_rates', 'usdt_to_aed_buy', 3.65, 'USDT → AED покупка'),
    ('exchange_rates', 'usdt_to_aed_sell', 3.69, 'USDT → AED продажа'),
    ('exchange_rates', 'aed_to_usd_buy', 0.2723, 'AED → USD покупка'),
    ('exchange_rates', 'aed_to_usd_sell', 0.2715, 'AED → USD продажа'),
    ('exchange_rates', 'usd_to_aed_buy', 3.68, 'USD → AED покупка'),
    ('exchange_rates', 'usd_to_aed_sell', 3.67, 'USD → AED продажа')
ON CONFLICT (category, key) DO UPDATE SET value = EXCLUDED.value;

-- FEES (Based on Mind Map)
INSERT INTO admin_settings (category, key, value, description) VALUES
    -- Top-up fees
    ('fees', 'top_up_crypto_flat', 5.90, 'Крипто пополнение (USDT flat)'),
    ('fees', 'top_up_bank_percent', 1.5, 'Банковское пополнение (%)'),
    
    -- Transfer fees
    ('fees', 'card_to_card_percent', 1.0, 'Card-to-Card перевод (%)'),
    ('fees', 'bank_transfer_percent', 2.0, 'Банковский перевод (%)'),
    ('fees', 'network_fee_percent', 1.0, 'Сетевая комиссия (%)'),
    ('fees', 'currency_conversion_percent', 1.5, 'Конвертация валюты (%)'),
    
    -- Card fees (183 AED/year)
    ('fees', 'virtual_card_annual', 183.00, 'Виртуальная карта (AED/год)'),
    ('fees', 'virtual_card_replacement', 50.00, 'Замена виртуальной карты (AED)'),
    ('fees', 'metal_card_annual', 183.00, 'Металлическая карта (AED/год)'),
    ('fees', 'metal_card_replacement', 150.00, 'Замена металлической карты (AED)'),
    
    -- Account fees
    ('fees', 'virtual_account_opening', 0.00, 'Открытие виртуального счета (AED)')
ON CONFLICT (category, key) DO UPDATE SET value = EXCLUDED.value;

-- LIMITS
INSERT INTO admin_settings (category, key, value, description) VALUES
    -- Minimums
    ('limits', 'top_up_crypto_min', 10.00, 'Мин. крипто пополнение (USDT)'),
    ('limits', 'top_up_bank_min', 100.00, 'Мин. банковское пополнение (AED)'),
    ('limits', 'transfer_min', 1.00, 'Мин. сумма перевода (AED)'),
    ('limits', 'withdrawal_min', 50.00, 'Мин. сумма вывода (AED)'),
    
    -- Maximums
    ('limits', 'top_up_crypto_max', 50000.00, 'Макс. крипто пополнение (USDT)'),
    ('limits', 'top_up_bank_max', 100000.00, 'Макс. банковское пополнение (AED)'),
    ('limits', 'transfer_max', 50000.00, 'Макс. сумма перевода (AED)'),
    ('limits', 'withdrawal_max', 50000.00, 'Макс. сумма вывода (AED)'),
    
    -- Daily limits
    ('limits', 'daily_top_up_limit', 100000.00, 'Дневной лимит пополнения (AED)'),
    ('limits', 'daily_transfer_limit', 50000.00, 'Дневной лимит переводов (AED)'),
    ('limits', 'daily_withdrawal_limit', 50000.00, 'Дневной лимит вывода (AED)'),
    
    -- Monthly limits
    ('limits', 'monthly_top_up_limit', 500000.00, 'Месячный лимит пополнения (AED)'),
    ('limits', 'monthly_transfer_limit', 200000.00, 'Месячный лимит переводов (AED)'),
    ('limits', 'monthly_withdrawal_limit', 200000.00, 'Месячный лимит вывода (AED)')
ON CONFLICT (category, key) DO UPDATE SET value = EXCLUDED.value;

-- Create default admin user (change in production!)
-- Password should be set via your auth system
INSERT INTO profiles (user_id, first_name, last_name, phone, language)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'System',
    'Admin',
    '+971500000000',
    'ru'
) ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_roles (user_id, role)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin'
) ON CONFLICT (user_id, role) DO NOTHING;
