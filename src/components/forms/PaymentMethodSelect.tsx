'use client';

import React from 'react';
import {
  BanknotesIcon,
  CreditCardIcon,
  BuildingLibraryIcon,
  DocumentCheckIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface PaymentMethodSelectProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  touched?: boolean;
}

const paymentMethods = [
  {
    value: 'CASH',
    label: 'Cash',
    icon: BanknotesIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  {
    value: 'CREDIT_CARD',
    label: 'Credit Card',
    icon: CreditCardIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    value: 'BANK_TRANSFER',
    label: 'Bank Transfer',
    icon: BuildingLibraryIcon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  {
    value: 'CHECK',
    label: 'Check',
    icon: DocumentCheckIcon,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  {
    value: 'ZELLE',
    label: 'Zelle',
    icon: DevicePhoneMobileIcon,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
  },
];

export default function PaymentMethodSelect({
  value,
  onChange,
  required = false,
  error,
  touched
}: PaymentMethodSelectProps) {
  const selectedMethod = paymentMethods.find(m => m.value === value);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Payment Type
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {/* Icon Grid Selection */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-2">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = value === method.value;
          
          return (
            <button
              key={method.value}
              type="button"
              onClick={() => onChange(method.value)}
              className={`
                flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all
                ${isSelected 
                  ? `${method.bgColor} ${method.borderColor} border-2 ring-2 ring-offset-2 ${method.color.replace('text-', 'ring-')}` 
                  : 'bg-white border-gray-200 hover:border-gray-300'
                }
                ${error && touched ? 'border-red-500' : ''}
              `}
            >
              <Icon className={`h-6 w-6 mb-1 ${isSelected ? method.color : 'text-gray-400'}`} />
              <span className={`text-xs font-medium ${isSelected ? method.color : 'text-gray-600'}`}>
                {method.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Traditional Dropdown (Fallback) */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          input w-full
          ${error && touched ? 'border-red-500' : ''}
        `}
        required={required}
      >
        <option value="">Select Payment Type</option>
        {paymentMethods.map((method) => (
          <option key={method.value} value={method.value}>
            {method.label}
          </option>
        ))}
      </select>

      {error && touched && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <ExclamationCircleIcon className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
}
