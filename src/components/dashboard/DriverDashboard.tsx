'use client';

import React, { useEffect, useState } from 'react';
import { 
  DocumentTextIcon, 
  CurrencyDollarIcon, 
  ClockIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { dashboardService, DashboardData } from '@/services/dashboard';
import StatsCard from './StatsCard';
import RecentBOLsWidget from './RecentBOLsWidget';
import ProgressBar from './ProgressBar';

export default function DriverDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [loadedSections, setLoadedSections] = useState({
    header: false,
    stats: false,
    paymentStatus: false,
    widgets: false,
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

        const dashboardData = await dashboardService.getStats();
        setData(dashboardData);
        clearInterval(progressInterval);
        setProgress(100);

        // Sequential loading of sections
        setTimeout(() => setLoadedSections(prev => ({ ...prev, header: true })), 100);
        setTimeout(() => setLoadedSections(prev => ({ ...prev, stats: true })), 300);
        setTimeout(() => setLoadedSections(prev => ({ ...prev, paymentStatus: true })), 500);
        setTimeout(() => setLoadedSections(prev => ({ ...prev, widgets: true })), 700);
        setTimeout(() => setLoadedSections(prev => ({ ...prev, quickActions: true })), 900);
        
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
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <ProgressBar progress={progress} label="Loading dashboard..." />
        </div>
      </div>
    );
  }

  const { stats, recent_bols } = data;
  const completionRate = stats.total_revenue > 0 
    ? ((stats.total_collected / stats.total_revenue) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      {loading && (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
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
          <h2 className="text-3xl font-bold leading-7 text-gray-900 sm:truncate sm:text-4xl sm:tracking-tight">
            My Dashboard
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Overview of your BOLs and payments
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

      {/* Stats Cards */}
      <div 
        className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 transition-all duration-500 ${
          loadedSections.stats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <StatsCard
          title="My BOLs"
          value={stats.total_bols}
          icon={DocumentTextIcon}
          color="blue"
          loading={!loadedSections.stats}
        />
        <StatsCard
          title="My Revenue"
          value={stats.total_revenue}
          icon={CurrencyDollarIcon}
          color="green"
          loading={!loadedSections.stats}
        />
        <StatsCard
          title="Collected"
          value={stats.total_collected}
          icon={CurrencyDollarIcon}
          color="purple"
          loading={!loadedSections.stats}
        />
        <StatsCard
          title="Pending"
          value={stats.total_pending}
          icon={ClockIcon}
          color="red"
          loading={!loadedSections.stats}
        />
      </div>

      {/* Payment Status Summary */}
      <div 
        className={`bg-white rounded-lg shadow-lg p-6 border border-gray-200 transition-all duration-500 ${
          loadedSections.paymentStatus ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {stats.payment_breakdown.fully_paid}
            </div>
            <div className="text-sm text-green-700">Fully Paid</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-600 mb-1">
              {stats.payment_breakdown.partially_paid}
            </div>
            <div className="text-sm text-yellow-700">Partially Paid</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600 mb-1">
              {stats.payment_breakdown.pending_payment}
            </div>
            <div className="text-sm text-red-700">Pending</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Payment Completion Rate</span>
            <span className="text-lg font-bold text-gray-900">{completionRate}%</span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-green-500 to-green-600 h-2.5 rounded-full transition-all duration-1000"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Recent BOLs */}
      <div 
        className={`transition-all duration-500 ${
          loadedSections.widgets ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <RecentBOLsWidget bols={recent_bols} isAdmin={false} loading={!loadedSections.widgets} />
      </div>

      {/* Quick Actions */}
      <div 
        className={`bg-white rounded-lg shadow-lg p-6 border border-gray-200 transition-all duration-500 ${
          loadedSections.quickActions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/dashboard/bol"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all hover:shadow-md"
          >
            <PlusIcon className="h-6 w-6 text-blue-600" />
            <div>
              <div className="font-medium text-gray-900">Create New BOL</div>
              <div className="text-sm text-gray-500">Add a new bill of lading</div>
            </div>
          </Link>
          <Link
            href="/dashboard/reports"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all hover:shadow-md"
          >
            <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            <div>
              <div className="font-medium text-gray-900">My Reports</div>
              <div className="text-sm text-gray-500">View my BOL reports</div>
            </div>
          </Link>
          <Link
            href="/dashboard/transactions/daily-expense"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all hover:shadow-md"
          >
            <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            <div>
              <div className="font-medium text-gray-900">Daily Expenses</div>
              <div className="text-sm text-gray-500">Record daily expenses</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
