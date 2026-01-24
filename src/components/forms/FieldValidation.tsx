'use client';

import React from 'react';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface FieldValidationProps {
  error?: string;
  success?: string;
  touched?: boolean;
  children: React.ReactNode;
  label?: string;
  required?: boolean;
}

export default function FieldValidation({
  error,
  success,
  touched,
  children,
  label,
  required
}: FieldValidationProps) {
  const showError = touched && error;
  const showSuccess = touched && success && !error;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {children}
        {showError && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
          </div>
        )}
        {showSuccess && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
          </div>
        )}
      </div>
      {showError && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <ExclamationCircleIcon className="h-4 w-4" />
          {error}
        </p>
      )}
      {showSuccess && (
        <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
          <CheckCircleIcon className="h-4 w-4" />
          {success}
        </p>
      )}
    </div>
  );
}
