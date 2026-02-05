'use client';

import React from 'react';
import { useAccessControl } from '@/hooks/useAccessControl';

export default function ProfilePage() {
  const { currentUser, loading } = useAccessControl();

  if (loading || !currentUser) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 shadow-xl rounded-2xl mt-8 mb-8 border border-blue-100 dark:border-gray-700">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const isAdmin =
    currentUser.is_superuser === true ||
    currentUser.is_superuser === 'true' ||
    currentUser.is_superuser === 1 ||
    currentUser.is_superuser === '1';

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 shadow-xl rounded-2xl mt-8 mb-8 border border-blue-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-400 tracking-tight">
            Your Profile
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            View your account details and role in the system.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <section className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Basic Information</h2>
          <dl className="divide-y divide-gray-200 dark:divide-gray-600">
            <div className="py-3 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</dt>
              <dd className="mt-0 text-sm text-gray-900 dark:text-gray-100 col-span-2">
                {currentUser.full_name || 'Not set'}
              </dd>
            </div>
            <div className="py-3 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
              <dd className="mt-0 text-sm text-gray-900 dark:text-gray-100 col-span-2 break-words">
                {currentUser.email}
              </dd>
            </div>
            <div className="py-3 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</dt>
              <dd className="mt-0 text-sm text-gray-900 dark:text-gray-100 col-span-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                  {isAdmin ? 'Administrator' : 'Driver'}
                </span>
              </dd>
            </div>
            <div className="py-3 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
              <dd className="mt-0 text-sm text-gray-900 dark:text-gray-100 col-span-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                  Active
                </span>
              </dd>
            </div>
          </dl>
        </section>

        <section className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Profile Management</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            At the moment, your name and email are managed by the administrator. If you need
            to update these details, please contact your system administrator.
          </p>
        </section>
      </div>
    </div>
  );
}

