'use client';

import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface FormProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{ label: string; completed: boolean }>;
}

export default function FormProgress({ currentStep, totalSteps, steps }: FormProgressProps) {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-6">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 mb-4">
        <div
          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        >
          <div className="h-full w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div className="flex items-center w-full">
              {/* Step Circle */}
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
                  step.completed
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : index + 1 === currentStep
                    ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-300'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                }`}
              >
                {step.completed ? (
                  <CheckCircleIcon className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                className={`flex-1 h-0.5 mx-2 transition-all ${
                  step.completed ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                />
              )}
            </div>
            {/* Step Label */}
            <div className="mt-2 text-center">
              <p
                className={`text-xs font-medium ${
                  step.completed || index + 1 === currentStep
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {step.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
