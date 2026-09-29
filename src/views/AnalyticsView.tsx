import React, { useMemo, useState } from 'react';
import { Transaction, HOLST } from '../types';
import { 
  PieChart, TrendingUp, CreditCard, Calendar, BarChart3, 
  ArrowUpRight, ArrowDownLeft, Filter, Smartphone, Landmark,
  DollarSign, Wallet
} from 'lucide-react';

interface AnalyticsViewProps {
  transactions: Transaction[];
  isDark: boolean;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ transactions, isDark }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'3M' | '6M' | 'ALL'>('ALL');
  const [categoryViewType, setCategoryViewType] = useState<'EXPENSE' | 'INCOME' | 'ALL'>('EXPENSE');

  const cardBgClass = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-[#D0E1F2] text-slate-900';

  // Filter transactions based on selected period
  const filteredTransactions = useMemo(() => {
    if (selectedPeriod === 'ALL') return transactions;

    const now = new Date();
    const cutoffMonths = selectedPeriod === '3M' ? 3 : 6;
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - cutoffMonths, 1);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    return transactions.filter(t => t.date >= cutoffStr);
  }, [transactions, selectedPeriod]);

  // Category Aggregation (Supports Expense, Income, or Combined)
  const { categoryData, totalAmount } = useMemo(() => {
    const list = filteredTransactions.filter(t => {
      if (categoryViewType === 'ALL') return true;
      return t.type === categoryViewType;
    });

    const map: Record<string, { amount: number; count: number }> = {};
    let total = 0;
    list.forEach(t => {
      if (!map[t.category]) map[t.category] = { amount: 0, count: 0 };
      map[t.category].amount += t.amount;
      map[t.category].count += 1;
      total += t.amount;
    });

    const sorted = Object.entries(map)
      .map(([cat, data]) => ({
        category: cat,
        amount: data.amount,
        count: data.count,
        pct: total > 0 ? (data.amount / total) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    return { categoryData: sorted, totalAmount: total };
  }, [filteredTransactions, categoryViewType]);

  // Monthly Spending Trend (Clean Historical Comparison - Velocity Model Removed)
  const monthlyTrend = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'EXPENSE');
    const map: Record<string, number> = {};

    expenses.forEach(t => {
      const m = t.date.substring(0, 7); // YYYY-MM
      map[m] = (map[m] || 0) + t.amount;
    });

    const months = Object.keys(map).sort();
    return months.map(m => {
      const parts = m.split('-');
      const monthName = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1).toLocaleString('default', { month: 'short' });
      return {
        key: m,
        label: `${monthName} ${parts[0].slice(2)}`,
        amount: map[m]
      };
    });
  }, [filteredTransactions]);

  // Payment Method Breakdown across filtered transactions
  const paymentMethods = useMemo(() => {
    const map: Record<string, { amount: number; count: number }> = {};
    let total = 0;
    filteredTransactions.forEach(t => {
      const pm = t.paymentMethod || 'Other';
      if (!map[pm]) map[pm] = { amount: 0, count: 0 };
      map[pm].amount += t.amount;
      map[pm].count += 1;
      total += t.amount;
    });

    return Object.entries(map).map(([method, data]) => ({
      method,
      amount: data.amount,
      count: data.count,
      pct: total > 0 ? (data.amount / total) * 100 : 0
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions]);

  const maxMonthly = useMemo(() => {
    return Math.max(...monthlyTrend.map(m => m.amount), 1000);
  }, [monthlyTrend]);

  const getMethodIcon = (method: string) => {
    const m = method.toLowerCase();
    if (m.includes('google') || m.includes('gpay') || m.includes('upi') || m.includes('phonepe')) {
      return <Smartphone className="w-4 h-4 text-emerald-500" />;
    }
    if (m.includes('card')) {
      return <CreditCard className="w-4 h-4 text-indigo-500" />;
    }
    if (m.includes('bank') || m.includes('net')) {
      return <Landmark className="w-4 h-4 text-blue-600" />;
    }
    if (m.includes('cash')) {
      return <DollarSign className="w-4 h-4 text-amber-500" />;
    }
    return <Wallet className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header & Period Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Spending Analytics & Financial Breakdown</h1>
          <p className="text-xs text-slate-500">Comprehensive expenditure analysis, payment channels, and monthly trends.</p>
        </div>
        <div className="flex items-center space-x-1.5 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          {(['3M', '6M', 'ALL'] as const).map(p => (
            <button
              key={p}
              onClick={() => setSelectedPeriod(p)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                selectedPeriod === p ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {p === 'ALL' ? 'All Time' : `Last ${p}`}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Category Breakdown & Monthly Spend Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Expenditure Breakdown */}
        <div className={`p-6 rounded-2xl border ${cardBgClass} shadow-xs space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-base">Category Expenditure Breakdown</h2>
            </div>
            
            {/* Category Type Filter (Expenses vs Income) */}
            <div className="flex items-center space-x-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold">
              <button
                onClick={() => setCategoryViewType('EXPENSE')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  categoryViewType === 'EXPENSE' ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                Expenses
              </button>
              <button
                onClick={() => setCategoryViewType('INCOME')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  categoryViewType === 'INCOME' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                Income
              </button>
              <button
                onClick={() => setCategoryViewType('ALL')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  categoryViewType === 'ALL' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                All
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs pb-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 font-medium">Categories Active: {categoryData.length}</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">Total: ₹{totalAmount.toLocaleString()}</span>
          </div>

          <div className="space-y-3 pt-1 max-h-96 overflow-y-auto pr-1">
            {categoryData.length > 0 ? (
              categoryData.map((c, idx) => {
                const colors = [HOLST.navy, HOLST.slate, HOLST.steel, HOLST.cornflower, '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#6366F1'];
                const barColor = colors[idx % colors.length];

                return (
                  <div key={c.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: barColor }} />
                        <span className="font-semibold">{c.category}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({c.count} records)</span>
                      </span>
                      <span className="font-bold">
                        ₹{c.amount.toLocaleString()} ({c.pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(3, c.pct))}%`, backgroundColor: barColor }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-xs text-slate-400 py-8">No records found for the selected filter.</p>
            )}
          </div>
        </div>

        {/* Monthly Spending History (Velocity model replaced with clean monthly comparison) */}
        <div className={`p-6 rounded-2xl border ${cardBgClass} shadow-xs space-y-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-base">Monthly Spending Comparison</h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">Month-by-Month</span>
          </div>

          <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-100 dark:border-slate-800">
            {monthlyTrend.length > 0 ? (
              monthlyTrend.map(item => {
                const heightPct = Math.min(100, Math.max(15, (item.amount / maxMonthly) * 100));

                return (
                  <div key={item.key} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      ₹{Math.round(item.amount / 1000)}k
                    </span>
                    <div
                      className="w-full max-w-[44px] rounded-t-xl transition-all duration-500 hover:brightness-110"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: HOLST.steel
                      }}
                    />
                    <span className="text-[10px] font-medium text-slate-400 mt-2 truncate w-full text-center">
                      {item.label}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full text-center text-xs text-slate-400 py-8">No monthly expense data recorded.</div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <span>Average monthly spend:</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              ₹{monthlyTrend.length > 0 ? Math.round(monthlyTrend.reduce((s, m) => s + m.amount, 0) / monthlyTrend.length).toLocaleString() : 0}
            </span>
          </div>
        </div>

      </div>

      {/* Payment Methods Breakdown & Financial Efficiency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Payment Methods Breakdown */}
        <div className={`p-6 rounded-2xl border ${cardBgClass} shadow-xs space-y-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-base">Payment Method Breakdown</h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">{paymentMethods.length} Methods Used</span>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {paymentMethods.map(pm => (
              <div key={pm.method} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0">
                    {getMethodIcon(pm.method)}
                  </div>
                  <div>
                    <span className="text-xs font-bold block">{pm.method}</span>
                    <span className="text-[10px] text-slate-400">{pm.count} transactions</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold block">₹{pm.amount.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{pm.pct.toFixed(1)}% of total</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Efficiency & Budget Health */}
        <div className={`p-6 rounded-2xl border ${cardBgClass} shadow-xs space-y-4`}>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-base">Financial Health Summary</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Discretionary Ratio</span>
              <p className="text-xl font-bold mt-1 text-blue-600">32.8%</p>
              <span className="text-[10px] text-slate-400">Non-essential expenditures</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Fixed Burden</span>
              <p className="text-xl font-bold mt-1 text-slate-700 dark:text-slate-300">24.5%</p>
              <span className="text-[10px] text-slate-400">Rent, broadband & utilities</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
            <strong>Spending Discipline Status:</strong>
            <p className="text-[11px] leading-relaxed">
              Your cash flow shows strong liquidity retention. Keeping monthly grocery and dining allocations below budget thresholds ensures an estimated savings buffer of +₹18,500 every quarter.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
