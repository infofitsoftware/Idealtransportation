import React from 'react';
import { DocumentTextIcon, EyeIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { RecentBOL } from '@/services/dashboard';

interface RecentBOLsWidgetProps {
  bols: RecentBOL[];
  loading?: boolean;
  isAdmin?: boolean;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusBadge(status: 'paid' | 'partial' | 'pending') {
  const styles = {
    paid: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
    partial: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300',
    pending: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300',
  };

  const labels = {
    paid: 'Paid',
    partial: 'Partial',
    pending: 'Pending',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function RecentBOLsWidget({ bols, loading = false, isAdmin = false }: RecentBOLsWidgetProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent BOLs</h3>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 dark:bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (bols.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isAdmin ? 'Recent BOLs' : 'My Recent BOLs'}
          </h3>
        </div>
        <div className="text-center py-8">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No BOLs found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {isAdmin ? 'Recent BOLs' : 'My Recent BOLs'}
        </h3>
        <Link 
          href="/dashboard/reports" 
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
        >
          View All
        </Link>
      </div>
      <div className="space-y-3">
        {bols.map((bol) => (
          <Link
            key={bol.id}
            href={`/dashboard/bol/detail?id=${bol.id}`}
            className="block p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {bol.work_order_no || `BOL #${bol.id}`}
                  </span>
                  {getStatusBadge(bol.status)}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  {isAdmin && (
                    <span className="truncate">{bol.driver_name}</span>
                  )}
                  <span>{formatDate(bol.date)}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(bol.total_amount)}
                  </span>
                </div>
              </div>
              <EyeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 ml-2 flex-shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
