'use client';

import React, { useEffect, useState } from 'react';
import { authService } from '@/services/auth';
import toast from 'react-hot-toast';

type ThemeOption = 'light' | 'dark' | 'system';

function applyTheme(theme: ThemeOption) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // system preference
    const prefersDark = window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}

export default function SettingsPage() {
  const [theme, setTheme] = useState<ThemeOption>('light');
  const [savingTheme, setSavingTheme] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    // Initialize theme from localStorage or system
    if (typeof window === 'undefined') return;
    const stored = (localStorage.getItem('theme') as ThemeOption | null);
    const initialTheme: ThemeOption = stored || 'light';
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const handleThemeChange = async (value: ThemeOption) => {
    setTheme(value);
    setSavingTheme(true);
    try {
      applyTheme(value);
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', value);
      }
      toast.success('Theme preference updated');
    } catch (err) {
      console.error('Error applying theme:', err);
      toast.error('Failed to update theme');
    } finally {
      setSavingTheme(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('New password should be at least 8 characters long.');
      return;
    }

    try {
      setChangingPassword(true);
      await authService.changePassword({
        old_password: currentPassword,
        new_password: newPassword,
      });
      toast.success('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Error changing password:', err);
      const message =
        err?.response?.data?.detail || 'Failed to change password. Please try again.';
      toast.error(message);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 shadow-xl rounded-2xl mt-8 mb-8 border border-blue-100 dark:border-gray-700">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-400 tracking-tight">
          Settings
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Manage your personal preferences and account security.
        </p>
      </div>

      <div className="space-y-8">
        {/* Theme settings */}
        <section className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Theme</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Choose how the application looks while you work.
          </p>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={theme === 'light'}
                onChange={() => handleThemeChange('light')}
                className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-500 focus:ring-blue-500 dark:bg-gray-600"
              />
              <span className="text-sm text-gray-800 dark:text-gray-200">Light</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={theme === 'dark'}
                onChange={() => handleThemeChange('dark')}
                className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-500 focus:ring-blue-500 dark:bg-gray-600"
              />
              <span className="text-sm text-gray-800 dark:text-gray-200">Dark</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="theme"
                value="system"
                checked={theme === 'system'}
                onChange={() => handleThemeChange('system')}
                className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-500 focus:ring-blue-500 dark:bg-gray-600"
              />
              <span className="text-sm text-gray-800 dark:text-gray-200">Use system preference</span>
            </label>
          </div>

          {savingTheme && (
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Saving theme preference...</p>
          )}
        </section>

        {/* Password change */}
        <section className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Change Password</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Update your password regularly to keep your account secure.
          </p>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500 sm:text-sm"
                autoComplete="current-password"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500 sm:text-sm"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500 sm:text-sm"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={changingPassword}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 ${
                  changingPassword
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
                }`}
              >
                {changingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

