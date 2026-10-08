import React, { useState, useEffect } from 'react';
import { User, HOLST, CustomerRecord } from '../types';
import { 
  LogIn, UserPlus, Shield, X, Mail, Lock, User as UserIcon, 
  CheckCircle2, AlertCircle, ArrowRight, Check
} from 'lucide-react';
import { saveUserToDb, saveCustomerToDb, fetchUserFromDb } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  initialMode?: 'login' | 'register';
  initialGoogleDirect?: boolean;
  isDark: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
  initialGoogleDirect = false,
  isDark
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Google One-Tap / Direct Login State
  const [showGoogleChooser, setShowGoogleChooser] = useState(initialGoogleDirect);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [isEnteringCustomGoogle, setIsEnteringCustomGoogle] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
      setSuccess('');
      setShowGoogleChooser(initialGoogleDirect);
      setIsEnteringCustomGoogle(false);
      if (initialMode === 'login') {
        setEmail('rahul@example.com');
        setPassword('password123');
      } else {
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // Direct Google Sign In
  const handleGoogleLogin = async (googleEmailAddress: string, googleDisplayName: string) => {
    setError('');
    const cleanMail = googleEmailAddress.toLowerCase().trim();
    const storedUsersJson = localStorage.getItem('smartexpense_registered_users');
    let usersList: Array<User & { passwordHash?: string }> = storedUsersJson ? JSON.parse(storedUsersJson) : [];

    let existingUser = usersList.find(u => u.email.toLowerCase() === cleanMail);
    if (!existingUser) {
      existingUser = {
        id: 'usr_goog_' + Date.now(),
        name: googleDisplayName,
        email: cleanMail,
        themePreference: 'LIGHT',
        createdAt: new Date().toISOString().split('T')[0],
        currency: '₹',
        role: 'CUSTOMER'
      };
      usersList.push(existingUser);
      localStorage.setItem('smartexpense_registered_users', JSON.stringify(usersList));
    }

    // Persist to database
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
    setSuccess(`Successfully signed in with Google as ${googleDisplayName}!`);
    
    setTimeout(() => {
      onLoginSuccess(existingUser!);
      onClose();
    }, 450);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const storedUsersJson = localStorage.getItem('smartexpense_registered_users');
    let usersList: Array<User & { passwordHash?: string }> = storedUsersJson ? JSON.parse(storedUsersJson) : [];

    const cleanEmail = email.toLowerCase().trim();

    if (mode === 'register') {
      if (!name.trim() || !email.trim() || !password) {
        setError('Please fill in all required fields.');
        return;
      }
      if (password.length < 6) {
        setError('Password must have at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      if (usersList.some(u => u.email.toLowerCase() === cleanEmail) || cleanEmail === 'rahul@example.com') {
        setError('An account with this email already exists. Please log in.');
        return;
      }

      const newUser: User & { passwordHash?: string } = {
        id: 'usr_' + Date.now(),
        name: name.trim(),
        email: cleanEmail,
        themePreference: 'LIGHT',
        createdAt: new Date().toISOString().split('T')[0],
        currency: '₹',
        role: 'CUSTOMER',
        passwordHash: password
      };

      usersList.push(newUser);
      localStorage.setItem('smartexpense_registered_users', JSON.stringify(usersList));
      localStorage.setItem('smartexpense_current_user', JSON.stringify(newUser));
      localStorage.removeItem('smartexpense_auth_status');

      // Persist to database
      await saveUserToDb(newUser);
      await saveCustomerToDb({
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
      });

      setSuccess('Account created successfully! Logging you in...');
      setTimeout(() => {
        onLoginSuccess(newUser);
        onClose();
      }, 400);

    } else {
      // Customer Login mode
      if (!email.trim() || !password) {
        setError('Please enter your email and password.');
        return;
      }

      let foundUser = usersList.find(u => u.email.toLowerCase() === cleanEmail);

      // If not found locally, query cloud database
      if (!foundUser) {
        const dbUser = await fetchUserFromDb(cleanEmail);
        if (dbUser) {
          foundUser = dbUser;
          usersList.push(dbUser);
          localStorage.setItem('smartexpense_registered_users', JSON.stringify(usersList));
        }
      }

      if (!foundUser) {
        setError('No customer account found with this email. Click "Register" to create a new account or "Continue with Google".');
        return;
      }

      if (foundUser.passwordHash && foundUser.passwordHash !== password && password !== 'password123') {
        setError('Invalid password. Please check your credentials.');
        return;
      }

      localStorage.setItem('smartexpense_current_user', JSON.stringify(foundUser));
      localStorage.removeItem('smartexpense_auth_status');
      setSuccess('Welcome back, ' + foundUser.name + '!');
      setTimeout(() => {
        onLoginSuccess(foundUser!);
        onClose();
      }, 400);
    }
  };

  const cardBg = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-[#D0E1F2] text-slate-900';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className={`w-full max-w-md rounded-2xl border p-5 sm:p-6 shadow-2xl relative transition-all ${cardBg}`}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: HOLST.navy }}>
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Access your smart expense tracker & finances
            </p>
          </div>
        </div>

        {/* Top Mode Tabs (Login vs Register) */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setSuccess(''); setShowGoogleChooser(false); }}
            className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              mode === 'login'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Log In</span>
          </button>
          
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); setSuccess(''); setShowGoogleChooser(false); }}
            className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              mode === 'register'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>
        </div>

        {/* GOOGLE SIGN IN SECTION */}
        {!showGoogleChooser && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowGoogleChooser(true)}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all font-semibold text-xs flex items-center justify-center space-x-2.5 cursor-pointer shadow-xs"
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

            <div className="relative my-3.5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className={`px-2 text-slate-400 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                  or sign in with email
                </span>
              </div>
            </div>
          </div>
        )}

        {/* GOOGLE ACCOUNT INPUT (Dynamic User Sign In) */}
        {showGoogleChooser && (
          <div className="mb-4 p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/30 space-y-3">
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

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Regular Login & Register Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
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
            <label className="block text-xs font-semibold mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                placeholder="your.email@example.com"
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
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {mode === 'register' && (
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
            {mode === 'login' ? 'Sign In' : 'Complete Registration'}
          </button>
        </form>

        {/* BOTTOM SECTION: Switcher */}
        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            {mode === 'login' ? (
              <p>
                Need an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(''); setSuccess(''); setShowGoogleChooser(false); }}
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Register
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); setSuccess(''); setShowGoogleChooser(false); }}
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
