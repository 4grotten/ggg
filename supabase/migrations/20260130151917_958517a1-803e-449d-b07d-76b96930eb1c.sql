-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create admin_settings table for all configurable values
CREATE TABLE public.admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, -- 'exchange_rates', 'fees', 'limits'
    key TEXT NOT NULL,
    value NUMERIC NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id),
    UNIQUE (category, key)
);

-- Enable RLS on admin_settings
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings (needed for app to work)
CREATE POLICY "Anyone can view settings"
ON public.admin_settings
FOR SELECT
TO authenticated
USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update settings"
ON public.admin_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert settings"
ON public.admin_settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_admin_settings_updated_at
BEFORE UPDATE ON public.admin_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default exchange rates
INSERT INTO public.admin_settings (category, key, value, description) VALUES
-- Exchange rates
('exchange_rates', 'usdt_to_aed_buy', 3.65, 'USDT to AED rate for buying (top-ups)'),
('exchange_rates', 'usdt_to_aed_sell', 3.69, 'USDT to AED rate for selling (withdrawals)'),
('exchange_rates', 'aed_to_usd_buy', 0.2723, 'AED to USD rate for buying'),
('exchange_rates', 'aed_to_usd_sell', 0.2710, 'AED to USD rate for selling'),
('exchange_rates', 'usd_to_aed_buy', 3.6725, 'USD to AED rate for buying'),
('exchange_rates', 'usd_to_aed_sell', 3.69, 'USD to AED rate for selling'),

-- Fees (percentages)
('fees', 'top_up_crypto_flat', 5.90, 'Crypto top-up flat fee in USDT'),
('fees', 'top_up_bank_percent', 1.5, 'Bank top-up fee percentage'),
('fees', 'card_to_card_percent', 1.0, 'Card to card transfer fee percentage'),
('fees', 'bank_transfer_percent', 2.0, 'Bank transfer fee percentage'),
('fees', 'network_fee_percent', 1.0, 'Network fee percentage'),
('fees', 'currency_conversion_percent', 1.5, 'Currency conversion fee percentage'),
('fees', 'virtual_card_annual', 183.00, 'Virtual card annual fee in AED'),
('fees', 'virtual_card_replacement', 183.00, 'Virtual card replacement fee in AED'),
('fees', 'metal_card_annual', 183.00, 'Metal card annual fee in AED'),
('fees', 'metal_card_replacement', 183.00, 'Metal card replacement fee in AED'),
('fees', 'virtual_account_opening', 183.00, 'Virtual account opening fee in AED'),

-- Limits (minimums)
('limits', 'top_up_crypto_min', 15.00, 'Minimum crypto top-up amount in USDT'),
('limits', 'top_up_bank_min', 50.00, 'Minimum bank top-up amount in AED'),
('limits', 'transfer_min', 10.00, 'Minimum transfer amount in AED'),
('limits', 'withdrawal_min', 50.00, 'Minimum withdrawal amount in AED'),

-- Limits (maximums)
('limits', 'top_up_crypto_max', 50000.00, 'Maximum crypto top-up amount in USDT'),
('limits', 'top_up_bank_max', 100000.00, 'Maximum bank top-up amount in AED'),
('limits', 'transfer_max', 50000.00, 'Maximum transfer amount in AED'),
('limits', 'withdrawal_max', 50000.00, 'Maximum withdrawal amount in AED'),

-- Limits (daily)
('limits', 'daily_top_up_limit', 100000.00, 'Daily top-up limit in AED'),
('limits', 'daily_transfer_limit', 100000.00, 'Daily transfer limit in AED'),
('limits', 'daily_withdrawal_limit', 50000.00, 'Daily withdrawal limit in AED'),

-- Limits (monthly)
('limits', 'monthly_top_up_limit', 1000000.00, 'Monthly top-up limit in AED'),
('limits', 'monthly_transfer_limit', 500000.00, 'Monthly transfer limit in AED'),
('limits', 'monthly_withdrawal_limit', 200000.00, 'Monthly withdrawal limit in AED');