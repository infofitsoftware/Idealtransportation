import React from 'react';
import { 
  CurrencyDollarIcon, 
  DocumentTextIcon, 
  UserGroupIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'red' | 'purple' | 'yellow';
  loading?: boolean;
}

const iconColors = {
  blue: 'text-blue-600 bg-blue-100',
  green: 'text-green-600 bg-green-100',
  red: 'text-red-600 bg-red-100',
  purple: 'text-purple-600 bg-purple-100',
  yellow: 'text-yellow-600 bg-yellow-100',
};

const borderColors = {
  blue: 'border-blue-200',
  green: 'border-green-200',
  red: 'border-red-200',
  purple: 'border-purple-200',
  yellow: 'border-yellow-200',
};

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = 'blue',
  loading = false 
}: StatsCardProps) {
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 border ${borderColors[color]}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      // If it's a currency value (has decimal places)
      if (val % 1 !== 0 || val >= 1000) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      }
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <div className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border ${borderColors[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold text-gray-900`}>
            {formatValue(value)}
          </p>
          {trend && (
            <div className="mt-2 flex items-center">
              <span className={`text-sm font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`ml-4 p-3 rounded-lg ${iconColors[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
}
