'use client';

import React, { useEffect, useState } from 'react';
import { 
  DocumentTextIcon, 
  CurrencyDollarIcon, 
  UserGroupIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { dashboardService, DashboardData } from '@/services/dashboard';
import StatsCard from './StatsCard';
import RecentBOLsWidget from './RecentBOLsWidget';
import ProgressBar from './ProgressBar';

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [loadedSections, setLoadedSections] = useState({
    header: false,
    stats: false,
    secondaryStats: false,
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
        setTimeout(() => setLoadedSections(prev => ({ ...prev, secondaryStats: true })), 500);
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

  const { stats, recent_bols, monthly_revenue } = data;
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
            Admin Dashboard
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Overview of your transportation operations
          </p>
        </div>
        <div className="mt-4 flex gap-3 md:mt-0 md:ml-4">
          <Link
            href="/dashboard/analytics"
            className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all"
          >
            <ChartBarIcon className="h-5 w-5" />
            View Analytics
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
          title="Total BOLs"
          value={stats.total_bols}
          icon={DocumentTextIcon}
          color="blue"
          loading={!loadedSections.stats}
        />
        <StatsCard
          title="Total Revenue"
          value={stats.total_revenue}
          icon={CurrencyDollarIcon}
          color="green"
          loading={!loadedSections.stats}
        />
        <StatsCard
          title="Total Collected"
          value={stats.total_collected}
          icon={ArrowTrendingUpIcon}
          color="purple"
          loading={!loadedSections.stats}
        />
        <StatsCard
          title="Pending Amount"
          value={stats.total_pending}
          icon={ClockIcon}
          color="red"
          loading={!loadedSections.stats}
        />
      </div>

      {/* Secondary Stats */}
      <div 
        className={`grid grid-cols-1 gap-6 sm:grid-cols-3 transition-all duration-500 ${
          loadedSections.secondaryStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <StatsCard
          title="Active Drivers"
          value={stats.active_drivers || 0}
          icon={UserGroupIcon}
          color="yellow"
          loading={!loadedSections.secondaryStats}
        />
        <StatsCard
          title="Payment Completion"
          value={`${completionRate}%`}
          icon={ChartBarIcon}
          color="green"
          loading={!loadedSections.secondaryStats}
        />
        <div className={`bg-white rounded-lg shadow-lg p-6 border border-gray-200 transition-all duration-500 ${
          loadedSections.secondaryStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <h3 className="text-sm font-medium text-gray-600 mb-4">Payment Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Fully Paid</span>
              <span className="text-lg font-semibold text-green-600">
                {stats.payment_breakdown.fully_paid}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Partially Paid</span>
              <span className="text-lg font-semibold text-yellow-600">
                {stats.payment_breakdown.partially_paid}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pending</span>
              <span className="text-lg font-semibold text-red-600">
                {stats.payment_breakdown.pending_payment}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div 
        className={`grid grid-cols-1 gap-6 lg:grid-cols-2 transition-all duration-500 ${
          loadedSections.widgets ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Recent BOLs */}
        <div className={loadedSections.widgets ? 'opacity-100' : 'opacity-0'}>
          <RecentBOLsWidget bols={recent_bols} isAdmin={true} loading={!loadedSections.widgets} />
        </div>

        {/* Monthly Revenue Chart */}
        <div className={`bg-white rounded-lg shadow-lg p-6 border border-gray-200 transition-all duration-500 ${
          loadedSections.widgets ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue (Last 6 Months)</h3>
          {monthly_revenue && monthly_revenue.length > 0 ? (
            <div className="space-y-3">
              {monthly_revenue.map((month, index) => {
                const maxRevenue = Math.max(...monthly_revenue.map(m => m.revenue));
                const percentage = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;
                
                return (
                  <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        ${month.revenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No revenue data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div 
        className={`bg-white rounded-lg shadow-lg p-6 border border-gray-200 transition-all duration-500 ${
          loadedSections.quickActions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/dashboard/bol"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all hover:shadow-md"
          >
            <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            <span className="font-medium text-gray-900">Create BOL</span>
          </Link>
          <Link
            href="/dashboard/reports"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all hover:shadow-md"
          >
            <ChartBarIcon className="h-6 w-6 text-blue-600" />
            <span className="font-medium text-gray-900">View Reports</span>
          </Link>
          <Link
            href="/dashboard/users"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all hover:shadow-md"
          >
            <UserGroupIcon className="h-6 w-6 text-blue-600" />
            <span className="font-medium text-gray-900">Manage Users</span>
          </Link>
          <Link
            href="/dashboard/analytics"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all hover:shadow-md"
          >
            <ChartBarIcon className="h-6 w-6 text-blue-600" />
            <span className="font-medium text-gray-900">Analytics</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
