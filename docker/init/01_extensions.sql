-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create app_role enum
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create transaction_status enum
DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create transaction_type enum
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM (
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
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create card_type enum
DO $$ BEGIN
    CREATE TYPE card_type AS ENUM ('virtual', 'metal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create card_status enum
DO $$ BEGIN
    CREATE TYPE card_status AS ENUM ('active', 'inactive', 'blocked', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create admin_action enum for audit logs
DO $$ BEGIN
    CREATE TYPE admin_action AS ENUM (
        'role_assigned',
        'role_removed', 
        'settings_updated',
        'client_modified',
        'login',
        'logout'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
