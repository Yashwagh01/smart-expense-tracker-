-- ==============================================================================
-- SMART EXPENSE TRACKER - SUPABASE DATABASE SCHEMA
-- Project ID: acemxzyszztshqyyitnf
-- Execute this script in your Supabase SQL Editor (SQL Editor -> New Query -> Run)
-- ==============================================================================

-- 1. Customers Table (Platform Owner Directory & Metrics)
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    joined_date TEXT,
    status TEXT DEFAULT 'ACTIVE',
    tier TEXT DEFAULT 'STANDARD',
    transactions_count INTEGER DEFAULT 0,
    total_income NUMERIC(14, 2) DEFAULT 0.00,
    total_expense NUMERIC(14, 2) DEFAULT 0.00,
    net_balance NUMERIC(14, 2) DEFAULT 0.00,
    active_budgets_count INTEGER DEFAULT 0,
    last_active TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Users / Profiles Table (Customer Sign In & Preferences)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    theme_preference TEXT DEFAULT 'LIGHT',
    currency TEXT DEFAULT '₹',
    role TEXT DEFAULT 'CUSTOMER',
    password_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Transactions Table (Incomes & Expenses)
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    amount NUMERIC(14, 2) NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    payment_method TEXT,
    date TEXT NOT NULL,
    recurring BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Budgets Table (Category Caps & Targets)
CREATE TABLE IF NOT EXISTS public.budgets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Financial Goals Table (Savings & Milestones)
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    target_amount NUMERIC(14, 2) NOT NULL,
    current_amount NUMERIC(14, 2) DEFAULT 0.00,
    deadline TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Bills Table (Scheduled & Recurring Payments)
CREATE TABLE IF NOT EXISTS public.bills (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    due_date TEXT,
    status TEXT DEFAULT 'UNPAID',
    recurring BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    frequency TEXT DEFAULT 'MONTHLY',
    category TEXT,
    next_payment_date TEXT,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) & PUBLIC POLICIES FOR INSTANT SYNC
-- ==============================================================================

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow full access for anon & authenticated roles so data saves smoothly
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public access on customers" ON public.customers;
    CREATE POLICY "Public access on customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access on users" ON public.users;
    CREATE POLICY "Public access on users" ON public.users FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access on transactions" ON public.transactions;
    CREATE POLICY "Public access on transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access on budgets" ON public.budgets;
    CREATE POLICY "Public access on budgets" ON public.budgets FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access on financial_goals" ON public.financial_goals;
    CREATE POLICY "Public access on financial_goals" ON public.financial_goals FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access on bills" ON public.bills;
    CREATE POLICY "Public access on bills" ON public.bills FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access on subscriptions" ON public.subscriptions;
    CREATE POLICY "Public access on subscriptions" ON public.subscriptions FOR ALL USING (true) WITH CHECK (true);
END $$;

-- Grant permissions to anon and authenticated clients
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Helpful indexes for high-speed queries
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_budgets_user ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user ON public.financial_goals(user_id);
