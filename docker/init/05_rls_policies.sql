-- ================================================
-- Row Level Security (RLS) Policies
-- Note: These require auth.uid() function from Supabase
-- For standalone PostgreSQL, implement your own auth mechanism
-- ================================================

-- This file provides RLS policy templates
-- In standalone PostgreSQL without Supabase Auth, you'll need to:
-- 1. Create a custom auth.uid() function
-- 2. Or use application-level security

-- Example: Create a simple session-based auth mechanism
CREATE SCHEMA IF NOT EXISTS auth;

-- Create a function to get current user from session variable
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID AS $$
BEGIN
    -- Get user ID from session variable (set by your application)
    RETURN NULLIF(current_setting('app.current_user_id', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_action_history ENABLE ROW LEVEL SECURITY;

-- =====================
-- PROFILES POLICIES
-- =====================
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (has_role(auth.uid(), 'admin'));

-- =====================
-- USER_ROLES POLICIES
-- =====================
CREATE POLICY "Users can view their own roles"
    ON user_roles FOR SELECT
    USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles"
    ON user_roles FOR ALL
    USING (has_role(auth.uid(), 'admin'))
    WITH CHECK (has_role(auth.uid(), 'admin'));

-- =====================
-- CARDS POLICIES
-- =====================
CREATE POLICY "Users can view their own cards"
    ON cards FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards"
    ON cards FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all cards"
    ON cards FOR SELECT
    USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- =====================
-- TRANSACTIONS POLICIES
-- =====================
CREATE POLICY "Users can view their own transactions"
    ON transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service can manage all transactions"
    ON transactions FOR ALL
    USING (has_role(auth.uid(), 'admin'))
    WITH CHECK (has_role(auth.uid(), 'admin'));

-- =====================
-- ADMIN_SETTINGS POLICIES
-- =====================
CREATE POLICY "Anyone can view settings"
    ON admin_settings FOR SELECT
    USING (true);

CREATE POLICY "Admins can update settings"
    ON admin_settings FOR UPDATE
    USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert settings"
    ON admin_settings FOR INSERT
    WITH CHECK (has_role(auth.uid(), 'admin'));

-- =====================
-- ADMIN_ACTION_HISTORY POLICIES
-- =====================
-- Immutable audit log - no updates or deletes
CREATE POLICY "Admins and moderators can view audit log"
    ON admin_action_history FOR SELECT
    USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins can insert audit entries"
    ON admin_action_history FOR INSERT
    WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- Prevent any updates or deletes on audit log (no policies = denied by default with RLS)
