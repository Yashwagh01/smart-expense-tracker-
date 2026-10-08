import { User, Transaction, Budget, FinancialGoal, Bill, Subscription, CustomerRecord } from '../types';

export const INITIAL_CUSTOMERS: CustomerRecord[] = [
  {
    id: 'user_1',
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    phone: '+91 98201 44521',
    joinedDate: '2026-06-15',
    status: 'ACTIVE',
    tier: 'PREMIUM',
    transactionsCount: 18,
    totalIncome: 210000,
    totalExpense: 83750,
    netBalance: 126250,
    activeBudgetsCount: 5,
    lastActive: 'Just now'
  },
  {
    id: 'user_2',
    name: 'Priya Patel',
    email: 'priya.patel@acme.in',
    phone: '+91 97112 88402',
    joinedDate: '2026-07-02',
    status: 'ACTIVE',
    tier: 'PRO',
    transactionsCount: 14,
    totalIncome: 145000,
    totalExpense: 62400,
    netBalance: 82600,
    activeBudgetsCount: 4,
    lastActive: '2 hours ago'
  },
  {
    id: 'user_3',
    name: 'Amit Verma',
    email: 'amit.verma@techcorp.com',
    phone: '+91 98450 12903',
    joinedDate: '2026-07-20',
    status: 'ACTIVE',
    tier: 'PREMIUM',
    transactionsCount: 26,
    totalIncome: 320000,
    totalExpense: 148500,
    netBalance: 171500,
    activeBudgetsCount: 6,
    lastActive: 'Yesterday'
  },
  {
    id: 'user_4',
    name: 'Sneha Kulkarni',
    email: 'sneha.k@designstudio.io',
    phone: '+91 99220 77194',
    joinedDate: '2026-08-05',
    status: 'ACTIVE',
    tier: 'STANDARD',
    transactionsCount: 9,
    totalIncome: 95000,
    totalExpense: 42100,
    netBalance: 52900,
    activeBudgetsCount: 3,
    lastActive: '3 days ago'
  },
  {
    id: 'user_5',
    name: 'Rajesh Nair',
    email: 'rajesh.nair@investments.co',
    phone: '+91 94470 33118',
    joinedDate: '2026-08-18',
    status: 'ACTIVE',
    tier: 'PRO',
    transactionsCount: 31,
    totalIncome: 450000,
    totalExpense: 195200,
    netBalance: 254800,
    activeBudgetsCount: 7,
    lastActive: 'Today at 08:30 AM'
  }
];

export const DEFAULT_USER: User = {
  id: 'user_1',
  name: 'Rahul Sharma',
  email: 'rahul@example.com',
  themePreference: 'LIGHT',
  createdAt: '2026-06-15',
  currency: '₹',
  role: 'CUSTOMER'
};

export const DEFAULT_EXPENSE_CATEGORIES: string[] = [
  'Food & Dining',
  'Groceries',
  'Rent & Housing',
  'Bills & Utilities',
  'Shopping & Retail',
  'Transportation & Fuel',
  'Entertainment & OTT',
  'Healthcare & Medical',
  'Education & Learning',
  'Travel & Vacation',
  'Personal Care & Fitness',
  'Subscriptions',
  'Other'
];

export const DEFAULT_INCOME_CATEGORIES: string[] = [
  'Salary',
  'Freelancing',
  'Business Income',
  'Investment Returns',
  'Rental Income',
  'Scholarship & Grants',
  'Bonus & Rewards',
  'Other'
];

export const DEFAULT_PAYMENT_METHODS: string[] = [
  'Google Pay (GPay)',
  'PhonePe',
  'UPI',
  'Credit Card',
  'Debit Card',
  'Net Banking',
  'Bank Transfer',
  'Cash',
  'Digital Wallet'
];

export function getInitialDemoTransactions(userId: string): Transaction[] {
  return [
    { id: 'tx_1', userId, type: 'INCOME', amount: 65000, category: 'Salary', description: 'Monthly Software Engineer Salary', paymentMethod: 'Bank Transfer', date: '2026-09-01' },
    { id: 'tx_2', userId, type: 'INCOME', amount: 15000, category: 'Freelancing', description: 'Mobile App Prototype Delivery', paymentMethod: 'Google Pay (GPay)', date: '2026-09-10' },
    { id: 'tx_3', userId, type: 'EXPENSE', amount: 16000, category: 'Rent & Housing', description: 'Apartment Monthly Rent', paymentMethod: 'Net Banking', date: '2026-09-02' },
    { id: 'tx_4', userId, type: 'EXPENSE', amount: 5200, category: 'Groceries', description: 'Supermarket Provisions & Organic Greens', paymentMethod: 'Google Pay (GPay)', date: '2026-09-04' },
    { id: 'tx_5', userId, type: 'EXPENSE', amount: 1850, category: 'Transportation & Fuel', description: 'Metro Card Recharge & Fuel', paymentMethod: 'PhonePe', date: '2026-09-07' },
    { id: 'tx_6', userId, type: 'EXPENSE', amount: 3100, category: 'Bills & Utilities', description: 'Fiber Broadband & Electricity', paymentMethod: 'UPI', date: '2026-09-11' },
    { id: 'tx_7', userId, type: 'EXPENSE', amount: 2900, category: 'Shopping & Retail', description: 'Noise Cancelling Headphones', paymentMethod: 'Credit Card', date: '2026-09-14' },
    { id: 'tx_8', userId, type: 'EXPENSE', amount: 1200, category: 'Entertainment & OTT', description: 'IMAX Cinema Tickets & Popcorn', paymentMethod: 'Debit Card', date: '2026-09-18' },
    { id: 'tx_9', userId, type: 'EXPENSE', amount: 3800, category: 'Food & Dining', description: 'Weekend Bistro Dinner Celebration', paymentMethod: 'Google Pay (GPay)', date: '2026-09-20' },
    { id: 'tx_10', userId, type: 'EXPENSE', amount: 2450, category: 'Healthcare & Medical', description: 'Health Checkup & Pharmacy Prescription', paymentMethod: 'PhonePe', date: '2026-09-22' },
    { id: 'tx_11', userId, type: 'EXPENSE', amount: 1500, category: 'Education & Learning', description: 'System Design Mastery Course', paymentMethod: 'Credit Card', date: '2026-09-24' },
    { id: 'tx_12', userId, type: 'EXPENSE', amount: 850, category: 'Personal Care & Fitness', description: 'Gym Protein Supplement & Grooming', paymentMethod: 'Cash', date: '2026-09-25' },
    { id: 'tx_13', userId, type: 'INCOME', amount: 8000, category: 'Investment Returns', description: 'Mutual Fund Dividend Payout', paymentMethod: 'Bank Transfer', date: '2026-09-15' },
    { id: 'tx_14', userId, type: 'EXPENSE', amount: 3400, category: 'Travel & Vacation', description: 'Weekend Getaway Train Ticket Booking', paymentMethod: 'Google Pay (GPay)', date: '2026-09-26' },
    { id: 'tx_15', userId, type: 'EXPENSE', amount: 16000, category: 'Rent & Housing', description: 'Apartment Monthly Rent', paymentMethod: 'Bank Transfer', date: '2026-08-02' },
    { id: 'tx_16', userId, type: 'EXPENSE', amount: 7400, category: 'Groceries', description: 'Monthly Groceries & Dairy', paymentMethod: 'Debit Card', date: '2026-08-06' },
    { id: 'tx_17', userId, type: 'EXPENSE', amount: 2800, category: 'Transportation & Fuel', description: 'Cab Rides & Highway Tolls', paymentMethod: 'UPI', date: '2026-08-11' },
    { id: 'tx_18', userId, type: 'EXPENSE', amount: 5200, category: 'Shopping & Retail', description: 'Smart Watch Accessories', paymentMethod: 'Credit Card', date: '2026-08-19' }
  ];
}

export function getInitialDemoBudgets(userId: string): Budget[] {
  return [
    { id: 'b1', userId, category: 'Food & Dining', amount: 12000, month: 9, year: 2026 },
    { id: 'b2', userId, category: 'Groceries', amount: 10000, month: 9, year: 2026 },
    { id: 'b3', userId, category: 'Shopping & Retail', amount: 7000, month: 9, year: 2026 },
    { id: 'b4', userId, category: 'Transportation & Fuel', amount: 4500, month: 9, year: 2026 },
    { id: 'b5', userId, category: 'Bills & Utilities', amount: 5000, month: 9, year: 2026 },
    { id: 'b6', userId, category: 'Entertainment & OTT', amount: 3000, month: 9, year: 2026 },
    { id: 'b7', userId, category: 'Healthcare & Medical', amount: 4000, month: 9, year: 2026 }
  ];
}

export function getInitialDemoGoals(userId: string): FinancialGoal[] {
  return [
    { id: 'g1', userId, name: 'Emergency Safety Cushion', targetAmount: 150000, currentAmount: 95000, deadline: '2027-04-30', description: '6 months essential living expenses reserve' },
    { id: 'g2', userId, name: 'MacBook Pro M4', targetAmount: 180000, currentAmount: 120000, deadline: '2027-01-15', description: 'High-performance engineering machine' },
    { id: 'g3', userId, name: 'Japan Travel Fund', targetAmount: 250000, currentAmount: 60000, deadline: '2027-10-30', description: '14-day holiday in Tokyo & Kyoto' }
  ];
}

export function getInitialDemoBills(userId: string): Bill[] {
  return [
    { id: 'bl1', userId, name: 'Fiber Broadband 300Mbps', amount: 1180, dueDate: '2026-10-05', status: 'UNPAID', recurring: true },
    { id: 'bl2', userId, name: 'Apartment Power Bill', amount: 2450, dueDate: '2026-10-12', status: 'UNPAID', recurring: true },
    { id: 'bl3', userId, name: 'Gym Membership', amount: 2500, dueDate: '2026-09-25', status: 'PAID', recurring: true }
  ];
}

export function getInitialDemoSubscriptions(userId: string): Subscription[] {
  return [
    { id: 's1', userId, name: 'Spotify Duo', amount: 199, frequency: 'MONTHLY', category: 'Entertainment & OTT', nextPaymentDate: '2026-10-08', status: 'ACTIVE' },
    { id: 's2', userId, name: 'Netflix 4K', amount: 649, frequency: 'MONTHLY', category: 'Entertainment & OTT', nextPaymentDate: '2026-10-15', status: 'ACTIVE' },
    { id: 's3', userId, name: 'GitHub Copilot', amount: 820, frequency: 'MONTHLY', category: 'Education & Learning', nextPaymentDate: '2026-10-22', status: 'ACTIVE' },
    { id: 's4', userId, name: 'Amazon Prime', amount: 1499, frequency: 'ANNUALLY', category: 'Shopping & Retail', nextPaymentDate: '2027-03-10', status: 'ACTIVE' }
  ];
}

