import { createClient } from '@supabase/supabase-js';
import { CustomerRecord, Transaction, Budget, FinancialGoal, Bill, Subscription, User } from '../types';

export const SUPABASE_PROJECT_ID = 'acemxzyszztshqyyitnf';

function getValidSupabaseUrl(): string {
  const customUrl = (import.meta.env.VITE_SUPABASE_URL as string)?.trim();
  if (customUrl && customUrl !== 'undefined' && customUrl !== 'null') {
    let rawUrl = customUrl.replace(/^["']|["']$/g, '').trim();
    if (!rawUrl.includes('.') && !rawUrl.includes('/')) {
      return `https://${rawUrl}.supabase.co`;
    }
    if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
      rawUrl = `https://${rawUrl}`;
    }
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.origin;
      }
    } catch {
      // fallback if URL constructor fails
    }
  }

  // When running inside browser/iframe, use same-origin proxy to eliminate CORS & iframe network restrictions
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return `${window.location.origin}/api/supabase`;
  }

  return `https://${SUPABASE_PROJECT_ID}.supabase.co`;
}

function getValidSupabaseKey(): string {
  let rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string)?.trim();
  if (!rawKey || rawKey === 'undefined' || rawKey === 'null') {
    return 'sb_publishable_aIwh2ER68ajiIwWJ9J7OTw_rbHffKU4';
  }
  return rawKey.replace(/^["']|["']$/g, '').trim() || 'sb_publishable_aIwh2ER68ajiIwWJ9J7OTw_rbHffKU4';
}

export const SUPABASE_URL = getValidSupabaseUrl();
export const SUPABASE_ANON_KEY = getValidSupabaseKey();

// Initialize Supabase Client with safe fallback
export const supabase = (() => {
  try {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
  } catch (err) {
    console.warn('Initial createClient notice, using canonical fallback:', err);
    return createClient(`https://${SUPABASE_PROJECT_ID}.supabase.co`, 'sb_publishable_aIwh2ER68ajiIwWJ9J7OTw_rbHffKU4');
  }
})();

export interface DatabaseStatus {
  isConnected: boolean;
  tablesExist: boolean;
  message: string;
  checkedAt: string;
  projectId: string;
  details?: string;
}

/**
 * Checks connection health to the cloud database
 */
export async function testDatabaseConnection(): Promise<DatabaseStatus> {
  try {
    const { error } = await supabase.from('customers').select('id').limit(1);
    if (!error) {
      return {
        isConnected: true,
        tablesExist: true,
        message: 'Connected and synchronized with cloud database',
        checkedAt: new Date().toLocaleTimeString(),
        projectId: SUPABASE_PROJECT_ID
      };
    }

    if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.code === '42P01') {
      return {
        isConnected: true,
        tablesExist: false,
        message: 'Connected to cloud instance. Tables pending schema initialization.',
        checkedAt: new Date().toLocaleTimeString(),
        projectId: SUPABASE_PROJECT_ID,
        details: error.message
      };
    }

    return {
      isConnected: false,
      tablesExist: false,
      message: error.message || 'Database error occurred',
      checkedAt: new Date().toLocaleTimeString(),
      projectId: SUPABASE_PROJECT_ID
    };
  } catch (err: any) {
    return {
      isConnected: false,
      tablesExist: false,
      message: err?.message || 'Could not reach cloud database endpoint',
      checkedAt: new Date().toLocaleTimeString(),
      projectId: SUPABASE_PROJECT_ID
    };
  }
}

// ==========================================
// CUSTOMER SYNC & PERSISTENCE
// ==========================================

export async function fetchCustomersFromDb(): Promise<{
  data: CustomerRecord[] | null;
  isDbOnline: boolean;
  tablesExist: boolean;
}> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        return { data: null, isDbOnline: true, tablesExist: false };
      }
      return { data: null, isDbOnline: false, tablesExist: false };
    }

    if (!data) return { data: [], isDbOnline: true, tablesExist: true };

    const mapped: CustomerRecord[] = data.map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone || undefined,
      joinedDate: row.joined_date || row.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      status: (row.status as any) || 'ACTIVE',
      tier: (row.tier as any) || 'STANDARD',
      transactionsCount: Number(row.transactions_count || 0),
      totalIncome: Number(row.total_income || 0),
      totalExpense: Number(row.total_expense || 0),
      netBalance: Number(row.net_balance || 0),
      activeBudgetsCount: Number(row.active_budgets_count || 0),
      lastActive: row.last_active || 'Recently'
    }));

    return { data: mapped, isDbOnline: true, tablesExist: true };
  } catch {
    return { data: null, isDbOnline: false, tablesExist: false };
  }
}

export async function saveCustomerToDb(customer: CustomerRecord): Promise<{ success: boolean; error?: string }> {
  try {
    const row = {
      id: customer.id,
      name: customer.name,
      email: customer.email.toLowerCase().trim(),
      phone: customer.phone || null,
      joined_date: customer.joinedDate,
      status: customer.status,
      tier: customer.tier,
      transactions_count: customer.transactionsCount,
      total_income: customer.totalIncome,
      total_expense: customer.totalExpense,
      net_balance: customer.netBalance,
      active_budgets_count: customer.activeBudgetsCount,
      last_active: customer.lastActive || 'Just now',
      updated_at: new Date().toISOString()
    };

    let { error } = await supabase.from('customers').upsert(row, { onConflict: 'email' });
    if (error) {
      console.warn('Upsert customers onConflict email failed, falling back to id:', error.message);
      const retry = await supabase.from('customers').upsert(row, { onConflict: 'id' });
      error = retry.error;
    }
    if (error) {
      console.warn('saveCustomerToDb cloud notice:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('saveCustomerToDb offline/network fallback:', err?.message);
    return { success: false, error: err?.message };
  }
}

export async function deleteCustomerFromDb(customerId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('customers').delete().eq('id', customerId);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// BULK CLOUD SYNC
// ==========================================

export async function syncAllCustomersToCloud(customers: CustomerRecord[]): Promise<{
  successCount: number;
  totalCount: number;
  error?: string;
}> {
  if (!customers.length) return { successCount: 0, totalCount: 0 };
  try {
    const rows = customers.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email.toLowerCase().trim(),
      phone: c.phone || null,
      joined_date: c.joinedDate,
      status: c.status,
      tier: c.tier,
      transactions_count: c.transactionsCount,
      total_income: c.totalIncome,
      total_expense: c.totalExpense,
      net_balance: c.netBalance,
      active_budgets_count: c.activeBudgetsCount,
      last_active: c.lastActive || 'Active',
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase.from('customers').upsert(rows, { onConflict: 'email' });
    if (error) {
      return { successCount: 0, totalCount: customers.length, error: error.message };
    }
    return { successCount: customers.length, totalCount: customers.length };
  } catch (err: any) {
    return { successCount: 0, totalCount: customers.length, error: err?.message };
  }
}

// ==========================================
// TRANSACTIONS SYNC & PERSISTENCE
// ==========================================

export async function fetchTransactionsFromDb(userId?: string): Promise<Transaction[] | null> {
  try {
    let query = supabase.from('transactions').select('*').order('date', { ascending: false });
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query;
    if (error || !data) return null;

    return data.map((t: any) => ({
      id: t.id,
      userId: t.user_id,
      type: t.type,
      amount: Number(t.amount),
      category: t.category,
      description: t.description || '',
      paymentMethod: t.payment_method || 'Other',
      date: t.date,
      recurring: Boolean(t.recurring)
    }));
  } catch {
    return null;
  }
}

export async function saveTransactionToDb(tx: Transaction): Promise<boolean> {
  try {
    const row = {
      id: tx.id,
      user_id: tx.userId,
      type: tx.type,
      amount: tx.amount,
      category: tx.category,
      description: tx.description,
      payment_method: tx.paymentMethod,
      date: tx.date,
      recurring: Boolean(tx.recurring)
    };
    const { error } = await supabase.from('transactions').upsert(row, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteTransactionFromDb(txId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('transactions').delete().eq('id', txId);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// BUDGETS & GOALS SYNC & PERSISTENCE
// ==========================================

export async function fetchBudgetsFromDb(userId?: string): Promise<Budget[] | null> {
  try {
    let query = supabase.from('budgets').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query;
    if (error || !data) return null;

    return data.map((b: any) => ({
      id: b.id,
      userId: b.user_id,
      category: b.category,
      amount: Number(b.amount),
      month: Number(b.month),
      year: Number(b.year)
    }));
  } catch {
    return null;
  }
}

export async function saveBudgetToDb(budget: Budget): Promise<boolean> {
  try {
    const row = {
      id: budget.id,
      user_id: budget.userId,
      category: budget.category,
      amount: budget.amount,
      month: budget.month,
      year: budget.year
    };
    const { error } = await supabase.from('budgets').upsert(row, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteBudgetFromDb(budgetId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('budgets').delete().eq('id', budgetId);
    return !error;
  } catch {
    return false;
  }
}

export async function fetchGoalsFromDb(userId?: string): Promise<FinancialGoal[] | null> {
  try {
    let query = supabase.from('financial_goals').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query;
    if (error || !data) return null;

    return data.map((g: any) => ({
      id: g.id,
      userId: g.user_id,
      name: g.name,
      targetAmount: Number(g.target_amount),
      currentAmount: Number(g.current_amount || 0),
      deadline: g.deadline || '',
      description: g.description || ''
    }));
  } catch {
    return null;
  }
}

export async function saveGoalToDb(goal: FinancialGoal): Promise<boolean> {
  try {
    const row = {
      id: goal.id,
      user_id: goal.userId,
      name: goal.name,
      target_amount: goal.targetAmount,
      current_amount: goal.currentAmount,
      deadline: goal.deadline,
      description: goal.description
    };
    const { error } = await supabase.from('financial_goals').upsert(row, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteGoalFromDb(goalId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('financial_goals').delete().eq('id', goalId);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// BILLS SYNC & PERSISTENCE
// ==========================================

export async function fetchBillsFromDb(userId?: string): Promise<Bill[] | null> {
  try {
    let query = supabase.from('bills').select('*').order('due_date', { ascending: true });
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query;
    if (error || !data) return null;

    return data.map((b: any) => ({
      id: b.id,
      userId: b.user_id,
      name: b.name,
      amount: Number(b.amount),
      dueDate: b.due_date || '',
      status: (b.status as 'PAID' | 'UNPAID') || 'UNPAID',
      recurring: Boolean(b.recurring)
    }));
  } catch {
    return null;
  }
}

export async function saveBillToDb(bill: Bill): Promise<boolean> {
  try {
    const row = {
      id: bill.id,
      user_id: bill.userId,
      name: bill.name,
      amount: bill.amount,
      due_date: bill.dueDate,
      status: bill.status,
      recurring: Boolean(bill.recurring)
    };
    const { error } = await supabase.from('bills').upsert(row, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteBillFromDb(billId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('bills').delete().eq('id', billId);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// SUBSCRIPTIONS SYNC & PERSISTENCE
// ==========================================

export async function fetchSubscriptionsFromDb(userId?: string): Promise<Subscription[] | null> {
  try {
    let query = supabase.from('subscriptions').select('*').order('next_payment_date', { ascending: true });
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query;
    if (error || !data) return null;

    return data.map((s: any) => ({
      id: s.id,
      userId: s.user_id,
      name: s.name,
      amount: Number(s.amount || 0),
      frequency: (s.frequency === 'ANNUALLY' || s.frequency === 'WEEKLY' ? s.frequency : 'MONTHLY') as 'MONTHLY' | 'ANNUALLY' | 'WEEKLY',
      category: s.category || 'Subscriptions',
      nextPaymentDate: s.next_payment_date || '',
      status: (s.status === 'CANCELLED' ? 'CANCELLED' : 'ACTIVE') as 'ACTIVE' | 'CANCELLED'
    }));
  } catch {
    return null;
  }
}

export async function saveSubscriptionToDb(sub: Subscription): Promise<boolean> {
  try {
    const row = {
      id: sub.id,
      user_id: sub.userId,
      name: sub.name,
      amount: sub.amount,
      frequency: sub.frequency,
      category: sub.category,
      next_payment_date: sub.nextPaymentDate,
      status: sub.status
    };
    const { error } = await supabase.from('subscriptions').upsert(row, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteSubscriptionFromDb(subId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('subscriptions').delete().eq('id', subId);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// USER ACCOUNTS / AUTH PERSISTENCE
// ==========================================

export async function saveUserToDb(user: User): Promise<boolean> {
  try {
    const row = {
      id: user.id,
      name: user.name,
      email: user.email.toLowerCase().trim(),
      theme_preference: user.themePreference || 'LIGHT',
      currency: user.currency || '₹',
      role: user.role || 'CUSTOMER',
      password_hash: user.passwordHash || null
    };
    let { error } = await supabase.from('users').upsert(row, { onConflict: 'email' });
    if (error) {
      console.warn('Upsert users onConflict email failed, falling back to id:', error.message);
      const retry = await supabase.from('users').upsert(row, { onConflict: 'id' });
      error = retry.error;
    }
    if (error) {
      console.warn('saveUserToDb cloud notice:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('saveUserToDb offline/network fallback:', err?.message);
    return false;
  }
}

export async function fetchUserFromDb(email: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      themePreference: data.theme_preference || 'LIGHT',
      createdAt: data.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      currency: data.currency || '₹',
      role: data.role || 'CUSTOMER',
      passwordHash: data.password_hash || undefined
    };
  } catch {
    return null;
  }
}

// Pre-packaged SQL Schema for quick copy/initialization
export const DATABASE_SCHEMA_SQL = `-- SMART EXPENSE TRACKER - DATABASE SCHEMA
-- Project: ${SUPABASE_PROJECT_ID}
-- Run in SQL Editor (SQL Editor -> New Query -> Paste & Run)

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

CREATE TABLE IF NOT EXISTS public.budgets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Row Level Security (RLS) & Full Access Policies
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

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
END $$;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
`;
