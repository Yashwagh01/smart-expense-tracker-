import React, { useState, useMemo } from 'react';
import { Transaction, Budget, HOLST } from '../types';
import { 
  Tag, CreditCard, Plus, ArrowUpRight, ArrowDownLeft, 
  Search, Sliders, CheckCircle2, ChevronRight, Layers,
  Utensils, ShoppingBag, Home, Zap, Car, Film, HeartPulse,
  GraduationCap, Plane, Sparkles, Smartphone, Landmark,
  Wallet, DollarSign, Banknote
} from 'lucide-react';

interface CategoriesViewProps {
  transactions: Transaction[];
  budgets: Budget[];
  categoriesList: {
    expense: string[];
    income: string[];
  };
  paymentMethodsList: string[];
  onAddCategory: (type: 'EXPENSE' | 'INCOME', categoryName: string) => void;
  onAddPaymentMethod: (methodName: string) => void;
  onOpenSetBudget: (category: string) => void;
  onFilterTransactions: (category: string) => void;
  isDark: boolean;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  transactions,
  budgets,
  categoriesList,
  paymentMethodsList,
  onAddCategory,
  onAddPaymentMethod,
  onOpenSetBudget,
  onFilterTransactions,
  isDark
}) => {
  const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME' | 'METHODS'>('EXPENSE');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom Addition Modal State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingMethod, setIsAddingMethod] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  const cardBgClass = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-[#D0E1F2] text-slate-900';

  // Category Icon Resolver
  const getCategoryIcon = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('food') || c.includes('dine') || c.includes('eat')) return <Utensils className="w-4 h-4 text-amber-500" />;
    if (c.includes('grocery') || c.includes('mart')) return <ShoppingBag className="w-4 h-4 text-emerald-500" />;
    if (c.includes('rent') || c.includes('housing') || c.includes('home')) return <Home className="w-4 h-4 text-blue-500" />;
    if (c.includes('bill') || c.includes('utility') || c.includes('power')) return <Zap className="w-4 h-4 text-amber-400" />;
    if (c.includes('transport') || c.includes('fuel') || c.includes('car') || c.includes('travel')) return <Car className="w-4 h-4 text-indigo-500" />;
    if (c.includes('entertainment') || c.includes('movie') || c.includes('ott')) return <Film className="w-4 h-4 text-purple-500" />;
    if (c.includes('health') || c.includes('medical') || c.includes('doctor')) return <HeartPulse className="w-4 h-4 text-rose-500" />;
    if (c.includes('education') || c.includes('learn') || c.includes('book')) return <GraduationCap className="w-4 h-4 text-cyan-500" />;
    if (c.includes('vacation') || c.includes('trip') || c.includes('flight')) return <Plane className="w-4 h-4 text-sky-500" />;
    if (c.includes('salary') || c.includes('pay') || c.includes('job')) return <Banknote className="w-4 h-4 text-emerald-500" />;
    if (c.includes('freelance') || c.includes('consult')) return <Sparkles className="w-4 h-4 text-teal-500" />;
    if (c.includes('invest') || c.includes('stock') || c.includes('dividend')) return <Landmark className="w-4 h-4 text-blue-600" />;
    return <Tag className="w-4 h-4 text-slate-400" />;
  };

  const getMethodIcon = (method: string) => {
    const m = method.toLowerCase();
    if (m.includes('google') || m.includes('gpay')) return <Smartphone className="w-4 h-4 text-blue-500" />;
    if (m.includes('phonepe')) return <Smartphone className="w-4 h-4 text-purple-500" />;
    if (m.includes('upi')) return <Smartphone className="w-4 h-4 text-emerald-500" />;
    if (m.includes('credit')) return <CreditCard className="w-4 h-4 text-indigo-500" />;
    if (m.includes('debit')) return <CreditCard className="w-4 h-4 text-cyan-500" />;
    if (m.includes('net') || m.includes('bank')) return <Landmark className="w-4 h-4 text-blue-600" />;
    if (m.includes('cash')) return <DollarSign className="w-4 h-4 text-emerald-600" />;
    return <Wallet className="w-4 h-4 text-slate-400" />;
  };

  // Metrics for Expense Categories
  const expenseStats = useMemo(() => {
    const stats: Record<string, { total: number; count: number }> = {};
    transactions
      .filter(t => t.type === 'EXPENSE')
      .forEach(t => {
        if (!stats[t.category]) stats[t.category] = { total: 0, count: 0 };
        stats[t.category].total += t.amount;
        stats[t.category].count += 1;
      });
    return stats;
  }, [transactions]);

  // Metrics for Income Categories
  const incomeStats = useMemo(() => {
    const stats: Record<string, { total: number; count: number }> = {};
    transactions
      .filter(t => t.type === 'INCOME')
      .forEach(t => {
        if (!stats[t.category]) stats[t.category] = { total: 0, count: 0 };
        stats[t.category].total += t.amount;
        stats[t.category].count += 1;
      });
    return stats;
  }, [transactions]);

  // Metrics for Payment Methods
  const methodStats = useMemo(() => {
    const stats: Record<string, { total: number; count: number }> = {};
    transactions.forEach(t => {
      const pm = t.paymentMethod || 'Other';
      if (!stats[pm]) stats[pm] = { total: 0, count: 0 };
      stats[pm].total += t.amount;
      stats[pm].count += 1;
    });
    return stats;
  }, [transactions]);

  // Handlers
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    onAddCategory(newCategoryType, newItemName.trim());
    setNewItemName('');
    setIsAddingCategory(false);
  };

  const handleSaveMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    onAddPaymentMethod(newItemName.trim());
    setNewItemName('');
    setIsAddingMethod(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories & Payment Methods</h1>
          <p className="text-xs text-slate-500">Configure financial classification, budget caps, and supported payment instruments.</p>
        </div>
        
        <div className="flex items-center space-x-2">
          {activeTab === 'METHODS' ? (
            <button
              onClick={() => { setIsAddingMethod(true); setNewItemName(''); }}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Payment Method</span>
            </button>
          ) : (
            <button
              onClick={() => { 
                setIsAddingCategory(true); 
                setNewCategoryType(activeTab === 'EXPENSE' ? 'EXPENSE' : 'INCOME');
                setNewItemName(''); 
              }}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add {activeTab === 'EXPENSE' ? 'Expense' : 'Income'} Category</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('EXPENSE')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'EXPENSE'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Expense Categories ({categoriesList.expense.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('INCOME')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'INCOME'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Income Categories ({categoriesList.income.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('METHODS')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'METHODS'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payment Methods ({paymentMethodsList.length})</span>
          </button>
        </div>

        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* EXPENSE CATEGORIES GRID */}
      {activeTab === 'EXPENSE' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoriesList.expense
            .filter(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(cat => {
              const stats = expenseStats[cat] || { total: 0, count: 0 };
              const budget = budgets.find(b => b.category.toLowerCase() === cat.toLowerCase());
              const hasBudget = !!budget;
              const pct = hasBudget ? Math.round((stats.total / budget.amount) * 100) : 0;

              return (
                <div key={cat} className={`p-4 rounded-2xl border ${cardBgClass} shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between space-y-3`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 shrink-0">
                        {getCategoryIcon(cat)}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">{cat}</h3>
                        <span className="text-[11px] text-slate-400">{stats.count} transactions recorded</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      ₹{stats.total.toLocaleString()}
                    </span>
                  </div>

                  {/* Budget Allocation Info */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-[11px] text-slate-500">
                      <span>Monthly Budget Limit</span>
                      {hasBudget ? (
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          ₹{budget.amount.toLocaleString()} ({pct}%)
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No cap set</span>
                      )}
                    </div>
                    {hasBudget && (
                      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct >= 100 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Action Shortcuts */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <button
                      onClick={() => onOpenSetBudget(cat)}
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 cursor-pointer font-medium"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>{hasBudget ? 'Edit Limit' : 'Set Limit'}</span>
                    </button>
                    <button
                      onClick={() => onFilterTransactions(cat)}
                      className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center space-x-0.5 cursor-pointer"
                    >
                      <span>View records</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* INCOME CATEGORIES GRID */}
      {activeTab === 'INCOME' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoriesList.income
            .filter(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(cat => {
              const stats = incomeStats[cat] || { total: 0, count: 0 };

              return (
                <div key={cat} className={`p-4 rounded-2xl border ${cardBgClass} shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col justify-between space-y-3`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 shrink-0">
                        {getCategoryIcon(cat)}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">{cat}</h3>
                        <span className="text-[11px] text-slate-400">{stats.count} earnings entries</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{stats.total.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-[11px] text-slate-400">Direct Inflow Source</span>
                    <button
                      onClick={() => onFilterTransactions(cat)}
                      className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center space-x-0.5 cursor-pointer font-medium"
                    >
                      <span>View inflow</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* PAYMENT METHODS GRID */}
      {activeTab === 'METHODS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paymentMethodsList
            .filter(pm => pm.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(pm => {
              const stats = methodStats[pm] || { total: 0, count: 0 };

              return (
                <div key={pm} className={`p-4 rounded-2xl border ${cardBgClass} shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between space-y-3`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 shrink-0">
                        {getMethodIcon(pm)}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">{pm}</h3>
                        <span className="text-[11px] text-slate-400">{stats.count} transactions settled</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      ₹{stats.total.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="inline-flex items-center space-x-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Ready for checkout</span>
                    </span>
                    <button
                      onClick={() => onFilterTransactions(pm)}
                      className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center space-x-0.5 cursor-pointer font-medium"
                    >
                      <span>Filter records</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Add Category Modal */}
      {isAddingCategory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-2xl border p-5 shadow-2xl ${cardBgClass}`}>
            <h3 className="font-bold text-base mb-1">Add New Category</h3>
            <p className="text-xs text-slate-400 mb-4">Create a custom financial bucket for sorting your money.</p>

            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Classification Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCategoryType('EXPENSE')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      newCategoryType === 'EXPENSE'
                        ? 'bg-rose-50 border-rose-400 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCategoryType('INCOME')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      newCategoryType === 'INCOME'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pet Care, Gadgets, Gaming"
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Payment Method Modal */}
      {isAddingMethod && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-2xl border p-5 shadow-2xl ${cardBgClass}`}>
            <h3 className="font-bold text-base mb-1">Add Payment Method</h3>
            <p className="text-xs text-slate-400 mb-4">Add a new bank, wallet, card, or payment gateway.</p>

            <form onSubmit={handleSaveMethod} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Payment Method Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amazon Pay, HDFC Forex, Sodexo"
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingMethod(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700"
                >
                  Save Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
