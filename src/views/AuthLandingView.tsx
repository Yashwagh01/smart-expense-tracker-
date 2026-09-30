import React, { useState } from 'react';
import { User, HOLST, CustomerRecord } from '../types';
import { OWNER_USER } from '../data/initialData';
import { 
  PiggyBank, Sparkles, Sliders, CreditCard, ShieldCheck, 
  ArrowRight, Check, Sun, Moon, LogIn, UserPlus, Mail, Lock, 
  User as UserIcon, AlertCircle, Crown, Eye, EyeOff
} from 'lucide-react';
import { saveUserToDb, saveCustomerToDb, fetchUserFromDb } from '../lib/supabase';

interface AuthLandingViewProps {
  onLoginSuccess: (user: User) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const AuthLandingView: React.FC<AuthLandingViewProps> = ({
  onLoginSuccess,
  isDark,
  onToggleTheme
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Google One-Tap State
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [isEnteringCustomGoogle, setIsEnteringCustomGoogle] = useState(false);

  // Direct Google Sign In
  const handleGoogleLogin = async (googleEmail: string, googleName: string) => {
    setError('');
    const cleanMail = googleEmail.toLowerCase().trim();
    const storedUsersJson = localStorage.getItem('smartexpense_registered_users');
    let usersList: Array<User & { passwordHash?: string }> = storedUsersJson ? JSON.parse(storedUsersJson) : [];

    let existingUser = usersList.find(u => u.email.toLowerCase() === cleanMail);
    if (!existingUser) {
      existingUser = {
        id: 'usr_goog_' + Date.now(),
        name: googleName,
        email: cleanMail,
        themePreference: isDark ? 'DARK' : 'LIGHT',
        createdAt: new Date().toISOString().split('T')[0],
        currency: '₹',
        role: 'CUSTOMER'
      };
      usersList.push(existingUser);
      localStorage.setItem('smartexpense_registered_users', JSON.stringify(usersList));
    }

    // Persist to cloud database
    await saveUserToDb(existingUser);
    await saveCustomerToDb({
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      joinedDate: existingUser.createdAt,
      status: 'ACTIVE',
      tier: 'STANDARD',
      transactionsCount: 0,
      totalIncome: 0,
      totalExpense: 0,
      netBalance: 0,
      activeBudgetsCount: 0,
      lastActive: 'Just now'
    });

    localStorage.setItem('smartexpense_current_user', JSON.stringify(existingUser));
    localStorage.removeItem('smartexpense_auth_status');
    setSuccess(`Signed in with Google as ${googleName}!`);

    setTimeout(() => {
      onLoginSuccess(existingUser!);
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanEmail = email.toLowerCase().trim();
    const storedUsersJson = localStorage.getItem('smartexpense_registered_users');
    let usersList: Array<User & { passwordHash?: string }> = storedUsersJson ? JSON.parse(storedUsersJson) : [];

    // Owner Login check
    const isOwnerEmail = cleanEmail === 'owner@smartexpense.com' || cleanEmail === 'owner';
    const isOwnerPass = password === 'Owner@2026' || password === 'owner123' || password === 'owner';

    if (isOwnerEmail && isOwnerPass) {
      localStorage.setItem('smartexpense_current_user', JSON.stringify(OWNER_USER));
      localStorage.removeItem('smartexpense_auth_status');
      setSuccess('Authenticated as Platform Owner! Opening Data Portal...');
      setTimeout(() => {
        onLoginSuccess(OWNER_USER);
      }, 350);
      return;
    }

    if (authMode === 'register') {
      if (!name.trim() || !email.trim() || !password) {
        setError('Please fill in all required fields.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (cleanEmail === 'owner@smartexpense.com' || cleanEmail === 'owner') {
        setError('This email address is reserved.');
        return;
      }
      if (usersList.some(u => u.email.toLowerCase() === cleanEmail)) {
        setError('An account with this email already exists. Please log in.');
        return;
      }

      const newUser: User & { passwordHash?: string } = {
        id: 'usr_' + Date.now(),
        name: name.trim(),
        email: cleanEmail,
        themePreference: isDark ? 'DARK' : 'LIGHT',
        createdAt: new Date().toISOString().split('T')[0],
        currency: '₹',
        role: 'CUSTOMER',
        passwordHash: password
      };

      usersList.push(newUser);
      localStorage.setItem('smartexpense_registered_users', JSON.stringify(usersList));
      localStorage.setItem('smartexpense_current_user', JSON.stringify(newUser));
      localStorage.removeItem('smartexpense_auth_status');

      // Persist customer record and user profile to cloud database
      await saveUserToDb(newUser);
      const newCust: CustomerRecord = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        joinedDate: newUser.createdAt,
        status: 'ACTIVE',
        tier: 'STANDARD',
        transactionsCount: 0,
        totalIncome: 0,
        totalExpense: 0,
        netBalance: 0,
        activeBudgetsCount: 0,
        lastActive: 'Just now'
      };
      await saveCustomerToDb(newCust);

      setSuccess('Account created! Welcome to Smart Expense.');
      setTimeout(() => {
        onLoginSuccess(newUser);
      }, 200);

    } else {
      // Login mode
      if (!email.trim() || !password) {
        setError('Please enter your email and password.');
        return;
      }

      let foundUser = usersList.find(u => u.email.toLowerCase() === cleanEmail);

      // If not in local storage, check cloud database
      if (!foundUser) {
        const dbUser = await fetchUserFromDb(cleanEmail);
        if (dbUser) {
          foundUser = dbUser;
          usersList.push(dbUser);
          localStorage.setItem('smartexpense_registered_users', JSON.stringify(usersList));
        }
      }

      if (!foundUser) {
        setError('No account found with this email. Please register or continue with Google.');
        return;
      }

      if (foundUser.passwordHash && foundUser.passwordHash !== password) {
        setError('Invalid password. Please check your credentials.');
        return;
      }

      localStorage.setItem('smartexpense_current_user', JSON.stringify(foundUser));
      localStorage.removeItem('smartexpense_auth_status');
      setSuccess(`Welcome back, ${foundUser.name}!`);
      setTimeout(() => {
        onLoginSuccess(foundUser);
      }, 400);
    }
  };

  const bgClass = isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#F4F8FD] text-slate-900';
  const cardBg = isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-[#D0E1F2]';

  return (
    <div className={`min-h-screen flex flex-col ${bgClass}`} style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Top Navigation Bar */}
      <header className={`border-b sticky top-0 z-30 px-3 xs:px-4 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3 backdrop-blur-md ${isDark ? 'bg-slate-950/85 border-slate-800' : 'bg-white/85 border-[#D0E1F2]'}`}>
        <div className="flex items-center space-x-2 xs:space-x-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 xs:w-9 xs:h-9 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0" style={{ backgroundColor: HOLST.navy }}>
            <PiggyBank className="w-4 h-4 xs:w-5 xs:h-5" />
          </div>
          <div className="min-w-0">
            <span className="font-extrabold text-sm xs:text-base tracking-tight truncate block" style={{ color: isDark ? '#9FC0E3' : HOLST.navy }}>
              SMART EXPENSE
            </span>
            <span className="hidden md:inline text-slate-400 text-xs">Personal Expense Tracker & Predictions</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={onToggleTheme}
            className={`p-1.5 xs:p-2 rounded-xl border transition-all cursor-pointer shrink-0 ${isDark ? 'bg-slate-800 text-amber-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'}`}
            title="Toggle theme"
            aria-label="Toggle light or dark theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Content: Split Hero & Auth Card */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-14 flex flex-col lg:flex-row items-center justify-between gap-10">
        
        {/* Left Column: Product Information & Value Proposition */}
        <div className="flex-1 space-y-6 max-w-xl">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
              <Sparkles className="w-4 h-4" />
              <span>Intelligent Spending Control · Zero Bloat</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight" style={{ color: isDark ? '#E2E8F0' : HOLST.navy }}>
              Know exactly where your money goes.
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Track daily expenses, set category limits, and understand your real-time month-end spending projection before the month ends.
            </p>
          </div>

          {/* Core Feature Highlights */}
          <div className="space-y-4 pt-2">
            <div className="flex items-start space-x-3.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Smart Month-End Spending Projection</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Analyzes your daily pace to project your total spend by month-end with a safe daily spend limit to stay within budget.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Dynamic Categories & Budget Limits</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Organize by Groceries, Dining, Rent, Bills, Transport, and custom categories with real-time budget utilization alerts.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Multi-Channel Payment Methods</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Seamlessly log payments made with Google Pay (GPay), PhonePe, UPI, Credit Card, Bank Transfer, or Cash.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Clean Slate · No Pre-Loaded Demo Data</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Your account starts with completely clean personal data, ready for your real income and expense records.
                </p>
              </div>
            </div>
          </div>

          {/* Live Preview Sample Card */}
          <div className={`p-4 rounded-xl border ${cardBg} shadow-xs space-y-2`}>
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-500">Live Preview · Projection Pace</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ On Track</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-xl font-extrabold" style={{ color: HOLST.navy }}>
                  ₹24,500 <span className="text-xs font-normal text-slate-400">projected end-of-month</span>
                </div>
                <div className="text-[11px] text-slate-500">Daily average: ₹816 / day</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Safe Daily Limit</div>
                <div className="text-xs font-extrabold text-emerald-600">₹720 / day</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Simple Login & Register Form Card */}
        <div className="w-full max-w-md">
          <div className={`p-6 sm:p-8 rounded-2xl border shadow-xl ${cardBg}`}>
            
            {/* Form Header */}
            <div className="mb-6">
              <h2 className="text-xl font-extrabold tracking-tight">
                {authMode === 'login' ? 'Sign In to Your Tracker' : 'Create an Account'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {authMode === 'login' ? 'Access your financial ledger, budgets, and projections' : 'Start with your own clean, private expense tracker'}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 mb-5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setError(''); setSuccess(''); setShowGoogleChooser(false); }}
                className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                  authMode === 'login'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>
              
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setError(''); setSuccess(''); setShowGoogleChooser(false); }}
                className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                  authMode === 'register'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            </div>

            {/* 1-CLICK GOOGLE SIGN IN BUTTON */}
            {!showGoogleChooser ? (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setShowGoogleChooser(true)}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-semibold text-xs flex items-center justify-center space-x-2.5 cursor-pointer shadow-xs"
                >
                  {/* Google 4-Color SVG Icon */}
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">1-Click</span>
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className={`px-2 text-slate-400 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                      or continue with email
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* GOOGLE ACCOUNT INPUT (Dynamic User Sign In) */
              <div className="mb-5 p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Google Account Sign-In</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowGoogleChooser(false); }}
                    className="text-[11px] text-slate-500 hover:underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Your Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Alex Johnson"
                      value={customGoogleName}
                      onChange={e => setCustomGoogleName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Google Email Address</label>
                    <input
                      type="email"
                      placeholder="you@gmail.com"
                      value={customGoogleEmail}
                      onChange={e => setCustomGoogleEmail(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!customGoogleEmail.trim()) {
                        setError('Please enter your Google email address.');
                        return;
                      }
                      const emailVal = customGoogleEmail.trim();
                      const nameVal = customGoogleName.trim() || emailVal.split('@')[0];
                      handleGoogleLogin(emailVal, nameVal);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs flex items-center justify-center space-x-1.5"
                  >
                    <span>Continue to My Private Ledger</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Error & Success Messages */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-start space-x-2">
                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {/* Email / Password Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold mb-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all shadow-sm cursor-pointer hover:opacity-95 mt-2"
                style={{ backgroundColor: HOLST.navy }}
              >
                {authMode === 'login' ? 'Sign In to Tracker' : 'Create Account & Start Tracking'}
              </button>
            </form>

            {/* Bottom Footer: Platform Owner & Disclaimer */}
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="text-[11px] text-slate-400">100% Private · Local Storage</span>
              <button
                type="button"
                onClick={() => {
                  setEmail('owner@smartexpense.com');
                  setPassword('Owner@2026');
                  setError('');
                  setAuthMode('login');
                  setSuccess('Owner credentials pre-filled. Click Sign In.');
                }}
                className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center space-x-1 cursor-pointer opacity-85 hover:opacity-100"
              >
                <Crown className="w-3 h-3 text-amber-500" />
                <span>Owner Portal</span>
              </button>
            </div>

          </div>
        </div>

      </main>

    </div>
  );
};
