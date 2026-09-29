import React, { useState, useEffect } from 'react';
import { User, HOLST } from '../types';
import { User as UserIcon, Mail, Calendar, Key, Sun, Moon, ShieldCheck, LogOut, LogIn, UserPlus } from 'lucide-react';

interface ProfileViewProps {
  currentUser: User | null;
  onUpdateUser: (updated: User) => void;
  onLogout: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  stats: {
    totalTransactions: number;
    activeBudgets: number;
    activeGoals: number;
    balance: number;
  };
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onUpdateUser,
  onLogout,
  onOpenLogin,
  onOpenRegister,
  isDark,
  onToggleTheme,
  stats
}) => {
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [currency, setCurrency] = useState(currentUser?.currency || '₹');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  // Keep state updated if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email);
      setCurrency(currentUser.currency || '₹');
    }
  }, [currentUser]);

  const cardBgClass = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-[#D0E1F2] text-slate-900';

  if (!currentUser) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto py-8">
        <div className={`p-8 rounded-2xl border ${cardBgClass} shadow-md text-center space-y-4`}>
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-white bg-slate-700 shadow-md">
            <UserIcon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">You are currently in Guest Mode</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Your transactions and calculations are saved locally in your browser. Sign in or create a free account to personalize your profile and secure your financial ledger.
          </p>
          <div className="flex items-center justify-center space-x-3 pt-3">
            <button
              onClick={onOpenLogin}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In</span>
            </button>
            <button
              onClick={onOpenRegister}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer shadow-md"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register New Account</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className={`p-6 rounded-2xl border ${cardBgClass} shadow-xs`}>
          <h3 className="font-bold text-sm mb-3">Local Ledger Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Transactions</span>
              <p className="text-lg font-bold">{stats.totalTransactions}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Budgets</span>
              <p className="text-lg font-bold">{stats.activeBudgets}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Net Balance</span>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">₹{stats.balance.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: User = {
      ...currentUser,
      name: name.trim(),
      email: email.trim(),
      currency
    };
    onUpdateUser(updated);
    setProfileMsg('Profile updated successfully!');
    setTimeout(() => setProfileMsg(''), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg('New password must have at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg('New passwords do not match.');
      return;
    }

    const storedUsers = localStorage.getItem('smartexpense_registered_users');
    if (storedUsers) {
      const list = JSON.parse(storedUsers);
      const idx = list.findIndex((u: any) => u.id === currentUser.id);
      if (idx !== -1) {
        list[idx].passwordHash = newPassword;
        localStorage.setItem('smartexpense_registered_users', JSON.stringify(list));
      }
    }

    setPasswordMsg('Password changed successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordMsg(''), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account & User Profile</h1>
          <p className="text-xs text-slate-500">Manage your profile credentials, security settings, and app preferences.</p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all cursor-pointer shadow-xs"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>

      {/* Profile Overview Card */}
      <div className={`p-6 rounded-2xl border ${cardBgClass} shadow-xs flex flex-wrap items-center justify-between gap-4`}>
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-md" style={{ backgroundColor: HOLST.navy }}>
            {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold">{currentUser.name}</h2>
            <p className="text-xs text-slate-500">{currentUser.email}</p>
            <div className="flex items-center space-x-3 mt-2 text-xs text-slate-400">
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Member since {currentUser.createdAt}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Account</span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center w-full sm:w-auto mt-2 sm:mt-0">
          <div className="px-3 sm:px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-semibold">Transactions</span>
            <p className="text-sm sm:text-base font-bold">{stats.totalTransactions}</p>
          </div>
          <div className="px-3 sm:px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-semibold">Budgets</span>
            <p className="text-sm sm:text-base font-bold">{stats.activeBudgets}</p>
          </div>
          <div className="px-3 sm:px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-semibold">Net Balance</span>
            <p className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">₹{stats.balance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Personal Details Form */}
        <div className={`p-6 rounded-2xl border ${cardBgClass} shadow-xs space-y-4`}>
          <div className="flex items-center space-x-2">
            <UserIcon className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-base">Edit Profile Details</h3>
          </div>

          {profileMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-semibold">
              {profileMsg}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Default Currency Symbol</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
              >
                <option value="₹">₹ INR (Indian Rupee)</option>
                <option value="$">$ USD (US Dollar)</option>
                <option value="€">€ EUR (Euro)</option>
                <option value="£">£ GBP (British Pound)</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer shadow-sm"
            >
              Save Profile Changes
            </button>
          </form>
        </div>

        {/* Change Password & Security Form */}
        <div className={`p-6 rounded-2xl border ${cardBgClass} shadow-xs space-y-4`}>
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-base">Security & Password</h3>
          </div>

          {passwordMsg && (
            <div className={`p-3 rounded-xl text-xs font-semibold ${
              passwordMsg.includes('successfully') ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
            }`}>
              {passwordMsg}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">New Password</label>
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Confirm New Password</label>
              <input
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-700 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-sm"
            >
              Update Password
            </button>
          </form>
        </div>

      </div>

      {/* Session Management & Theme Preference */}
      <div className={`p-6 rounded-2xl border ${cardBgClass} shadow-xs flex flex-wrap items-center justify-between gap-4`}>
        <div>
          <h3 className="font-bold text-sm">Theme Preference</h3>
          <p className="text-xs text-slate-500">Toggle between professional Holst Light mode and Dark mode.</p>
        </div>
        <button
          onClick={onToggleTheme}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
            isDark ? 'bg-slate-800 border-slate-700 text-amber-300' : 'bg-slate-100 border-slate-200 text-slate-800'
          }`}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span>{isDark ? 'Dark Mode Active' : 'Light Mode Active'}</span>
        </button>
      </div>

    </div>
  );
};
