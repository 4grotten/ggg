-- Create transaction type enum
CREATE TYPE public.transaction_type AS ENUM (
  'top_up',
  'withdrawal', 
  'transfer_in',
  'transfer_out',
  'card_payment',
  'refund',
  'fee',
  'cashback',
  'card_activation'
);

-- Create transaction status enum
CREATE TYPE public.transaction_status AS ENUM (
  'pending',
  'completed',
  'failed',
  'cancelled'
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  card_id UUID,
  type transaction_type NOT NULL,
  status transaction_status NOT NULL DEFAULT 'completed',
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'AED',
  description TEXT,
  merchant_name TEXT,
  merchant_category TEXT,
  reference_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_card_id ON public.transactions(card_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_transactions_type ON public.transactions(type);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own transactions
CREATE POLICY "Users can view their own transactions"
ON public.transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for service role to insert transactions
CREATE POLICY "Service role can manage all transactions"
ON public.transactions
FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();