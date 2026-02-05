'use client';

import React, { useState, useEffect } from 'react';
import { UserIcon, ChevronDownIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { useAccessControl } from '@/hooks/useAccessControl';
import { authService } from '@/services/auth';
import { api } from '@/services/auth';

interface Driver {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
}

interface DriverSelectProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  touched?: boolean;
}

export default function DriverSelect({
  value,
  onChange,
  required = false,
  error,
  touched
}: DriverSelectProps) {
  const { isSuperuser, currentUser } = useAccessControl();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // For admin: fetch list of drivers
    if (isSuperuser) {
      fetchDrivers();
    } else {
      // For driver: auto-populate with their name
      if (currentUser?.full_name) {
        onChange(currentUser.full_name);
      }
    }
  }, [isSuperuser, currentUser]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      // Use the new getDrivers service method
      const driverList = await authService.getDrivers();
      setDrivers(driverList || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      // Fallback: try to get all users if drivers endpoint fails (for admin)
      try {
        const users = await authService.getUsers();
        const driverUsers = users.filter((u: Driver) => !u.is_superuser && u.is_active);
        setDrivers(driverUsers);
      } catch (err) {
        console.error('Error fetching users as fallback:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  // For driver: show disabled input with their name
  if (!isSuperuser) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Driver Name
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type="text"
          value={currentUser?.full_name || value || 'Loading...'}
          disabled
          className="input bg-gray-100 dark:bg-gray-700 cursor-not-allowed text-gray-600 dark:text-gray-300"
          placeholder="Auto-populated from your account"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Auto-populated from your account ({currentUser?.email || ''})
        </p>
      </div>
    );
  }

  // For admin: show searchable dropdown
  const filteredDrivers = drivers.filter((driver) =>
    driver.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedDriver = drivers.find((d) => d.full_name === value);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Driver Name
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`input w-full text-left flex items-center justify-between bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 ${
            error && touched
              ? 'border-red-500 focus:ring-red-500'
              : 'border-blue-200 dark:border-gray-600 focus:ring-blue-500'
          } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          disabled={loading}
        >
          <span className={value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
            {selectedDriver?.full_name || value || 'Select a driver...'}
          </span>
          <ChevronDownIcon
            className={`h-5 w-5 text-gray-400 dark:text-gray-500 transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            {/* Dropdown */}
            <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-hidden">
              {/* Search Input */}
              <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                <input
                  type="text"
                  placeholder="Search drivers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              {/* Driver List */}
              <div className="max-h-48 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">Loading drivers...</div>
                ) : filteredDrivers.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'No drivers found' : 'No drivers available'}
                  </div>
                ) : (
                  filteredDrivers.map((driver) => (
                    <button
                      key={driver.id}
                      type="button"
                      onClick={() => {
                        onChange(driver.full_name || driver.email);
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                      className={`w-full text-left px-4 py-2 transition-colors flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/40 ${
                        value === driver.full_name ? 'bg-blue-100 dark:bg-blue-900/50' : ''
                      }`}
                    >
                      <UserIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {driver.full_name || 'No name'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{driver.email}</div>
                      </div>
                      {value === driver.full_name && (
                        <CheckCircleIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
      {error && touched && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <ExclamationCircleIcon className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
}
