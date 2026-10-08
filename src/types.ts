export interface User {
  id: string;
  name: string;
  email: string;
  themePreference: 'LIGHT' | 'DARK';
  createdAt: string;
  currency: string;
  role?: string;
  passwordHash?: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  joinedDate: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  tier: 'PREMIUM' | 'STANDARD' | 'PRO';
  transactionsCount: number;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  activeBudgetsCount: number;
  lastActive: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category: string;
  description: string;
  paymentMethod: string;
  date: string;
  recurring?: boolean;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  amount: number;
  month: number;
  year: number;
}

export interface FinancialGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  description: string;
}

export interface Bill {
  id: string;
  userId: string;
  name: string;
  amount: number;
  dueDate: string;
  status: 'PAID' | 'UNPAID';
  recurring: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  name: string;
  amount: number;
  frequency: 'MONTHLY' | 'ANNUALLY' | 'WEEKLY';
  category: string;
  nextPaymentDate: string;
  status: 'ACTIVE' | 'CANCELLED';
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'BUDGET_WARNING' | 'BUDGET_EXCEEDED' | 'ANOMALY' | 'INSIGHT' | 'BILL_DUE';
  date: string;
  read: boolean;
}

export interface AiPredictionResult {
  success: boolean;
  predictedAmount: number;
  model: string;
  confidence: string;
  dataPoints: number;
  message: string;
}

export interface SpendingAnomaly {
  txn: Transaction;
  zScore: number;
  reason: string;
}

export const HOLST = {
  navy: '#223A5E',
  slate: '#355982',
  steel: '#4D79A8',
  cornflower: '#6E9ECC',
  frost: '#9FC0E3',
  ice: '#D0E1F2',
  porcelain: '#F3F8FD'
};

export interface CategoryItem {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon?: string;
  color?: string;
  description?: string;
}

export interface PaymentMethodItem {
  id: string;
  name: string;
  category: 'DIGITAL' | 'CARD' | 'BANK' | 'CASH';
  icon?: string;
}

