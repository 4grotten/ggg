-- ================================================
-- Easy Card Database Schema
-- Based on Mind Map: User Admin Data Base Easy Card
-- ================================================

-- 1. PROFILES TABLE
-- Stores user profile information
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    phone TEXT,
    first_name TEXT,
    last_name TEXT,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    language TEXT DEFAULT 'en',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_phone ON profiles(phone);

-- 2. USER_ROLES TABLE
-- RBAC: Role-Based Access Control
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- 3. CARDS TABLE
-- Virtual and Metal cards (183 AED/year)
CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type card_type NOT NULL DEFAULT 'virtual',
    name TEXT NOT NULL DEFAULT 'My Card',
    status card_status NOT NULL DEFAULT 'inactive',
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    last_four_digits VARCHAR(4),
    expiry_date DATE,
    card_number_encrypted TEXT, -- Encrypted card number
    cvv_encrypted TEXT,         -- Encrypted CVV
    annual_fee NUMERIC(10, 2) DEFAULT 183.00, -- AED
    activated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cards_user_id ON cards(user_id);
CREATE INDEX idx_cards_status ON cards(status);
CREATE INDEX idx_cards_type ON cards(type);

-- 4. TRANSACTIONS TABLE
-- All financial operations
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    card_id UUID REFERENCES cards(id) ON DELETE SET NULL,
    type transaction_type NOT NULL,
    status transaction_status NOT NULL DEFAULT 'pending',
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'AED',
    fee NUMERIC(10, 2) DEFAULT 0.00,
    exchange_rate NUMERIC(10, 6),
    original_amount NUMERIC(15, 2),
    original_currency VARCHAR(3),
    merchant_name TEXT,
    merchant_category TEXT,
    recipient_card VARCHAR(19),
    sender_name TEXT,
    sender_card VARCHAR(19),
    reference_id TEXT,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_card_id ON transactions(card_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- 5. ADMIN_SETTINGS TABLE
-- Dynamic rates, fees, and limits
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, -- 'exchange_rates', 'fees', 'limits'
    key TEXT NOT NULL,
    value NUMERIC NOT NULL,
    description TEXT,
    updated_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(category, key)
);

CREATE INDEX idx_admin_settings_category ON admin_settings(category);

-- 6. ADMIN_ACTION_HISTORY TABLE
-- Audit log for admin actions
CREATE TABLE IF NOT EXISTS admin_action_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL,
    admin_name TEXT,
    action admin_action NOT NULL,
    target_user_id UUID,
    target_user_name TEXT,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_history_admin_id ON admin_action_history(admin_id);
CREATE INDEX idx_admin_history_action ON admin_action_history(action);
CREATE INDEX idx_admin_history_created_at ON admin_action_history(created_at DESC);
CREATE INDEX idx_admin_history_target ON admin_action_history(target_user_id);
