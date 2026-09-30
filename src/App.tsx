import React, { useState, useEffect, useMemo } from 'react';
import {
  User, Transaction, Budget, FinancialGoal, Bill, Subscription,
  AiPredictionResult, SpendingAnomaly, NotificationItem, CustomerRecord, HOLST
} from './types';
import {
  DEFAULT_USER, OWNER_USER, INITIAL_CUSTOMERS, getInitialDemoTransactions, getInitialDemoBudgets,
  getInitialDemoGoals, getInitialDemoBills, getInitialDemoSubscriptions,
  DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, DEFAULT_PAYMENT_METHODS
} from './data/initialData';
import { AuthModal } from './components/AuthModal';
import { AuthLandingView } from './views/AuthLandingView';
import { ProfileView } from './views/ProfileView';
import { AnalyticsView } from './views/AnalyticsView';
import { CategoriesView } from './views/CategoriesView';
import { OwnerPortalView } from './views/OwnerPortalView';
import {
  fetchCustomersFromDb, saveCustomerToDb, deleteCustomerFromDb,
  saveTransactionToDb, deleteTransactionFromDb, saveBudgetToDb,
  deleteBudgetFromDb, saveGoalToDb, deleteGoalFromDb, saveUserToDb,
  fetchTransactionsFromDb, fetchBudgetsFromDb, fetchGoalsFromDb,
  fetchBillsFromDb, saveBillToDb, deleteBillFromDb,
  fetchSubscriptionsFromDb, saveSubscriptionToDb, deleteSubscriptionFromDb
} from './lib/supabase';
import {
  Wallet, TrendingUp, PiggyBank, Sparkles, PieChart,
  Calendar, CreditCard, Plus, Trash2, ArrowUpRight, ArrowDownLeft,
  AlertTriangle, Shield, Moon, Sun, Download, FileText,
  RefreshCw, Sliders, Eye, Lightbulb, Bell, Search, Filter,
  CheckCircle2, LogIn, LogOut, UserPlus, User as UserIcon, X, Check,
  Pencil, Coffee, ShoppingBag, Car, DollarSign, Menu, Crown, Users, Tag, Database
} from 'lucide-react';


export default function App() {
  // Theme State
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('theme_preference') === 'DARK';
  });

  // Current User State (defaults to null so unregistered/new visitors see the clean Login/Register page)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const authStatus = localStorage.getItem('smartexpense_auth_status');
    if (authStatus === 'logged_out') {
      return null;
    }
    const saved = localStorage.getItem('smartexpense_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only keep genuine user session, ignore previous hardcoded demo user (rahul@example.com)
        if (parsed && parsed.email && parsed.email !== 'rahul@example.com') {
          return parsed;
        }
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Navigation Tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'owner'>('login');
  const [isGoogleDirectAuth, setIsGoogleDirectAuth] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Customer Management (Platform Owner Database)
  const [customers, setCustomers] = useState<CustomerRecord[]>(() => {
    const saved = localStorage.getItem('smartexpense_customers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_CUSTOMERS;
  });

  useEffect(() => {
    localStorage.setItem('smartexpense_customers', JSON.stringify(customers));
  }, [customers]);

  // Load customer directory from cloud database on startup
  useEffect(() => {
    fetchCustomersFromDb().then(res => {
      if (res.data && res.data.length > 0) {
        setCustomers(prev => {
          const existingIds = new Set(prev.map(c => c.id));
          const existingEmails = new Set(prev.map(c => c.email.toLowerCase()));
          const toAdd = res.data!.filter(c => !existingIds.has(c.id) && !existingEmails.has(c.email.toLowerCase()));
          if (toAdd.length === 0) return prev;
          return [...prev, ...toAdd];
        });
      }
    });
  }, []);

  // Guarantee that active user profile and registered customers are stored in Supabase database tables
  useEffect(() => {
    if (currentUser && currentUser.role !== 'OWNER') {
      saveUserToDb(currentUser);
      saveCustomerToDb({
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        joinedDate: currentUser.createdAt || new Date().toISOString().split('T')[0],
        status: 'ACTIVE',
        tier: 'STANDARD',
        transactionsCount: transactions.length,
        totalIncome: totalIncome,
        totalExpense: totalExpenses,
        netBalance: balance,
        activeBudgetsCount: budgets.length,
        lastActive: 'Just now'
      });
    }

    try {
      const storedUsers = localStorage.getItem('smartexpense_registered_users');
      if (storedUsers) {
        const users: User[] = JSON.parse(storedUsers);
        users.forEach(u => {
          if (u.role !== 'OWNER') {
            saveUserToDb(u);
            saveCustomerToDb({
              id: u.id,
              name: u.name,
              email: u.email,
              joinedDate: u.createdAt || new Date().toISOString().split('T')[0],
              status: 'ACTIVE',
              tier: 'STANDARD',
              transactionsCount: 0,
              totalIncome: 0,
              totalExpense: 0,
              netBalance: 0,
              activeBudgetsCount: 0,
              lastActive: 'Active'
            });
          }
        });
      }
    } catch {}
  }, [currentUser?.id]);


  // Search & Filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('ALL');

  // Categories & Payment Methods Management (Always merge defaults to guarantee all categories & methods are available)
  const [categoriesList, setCategoriesList] = useState<{ expense: string[]; income: string[] }>(() => {
    const saved = localStorage.getItem('smartexpense_categories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.expense && Array.isArray(parsed.expense) && parsed.income && Array.isArray(parsed.income)) {
          const mergedExpense = Array.from(new Set([...DEFAULT_EXPENSE_CATEGORIES, ...parsed.expense]));
          const mergedIncome = Array.from(new Set([...DEFAULT_INCOME_CATEGORIES, ...parsed.income]));
          return { expense: mergedExpense, income: mergedIncome };
        }
      } catch (e) {}
    }
    return {
      expense: DEFAULT_EXPENSE_CATEGORIES,
      income: DEFAULT_INCOME_CATEGORIES
    };
  });

  const [paymentMethodsList, setPaymentMethodsList] = useState<string[]>(() => {
    const saved = localStorage.getItem('smartexpense_payment_methods');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return Array.from(new Set([...DEFAULT_PAYMENT_METHODS, ...parsed]));
        }
      } catch (e) {}
    }
    return DEFAULT_PAYMENT_METHODS;
  });

  useEffect(() => {
    localStorage.setItem('smartexpense_categories', JSON.stringify(categoriesList));
  }, [categoriesList]);

  useEffect(() => {
    localStorage.setItem('smartexpense_payment_methods', JSON.stringify(paymentMethodsList));
  }, [paymentMethodsList]);

  const handleAddCategory = (type: 'EXPENSE' | 'INCOME', categoryName: string) => {
    const key = type === 'EXPENSE' ? 'expense' : 'income';
    setCategoriesList(prev => {
      if (prev[key].includes(categoryName)) return prev;
      return {
        ...prev,
        [key]: [...prev[key], categoryName]
      };
    });
    showToast(`Added ${type.toLowerCase()} category "${categoryName}"`);
  };

  const handleAddPaymentMethod = (methodName: string) => {
    setPaymentMethodsList(prev => {
      if (prev.includes(methodName)) return prev;
      return [...prev, methodName];
    });
    showToast(`Added payment method "${methodName}"`);
  };


  // Active user ID for data ownership (safe fallback for guest mode)
  const currentUserId = currentUser ? currentUser.id : 'guest_user';

  // Helper for isolated user datasets
  const getUserScopedStorage = <T,>(datasetKey: string, uid: string): T[] => {
    if (!uid || uid === 'guest_user') return [];
    try {
      const data = localStorage.getItem(`smartexpense_${datasetKey}_${uid}`);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.filter((item: any) => !item.userId || item.userId === uid);
        }
      }
    } catch {}
    return [];
  };

  // Financial Datasets strictly scoped to the active user (zero contamination across accounts)
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (!currentUser || currentUser.role === 'OWNER') return [];
    return getUserScopedStorage<Transaction>('transactions', currentUser.id);
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    if (!currentUser || currentUser.role === 'OWNER') return [];
    return getUserScopedStorage<Budget>('budgets', currentUser.id);
  });

  const [goals, setGoals] = useState<FinancialGoal[]>(() => {
    if (!currentUser || currentUser.role === 'OWNER') return [];
    return getUserScopedStorage<FinancialGoal>('goals', currentUser.id);
  });

  const [bills, setBills] = useState<Bill[]>(() => {
    if (!currentUser || currentUser.role === 'OWNER') return [];
    return getUserScopedStorage<Bill>('bills', currentUser.id);
  });

  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    if (!currentUser || currentUser.role === 'OWNER') return [];
    return getUserScopedStorage<Subscription>('subscriptions', currentUser.id);
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Modal State for CRUD & Quick Data Editing
  const [modalType, setModalType] = useState<
    'INCOME' | 'EXPENSE' | 'BUDGET' | 'GOAL' | 'BILL' | 'SUB' |
    'EDIT_TX' | 'EDIT_BUDGET' | 'ADJUST_BALANCE' | 'EDIT_DASHBOARD' | null
  >(null);

  // Form Fields
  const [formAmount, setFormAmount] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('Food & Dining');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formPaymentMethod, setFormPaymentMethod] = useState<string>('Google Pay (GPay)');
  const [formType, setFormType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [formName, setFormName] = useState<string>('');
  const [targetBalanceInput, setTargetBalanceInput] = useState<string>('');

  // Editing Entities
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // What-If Simulator State
  const [simIncomeChange, setSimIncomeChange] = useState<number>(0);
  const [simExpenseCut, setSimExpenseCut] = useState<number>(0);

  // Persist Datasets to LocalStorage
  useEffect(() => {
    localStorage.setItem('theme_preference', isDark ? 'DARK' : 'LIGHT');
  }, [isDark]);

  // Strict User Data Partitioning: Whenever currentUser changes, load ONLY that user's data
  useEffect(() => {
    if (!currentUser || currentUser.role === 'OWNER') {
      setTransactions([]);
      setBudgets([]);
      setGoals([]);
      setBills([]);
      setSubscriptions([]);
      setNotifications([]);
      return;
    }

    const uid = currentUser.id;

    // 1. Load user's private local records
    setTransactions(getUserScopedStorage<Transaction>('transactions', uid));
    setBudgets(getUserScopedStorage<Budget>('budgets', uid));
    setGoals(getUserScopedStorage<FinancialGoal>('goals', uid));
    setBills(getUserScopedStorage<Bill>('bills', uid));
    setSubscriptions(getUserScopedStorage<Subscription>('subscriptions', uid));

    // 2. Fetch cloud database records strictly for this user
    fetchTransactionsFromDb(uid).then(cloudTxns => {
      if (cloudTxns) {
        const scoped = cloudTxns.filter(t => t.userId === uid);
        setTransactions(scoped);
        localStorage.setItem(`smartexpense_transactions_${uid}`, JSON.stringify(scoped));
      }
    });

    fetchBudgetsFromDb(uid).then(cloudBudgets => {
      if (cloudBudgets) {
        const scoped = cloudBudgets.filter(b => b.userId === uid);
        setBudgets(scoped);
        localStorage.setItem(`smartexpense_budgets_${uid}`, JSON.stringify(scoped));
      }
    });

    fetchGoalsFromDb(uid).then(cloudGoals => {
      if (cloudGoals) {
        const scoped = cloudGoals.filter(g => g.userId === uid);
        setGoals(scoped);
        localStorage.setItem(`smartexpense_goals_${uid}`, JSON.stringify(scoped));
      }
    });

    fetchBillsFromDb(uid).then(cloudBills => {
      if (cloudBills) {
        const scoped = cloudBills.filter(b => b.userId === uid);
        setBills(scoped);
        localStorage.setItem(`smartexpense_bills_${uid}`, JSON.stringify(scoped));
      }
    });

    fetchSubscriptionsFromDb(uid).then(cloudSubs => {
      if (cloudSubs) {
        const scoped = cloudSubs.filter(s => s.userId === uid);
        setSubscriptions(scoped);
        localStorage.setItem(`smartexpense_subscriptions_${uid}`, JSON.stringify(scoped));
      }
    });
  }, [currentUser?.id]);

  // User-scoped LocalStorage Persistence (Never leak records between accounts)
  useEffect(() => {
    if (currentUser && currentUser.id && currentUser.role !== 'OWNER') {
      localStorage.setItem(`smartexpense_transactions_${currentUser.id}`, JSON.stringify(transactions));
    }
  }, [transactions, currentUser?.id]);

  useEffect(() => {
    if (currentUser && currentUser.id && currentUser.role !== 'OWNER') {
      localStorage.setItem(`smartexpense_budgets_${currentUser.id}`, JSON.stringify(budgets));
    }
  }, [budgets, currentUser?.id]);

  useEffect(() => {
    if (currentUser && currentUser.id && currentUser.role !== 'OWNER') {
      localStorage.setItem(`smartexpense_goals_${currentUser.id}`, JSON.stringify(goals));
    }
  }, [goals, currentUser?.id]);

  useEffect(() => {
    if (currentUser && currentUser.id && currentUser.role !== 'OWNER') {
      localStorage.setItem(`smartexpense_bills_${currentUser.id}`, JSON.stringify(bills));
    }
  }, [bills, currentUser?.id]);

  useEffect(() => {
    if (currentUser && currentUser.id && currentUser.role !== 'OWNER') {
      localStorage.setItem(`smartexpense_subscriptions_${currentUser.id}`, JSON.stringify(subscriptions));
    }
  }, [subscriptions, currentUser?.id]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('smartexpense_current_user', JSON.stringify(currentUser));
      localStorage.removeItem('smartexpense_auth_status');
    }
  }, [currentUser]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPI Calculations
  const totalIncome = useMemo(() => {
    return transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalExpenses = useMemo(() => {
    return transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const balance = useMemo(() => {
    return totalIncome - totalExpenses;
  }, [totalIncome, totalExpenses]);

  const savingsRate = useMemo(() => {
    if (totalIncome <= 0) return 0;
    return Math.max(0, ((totalIncome - totalExpenses) / totalIncome) * 100);
  }, [totalIncome, totalExpenses]);

  // Category Spending Map
  const categorySpending = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'EXPENSE')
      .forEach(t => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return map;
  }, [transactions]);

  // Easy-to-Understand Monthly Spending Projection & Budget Pace (replaces complex velocity model)
  const monthlyProjection = useMemo(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = Math.max(1, now.getDate());
    const daysRemaining = Math.max(0, daysInMonth - currentDay);

    // Current month expenses
    const thisMonthExpenses = transactions
      .filter(t => t.type === 'EXPENSE' && t.date.startsWith(currentMonthKey));
    
    // Fallback if current calendar month has no records yet (e.g. demo transactions or new month)
    const monthExpenses = thisMonthExpenses.length > 0 
      ? thisMonthExpenses 
      : transactions.filter(t => t.type === 'EXPENSE');
    
    const spentSoFar = monthExpenses.reduce((sum, t) => sum + t.amount, 0);
    const dayCount = thisMonthExpenses.length > 0 ? currentDay : 25;
    const dailyAverage = dayCount > 0 ? Math.round(spentSoFar / dayCount) : 0;
    const projectedEndMonth = Math.round(spentSoFar + (dailyAverage * (thisMonthExpenses.length > 0 ? daysRemaining : 5)));

    // Total monthly budget across active categories
    const totalBudgetCap = budgets.reduce((sum, b) => sum + b.amount, 0);
    const budgetRemaining = Math.max(0, totalBudgetCap - spentSoFar);
    const safeDailySpend = daysRemaining > 0 ? Math.round(budgetRemaining / daysRemaining) : (budgetRemaining > 0 ? Math.round(budgetRemaining / 5) : 0);
    const isWithinBudget = totalBudgetCap > 0 ? projectedEndMonth <= totalBudgetCap : true;

    // Top 3 expense categories
    const catMap: Record<string, number> = {};
    monthExpenses.forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    const topCategories = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, amt]) => ({ category: cat, amount: amt }));

    return {
      spentSoFar,
      dailyAverage,
      projectedEndMonth,
      daysInMonth,
      daysRemaining,
      totalBudgetCap,
      budgetRemaining,
      safeDailySpend,
      isWithinBudget,
      topCategories,
      recordsCount: monthExpenses.length
    };
  }, [transactions, budgets]);

  // Anomaly Detection
  const anomalies = useMemo<SpendingAnomaly[]>(() => {
    const results: SpendingAnomaly[] = [];
    const catMap: Record<string, number[]> = {};

    transactions
      .filter(t => t.type === 'EXPENSE')
      .forEach(t => {
        if (!catMap[t.category]) catMap[t.category] = [];
        catMap[t.category].push(t.amount);
      });

    transactions.forEach(t => {
      if (t.type === 'EXPENSE') {
        const amounts = catMap[t.category];
        if (amounts && amounts.length >= 3) {
          const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
          const variance = amounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / amounts.length;
          const stdDev = Math.sqrt(variance) || 1;
          const z = (t.amount - mean) / stdDev;

          if (z >= 2.0 && t.amount > mean * 1.5) {
            results.push({
              txn: t,
              zScore: parseFloat(z.toFixed(2)),
              reason: `₹${t.amount.toLocaleString()} is ${Math.round(((t.amount - mean) / mean) * 100)}% higher than your ${t.category} average (₹${Math.round(mean).toLocaleString()})`
            });
          }
        }
      }
    });

    return results;
  }, [transactions]);

  // Open Edit Modal for a Transaction
  const handleOpenEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setFormAmount(tx.amount.toString());
    setFormCategory(tx.category);
    setFormDesc(tx.description);
    setFormDate(tx.date);
    setFormPaymentMethod(tx.paymentMethod);
    setFormType(tx.type);
    setModalType('EDIT_TX');
  };

  // Open Edit Modal for a Budget
  const handleOpenEditBudget = (b: Budget) => {
    setEditingBudget(b);
    setFormCategory(b.category);
    setFormAmount(b.amount.toString());
    setModalType('EDIT_BUDGET');
  };

  // Quick 1-Click Preset Additions
  const handleQuickAdd = (type: 'INCOME' | 'EXPENSE', amount: number, category: string, description: string) => {
    const newTx: Transaction = {
      id: 'tx_' + Date.now(),
      userId: currentUserId,
      type,
      amount,
      category,
      description,
      paymentMethod: 'UPI',
      date: new Date().toISOString().split('T')[0]
    };
    setTransactions(prev => [newTx, ...prev]);
    showToast(`Added ${type === 'INCOME' ? 'Inflow' : 'Expense'}: ₹${amount.toLocaleString()} (${description})`);
  };

  // Open Adjust Balance Modal
  const handleOpenAdjustBalance = () => {
    setTargetBalanceInput(balance.toString());
    setModalType('ADJUST_BALANCE');
  };

  // Form Submissions (Create, Update, Adjust)
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(formAmount);

    // 1. EDIT EXISTING TRANSACTION
    if (modalType === 'EDIT_TX' && editingTransaction) {
      if (isNaN(amt) || amt <= 0) {
        showToast('Please enter a valid amount.');
        return;
      }
      setTransactions(prev => prev.map(t => {
        if (t.id === editingTransaction.id) {
          const updatedTx: Transaction = {
            ...t,
            type: formType,
            amount: amt,
            category: formCategory,
            description: formDesc || t.description,
            paymentMethod: formPaymentMethod,
            date: formDate
          };
          saveTransactionToDb(updatedTx);
          return updatedTx;
        }
        return t;
      }));
      showToast('Transaction details updated successfully!');
      setModalType(null);
      setEditingTransaction(null);
      return;
    }

    // 2. EDIT EXISTING BUDGET CAP
    if (modalType === 'EDIT_BUDGET' && editingBudget) {
      if (isNaN(amt) || amt <= 0) {
        showToast('Please enter a valid budget amount.');
        return;
      }
      setBudgets(prev => prev.map(b => {
        if (b.id === editingBudget.id) {
          const updatedB: Budget = {
            ...b,
            category: formCategory,
            amount: amt
          };
          saveBudgetToDb(updatedB);
          return updatedB;
        }
        return b;
      }));
      showToast(`Budget limit for ${formCategory} updated to ₹${amt.toLocaleString()}!`);
      setModalType(null);
      setEditingBudget(null);
      return;
    }

    // 3. ADJUST NET BALANCE DIRECTLY
    if (modalType === 'ADJUST_BALANCE') {
      const targetBal = parseFloat(targetBalanceInput);
      if (isNaN(targetBal)) {
        showToast('Please enter a valid target balance.');
        return;
      }
      const currentNet = balance;
      const difference = targetBal - currentNet;

      if (Math.abs(difference) < 0.01) {
        showToast('Balance is already at this amount.');
        setModalType(null);
        return;
      }

      if (difference > 0) {
        // Add income adjustment
        const adjustTx: Transaction = {
          id: 'tx_' + Date.now(),
          userId: currentUserId,
          type: 'INCOME',
          amount: difference,
          category: 'Adjustment',
          description: 'Net Balance Calibration (Opening / Reserve adjustment)',
          paymentMethod: 'Bank Transfer',
          date: new Date().toISOString().split('T')[0]
        };
        setTransactions(prev => [adjustTx, ...prev]);
        saveTransactionToDb(adjustTx);
        showToast(`Balance adjusted to ₹${targetBal.toLocaleString()} (+₹${difference.toLocaleString()})`);
      } else {
        // Add expense adjustment
        const adjustTx: Transaction = {
          id: 'tx_' + Date.now(),
          userId: currentUserId,
          type: 'EXPENSE',
          amount: Math.abs(difference),
          category: 'Adjustment',
          description: 'Net Balance Calibration (Reconciliation adjustment)',
          paymentMethod: 'Bank Transfer',
          date: new Date().toISOString().split('T')[0]
        };
        setTransactions(prev => [adjustTx, ...prev]);
        saveTransactionToDb(adjustTx);
        showToast(`Balance adjusted to ₹${targetBal.toLocaleString()} (-₹${Math.abs(difference).toLocaleString()})`);
      }

      setModalType(null);
      return;
    }

    // 4. NEW INCOME OR EXPENSE
    if (modalType === 'INCOME' || modalType === 'EXPENSE') {
      if (isNaN(amt) || amt <= 0) {
        showToast('Please enter a valid amount.');
        return;
      }
      const newTx: Transaction = {
        id: 'tx_' + Date.now(),
        userId: currentUserId,
        type: modalType,
        amount: amt,
        category: formCategory,
        description: formDesc || `${formCategory} ${modalType.toLowerCase()}`,
        paymentMethod: formPaymentMethod,
        date: formDate
      };
      setTransactions(prev => [newTx, ...prev]);
      saveTransactionToDb(newTx);

      // Update customer ledger metrics in database
      setCustomers(prev => prev.map(c => {
        if (c.id === currentUserId || (currentUser && c.email.toLowerCase() === currentUser.email.toLowerCase())) {
          const newInflow = modalType === 'INCOME' ? c.totalIncome + amt : c.totalIncome;
          const newExpense = modalType === 'EXPENSE' ? c.totalExpense + amt : c.totalExpense;
          const updatedCust: CustomerRecord = {
            ...c,
            transactionsCount: c.transactionsCount + 1,
            totalIncome: newInflow,
            totalExpense: newExpense,
            netBalance: newInflow - newExpense,
            lastActive: 'Just now'
          };
          saveCustomerToDb(updatedCust);
          return updatedCust;
        }
        return c;
      }));

      showToast(`${modalType === 'INCOME' ? 'Income' : 'Expense'} of ₹${amt.toLocaleString()} added!`);

      // Check Budget Alert for expense
      if (modalType === 'EXPENSE') {
        const b = budgets.find(bg => bg.category === formCategory);
        if (b) {
          const currentSpent = (categorySpending[formCategory] || 0) + amt;
          const pct = (currentSpent / b.amount) * 100;
          if (pct >= 100) {
            setNotifications(prev => [{
              id: Date.now().toString(),
              userId: currentUserId,
              title: `Budget Exceeded: ${b.category}`,
              message: `Spending reached ₹${currentSpent.toLocaleString()} against your ₹${b.amount.toLocaleString()} budget (${Math.round(pct)}%).`,
              type: 'BUDGET_EXCEEDED',
              date: new Date().toISOString().split('T')[0],
              read: false
            }, ...prev]);
          }
        }
      }
    } else if (modalType === 'BUDGET') {
      if (isNaN(amt) || amt <= 0) return;
      const newB: Budget = {
        id: 'b_' + Date.now(),
        userId: currentUserId,
        category: formCategory,
        amount: amt,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      };
      setBudgets(prev => [...prev.filter(b => b.category !== formCategory), newB]);
      saveBudgetToDb(newB);
      showToast(`Budget limit set for ${formCategory}!`);
    } else if (modalType === 'GOAL') {
      if (isNaN(amt) || amt <= 0 || !formName.trim()) return;
      const newG: FinancialGoal = {
        id: 'g_' + Date.now(),
        userId: currentUserId,
        name: formName.trim(),
        targetAmount: amt,
        currentAmount: 0,
        deadline: formDate,
        description: formDesc || 'Personal financial milestone'
      };
      setGoals(prev => [newG, ...prev]);
      saveGoalToDb(newG);
      showToast(`Goal "${formName}" created!`);
    } else if (modalType === 'BILL') {
      if (isNaN(amt) || amt <= 0 || !formName.trim()) return;
      const newBill: Bill = {
        id: 'bl_' + Date.now(),
        userId: currentUserId,
        name: formName.trim(),
        amount: amt,
        dueDate: formDate,
        status: 'UNPAID',
        recurring: true
      };
      setBills(prev => [newBill, ...prev]);
      saveBillToDb(newBill);
      showToast(`Bill "${formName}" scheduled!`);
    } else if (modalType === 'SUB') {
      if (isNaN(amt) || amt <= 0 || !formName.trim()) return;
      const newSub: Subscription = {
        id: 's_' + Date.now(),
        userId: currentUserId,
        name: formName.trim(),
        amount: amt,
        frequency: 'MONTHLY',
        category: formCategory,
        nextPaymentDate: formDate,
        status: 'ACTIVE'
      };
      setSubscriptions(prev => [newSub, ...prev]);
      saveSubscriptionToDb(newSub);
      showToast(`Subscription "${formName}" added!`);
    }

    setModalType(null);
    setFormAmount('');
    setFormDesc('');
    setFormName('');
  };

  const handleToggleBillStatus = (billId: string) => {
    setBills(prev => prev.map(b => {
      if (b.id === billId) {
        const nextStatus = b.status === 'PAID' ? 'UNPAID' : 'PAID';
        const updatedBill: Bill = { ...b, status: nextStatus };
        saveBillToDb(updatedBill);
        showToast(`Bill marked as ${nextStatus}`);
        return updatedBill;
      }
      return b;
    }));
  };

  const handleUpdateGoalProgress = (goalId: string, delta: number) => {
    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        const updated = Math.max(0, Math.min(g.targetAmount, g.currentAmount + delta));
        const updatedGoal: FinancialGoal = { ...g, currentAmount: updated };
        saveGoalToDb(updatedGoal);
        showToast(`Updated savings for ${g.name}`);
        return updatedGoal;
      }
      return g;
    }));
  };

  const handleDeleteItem = (type: 'tx' | 'b' | 'g' | 'bl' | 's', id: string) => {
    if (type === 'tx') {
      setTransactions(prev => prev.filter(t => t.id !== id));
      deleteTransactionFromDb(id);
    }
    if (type === 'b') {
      setBudgets(prev => prev.filter(b => b.id !== id));
      deleteBudgetFromDb(id);
    }
    if (type === 'g') {
      setGoals(prev => prev.filter(g => g.id !== id));
      deleteGoalFromDb(id);
    }
    if (type === 'bl') {
      setBills(prev => prev.filter(b => b.id !== id));
      deleteBillFromDb(id);
    }
    if (type === 's') {
      setSubscriptions(prev => prev.filter(s => s.id !== id));
      deleteSubscriptionFromDb(id);
    }
    showToast('Record deleted successfully');
  };


  const handleClearData = () => {
    setTransactions([]);
    setBudgets([]);
    setGoals([]);
    setBills([]);
    setSubscriptions([]);
    if (currentUser && currentUser.id) {
      localStorage.removeItem(`smartexpense_transactions_${currentUser.id}`);
      localStorage.removeItem(`smartexpense_budgets_${currentUser.id}`);
      localStorage.removeItem(`smartexpense_goals_${currentUser.id}`);
      localStorage.removeItem(`smartexpense_bills_${currentUser.id}`);
      localStorage.removeItem(`smartexpense_subscriptions_${currentUser.id}`);
    }
    showToast('All your records cleared.');
  };

  // True Logout Handler: Instantly clears in-memory personal state
  const handleLogout = () => {
    localStorage.removeItem('smartexpense_current_user');
    localStorage.setItem('smartexpense_auth_status', 'logged_out');
    setCurrentUser(null);
    setTransactions([]);
    setBudgets([]);
    setGoals([]);
    setBills([]);
    setSubscriptions([]);
    setNotifications([]);
    setEditingTransaction(null);
    setEditingBudget(null);
    setModalType(null);
    if (activeTab === 'owner_portal') {
      setActiveTab('dashboard');
    }
    showToast('Logged out successfully. All personal ledger data cleared.');
  };

  // Login Success Handler
  const handleLoginSuccess = (user: User) => {
    localStorage.removeItem('smartexpense_auth_status');
    localStorage.setItem('smartexpense_current_user', JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthModalOpen(false);

    if (user.role === 'OWNER') {
      setActiveTab('owner_portal');
      showToast('👑 Welcome Platform Owner! Customer Data Portal Unlocked.');
    } else {
      // Persist user and customer profile to cloud database
      saveUserToDb(user);
      const newCust: CustomerRecord = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: '+91 98000 00000',
        joinedDate: user.createdAt || new Date().toISOString().split('T')[0],
        status: 'ACTIVE',
        tier: 'STANDARD',
        transactionsCount: 0,
        totalIncome: 0,
        totalExpense: 0,
        netBalance: 0,
        activeBudgetsCount: 0,
        lastActive: 'Just now'
      };
      saveCustomerToDb(newCust);

      // Ensure customer exists in platform directory
      setCustomers(prev => {
        if (prev.some(c => c.email.toLowerCase() === user.email.toLowerCase())) {
          return prev;
        }
        return [newCust, ...prev];
      });
      showToast(`Welcome back, ${user.name}!`);
    }
  };

  // Add Customer (from Owner Portal)
  const handleAddCustomer = (newCustomer: CustomerRecord) => {
    setCustomers(prev => [newCustomer, ...prev]);
    saveCustomerToDb(newCustomer);
    showToast(`Customer ${newCustomer.name} saved to database.`);
  };

  // CSV Export
  const handleExportCsv = () => {
    const headers = 'ID,Date,Type,Category,Description,PaymentMethod,Amount\n';
    const rows = transactions.map(t =>
      `${t.id},${t.date},${t.type},"${t.category}","${t.description}","${t.paymentMethod}",${t.amount}`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `financial_statement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV statement downloaded.');
  };

  const bgClass = isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#F3F8FD] text-slate-900';
  const cardBgClass = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#D0E1F2]';

  // If user is not registered or logged in, show the simple login & register page
  // with comprehensive information about smart expense tracker with spending prediction
  if (!currentUser) {
    return (
      <AuthLandingView
        onLoginSuccess={handleLoginSuccess}
        isDark={isDark}
        onToggleTheme={() => {
          const next = !isDark;
          setIsDark(next);
          localStorage.setItem('theme_preference', next ? 'DARK' : 'LIGHT');
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${bgClass}`} style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar with Collison-Free Mobile Layout */}
      <header className={`border-b sticky top-0 z-30 px-2.5 xs:px-4 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 backdrop-blur-md ${isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-white/90 border-[#D0E1F2]'}`}>
        
        {/* Left Side: Mobile Menu Button & Brand */}
        <div className="flex items-center space-x-1.5 xs:space-x-2.5 min-w-0 flex-1">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-1.5 xs:p-2 -ml-0.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Open Navigation Menu"
            aria-label="Open navigation menu"
          >
            <Menu className="w-4 h-4 xs:w-5 xs:h-5" />
          </button>

          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center space-x-1.5 xs:space-x-2 cursor-pointer min-w-0"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-xs text-white shrink-0" style={{ backgroundColor: HOLST.navy }}>
              <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-xs xs:text-sm sm:text-base md:text-lg tracking-tight truncate block" style={{ color: isDark ? '#9FC0E3' : HOLST.navy }}>
                  SMART EXPENSE
                </span>
                {currentUser?.role === 'OWNER' && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hidden md:inline-block shrink-0">
                    OWNER
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 hidden md:block truncate">
                TRACK · CONTROL · ANALYZE · PREDICT
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls & Auth Buttons */}
        <div className="flex items-center space-x-1 xs:space-x-1.5 sm:space-x-2 shrink-0">
          
          {/* Clear Data Button (desktop/tablet) */}
          <button
            onClick={handleClearData}
            className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-all cursor-pointer"
            title="Clear all records"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className={`p-1.5 xs:p-2 rounded-xl border transition-all cursor-pointer shrink-0 ${isDark ? 'bg-slate-800 text-amber-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'}`}
            title="Toggle Light / Dark Theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notifications */}
          <button
            onClick={() => setActiveTab('notifications')}
            className={`p-1.5 xs:p-2 rounded-xl border transition-all relative cursor-pointer shrink-0 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            {notifications.some(n => !n.read) && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          {/* Authenticated User Controls */}
          <div className="flex items-center space-x-1 xs:space-x-1.5 pl-1 xs:pl-1.5 border-l border-slate-200 dark:border-slate-800 shrink-0">
            {currentUser?.role === 'OWNER' ? (
              <button
                onClick={() => setActiveTab('owner_portal')}
                className={`flex items-center space-x-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  activeTab === 'owner_portal'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                }`}
                title="Open Customer Data Portal"
              >
                <Crown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Owner</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('profile')}
                className="flex items-center space-x-1.5 p-1 xs:px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="View Account Profile"
              >
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
                </div>
                <span className="hidden md:inline max-w-[80px] truncate">{currentUser?.name ? currentUser.name.split(' ')[0] : 'User'}</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 p-1.5 xs:px-2 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
              title="Sign out of your account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main App Container */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* DESKTOP SIDEBAR (Visible on lg:flex) */}
        <aside className={`hidden lg:flex w-64 border-r flex-col justify-between p-4 shrink-0 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#F8FAFC] border-[#D0E1F2]'}`}>
          <div className="space-y-4 overflow-y-auto pr-1">

            {/* Overview */}
            <div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${activeTab === 'dashboard' ? 'bg-[#355982] text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'}`}
              >
                <Wallet className="w-4 h-4" />
                <span>Dashboard Overview</span>
              </button>
            </div>

            {/* Pillar 1: TRACK */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider px-3 mb-1 uppercase">
                1. TRACK
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('income')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeTab === 'income' ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Income Streams</span>
                </button>
                <button
                  onClick={() => setActiveTab('expenses')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeTab === 'expenses' ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
                  <span>Expenses</span>
                </button>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeTab === 'transactions' ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>All Transactions</span>
                </button>
              </div>
            </div>

            {/* Pillar 2: CONTROL */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider px-3 mb-1 uppercase">
                2. CONTROL
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('budgets')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeTab === 'budgets' ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Budgets & Limits</span>
                </button>
                <button
                  onClick={() => setActiveTab('categories')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeTab === 'categories' ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <Tag className="w-3.5 h-3.5 text-blue-500" />
                  <span>Categories & Methods</span>
                </button>
                <button
                  onClick={() => setActiveTab('goals')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeTab === 'goals' ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <PiggyBank className="w-3.5 h-3.5" />
                  <span>Financial Goals</span>
                </button>
                <button
                  onClick={() => setActiveTab('bills')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeTab === 'bills' ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Upcoming Bills</span>
                </button>
                <button
                  onClick={() => setActiveTab('subscriptions')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeTab === 'subscriptions' ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Subscriptions</span>
                </button>
              </div>
            </div>

            {/* Pillar 3: ANALYZE */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider px-3 mb-1 uppercase">
                3. ANALYZE
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeTab === 'analytics' ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <PieChart className="w-3.5 h-3.5" />
                  <span>Analytics & Trends</span>
                </button>
              </div>
            </div>

            {/* Pillar 4: PROJECTIONS */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider px-3 mb-1 uppercase">
                4. PROJECTIONS
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('predictions')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeTab === 'predictions' ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Monthly Projections</span>
                </button>
              </div>
            </div>

            {/* Pillar 5: UNDERSTAND */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider px-3 mb-1 uppercase">
                5. UNDERSTAND
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('insights')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeTab === 'insights' ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>Insights & Habits</span>
                </button>
                <button
                  onClick={() => setActiveTab('simulator')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeTab === 'simulator' ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>What-If Simulator</span>
                </button>
              </div>
            </div>

            {/* System Reports & User Profile */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider px-3 mb-1 uppercase">
                REPORTS & PROFILE
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeTab === 'reports' ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Financial Statement</span>
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeTab === 'profile' ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>User Details</span>
                </button>
              </div>
            </div>

          </div>

          {/* User Profile Mini Badge & Bottom Auth Controls */}
          <div className={`pt-3 border-t ${isDark ? 'border-slate-800' : 'border-[#D0E1F2]'}`}>
            {currentUser ? (
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab(currentUser.role === 'OWNER' ? 'owner_portal' : 'profile')}
                  className="w-full flex items-center space-x-3 text-left hover:opacity-85 transition-opacity cursor-pointer p-1 rounded-lg"
                >
                  <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                    currentUser.role === 'OWNER' ? 'bg-amber-600' : 'bg-blue-600'
                  }`}>
                    {currentUser.role === 'OWNER' ? '👑' : (currentUser.name ? currentUser.name.charAt(0) : 'U')}
                  </div>
                  <div className="truncate flex-1">
                    <p className="text-xs font-semibold truncate">{currentUser.name || 'User'}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email || 'Account'}</p>
                  </div>
                </button>

                <div className="flex items-center space-x-1.5 pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex-1 py-1.5 px-2 text-center text-xs font-semibold rounded-lg text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 transition-colors cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Log Out</span>
                  </button>
                  <button
                    onClick={() => { setAuthMode('register'); setIsAuthModalOpen(true); }}
                    className="py-1.5 px-2 text-center text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Register new account"
                  >
                    + New
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 px-1">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-[11px] font-semibold text-slate-500">Guest Mode (Local)</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
                    className="py-1.5 text-center text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => { setAuthMode('register'); setIsAuthModalOpen(true); }}
                    className="py-1.5 text-center text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
                  >
                    Register
                  </button>
                </div>
              </div>
            )}

            {/* OWNER SECTION - ALL THE WAY BOTTOM */}
            <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 px-1">
                Platform Administration
              </div>
              {currentUser?.role === 'OWNER' ? (
                <button
                  onClick={() => setActiveTab('owner_portal')}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'owner_portal'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                  }`}
                >
                  <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="truncate">👑 Customer Data Portal</span>
                </button>
              ) : (
                <button
                  onClick={() => { setAuthMode('owner'); setIsAuthModalOpen(true); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                  title="Platform Owner Portal Sign-In"
                >
                  <div className="flex items-center space-x-2">
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    <span>Owner Portal</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold">Admin</span>
                </button>
              )}
            </div>

          </div>
        </aside>

        {/* MOBILE NAVIGATION DRAWER (Slide-over overlay for Mobile & Tablet < lg) */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            />

            {/* Drawer Body */}
            <div className={`relative w-72 max-w-[85vw] h-full shadow-2xl flex flex-col justify-between p-4 z-10 overflow-y-auto ${
              isDark ? 'bg-slate-950 border-r border-slate-800 text-slate-100' : 'bg-white border-r border-[#D0E1F2] text-slate-900'
            }`}>
              
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: HOLST.navy }}>
                    <PiggyBank className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-sm tracking-tight" style={{ color: isDark ? '#9FC0E3' : HOLST.navy }}>
                      SMART EXPENSE
                    </span>
                    <p className="text-[9px] text-slate-400">FINANCIAL TRACKER</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items in Drawer */}
              <div className="space-y-4 py-3 flex-1 overflow-y-auto">
                
                {/* Dashboard Overview */}
                <button
                  onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                    activeTab === 'dashboard' ? 'bg-[#355982] text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span>Dashboard Overview</span>
                </button>

                {/* Track Group */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">Track</div>
                  <div className="space-y-1">
                    <button
                      onClick={() => { setActiveTab('income'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs ${activeTab === 'income' ? 'bg-blue-100 text-blue-900 font-semibold dark:bg-blue-950 dark:text-blue-200' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Income Streams</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('expenses'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs ${activeTab === 'expenses' ? 'bg-blue-100 text-blue-900 font-semibold dark:bg-blue-950 dark:text-blue-200' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
                      <span>Expenses</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('transactions'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs ${activeTab === 'transactions' ? 'bg-blue-100 text-blue-900 font-semibold dark:bg-blue-950 dark:text-blue-200' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>All Transactions</span>
                    </button>
                  </div>
                </div>

                {/* Control Group */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">Control</div>
                  <div className="space-y-1">
                    <button
                      onClick={() => { setActiveTab('budgets'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs ${activeTab === 'budgets' ? 'bg-blue-100 text-blue-900 font-semibold dark:bg-blue-950 dark:text-blue-200' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Budgets & Limits</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('categories'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs ${activeTab === 'categories' ? 'bg-blue-100 text-blue-900 font-semibold dark:bg-blue-950 dark:text-blue-200' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                      <Tag className="w-3.5 h-3.5 text-blue-500" />
                      <span>Categories & Methods</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('goals'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs ${activeTab === 'goals' ? 'bg-blue-100 text-blue-900 font-semibold dark:bg-blue-950 dark:text-blue-200' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                      <PiggyBank className="w-3.5 h-3.5" />
                      <span>Financial Goals</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('bills'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs ${activeTab === 'bills' ? 'bg-blue-100 text-blue-900 font-semibold dark:bg-blue-950 dark:text-blue-200' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Upcoming Bills</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('subscriptions'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs ${activeTab === 'subscriptions' ? 'bg-blue-100 text-blue-900 font-semibold dark:bg-blue-950 dark:text-blue-200' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Subscriptions</span>
                    </button>
                  </div>
                </div>

                {/* Intelligence & Analytics */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">Intelligence</div>
                  <div className="space-y-1">
                    <button
                      onClick={() => { setActiveTab('analytics'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs ${activeTab === 'analytics' ? 'bg-blue-100 text-blue-900 font-semibold dark:bg-blue-950 dark:text-blue-200' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                      <PieChart className="w-3.5 h-3.5" />
                      <span>Analytics & Trends</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('predictions'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs ${activeTab === 'predictions' ? 'bg-blue-100 text-blue-900 font-semibold dark:bg-blue-950 dark:text-blue-200' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Monthly Projections</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('insights'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs ${activeTab === 'insights' ? 'bg-blue-100 text-blue-900 font-semibold dark:bg-blue-950 dark:text-blue-200' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      <span>Insights & Habits</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('simulator'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs ${activeTab === 'simulator' ? 'bg-blue-100 text-blue-900 font-semibold dark:bg-blue-950 dark:text-blue-200' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>What-If Simulator</span>
                    </button>
                  </div>
                </div>

                {/* Account & Reports */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">Account & Audit</div>
                  <div className="space-y-1">
                    <button
                      onClick={() => { setActiveTab('reports'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs ${activeTab === 'reports' ? 'bg-blue-100 text-blue-900 font-semibold dark:bg-blue-950 dark:text-blue-200' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Financial Statement</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('profile'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs ${activeTab === 'profile' ? 'bg-blue-100 text-blue-900 font-semibold dark:bg-blue-950 dark:text-blue-200' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>User Details</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Drawer Footer User Controls */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                {currentUser ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                        {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                      </div>
                      <div className="truncate flex-1">
                        <p className="text-xs font-semibold truncate">{currentUser.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                      className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center space-x-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-500">Currently in Guest Mode</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => { setAuthMode('login'); setIsGoogleDirectAuth(false); setIsAuthModalOpen(true); setIsMobileMenuOpen(false); }}
                        className="py-2 text-center text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700"
                      >
                        Log In
                      </button>
                      <button
                        onClick={() => { setAuthMode('register'); setIsGoogleDirectAuth(false); setIsAuthModalOpen(true); setIsMobileMenuOpen(false); }}
                        className="py-2 text-center text-xs font-semibold rounded-xl bg-blue-600 text-white shadow-xs"
                      >
                        Register
                      </button>
                    </div>
                  </div>
                )}

                {/* OWNER SECTION - ALL THE WAY BOTTOM IN TABLET & PHONE */}
                <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
                    Platform Administration
                  </div>
                  {currentUser?.role === 'OWNER' ? (
                    <button
                      onClick={() => { setActiveTab('owner_portal'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                        activeTab === 'owner_portal'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      }`}
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>👑 Customer Data Portal</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => { setAuthMode('owner'); setIsAuthModalOpen(true); setIsMobileMenuOpen(false); }}
                      className="w-full flex items-center justify-between py-1.5 px-3 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer"
                    >
                      <div className="flex items-center space-x-1.5">
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                        <span>Owner Portal</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 font-bold">Admin</span>
                    </button>
                  )}
                </div>

              </div>

            </div>
          </div>
        )}

        {/* MOBILE BOTTOM NAVIGATION BAR (Fixed at bottom for < md screens) */}
        <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t flex items-center justify-around py-2 px-1 backdrop-blur-md transition-colors ${
          isDark ? 'bg-slate-950/95 border-slate-800' : 'bg-white/95 border-[#D0E1F2]'
        }`}>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all ${
              activeTab === 'dashboard' ? 'text-blue-600 dark:text-blue-400 font-bold scale-105' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Wallet className="w-4 h-4 mb-0.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all ${
              activeTab === 'transactions' ? 'text-blue-600 dark:text-blue-400 font-bold scale-105' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <CreditCard className="w-4 h-4 mb-0.5" />
            <span>Transactions</span>
          </button>

          <button
            onClick={() => setActiveTab('budgets')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all ${
              activeTab === 'budgets' ? 'text-blue-600 dark:text-blue-400 font-bold scale-105' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Sliders className="w-4 h-4 mb-0.5" />
            <span>Budgets</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all ${
              activeTab === 'analytics' ? 'text-blue-600 dark:text-blue-400 font-bold scale-105' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <PieChart className="w-4 h-4 mb-0.5" />
            <span>Analytics</span>
          </button>

          {currentUser?.role === 'OWNER' ? (
            <button
              onClick={() => setActiveTab('owner_portal')}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all ${
                activeTab === 'owner_portal' ? 'text-amber-600 dark:text-amber-400 font-bold scale-105' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Crown className="w-4 h-4 mb-0.5 text-amber-500" />
              <span>Customers</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all ${
                activeTab === 'profile' ? 'text-blue-600 dark:text-blue-400 font-bold scale-105' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <UserIcon className="w-4 h-4 mb-0.5" />
              <span>Profile</span>
            </button>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800"
          >
            <Menu className="w-4 h-4 mb-0.5" />
            <span>More</span>
          </button>
        </nav>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pb-24 md:pb-6">

          {/* DASHBOARD TAB (With Direct Data Editing Capabilities!) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight" style={{ color: isDark ? '#F3F8FD' : HOLST.navy }}>
                    Financial Overview & Dashboard
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {currentUser ? `Active ledger for ${currentUser.name}.` : 'Viewing local financial ledger (Guest). Sign in to personalize profile.'}
                  </p>
                </div>
                
                {/* Dashboard Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleOpenAdjustBalance}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80 shadow-xs transition-all cursor-pointer"
                    title="Directly adjust starting reserve or net balance"
                  >
                    <Pencil className="w-3.5 h-3.5 text-blue-500" />
                    <span>Adjust Balance</span>
                  </button>
                  <button
                    onClick={() => { setModalType('INCOME'); setFormCategory('Salary'); setFormAmount(''); setFormDesc(''); }}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Income</span>
                  </button>
                  <button
                    onClick={() => { setModalType('EXPENSE'); setFormCategory('Food'); setFormAmount(''); setFormDesc(''); }}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Expense</span>
                  </button>
                </div>
              </div>

              {/* 4 Core Financial KPI Metric Cards (INR Currency) with Direct Edit Triggers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Total Inflow Card */}
                <div className={`p-5 rounded-2xl border ${cardBgClass} shadow-xs relative group`}>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
                    <span>Total Inflow</span>
                    <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-slate-400">Confirmed incomes</span>
                    <button
                      onClick={() => { setModalType('INCOME'); setFormCategory('Salary'); setFormAmount(''); setFormDesc(''); }}
                      className="text-emerald-600 hover:underline font-semibold flex items-center space-x-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Record Inflow</span>
                    </button>
                  </div>
                </div>

                {/* Total Outflow Card */}
                <div className={`p-5 rounded-2xl border ${cardBgClass} shadow-xs relative group`}>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
                    <span>Total Outflow</span>
                    <ArrowUpRight className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-rose-600 dark:text-rose-400">
                    ₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-slate-400">Total spent</span>
                    <button
                      onClick={() => { setModalType('EXPENSE'); setFormCategory('Food'); setFormAmount(''); setFormDesc(''); }}
                      className="text-rose-600 hover:underline font-semibold flex items-center space-x-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Record Outflow</span>
                    </button>
                  </div>
                </div>

                {/* Net Balance Card with Direct Calibration */}
                <div className={`p-5 rounded-2xl border ${cardBgClass} shadow-xs relative group`}>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
                    <span>Net Balance</span>
                    <Wallet className="w-4 h-4" style={{ color: HOLST.steel }} />
                  </div>
                  <div className="mt-2 text-2xl font-extrabold" style={{ color: isDark ? '#9FC0E3' : HOLST.navy }}>
                    ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-slate-400">Available reserves</span>
                    <button
                      onClick={handleOpenAdjustBalance}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center space-x-0.5 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Adjust</span>
                    </button>
                  </div>
                </div>

                {/* Savings Rate Card */}
                <div className={`p-5 rounded-2xl border ${cardBgClass} shadow-xs relative group`}>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
                    <span>Savings Rate</span>
                    <PiggyBank className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                    {savingsRate.toFixed(1)}%
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-slate-400">{savingsRate >= 20 ? 'Optimal (≥ 20%)' : 'Target: 20%'}</span>
                    <button
                      onClick={() => setActiveTab('goals')}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                    >
                      Goals →
                    </button>
                  </div>
                </div>

              </div>

              {/* QUICK DASHBOARD DATA RECORDING PRESETS */}
              <div className={`p-4 rounded-2xl border ${cardBgClass} shadow-xs`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Quick 1-Click Dashboard Entries</span>
                  </div>
                  <span className="text-xs text-slate-400">Instantly record common transactions to update dashboard metrics</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => handleQuickAdd('EXPENSE', 500, 'Food & Dining', 'Coffee & Bistro Snacks')}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Coffee className="w-3.5 h-3.5 text-amber-600" />
                    <span>+ ₹500 Dining / Coffee</span>
                  </button>
                  <button
                    onClick={() => handleQuickAdd('EXPENSE', 2500, 'Groceries', 'Supermarket Provisions')}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-rose-500" />
                    <span>+ ₹2,500 Groceries</span>
                  </button>
                  <button
                    onClick={() => handleQuickAdd('EXPENSE', 1200, 'Transportation & Fuel', 'Fuel & Metro Recharge')}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Car className="w-3.5 h-3.5 text-blue-500" />
                    <span>+ ₹1,200 Fuel / Travel</span>
                  </button>
                  <button
                    onClick={() => handleQuickAdd('EXPENSE', 3200, 'Shopping & Retail', 'Clothing & Accessories')}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Tag className="w-3.5 h-3.5 text-purple-500" />
                    <span>+ ₹3,200 Shopping</span>
                  </button>
                  <button
                    onClick={() => handleQuickAdd('INCOME', 10000, 'Freelancing', 'Client Project Milestone')}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>+ ₹10,000 Freelance</span>
                  </button>
                  <button
                    onClick={() => handleQuickAdd('INCOME', 65000, 'Salary', 'Monthly Direct Deposit')}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>+ ₹65,000 Salary</span>
                  </button>
                </div>
              </div>

              {/* Mid Section: Easy-to-Understand Monthly Spending Projection & Budget Utilization */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Monthly Spending Projection (Simple, Clean, Actionable) */}
                <div className={`p-6 rounded-2xl border ${cardBgClass} shadow-xs space-y-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      <h2 className="font-bold text-base">Monthly Spending Projection</h2>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      monthlyProjection.isWithinBudget
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {monthlyProjection.isWithinBudget ? '✓ On Track' : '⚡ Attention Needed'}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-slate-800/50 border border-blue-100 dark:border-slate-700 space-y-3">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Estimated Total Spend by Month-End</span>
                      <div className="text-3xl font-extrabold mt-1" style={{ color: HOLST.navy }}>
                        ₹{monthlyProjection.projectedEndMonth.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-100 dark:border-slate-700/60 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-400">Spent So Far</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          ₹{monthlyProjection.spentSoFar.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400">Daily Average Pace</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          ₹{monthlyProjection.dailyAverage.toLocaleString()} / day
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <p>
                      • Remaining days in month: <strong className="text-slate-800 dark:text-slate-200">{monthlyProjection.daysRemaining} days</strong>
                    </p>
                    <p>
                      • Safe daily limit to stay within budget: <strong className="text-emerald-600 dark:text-emerald-400">₹{monthlyProjection.safeDailySpend.toLocaleString()} / day</strong>
                    </p>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => setActiveTab('predictions')}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center space-x-1"
                    >
                      <span>View full monthly projections & budget guide</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>

                {/* Monthly Budget Utilization (WITH DIRECT EDIT CAP BUTTONS) */}
                <div className={`p-6 rounded-2xl border ${cardBgClass} shadow-xs`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Sliders className="w-5 h-5 text-blue-600" />
                      <h2 className="font-bold text-base">Budget Control Status</h2>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setModalType('BUDGET')}
                        className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded-lg cursor-pointer transition-colors shadow-xs"
                      >
                        + Add Budget
                      </button>
                      <button
                        onClick={() => setActiveTab('budgets')}
                        className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Manage
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    {budgets.length === 0 ? (
                      <div className="py-6 text-center text-slate-400">
                        <Sliders className="w-6 h-6 text-blue-500 mx-auto mb-2 opacity-80" />
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No active category budgets</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Click "+ Add Budget" above to set category spending caps.</p>
                      </div>
                    ) : (
                      budgets.slice(0, 4).map(b => {
                        const spent = categorySpending[b.category] || 0;
                        const pct = Math.round((spent / b.amount) * 100);
                        const isOver = pct >= 100;
                        const isWarn = pct >= 80 && !isOver;

                        return (
                          <div key={b.id} className="space-y-1.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <div className="flex justify-between items-center text-xs font-medium">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold">{b.category}</span>
                                <button
                                  onClick={() => handleOpenEditBudget(b)}
                                  className="text-slate-400 hover:text-blue-600 p-0.5 cursor-pointer"
                                  title="Edit Budget Limit"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              </div>
                              <span className={isOver ? 'text-rose-600 font-bold' : isWarn ? 'text-amber-600' : 'text-slate-500'}>
                                ₹{spent.toLocaleString()} / ₹{b.amount.toLocaleString()} ({pct}%)
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isOver ? 'bg-rose-500' : isWarn ? 'bg-amber-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

              {/* Bottom Section: Recent Activity (WITH EDIT & DELETE BUTTONS!) & Anomalies */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Recent Transactions Table WITH FULL EDIT & DELETE BUTTONS */}
                <div className={`lg:col-span-2 p-6 rounded-2xl border ${cardBgClass} shadow-xs`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-bold text-base">Recent Transactions</h2>
                      <p className="text-xs text-slate-400">Click the pencil icon on any entry to edit its details</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('transactions')}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      View All ({transactions.length})
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase">
                          <th className="pb-2">Date</th>
                          <th className="pb-2">Category</th>
                          <th className="pb-2">Description</th>
                          <th className="pb-2">Method</th>
                          <th className="pb-2 text-right">Amount</th>
                          <th className="pb-2 text-center">Edit / Delete</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {transactions.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400">
                              <p className="font-semibold text-xs text-slate-600 dark:text-slate-300">No transactions recorded yet</p>
                              <p className="text-[11px] text-slate-400 mt-1">Use "Add Income" or "Add Expense" above to start logging your real spending.</p>
                            </td>
                          </tr>
                        ) : (
                          transactions.slice(0, 6).map(t => (
                            <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 group">
                              <td className="py-2.5 text-slate-500 font-mono">{t.date}</td>
                              <td className="py-2.5 font-semibold">{t.category}</td>
                              <td className="py-2.5 text-slate-600 dark:text-slate-300 truncate max-w-[170px]">{t.description}</td>
                              <td className="py-2.5 text-slate-500">{t.paymentMethod}</td>
                              <td className={`py-2.5 text-right font-bold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {t.type === 'INCOME' ? '+' : '-'}₹{t.amount.toLocaleString()}
                              </td>
                              <td className="py-2.5 text-center">
                                <div className="flex items-center justify-center space-x-1.5">
                                  <button
                                    onClick={() => handleOpenEditTransaction(t)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="Edit Transaction"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem('tx', t.id)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="Delete Transaction"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Detected Anomalies */}
                <div className={`p-6 rounded-2xl border ${cardBgClass} shadow-xs`}>
                  <div className="flex items-center space-x-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <h2 className="font-bold text-base">Anomaly Alerts</h2>
                  </div>

                  {anomalies.length > 0 ? (
                    <div className="space-y-3">
                      {anomalies.slice(0, 3).map((a, i) => (
                        <div key={i} className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
                          <div className="flex justify-between text-xs font-semibold text-amber-900 dark:text-amber-200">
                            <span>{a.txn.category}: ₹{a.txn.amount.toLocaleString()}</span>
                            <span>Z={a.zScore}</span>
                          </div>
                          <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1">
                            {a.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center">
                      All recent transactions adhere within statistical baseline limits.
                    </p>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* INCOME STREAMS TAB */}
          {activeTab === 'income' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Income Streams</h1>
                  <p className="text-xs text-slate-500">Manage salary, freelancing, dividends, and other cash inflows.</p>
                </div>
                <button
                  onClick={() => { setModalType('INCOME'); setFormCategory('Salary'); setFormAmount(''); setFormDesc(''); }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer shadow-sm"
                >
                  Record New Income
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-5 rounded-2xl border ${cardBgClass} shadow-xs`}>
                  <span className="text-xs text-slate-400 font-semibold uppercase">Total Recorded Inflow</span>
                  <div className="text-2xl font-extrabold text-emerald-600 mt-1">₹{totalIncome.toLocaleString()}</div>
                </div>
              </div>

              <div className={`rounded-2xl border ${cardBgClass} overflow-x-auto shadow-xs`}>
                <table className="w-full text-left text-xs min-w-[560px]">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Method</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {transactions.filter(t => t.type === 'INCOME').map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30">
                        <td className="p-3 font-mono text-slate-500">{t.date}</td>
                        <td className="p-3 font-semibold">{t.category}</td>
                        <td className="p-3">{t.description}</td>
                        <td className="p-3 text-slate-500">{t.paymentMethod}</td>
                        <td className="p-3 text-right font-bold text-emerald-600">+₹{t.amount.toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => handleOpenEditTransaction(t)}
                              className="p-1 rounded text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                              title="Edit Record"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem('tx', t.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* EXPENSES TAB */}
          {activeTab === 'expenses' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Expense Records</h1>
                  <p className="text-xs text-slate-500">Detailed list of living expenses, shopping, groceries, and travel.</p>
                </div>
                <button
                  onClick={() => { setModalType('EXPENSE'); setFormCategory('Food'); setFormAmount(''); setFormDesc(''); }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer shadow-sm"
                >
                  Record New Expense
                </button>
              </div>

              <div className={`rounded-2xl border ${cardBgClass} overflow-x-auto shadow-xs`}>
                <table className="w-full text-left text-xs min-w-[560px]">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Method</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {transactions.filter(t => t.type === 'EXPENSE').map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30">
                        <td className="p-3 font-mono text-slate-500">{t.date}</td>
                        <td className="p-3 font-semibold">{t.category}</td>
                        <td className="p-3">{t.description}</td>
                        <td className="p-3 text-slate-500">{t.paymentMethod}</td>
                        <td className="p-3 text-right font-bold text-rose-600">-₹{t.amount.toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => handleOpenEditTransaction(t)}
                              className="p-1 rounded text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                              title="Edit Record"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem('tx', t.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ALL TRANSACTIONS TAB */}
          {activeTab === 'transactions' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Financial Ledger & Transactions</h1>
                  <p className="text-xs text-slate-500">Filter, search, review, and export all recorded cash movements.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleExportCsv}
                    className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => { setModalType('EXPENSE'); setFormCategory(categoriesList.expense[0] || 'Food & Dining'); setFormPaymentMethod(paymentMethodsList[0] || 'Google Pay (GPay)'); setFormAmount(''); setFormDesc(''); }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer shadow-sm"
                  >
                    + Add Transaction
                  </button>
                </div>
              </div>

              {/* Dynamic Filters for All Categories & Payment Methods */}
              <div className={`p-4 rounded-2xl border ${cardBgClass} flex flex-wrap items-center gap-3 shadow-xs`}>
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by description, amount, or category..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs"
                  />
                </div>
                
                {/* Category Filter Dropdown (All Expense & Income Categories) */}
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs font-medium"
                >
                  <option value="ALL">All Categories ({categoriesList.expense.length + categoriesList.income.length})</option>
                  <optgroup label="Expense Categories">
                    {categoriesList.expense.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Income Categories">
                    {categoriesList.income.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </optgroup>
                </select>

                {/* Payment Method Filter Dropdown (All Payment Methods) */}
                <select
                  value={paymentMethodFilter}
                  onChange={e => setPaymentMethodFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs font-medium"
                >
                  <option value="ALL">All Payment Methods ({paymentMethodsList.length})</option>
                  {paymentMethodsList.map(pm => (
                    <option key={pm} value={pm}>{pm}</option>
                  ))}
                </select>
              </div>

              {/* Table */}
              <div className={`rounded-2xl border ${cardBgClass} overflow-x-auto shadow-xs`}>
                <table className="w-full text-left text-xs min-w-[620px]">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Method</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {transactions
                      .filter(t => categoryFilter === 'ALL' || t.category === categoryFilter)
                      .filter(t => paymentMethodFilter === 'ALL' || t.paymentMethod === paymentMethodFilter)
                      .filter(t => !searchTerm || t.description.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase()) || t.amount.toString().includes(searchTerm))
                      .length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">No transactions found</p>
                            <p className="text-xs text-slate-400 mt-1">Add your genuine income and expense records using the buttons above.</p>
                          </td>
                        </tr>
                      ) : (
                        transactions
                          .filter(t => categoryFilter === 'ALL' || t.category === categoryFilter)
                          .filter(t => paymentMethodFilter === 'ALL' || t.paymentMethod === paymentMethodFilter)
                          .filter(t => !searchTerm || t.description.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase()) || t.amount.toString().includes(searchTerm))
                          .map(t => (
                            <tr key={t.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30">
                              <td className="p-3 font-mono text-slate-500">{t.date}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.type === 'INCOME' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                  {t.type}
                                </span>
                              </td>
                              <td className="p-3 font-semibold">{t.category}</td>
                              <td className="p-3">{t.description}</td>
                              <td className="p-3 text-slate-500">{t.paymentMethod}</td>
                              <td className={`p-3 text-right font-bold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {t.type === 'INCOME' ? '+' : '-'}₹{t.amount.toLocaleString()}
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center space-x-1.5">
                                  <button
                                    onClick={() => handleOpenEditTransaction(t)}
                                    className="p-1 rounded text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                                    title="Edit Record"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem('tx', t.id)}
                                    className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                    title="Delete Record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                      )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BUDGETS TAB */}
          {activeTab === 'budgets' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Category Budgets & Alerts</h1>
                  <p className="text-xs text-slate-500">Set spending boundaries with automated alerts at 70%, 80%, and 100%.</p>
                </div>
                <button
                  onClick={() => setModalType('BUDGET')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer shadow-sm"
                >
                  Create Budget Limit
                </button>
              </div>

              {budgets.length === 0 ? (
                <div className={`p-10 rounded-2xl border ${cardBgClass} text-center space-y-3`}>
                  <Sliders className="w-8 h-8 text-blue-500 mx-auto opacity-80" />
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">No Budget Limits Configured Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Set spending limits for your monthly categories to monitor pace and prevent overspending.
                  </p>
                  <button
                    onClick={() => setModalType('BUDGET')}
                    className="mt-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer shadow-xs"
                  >
                    + Create Your First Budget
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {budgets.map(b => {
                    const spent = categorySpending[b.category] || 0;
                    const remaining = b.amount - spent;
                    const pct = Math.round((spent / b.amount) * 100);
                    const isExceeded = spent > b.amount;

                    return (
                      <div key={b.id} className={`p-5 rounded-2xl border ${cardBgClass} shadow-xs space-y-4`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-base">{b.category}</h3>
                            <span className="text-xs text-slate-400">Monthly Allocation</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isExceeded ? 'bg-rose-100 text-rose-800' : pct >= 80 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isExceeded ? 'Exceeded' : pct >= 80 ? 'High Usage' : 'Normal'}
                            </span>
                            <button
                              onClick={() => handleOpenEditBudget(b)}
                              className="text-slate-400 hover:text-blue-600 p-1 cursor-pointer"
                              title="Edit Budget Cap"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem('b', b.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              title="Delete Budget"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Spent: ₹{spent.toLocaleString()}</span>
                            <span className="font-semibold">Cap: ₹{b.amount.toLocaleString()}</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isExceeded ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500'}`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500">
                          <span>Remaining:</span>
                          <span className={`font-bold ${remaining < 0 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                            ₹{remaining.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* FINANCIAL GOALS TAB */}
          {activeTab === 'goals' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Financial Goals & Milestones</h1>
                  <p className="text-xs text-slate-500">Track target deadlines and suggested monthly savings rates.</p>
                </div>
                <button
                  onClick={() => setModalType('GOAL')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer shadow-sm"
                >
                  Set New Goal
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {goals.map(g => {
                  const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
                  const rem = g.targetAmount - g.currentAmount;

                  return (
                    <div key={g.id} className={`p-6 rounded-2xl border ${cardBgClass} shadow-xs space-y-4`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <PiggyBank className="w-5 h-5 text-indigo-500" />
                          <h3 className="font-bold text-base">{g.name}</h3>
                        </div>
                        <button onClick={() => handleDeleteItem('g', g.id)} className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500">{g.description}</p>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>₹{g.currentAmount.toLocaleString()}</span>
                          <span>₹{g.targetAmount.toLocaleString()} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[11px] text-slate-400">Quick Contribution:</span>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleUpdateGoalProgress(g.id, 5000)}
                            className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded-md hover:bg-indigo-100 cursor-pointer"
                          >
                            +₹5,000
                          </button>
                          <button
                            onClick={() => handleUpdateGoalProgress(g.id, 10000)}
                            className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded-md hover:bg-indigo-100 cursor-pointer"
                          >
                            +₹10,000
                          </button>
                        </div>
                      </div>

                      <div className="text-xs space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500">
                        <div className="flex justify-between">
                          <span>Remaining Amount:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">₹{rem.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Target Deadline:</span>
                          <span className="font-mono">{g.deadline}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* BILLS & SUBSCRIPTIONS TAB */}
          {activeTab === 'bills' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Recurring Obligations & Bills</h1>
                  <p className="text-xs text-slate-500">Ensure essential commitments are met before due dates.</p>
                </div>
                <button
                  onClick={() => setModalType('BILL')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer shadow-sm"
                >
                  Schedule Bill
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-6 rounded-2xl border ${cardBgClass} shadow-xs space-y-4`}>
                  <h2 className="font-bold text-base">Monthly Utility Bills</h2>
                  <div className="space-y-3">
                    {bills.map(b => (
                      <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <div>
                          <p className="text-xs font-semibold">{b.name}</p>
                          <p className="text-[11px] text-slate-400">Due: {b.dueDate}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-xs font-bold">₹{b.amount.toLocaleString()}</span>
                          <button
                            onClick={() => handleToggleBillStatus(b.id)}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                              b.status === 'PAID' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                          >
                            {b.status}
                          </button>
                          <button onClick={() => handleDeleteItem('bl', b.id)} className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`p-6 rounded-2xl border ${cardBgClass} shadow-xs space-y-4`}>
                  <div className="flex justify-between items-center">
                    <h2 className="font-bold text-base">Active Subscriptions</h2>
                    <button
                      onClick={() => setModalType('SUB')}
                      className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      + Add Subscription
                    </button>
                  </div>
                  <div className="space-y-3">
                    {subscriptions.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <div>
                          <p className="text-xs font-semibold">{s.name}</p>
                          <p className="text-[11px] text-slate-400">Next renewal: {s.nextPaymentDate}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <span className="text-xs font-bold block">₹{s.amount.toLocaleString()}</span>
                            <span className="text-[10px] text-slate-400 uppercase">{s.frequency}</span>
                          </div>
                          <button onClick={() => handleDeleteItem('s', s.id)} className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBSCRIPTIONS TAB */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Subscription Tracker</h1>
                  <p className="text-xs text-slate-500">Monitor active SaaS, entertainment, and digital subscriptions.</p>
                </div>
                <button
                  onClick={() => setModalType('SUB')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer shadow-sm"
                >
                  Add Subscription
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {subscriptions.map(s => (
                  <div key={s.id} className={`p-5 rounded-2xl border ${cardBgClass} shadow-xs space-y-3`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-base">{s.name}</h3>
                        <span className="text-xs text-slate-400">{s.category}</span>
                      </div>
                      <button onClick={() => handleDeleteItem('s', s.id)} className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-2xl font-extrabold text-blue-600">
                      ₹{s.amount.toLocaleString()}
                      <span className="text-xs text-slate-400 font-normal"> / {s.frequency.toLowerCase()}</span>
                    </div>
                    <p className="text-xs text-slate-500">Next renewal date: {s.nextPaymentDate}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CATEGORIES & PAYMENT METHODS MANAGEMENT TAB */}
          {activeTab === 'categories' && (
            <CategoriesView
              transactions={transactions}
              budgets={budgets}
              categoriesList={categoriesList}
              paymentMethodsList={paymentMethodsList}
              onAddCategory={handleAddCategory}
              onAddPaymentMethod={handleAddPaymentMethod}
              onOpenSetBudget={(category) => {
                setFormCategory(category);
                setModalType('BUDGET');
              }}
              onFilterTransactions={(category) => {
                setCategoryFilter(category);
                setActiveTab('transactions');
              }}
              isDark={isDark}
            />
          )}

          {/* ANALYTICS & TRENDS TAB */}
          {activeTab === 'analytics' && (
            <AnalyticsView transactions={transactions} isDark={isDark} />
          )}

          {/* SMART MONTHLY PROJECTIONS TAB (Velocity model replaced with easy-to-understand metrics) */}
          {activeTab === 'predictions' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Smart Monthly Projections & Budget Forecast</h1>
                  <p className="text-xs text-slate-500">Practical, transparent spending pace, remaining budget, and cash flow projections.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                    monthlyProjection.isWithinBudget
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                  }`}>
                    {monthlyProjection.isWithinBudget ? '✓ Spending Pace On Track' : '⚡ Attention: High Spending Pace'}
                  </span>
                </div>
              </div>

              {/* 3 Main Actionable Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Estimated Total Spend by Month-End */}
                <div className={`p-6 rounded-2xl border ${cardBgClass} shadow-xs space-y-4`}>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-base">Estimated Total Spend</h3>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-slate-800/50 border border-blue-100 dark:border-slate-700">
                    <span className="text-xs text-slate-400">Projected by End of Month</span>
                    <div className="text-3xl font-extrabold mt-1" style={{ color: HOLST.navy }}>
                      ₹{monthlyProjection.projectedEndMonth.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <ul className="text-xs text-slate-500 space-y-1.5">
                    <li>• Spent to date: <strong>₹{monthlyProjection.spentSoFar.toLocaleString()}</strong></li>
                    <li>• Daily average pace: <strong>₹{monthlyProjection.dailyAverage.toLocaleString()} / day</strong></li>
                    <li>• Days left in month: <strong>{monthlyProjection.daysRemaining} days</strong></li>
                  </ul>
                </div>

                {/* 2. Projected Net Cash Flow */}
                <div className={`p-6 rounded-2xl border ${cardBgClass} shadow-xs space-y-4`}>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-bold text-base">Projected Net Cash Flow</h3>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-slate-800/50 border border-emerald-100 dark:border-slate-700">
                    <span className="text-xs text-slate-400">Estimated Surplus / Savings</span>
                    <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                      ₹{Math.max(0, totalIncome - monthlyProjection.projectedEndMonth).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <ul className="text-xs text-slate-500 space-y-1.5">
                    <li>• Total recorded inflow: <strong>₹{totalIncome.toLocaleString()}</strong></li>
                    <li>• Estimated spend by month-end: <strong>₹{monthlyProjection.projectedEndMonth.toLocaleString()}</strong></li>
                    <li>• Liquidity status: <strong>{totalIncome >= monthlyProjection.projectedEndMonth ? 'Positive Savings' : 'Deficit Alert'}</strong></li>
                  </ul>
                </div>

                {/* 3. Safe Daily Spending Guide */}
                <div className={`p-6 rounded-2xl border ${cardBgClass} shadow-xs space-y-4`}>
                  <div className="flex items-center space-x-2">
                    <Sliders className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-bold text-base">Safe Daily Spend Guide</h3>
                  </div>
                  <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-slate-800/50 border border-indigo-100 dark:border-slate-700">
                    <span className="text-xs text-slate-400">Recommended Daily Limit</span>
                    <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                      ₹{monthlyProjection.safeDailySpend.toLocaleString('en-IN')}
                      <span className="text-xs font-normal text-slate-400"> / day</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    {monthlyProjection.totalBudgetCap > 0
                      ? `Staying under ₹${monthlyProjection.safeDailySpend.toLocaleString()}/day for the remaining ${monthlyProjection.daysRemaining} days keeps you strictly under your monthly budget cap of ₹${monthlyProjection.totalBudgetCap.toLocaleString()}.`
                      : 'Set category budget limits in the Budgets tab to generate custom personalized daily thresholds.'}
                  </p>
                </div>

              </div>

              {/* Top Categories Spending Pace Table */}
              <div className={`p-6 rounded-2xl border ${cardBgClass} shadow-xs space-y-4`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base">Top Outflow Categories</h3>
                  <button
                    onClick={() => setActiveTab('categories')}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Manage All Categories & Budgets →
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {monthlyProjection.topCategories.length > 0 ? (
                    monthlyProjection.topCategories.map((cat, idx) => (
                      <div key={cat.category} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <span className="text-xs text-slate-400 font-semibold">#{idx + 1} Outflow</span>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mt-0.5">{cat.category}</h4>
                        <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-2">
                          ₹{cat.amount.toLocaleString()}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {monthlyProjection.spentSoFar > 0 ? `${((cat.amount / monthlyProjection.spentSoFar) * 100).toFixed(1)}% of total outflow` : ''}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 col-span-3 text-center py-4">No expense records found.</p>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* INSIGHTS & HABITS TAB */}
          {activeTab === 'insights' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Smart Insights & Spending Habits</h1>
                <p className="text-xs text-slate-500">Autonomous analytical observations derived from your records.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className={`p-6 rounded-2xl border ${cardBgClass} shadow-xs space-y-4`}>
                  <h2 className="font-bold text-base">Key Behavioral Observations</h2>
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-slate-800/50 border border-blue-100 dark:border-slate-700">
                      <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200">Weekend Expenditure Cadence</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        42% of your non-essential spending occurs on Friday evening through Sunday.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-slate-800/50 border border-emerald-100 dark:border-slate-700">
                      <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Positive Savings Momentum</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Your net monthly savings rate of {savingsRate.toFixed(1)}% satisfies the benchmark 20% rule.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`p-6 rounded-2xl border ${cardBgClass} shadow-xs space-y-4`}>
                  <h2 className="font-bold text-base">Recommended Financial Actions</h2>
                  <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-3">
                    <li className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Review digital subscriptions: 4 active services cost ₹3,167 per month.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Allocate bonus freelance earnings directly toward the Emergency Safety Cushion goal.</span>
                    </li>
                  </ul>
                </div>

              </div>
            </div>
          )}

          {/* SIMULATOR TAB */}
          {activeTab === 'simulator' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">What-If Financial Scenario Simulator</h1>
                <p className="text-xs text-slate-500">Test how income raises or category expense cuts impact your year-end balance.</p>
              </div>

              <div className={`p-6 rounded-2xl border ${cardBgClass} shadow-xs space-y-6`}>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Monthly Income Adjustment</span>
                      <span>{simIncomeChange >= 0 ? `+₹${simIncomeChange.toLocaleString()}` : `-₹${Math.abs(simIncomeChange).toLocaleString()}`}</span>
                    </div>
                    <input
                      type="range"
                      min="-20000"
                      max="50000"
                      step="1000"
                      value={simIncomeChange}
                      onChange={e => setSimIncomeChange(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Monthly Expense Reduction</span>
                      <span>₹{simExpenseCut.toLocaleString()} saved / month</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20000"
                      step="500"
                      value={simExpenseCut}
                      onChange={e => setSimExpenseCut(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-semibold uppercase text-slate-400">12-Month Net Wealth Impact</h3>
                  <div className="text-3xl font-extrabold mt-1 text-emerald-600">
                    +₹{((simIncomeChange + simExpenseCut) * 12).toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Cumulative additional savings achieved across one year under this simulated strategy.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* REPORTS TAB */}
          {activeTab === 'reports' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Formal Financial Statement</h1>
                  <p className="text-xs text-slate-500">Comprehensive ledger audit report ready for export and archival.</p>
                </div>
                <button
                  onClick={handleExportCsv}
                  className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Statement (CSV)</span>
                </button>
              </div>

              <div className={`p-6 rounded-2xl border ${cardBgClass} shadow-xs space-y-4`}>
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex justify-between">
                  <div>
                    <h3 className="font-bold text-base">Account Holder: {currentUser ? currentUser.name : 'Guest User'}</h3>
                    <p className="text-xs text-slate-400">Email: {currentUser ? currentUser.email : 'guest@local'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Statement Date</span>
                    <p className="font-mono text-xs font-semibold">{new Date().toISOString().split('T')[0]}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center py-2">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Revenue Inflows</span>
                    <p className="text-base font-bold text-emerald-600">₹{totalIncome.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Outflows</span>
                    <p className="text-base font-bold text-rose-600">₹{totalExpenses.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Net Retained Reserve</span>
                    <p className="text-base font-bold text-blue-600">₹{balance.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* USER PROFILE TAB */}
          {activeTab === 'profile' && (
            <ProfileView
              currentUser={currentUser}
              onUpdateUser={updated => {
                setCurrentUser(updated);
                showToast('User profile updated successfully!');
              }}
              onLogout={handleLogout}
              onOpenLogin={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
              onOpenRegister={() => { setAuthMode('register'); setIsAuthModalOpen(true); }}
              isDark={isDark}
              onToggleTheme={() => setIsDark(!isDark)}
              stats={{
                totalTransactions: transactions.length,
                activeBudgets: budgets.length,
                activeGoals: goals.length,
                balance
              }}
            />
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">Notification Center</h1>
                <button
                  onClick={() => {
                    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                    showToast('All notifications marked as read.');
                  }}
                  className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Mark all as read
                </button>
              </div>
              <div className="space-y-3">
                {notifications.map(n => (
                  <div key={n.id} className={`p-4 rounded-2xl border ${cardBgClass} shadow-xs flex items-start space-x-3`}>
                    <Bell className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm">{n.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{n.message}</p>
                      <span className="text-[10px] text-slate-400 font-mono mt-2 block">{n.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PLATFORM OWNER / CUSTOMER DATA PORTAL */}
          {activeTab === 'owner_portal' && (
            currentUser?.role === 'OWNER' ? (
              <OwnerPortalView
                customers={customers}
                onAddCustomer={handleAddCustomer}
                onDeleteCustomer={(customerId) => {
                  setCustomers(prev => prev.filter(c => c.id !== customerId));
                  deleteCustomerFromDb(customerId);
                  showToast('Customer deleted from directory and database.');
                }}
                onRefreshFromDb={async () => {
                  const res = await fetchCustomersFromDb();
                  if (res.data && res.data.length > 0) {
                    setCustomers(res.data);
                  }
                }}
                isDark={isDark}
              />
            ) : (
              <div className="max-w-md mx-auto py-12 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shadow-md">
                  <Crown className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-xl font-bold">Owner Access Clearance Required</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The Customer Data Portal is strictly reserved for the platform owner to inspect customer accounts, financial ledgers, and transaction volume.
                </p>
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-left text-xs space-y-1">
                  <div className="font-bold text-amber-900 dark:text-amber-200">Owner Credentials:</div>
                  <div className="text-amber-800 dark:text-amber-300">Login Name: <code className="font-mono font-bold">owner@smartexpense.com</code></div>
                  <div className="text-amber-800 dark:text-amber-300">Password: <code className="font-mono font-bold">Owner@2026</code></div>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => { setAuthMode('owner'); setIsAuthModalOpen(true); }}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-all shadow-md cursor-pointer"
                  >
                    👑 Sign In as Platform Owner
                  </button>
                </div>
              </div>
            )
          )}

        </main>
      </div>

      {/* Auth Modal (Login / Register) with Both Modes */}
      {/* Auth Modal (Login / Register) with Google Direct Support */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => { setIsAuthModalOpen(false); setIsGoogleDirectAuth(false); }}
        initialMode={authMode}
        initialGoogleDirect={isGoogleDirectAuth}
        isDark={isDark}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Creation & Editing Modal for Transactions, Budgets, Adjustments, Goals, Bills, Subscriptions */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className={`w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl border shadow-xl ${cardBgClass}`}>
            
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold">
                {modalType === 'INCOME' && 'Record Income Stream'}
                {modalType === 'EXPENSE' && 'Record Expense Entry'}
                {modalType === 'BUDGET' && 'Set Category Budget Cap'}
                {modalType === 'GOAL' && 'Create Financial Milestone'}
                {modalType === 'BILL' && 'Schedule Utility Bill'}
                {modalType === 'SUB' && 'Add Recurring Subscription'}
                {modalType === 'EDIT_TX' && 'Edit Transaction Record'}
                {modalType === 'EDIT_BUDGET' && 'Edit Budget Limit'}
                {modalType === 'ADJUST_BALANCE' && 'Adjust Dashboard Net Balance'}
              </h3>
              <button
                onClick={() => { setModalType(null); setEditingTransaction(null); setEditingBudget(null); }}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ADJUST BALANCE DIRECT FORM */}
            {modalType === 'ADJUST_BALANCE' ? (
              <form onSubmit={handleSaveItem} className="space-y-4">
                <p className="text-xs text-slate-500">
                  Current Net Balance: <span className="font-bold text-slate-800 dark:text-slate-200">₹{balance.toLocaleString()}</span>. Enter your target balance to record an instant calibration entry.
                </p>
                <div>
                  <label className="block text-xs font-semibold mb-1">New Target Balance (₹)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="e.g. 50000"
                    value={targetBalanceInput}
                    onChange={e => setTargetBalanceInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer shadow-sm"
                  >
                    Update Balance
                  </button>
                </div>
              </form>
            ) : (
              /* STANDARD CREATE / EDIT FORM */
              <form onSubmit={handleSaveItem} className="space-y-3.5">
                
                {/* Transaction Type Selector when Editing Transaction */}
                {modalType === 'EDIT_TX' && (
                  <div>
                    <label className="block text-xs font-semibold mb-1">Transaction Type</label>
                    <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setFormType('EXPENSE')}
                        className={`py-1.5 text-xs font-bold rounded-lg transition-all ${formType === 'EXPENSE' ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-xs' : 'text-slate-500'}`}
                      >
                        Expense (-)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormType('INCOME')}
                        className={`py-1.5 text-xs font-bold rounded-lg transition-all ${formType === 'INCOME' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-xs' : 'text-slate-500'}`}
                      >
                        Income (+)
                      </button>
                    </div>
                  </div>
                )}

                {/* Name / Title for Goals, Bills, Subscriptions */}
                {(modalType === 'GOAL' || modalType === 'BILL' || modalType === 'SUB') && (
                  <div>
                    <label className="block text-xs font-semibold mb-1">Name / Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Electricity Bill, Gym, MacBook Goal"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Amount Field */}
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    {modalType === 'BUDGET' || modalType === 'EDIT_BUDGET' ? 'Monthly Budget Limit (₹)' : 'Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="e.g. 5000"
                    value={formAmount}
                    onChange={e => setFormAmount(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Dynamic Category Dropdown */}
                {(modalType === 'INCOME' || modalType === 'EXPENSE' || modalType === 'BUDGET' || modalType === 'EDIT_BUDGET' || modalType === 'SUB' || modalType === 'EDIT_TX') && (
                  <div>
                    <label className="block text-xs font-semibold mb-1">Category</label>
                    <select
                      value={formCategory}
                      onChange={e => setFormCategory(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {(modalType === 'INCOME' || (modalType === 'EDIT_TX' && formType === 'INCOME')) ? (
                        categoriesList.income.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))
                      ) : (
                        categoriesList.expense.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))
                      )}
                    </select>
                  </div>
                )}

                {/* Date Field */}
                {modalType !== 'BUDGET' && modalType !== 'EDIT_BUDGET' && (
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      {modalType === 'BILL' || modalType === 'GOAL' || modalType === 'SUB' ? 'Target / Due Date' : 'Transaction Date'}
                    </label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={e => setFormDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Description & Payment Method for Transactions */}
                {(modalType === 'INCOME' || modalType === 'EXPENSE' || modalType === 'EDIT_TX') && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Description</label>
                      <input
                        type="text"
                        placeholder="e.g. Supermarket provisions"
                        value={formDesc}
                        onChange={e => setFormDesc(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Payment Method</label>
                      <select
                        value={formPaymentMethod}
                        onChange={e => setFormPaymentMethod(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {paymentMethodsList.map(pm => (
                          <option key={pm} value={pm}>{pm}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setModalType(null); setEditingTransaction(null); setEditingBudget(null); }}
                    className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer shadow-sm"
                  >
                    {modalType === 'EDIT_TX' ? 'Update Transaction' : modalType === 'EDIT_BUDGET' ? 'Update Budget Cap' : 'Save Record'}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
