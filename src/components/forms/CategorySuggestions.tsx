'use client';

import React, { useState, useEffect } from 'react';
import { TagIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface CategorySuggestionsProps {
  value: string;
  onChange: (value: string) => void;
  recentCategories?: string[];
  popularCategories?: string[];
}

const DEFAULT_CATEGORIES = [
  'Tolls',
  'Parking',
  'Meals',
  'Lodging',
  'Repairs',
  'Maintenance',
  'Tire Replacement',
  'Oil Change',
  'Washing',
  'Permits',
  'Insurance',
  'Registration',
  'Truck Stop',
  'Rest Area',
  'Other',
];

export default function CategorySuggestions({
  value,
  onChange,
  recentCategories = [],
  popularCategories = []
}: CategorySuggestionsProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    // Combine recent, popular, and default categories
    const allCategories = [
      ...recentCategories,
      ...popularCategories,
      ...DEFAULT_CATEGORIES.filter(c => 
        !recentCategories.includes(c) && !popularCategories.includes(c)
      )
    ];
    setSuggestions(Array.from(new Set(allCategories)));
  }, [recentCategories, popularCategories]);

  const handleSuggestionClick = (category: string) => {
    onChange(category);
    setShowSuggestions(false);
  };

  const filteredSuggestions = value
    ? suggestions.filter(cat => 
        cat.toLowerCase().includes(value.toLowerCase()) && 
        cat.toLowerCase() !== value.toLowerCase()
      )
    : suggestions;

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-2">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Enter expense category..."
          className="input flex-1"
          style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          <div className="p-2">
            <div className="flex items-center gap-2 mb-2 px-2">
              <TagIcon className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Suggestions</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {filteredSuggestions.slice(0, 12).map((category, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(category)}
                  className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showSuggestions && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
}
