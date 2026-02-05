'use client';

import React, { useEffect, useState } from 'react';
import { 
  DocumentTextIcon, 
  PlusIcon,
  UserCircleIcon,
  EnvelopeIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { dashboardService } from '@/services/dashboard';
import ProgressBar from './ProgressBar';
import { useAccessControl } from '@/hooks/useAccessControl';

export default function DriverDashboard() {
  const { currentUser } = useAccessControl();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [loadedSections, setLoadedSections] = useState({
    header: false,
    profile: false,
    quickActions: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setProgress(0);
        
        // Simulate progress while fetching
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 2;
          });
        }, 50);

        // Fetch dashboard data (not displayed but kept for potential future use)
        await dashboardService.getStats();
        setData({});
        clearInterval(progressInterval);
        setProgress(100);

        // Sequential loading of sections
        setTimeout(() => setLoadedSections(prev => ({ ...prev, header: true })), 100);
        setTimeout(() => setLoadedSections(prev => ({ ...prev, profile: true })), 300);
        setTimeout(() => setLoadedSections(prev => ({ ...prev, quickActions: true })), 500);
        
        setTimeout(() => setLoading(false), 1000);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-300">Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 dark:hover:bg-red-500"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <ProgressBar progress={progress} label="Loading dashboard..." />
        </div>
      </div>
    );
  }

  // Data is fetched but only profile details are displayed

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <ProgressBar progress={progress} label="Loading dashboard..." />
        </div>
      )}

      {/* Header */}
      <div 
        className={`md:flex md:items-center md:justify-between transition-all duration-500 ${
          loadedSections.header ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        <div className="min-w-0 flex-1">
          <h2 className="text-3xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:truncate sm:text-4xl sm:tracking-tight">
            My Dashboard
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Overview of your BOLs and activities
          </p>
        </div>
        <div className="mt-4 flex gap-3 md:mt-0 md:ml-4">
          <Link
            href="/dashboard/bol"
            className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all"
          >
            <PlusIcon className="h-5 w-5" />
            Create New BOL
          </Link>
        </div>
      </div>

      {/* Profile Details */}
      {currentUser && (
        <div 
          className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-all duration-500 ${
            loadedSections.profile ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <UserCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Profile Details
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <IdentificationIcon className="h-5 w-5 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</div>
                <div className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1">
                  {currentUser.full_name || 'Not set'}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <EnvelopeIcon className="h-5 w-5 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</div>
                <div className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1 break-words">
                  {currentUser.email || 'Not set'}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <UserCircleIcon className="h-5 w-5 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</div>
                <div className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                    Driver
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div 
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-all duration-500 ${
          loadedSections.quickActions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/dashboard/bol"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all hover:shadow-md"
          >
            <PlusIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">Create New BOL</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Add a new bill of lading</div>
            </div>
          </Link>
          <Link
            href="/dashboard/transactions/daily-expense"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all hover:shadow-md"
          >
            <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">Daily Expenses</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Record daily expenses</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
