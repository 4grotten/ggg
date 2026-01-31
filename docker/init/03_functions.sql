-- ================================================
-- Database Functions
-- ================================================

-- Function: Check if user has specific role
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = _user_id AND role = _role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Log admin action
CREATE OR REPLACE FUNCTION log_admin_action(
    p_admin_id UUID,
    p_admin_name TEXT,
    p_action admin_action,
    p_target_user_id UUID DEFAULT NULL,
    p_target_user_name TEXT DEFAULT NULL,
    p_details JSONB DEFAULT '{}'::JSONB,
    p_ip_address INET DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO admin_action_history (
        admin_id, admin_name, action, 
        target_user_id, target_user_name, 
        details, ip_address
    ) VALUES (
        p_admin_id, p_admin_name, p_action,
        p_target_user_id, p_target_user_name,
        p_details, p_ip_address
    )
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate transaction fee
CREATE OR REPLACE FUNCTION calculate_fee(
    p_type transaction_type,
    p_amount NUMERIC,
    p_currency VARCHAR(3) DEFAULT 'AED'
)
RETURNS NUMERIC AS $$
DECLARE
    v_fee NUMERIC := 0;
    v_fee_percent NUMERIC;
    v_fee_flat NUMERIC;
BEGIN
    -- Get fee from admin_settings
    CASE p_type
        WHEN 'top_up' THEN
            -- Crypto top-up: flat 5.90 USDT
            SELECT value INTO v_fee_flat FROM admin_settings 
            WHERE category = 'fees' AND key = 'top_up_crypto_flat';
            v_fee := COALESCE(v_fee_flat, 5.90);
            
        WHEN 'card_payment' THEN
            -- Card-to-Card: 1%
            SELECT value INTO v_fee_percent FROM admin_settings 
            WHERE category = 'fees' AND key = 'card_to_card_percent';
            v_fee := p_amount * COALESCE(v_fee_percent, 1) / 100;
            
        WHEN 'transfer_out' THEN
            -- Bank transfer: 2%
            SELECT value INTO v_fee_percent FROM admin_settings 
            WHERE category = 'fees' AND key = 'bank_transfer_percent';
            v_fee := p_amount * COALESCE(v_fee_percent, 2) / 100;
            
        WHEN 'withdrawal' THEN
            -- Currency conversion: 1.5%
            SELECT value INTO v_fee_percent FROM admin_settings 
            WHERE category = 'fees' AND key = 'currency_conversion_percent';
            v_fee := p_amount * COALESCE(v_fee_percent, 1.5) / 100;
            
        ELSE
            v_fee := 0;
    END CASE;
    
    RETURN ROUND(v_fee, 2);
END;
$$ LANGUAGE plpgsql;

-- Function: Get current exchange rate
CREATE OR REPLACE FUNCTION get_exchange_rate(p_key TEXT)
RETURNS NUMERIC AS $$
DECLARE
    v_rate NUMERIC;
BEGIN
    SELECT value INTO v_rate FROM admin_settings 
    WHERE category = 'exchange_rates' AND key = p_key;
    
    RETURN v_rate;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at
    BEFORE UPDATE ON cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
