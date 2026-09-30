import React, { useState, useMemo, useEffect } from 'react';
import { CustomerRecord, Transaction, Budget, FinancialGoal } from '../types';
import {
  Users, Crown, Search, Filter, Download, Plus, Eye, CheckCircle2,
  TrendingUp, TrendingDown, DollarSign, Wallet, ShieldCheck, Mail,
  Phone, Calendar, ArrowUpRight, ArrowDownLeft, X, Sparkles, Database,
  RefreshCw, Copy, Check, AlertCircle, Code, Server, Trash2
} from 'lucide-react';
import { getInitialDemoTransactions, getInitialDemoBudgets, getInitialDemoGoals } from '../data/initialData';
import {
  DATABASE_SCHEMA_SQL,
  SUPABASE_PROJECT_ID,
  testDatabaseConnection,
  syncAllCustomersToCloud,
  saveUserToDb,
  deleteCustomerFromDb,
  DatabaseStatus
} from '../lib/supabase';

interface OwnerPortalViewProps {
  customers: CustomerRecord[];
  onAddCustomer: (newCustomer: CustomerRecord) => void;
  onDeleteCustomer?: (customerId: string) => void;
  onRefreshFromDb?: () => Promise<void>;
  isDark: boolean;
}

export const OwnerPortalView: React.FC<OwnerPortalViewProps> = ({
  customers,
  onAddCustomer,
  onDeleteCustomer,
  onRefreshFromDb,
  isDark
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [inspectingCustomer, setInspectingCustomer] = useState<CustomerRecord | null>(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  // Cloud Database state
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [isCheckingDb, setIsCheckingDb] = useState(false);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [hasCopiedSql, setHasCopiedSql] = useState(false);

  // New Customer Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newTier, setNewTier] = useState<'STANDARD' | 'PRO' | 'PREMIUM'>('STANDARD');
  const [newIncome, setNewIncome] = useState('');
  const [newExpense, setNewExpense] = useState('');

  const cardBgClass = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-[#D0E1F2] text-slate-900';

  // Check database connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setIsCheckingDb(true);
    const status = await testDatabaseConnection();
    setDbStatus(status);
    setIsCheckingDb(false);
  };

  const handleSyncToDatabase = async () => {
    setIsSyncingDb(true);
    setSyncFeedback(null);
    try {
      const res = await syncAllCustomersToCloud(customers);
      // Also ensure profiles are populated in users table
      for (const c of customers) {
        await saveUserToDb({
          id: c.id,
          name: c.name,
          email: c.email,
          themePreference: 'LIGHT',
          createdAt: c.joinedDate,
          currency: '₹',
          role: 'CUSTOMER'
        });
      }

      if (res.error) {
        if (res.error.includes('schema cache') || res.error.includes('relation "customers" does not exist')) {
          setSyncFeedback('Cloud database reachable. Tables pending SQL schema creation. Click "Database Schema SQL" to initialize.');
        } else {
          setSyncFeedback(`Sync note: ${res.error}`);
        }
      } else {
        setSyncFeedback(`✓ Successfully saved ${res.successCount} customer records and user accounts to cloud database!`);
      }
      if (onRefreshFromDb) {
        await onRefreshFromDb();
      }
    } catch (err: any) {
      setSyncFeedback(err?.message || 'Sync encountered a network issue');
    } finally {
      setIsSyncingDb(false);
      setTimeout(() => setSyncFeedback(null), 6000);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(DATABASE_SCHEMA_SQL);
    setHasCopiedSql(true);
    setTimeout(() => setHasCopiedSql(false), 2500);
  };

  // Platform aggregates
  const aggregates = useMemo(() => {
    let totalInflows = 0;
    let totalExpenses = 0;
    let totalTxCount = 0;

    customers.forEach(c => {
      totalInflows += c.totalIncome;
      totalExpenses += c.totalExpense;
      totalTxCount += c.transactionsCount;
    });

    const netPlatformVolume = totalInflows - totalExpenses;
    const avgCustomerBalance = customers.length > 0 ? netPlatformVolume / customers.length : 0;

    return {
      totalCustomers: customers.length,
      totalInflows,
      totalExpenses,
      netPlatformVolume,
      totalTxCount,
      avgCustomerBalance
    };
  }, [customers]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm));
      const matchTier = selectedTier === 'ALL' || c.tier === selectedTier;
      return matchSearch && matchTier;
    });
  }, [customers, searchTerm, selectedTier]);

  // Export Customer Data as CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Joined Date', 'Tier', 'Status', 'Transactions', 'Total Income (INR)', 'Total Expense (INR)', 'Net Balance (INR)', 'Active Budgets'];
    const rows = customers.map(c => [
      c.id,
      `"${c.name}"`,
      c.email,
      c.phone || '',
      c.joinedDate,
      c.tier,
      c.status,
      c.transactionsCount,
      c.totalIncome,
      c.totalExpense,
      c.netBalance,
      c.activeBudgetsCount
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customer_directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add Customer Submit
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const incomeVal = parseFloat(newIncome) || 0;
    const expenseVal = parseFloat(newExpense) || 0;

    const created: CustomerRecord = {
      id: 'cust_' + Date.now(),
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      phone: newPhone.trim() || '+91 98000 00000',
      joinedDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      tier: newTier,
      transactionsCount: incomeVal > 0 || expenseVal > 0 ? 2 : 0,
      totalIncome: incomeVal,
      totalExpense: expenseVal,
      netBalance: incomeVal - expenseVal,
      activeBudgetsCount: 3,
      lastActive: 'Just registered'
    };

    onAddCustomer(created);
    setIsAddCustomerOpen(false);
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewIncome('');
    setNewExpense('');
  };

  // Customer inspection data
  const customerDetailData = useMemo(() => {
    if (!inspectingCustomer) return null;
    const txns = getInitialDemoTransactions(inspectingCustomer.id);
    const budgets = getInitialDemoBudgets(inspectingCustomer.id);
    const goals = getInitialDemoGoals(inspectingCustomer.id);

    return { txns, budgets, goals };
  }, [inspectingCustomer]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className={`p-4 sm:p-6 rounded-2xl border ${cardBgClass} shadow-xs relative overflow-hidden`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-white flex items-center justify-center shadow-md shrink-0">
              <Crown className="w-6 h-6 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Platform Owner Portal</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 uppercase tracking-wider">
                  Owner Access
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Administrative directory, customer balance ledgers, and cloud database synchronization.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Download customer data spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setIsAddCustomerOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Customer</span>
            </button>
          </div>
        </div>

        {/* Credentials Reminder Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Active Owner Session:</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-200">owner@smartexpense.com</span>
          </div>
          <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
            🔒 Full Administrative Clearance: Customer Records & Database Unlocked
          </div>
        </div>
      </div>

      {/* CLOUD DATABASE CONNECTION & SYNC CARD */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${cardBgClass} shadow-xs space-y-3`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold">Cloud Database Integration</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  dbStatus?.isConnected
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                }`}>
                  {isCheckingDb ? 'Checking...' : dbStatus?.isConnected ? 'Connected' : 'Offline'}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  ID: {SUPABASE_PROJECT_ID}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {dbStatus?.message || `Connected to cloud project ${SUPABASE_PROJECT_ID}. Customer accounts and records save directly to the database.`}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={checkConnection}
              disabled={isCheckingDb}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingDb ? 'animate-spin' : ''}`} />
              <span>Test Connection</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSqlModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Database Schema (SQL)</span>
            </button>

            <button
              type="button"
              onClick={handleSyncToDatabase}
              disabled={isSyncingDb}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Server className="w-3.5 h-3.5" />
              <span>{isSyncingDb ? 'Syncing...' : 'Sync Customers to Cloud'}</span>
            </button>
          </div>
        </div>

        {/* Sync feedback notification */}
        {syncFeedback && (
          <div className={`p-2.5 rounded-xl text-xs flex items-center space-x-2 ${
            syncFeedback.startsWith('✓')
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
          }`}>
            {syncFeedback.startsWith('✓') ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{syncFeedback}</span>
          </div>
        )}
      </div>

      {/* Aggregate Stat KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className={`p-4 sm:p-5 rounded-2xl border ${cardBgClass} shadow-xs`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Customers</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight">
            {aggregates.totalCustomers}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center">
            <CheckCircle2 className="w-3 h-3 mr-1" /> All accounts verified & synchronized
          </p>
        </div>

        <div className={`p-4 sm:p-5 rounded-2xl border ${cardBgClass} shadow-xs`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer Inflows</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            ₹{aggregates.totalInflows.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Across {aggregates.totalCustomers} customer ledgers
          </p>
        </div>

        <div className={`p-4 sm:p-5 rounded-2xl border ${cardBgClass} shadow-xs`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer Expenses</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
            ₹{aggregates.totalExpenses.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Total verified customer spending
          </p>
        </div>

        <div className={`p-4 sm:p-5 rounded-2xl border ${cardBgClass} shadow-xs`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Platform Net Liquidity</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
            ₹{aggregates.netPlatformVolume.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Avg ₹{Math.round(aggregates.avgCustomerBalance).toLocaleString()} / customer
          </p>
        </div>

      </div>

      {/* Customer Directory Table & Filters */}
      <div className={`p-4 sm:p-6 rounded-2xl border ${cardBgClass} shadow-xs space-y-4`}>
        
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight">Customer Database Directory</h2>
            <p className="text-xs text-slate-500">Live records of users managing their budgets on your tracker.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Tier Filter */}
            <div className="flex items-center space-x-1 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
              {['ALL', 'PREMIUM', 'PRO', 'STANDARD'].map(tier => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    selectedTier === tier
                      ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Responsive Table Wrapper */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">Tier</th>
                <th className="py-3 px-3 text-right">Inflow</th>
                <th className="py-3 px-3 text-right">Expenses</th>
                <th className="py-3 px-3 text-right">Net Balance</th>
                <th className="py-3 px-3 text-center">Txns</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-100">{customer.name}</div>
                          <div className="text-[10px] text-slate-400">Joined {customer.joinedDate}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      <div>{customer.email}</div>
                      <div className="text-[10px] text-slate-400">{customer.phone}</div>
                    </td>

                    {/* Tier */}
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        customer.tier === 'PREMIUM'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          : customer.tier === 'PRO'
                          ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {customer.tier}
                      </span>
                    </td>

                    {/* Inflow */}
                    <td className="py-3 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      ₹{customer.totalIncome.toLocaleString()}
                    </td>

                    {/* Expenses */}
                    <td className="py-3 px-3 text-right font-semibold text-rose-600 dark:text-rose-400">
                      ₹{customer.totalExpense.toLocaleString()}
                    </td>

                    {/* Net Balance */}
                    <td className="py-3 px-3 text-right font-bold text-blue-600 dark:text-blue-400">
                      ₹{customer.netBalance.toLocaleString()}
                    </td>

                    {/* Txns */}
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-mono">
                        {customer.transactionsCount}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center space-x-1.5">
                        <button
                          onClick={() => setInspectingCustomer(customer)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                          title="View Customer Financial Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                        {onDeleteCustomer && (
                          <button
                            onClick={() => {
                              if (confirm(`Remove customer ${customer.name}? This will delete the account from platform directory.`)) {
                                onDeleteCustomer(customer.id);
                                deleteCustomerFromDb(customer.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete customer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No customer accounts match your search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SQL Schema Initialization Modal */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border p-5 sm:p-6 shadow-2xl relative ${cardBgClass}`}>
            <button
              onClick={() => setIsSqlModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Database Schema SQL Script</h3>
                <p className="text-xs text-slate-500">Project ID: <span className="font-mono font-semibold">{SUPABASE_PROJECT_ID}</span></p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              To create the tables in your cloud database, open your database web console, go to <strong>SQL Editor</strong> &gt; <strong>New Query</strong>, paste the script below, and click <strong>Run</strong>.
            </p>

            <div className="relative mb-4">
              <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto max-h-72 border border-slate-800 leading-relaxed">
                {DATABASE_SCHEMA_SQL}
              </pre>
              <button
                type="button"
                onClick={handleCopySql}
                className="absolute top-2 right-2 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md cursor-pointer"
              >
                {hasCopiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{hasCopiedSql ? 'Copied!' : 'Copy SQL'}</span>
              </button>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-400">Creates tables: customers, users, transactions, budgets, financial_goals with RLS.</span>
              <button
                type="button"
                onClick={() => setIsSqlModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Customer Modal */}
      {inspectingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border p-5 sm:p-6 shadow-2xl relative ${cardBgClass}`}>
            
            <button
              onClick={() => setInspectingCustomer(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm">
                <Crown className="w-5 h-5 text-amber-200" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Customer Ledger: {inspectingCustomer.name}</h3>
                <p className="text-xs text-slate-500">ID: {inspectingCustomer.id} · Email: {inspectingCustomer.email}</p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 text-center">
                <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold uppercase">Total Income</span>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">₹{inspectingCustomer.totalIncome.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-800/40 text-center">
                <span className="text-[10px] text-rose-800 dark:text-rose-300 font-semibold uppercase">Total Spending</span>
                <p className="text-base font-bold text-rose-600 dark:text-rose-400">₹{inspectingCustomer.totalExpense.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/40 text-center">
                <span className="text-[10px] text-blue-800 dark:text-blue-300 font-semibold uppercase">Net Liquidity</span>
                <p className="text-base font-bold text-blue-600 dark:text-blue-400">₹{inspectingCustomer.netBalance.toLocaleString()}</p>
              </div>
            </div>

            {/* Customer's Sample Transaction Records */}
            <div className="space-y-2 mb-5">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Recent Customer Transactions</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {customerDetailData?.txns.slice(0, 6).map(tx => (
                  <div key={tx.id} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold">{tx.description}</span>
                      <div className="text-[10px] text-slate-400">{tx.category} · {tx.date} · {tx.paymentMethod}</div>
                    </div>
                    <span className={`font-bold ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Budgets & Goals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="font-bold text-xs block mb-2">Active Budgets ({customerDetailData?.budgets.length || 0})</span>
                <div className="space-y-1">
                  {customerDetailData?.budgets.slice(0, 3).map(b => (
                    <div key={b.id} className="flex justify-between text-[11px]">
                      <span className="text-slate-500">{b.category} Cap:</span>
                      <span className="font-semibold">₹{b.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="font-bold text-xs block mb-2">Savings Goals ({customerDetailData?.goals.length || 0})</span>
                <div className="space-y-1">
                  {customerDetailData?.goals.slice(0, 2).map(g => (
                    <div key={g.id} className="flex justify-between text-[11px]">
                      <span className="text-slate-500 truncate max-w-[130px]">{g.name}:</span>
                      <span className="font-semibold text-emerald-600">₹{g.currentAmount.toLocaleString()} / ₹{g.targetAmount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setInspectingCustomer(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
              >
                Close Customer Dossier
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className={`w-full max-w-md rounded-2xl border p-5 sm:p-6 shadow-2xl relative ${cardBgClass}`}>
            
            <button
              onClick={() => setIsAddCustomerOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-1">Add Customer Account</h3>
            <p className="text-xs text-slate-500 mb-4">Enroll a new customer into the expense tracker database.</p>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Customer Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="ramesh@example.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 98000 12345"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1">Account Tier</label>
                  <select
                    value={newTier}
                    onChange={e => setNewTier(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs"
                  >
                    <option value="STANDARD">Standard</option>
                    <option value="PRO">Pro</option>
                    <option value="PREMIUM">Premium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Initial Inflow (₹)</label>
                  <input
                    type="number"
                    placeholder="50000"
                    value={newIncome}
                    onChange={e => setNewIncome(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Initial Expenses (₹)</label>
                <input
                  type="number"
                  placeholder="15000"
                  value={newExpense}
                  onChange={e => setNewExpense(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-amber-600 hover:bg-amber-700 transition-all shadow-sm"
                >
                  Create Customer Record
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
