'use client';

import React, { useState } from 'react';
import { TrashIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import FieldValidation from './FieldValidation';
import ReceiptUpload from './ReceiptUpload';

export interface ExpenseRowData {
  id?: string; // Temporary ID for frontend
  expense_type: string;
  sub_type?: string;
  amount: string;
  location: string;
  payment_mode: string;
  receipt_file?: File | null;
  receipt_url?: string;
  remarks?: string;
}

interface ExpenseRowProps {
  row: ExpenseRowData;
  index: number;
  onChange: (index: number, field: keyof ExpenseRowData, value: any) => void;
  onDelete: (index: number) => void;
  touched?: Record<string, boolean>;
  errors?: Record<string, string>;
}

const EXPENSE_TYPES = [
  { value: 'Fuel', label: 'Fuel' },
  { value: 'Toll', label: 'Toll' },
  { value: 'Food', label: 'Food' },
  { value: 'Parking', label: 'Parking' },
  { value: 'Maintenance', label: 'Maintenance' },
  { value: 'Phone', label: 'Phone' },
  { value: 'Misc', label: 'Miscellaneous' },
];

const SUB_TYPES: Record<string, Array<{ value: string; label: string }>> = {
  Fuel: [
    { value: 'Diesel', label: 'Diesel' },
    { value: 'Petrol', label: 'Petrol' },
    { value: 'CNG', label: 'CNG' },
    { value: 'DEF', label: 'DEF' },
  ],
  Maintenance: [
    { value: 'Oil Change', label: 'Oil Change' },
    { value: 'Tire Replacement', label: 'Tire Replacement' },
    { value: 'Repairs', label: 'Repairs' },
    { value: 'Washing', label: 'Washing' },
  ],
  Food: [
    { value: 'Meals', label: 'Meals' },
    { value: 'Snacks', label: 'Snacks' },
    { value: 'Beverages', label: 'Beverages' },
  ],
};

const PAYMENT_MODES = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHECK', label: 'Check' },
  { value: 'ZELLE', label: 'Zelle' },
  { value: 'UPI', label: 'UPI' },
  { value: 'COMPANY_WALLET', label: 'Company Wallet' },
];

export default function ExpenseRow({
  row,
  index,
  onChange,
  onDelete,
  touched = {},
  errors = {},
}: ExpenseRowProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleChange = (field: keyof ExpenseRowData, value: any) => {
    onChange(index, field, value);
  };

  const subTypeOptions = row.expense_type ? (SUB_TYPES[row.expense_type] || []) : [];

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Row Header - Mobile Card View */}
      <div 
        className="p-3 sm:p-4 flex items-center justify-between cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">
              {row.expense_type || 'New Expense'}
            </span>
            {row.sub_type && (
              <span className="text-xs text-gray-500">• {row.sub_type}</span>
            )}
          </div>
          <div className="text-lg font-bold text-blue-600 mt-1">
            ${parseFloat(row.amount || '0').toFixed(2)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(index);
            }}
            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Row Content - Expandable */}
      {isExpanded && (
        <div className="p-4 space-y-4 border-t border-gray-200 overflow-x-auto">
          {/* Desktop Table View */}
          <div className="hidden md:grid md:grid-cols-12 gap-3 min-w-0">
            <div className="col-span-2 min-w-0">
              <FieldValidation
                error={errors[`${index}_expense_type`]}
                touched={touched[`${index}_expense_type`]}
                required
              >
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Expense Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={row.expense_type}
                  onChange={(e) => {
                    handleChange('expense_type', e.target.value);
                    handleChange('sub_type', ''); // Reset sub_type when type changes
                  }}
                  className={`input text-sm w-full min-w-0 ${errors[`${index}_expense_type`] && touched[`${index}_expense_type`] ? 'border-red-500' : ''}`}
                  required
                >
                  <option value="">Select Type</option>
                  {EXPENSE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </FieldValidation>
            </div>

            <div className="col-span-2 min-w-0">
              {subTypeOptions.length > 0 && (
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Sub-Type
                </label>
              )}
              {subTypeOptions.length > 0 ? (
                <select
                  value={row.sub_type || ''}
                  onChange={(e) => handleChange('sub_type', e.target.value)}
                  className="input text-sm w-full min-w-0"
                >
                  <option value="">Select Sub-Type</option>
                  {subTypeOptions.map((sub) => (
                    <option key={sub.value} value={sub.value}>
                      {sub.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-gray-400 py-2">N/A</div>
              )}
            </div>

            <div className="col-span-1 min-w-0">
              <FieldValidation
                error={errors[`${index}_amount`]}
                touched={touched[`${index}_amount`]}
                required
              >
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={row.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  className={`input text-sm w-full min-w-0 ${errors[`${index}_amount`] && touched[`${index}_amount`] ? 'border-red-500' : ''}`}
                  placeholder="0.00"
                  required
                />
              </FieldValidation>
            </div>

            <div className="col-span-2 min-w-0">
              <FieldValidation
                error={errors[`${index}_location`]}
                touched={touched[`${index}_location`]}
                required
              >
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={row.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className={`input text-sm w-full min-w-0 ${errors[`${index}_location`] && touched[`${index}_location`] ? 'border-red-500' : ''}`}
                  placeholder="Enter location"
                  style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                  required
                />
              </FieldValidation>
            </div>

            <div className="col-span-2 min-w-0">
              <FieldValidation
                error={errors[`${index}_payment_mode`]}
                touched={touched[`${index}_payment_mode`]}
                required
              >
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Payment Mode <span className="text-red-500">*</span>
                </label>
                <select
                  value={row.payment_mode}
                  onChange={(e) => handleChange('payment_mode', e.target.value)}
                  className={`input text-sm w-full min-w-0 ${errors[`${index}_payment_mode`] && touched[`${index}_payment_mode`] ? 'border-red-500' : ''}`}
                  required
                >
                  <option value="">Select Payment Mode</option>
                  {PAYMENT_MODES.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </FieldValidation>
            </div>

            <div className="col-span-3 min-w-0">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                value={row.remarks || ''}
                onChange={(e) => handleChange('remarks', e.target.value)}
                className="input text-sm w-full min-w-0 min-h-[60px] resize-y"
                placeholder="Optional remarks..."
                style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
              />
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FieldValidation
                error={errors[`${index}_expense_type`]}
                touched={touched[`${index}_expense_type`]}
                required
              >
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Expense Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={row.expense_type}
                    onChange={(e) => {
                      handleChange('expense_type', e.target.value);
                      handleChange('sub_type', '');
                    }}
                    className={`input text-sm ${errors[`${index}_expense_type`] && touched[`${index}_expense_type`] ? 'border-red-500' : ''}`}
                    required
                  >
                    <option value="">Select Type</option>
                    {EXPENSE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </FieldValidation>

              {subTypeOptions.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Sub-Type
                  </label>
                  <select
                    value={row.sub_type || ''}
                    onChange={(e) => handleChange('sub_type', e.target.value)}
                    className="input text-sm"
                  >
                    <option value="">Select Sub-Type</option>
                    {subTypeOptions.map((sub) => (
                      <option key={sub.value} value={sub.value}>
                        {sub.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <FieldValidation
              error={errors[`${index}_amount`]}
              touched={touched[`${index}_amount`]}
              required
            >
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={row.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  className={`input text-sm ${errors[`${index}_amount`] && touched[`${index}_amount`] ? 'border-red-500' : ''}`}
                  placeholder="0.00"
                  required
                />
              </div>
            </FieldValidation>

            <FieldValidation
              error={errors[`${index}_location`]}
              touched={touched[`${index}_location`]}
              required
            >
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={row.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className={`input text-sm ${errors[`${index}_location`] && touched[`${index}_location`] ? 'border-red-500' : ''}`}
                  placeholder="Enter location"
                  style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                  required
                />
              </div>
            </FieldValidation>

            <FieldValidation
              error={errors[`${index}_payment_mode`]}
              touched={touched[`${index}_payment_mode`]}
              required
            >
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Payment Mode <span className="text-red-500">*</span>
                </label>
                <select
                  value={row.payment_mode}
                  onChange={(e) => handleChange('payment_mode', e.target.value)}
                  className={`input text-sm ${errors[`${index}_payment_mode`] && touched[`${index}_payment_mode`] ? 'border-red-500' : ''}`}
                  required
                >
                  <option value="">Select Payment Mode</option>
                  {PAYMENT_MODES.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </div>
            </FieldValidation>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                value={row.remarks || ''}
                onChange={(e) => handleChange('remarks', e.target.value)}
                className="input text-sm min-h-[60px] resize-y"
                placeholder="Optional remarks..."
                style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
              />
            </div>
          </div>

          {/* Receipt Upload - Both Views */}
          <div>
            <ReceiptUpload
              value={row.receipt_file || null}
              onChange={(file) => handleChange('receipt_file', file)}
              label="Receipt Upload (Optional)"
            />
          </div>
        </div>
      )}
    </div>
  );
}
