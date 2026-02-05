'use client';

import React, { useState } from 'react';
import { DocumentTextIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { PendingWorkOrder } from '@/services/transaction';

interface WorkOrderSelectProps {
  value: string;
  onChange: (value: string) => void;
  pendingWorkOrders: PendingWorkOrder[];
  loading?: boolean;
  required?: boolean;
  error?: string;
  touched?: boolean;
}

export default function WorkOrderSelect({
  value,
  onChange,
  pendingWorkOrders,
  loading = false,
  required = false,
  error,
  touched,
}: WorkOrderSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedWO = pendingWorkOrders.find((wo) => wo.work_order_no === value);

  return (
    <div className="relative">
      <label htmlFor="workOrderNo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Work Order Number <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <button
          type="button"
          id="workOrderNo"
          onClick={() => !loading && setIsOpen(!isOpen)}
          className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-md border mb-1 text-sm sm:text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
            error && touched ? 'border-red-500 focus:ring-red-500' : ''
          } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          disabled={loading}
        >
          <span className={value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
            {selectedWO
              ? `${selectedWO.work_order_no} - ${selectedWO.driver_name} (Due: $${selectedWO.due_amount.toFixed(2)})`
              : 'Select Work Order'}
          </span>
          <ChevronDownIcon
            className={`h-5 w-5 text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2 transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Loading work orders...
                </div>
              ) : pendingWorkOrders.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No pending work orders
                </div>
              ) : (
                pendingWorkOrders.map((wo) => (
                  <button
                    key={wo.work_order_no}
                    type="button"
                    onClick={() => {
                      onChange(wo.work_order_no);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 transition-colors flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/40 ${
                      value === wo.work_order_no ? 'bg-blue-100 dark:bg-blue-900/50' : ''
                    }`}
                  >
                    <DocumentTextIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {wo.work_order_no} - {wo.driver_name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Due: ${wo.due_amount.toFixed(2)}
                      </div>
                    </div>
                    {value === wo.work_order_no && (
                      <CheckCircleIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>
      {loading && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Loading work orders...</p>
      )}
    </div>
  );
}
