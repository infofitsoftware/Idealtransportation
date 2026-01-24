'use client';

import React, { useState } from 'react';
import { ClockIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ExpenseTemplate {
  id: string;
  description: string;
  amount: number;
  location: string;
}

interface RecurringExpenseTemplateProps {
  onApply: (template: ExpenseTemplate) => void;
  savedTemplates?: ExpenseTemplate[];
  onSaveTemplate?: (template: ExpenseTemplate) => void;
  onDeleteTemplate?: (id: string) => void;
}

const DEFAULT_TEMPLATES: ExpenseTemplate[] = [
  {
    id: 'toll-weekly',
    description: 'Weekly Tolls',
    amount: 0,
    location: 'Various',
  },
  {
    id: 'parking-daily',
    description: 'Daily Parking',
    amount: 0,
    location: 'Various',
  },
  {
    id: 'meals-daily',
    description: 'Daily Meals',
    amount: 0,
    location: 'Various',
  },
];

export default function RecurringExpenseTemplate({
  onApply,
  savedTemplates = [],
  onSaveTemplate,
  onDeleteTemplate
}: RecurringExpenseTemplateProps) {
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [templateForm, setTemplateForm] = useState<ExpenseTemplate>({
    id: '',
    description: '',
    amount: 0,
    location: '',
  });

  const allTemplates = [...DEFAULT_TEMPLATES, ...savedTemplates];

  const handleSaveTemplate = () => {
    if (!templateForm.description || !onSaveTemplate) return;
    
    const newTemplate: ExpenseTemplate = {
      ...templateForm,
      id: `template-${Date.now()}`,
    };
    
    onSaveTemplate(newTemplate);
    setTemplateForm({ id: '', description: '', amount: 0, location: '' });
    setShowTemplateForm(false);
  };

  return (
    <div className="border border-blue-100 rounded-lg p-4 bg-blue-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ClockIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-800">Recurring Expense Templates</h3>
        </div>
        {onSaveTemplate && (
          <button
            type="button"
            onClick={() => setShowTemplateForm(!showTemplateForm)}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <PlusIcon className="h-4 w-4" />
            {showTemplateForm ? 'Cancel' : 'Save Template'}
          </button>
        )}
      </div>

      {showTemplateForm && onSaveTemplate && (
        <div className="mb-3 p-3 bg-white rounded border border-blue-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
            <input
              type="text"
              placeholder="Description"
              value={templateForm.description}
              onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
              className="input text-sm"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Amount"
              value={templateForm.amount || ''}
              onChange={(e) => setTemplateForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              className="input text-sm"
            />
            <input
              type="text"
              placeholder="Location"
              value={templateForm.location}
              onChange={(e) => setTemplateForm(prev => ({ ...prev, location: e.target.value }))}
              className="input text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleSaveTemplate}
            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
          >
            Save Template
          </button>
        </div>
      )}

      {allTemplates.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {allTemplates.map((template) => (
            <div
              key={template.id}
              className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200 hover:border-blue-300 transition-colors"
            >
              <button
                type="button"
                onClick={() => onApply(template)}
                className="text-sm text-gray-700 hover:text-blue-600 transition-colors"
              >
                {template.description}
                {template.amount > 0 && ` ($${template.amount})`}
              </button>
              {onDeleteTemplate && savedTemplates.some(t => t.id === template.id) && (
                <button
                  type="button"
                  onClick={() => onDeleteTemplate(template.id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No templates available. Create one to save time!</p>
      )}
    </div>
  );
}
