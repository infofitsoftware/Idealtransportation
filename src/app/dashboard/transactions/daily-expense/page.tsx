'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, TagIcon, ChevronDownIcon, ChevronUpIcon, CalculatorIcon, TruckIcon } from '@heroicons/react/24/outline'
import { dailyExpenseService } from '@/services/dailyExpense'
import { authService } from '@/services/auth'
import toast from 'react-hot-toast'
import FormHeader from '@/components/FormHeader'
import FormProgress from '@/components/forms/FormProgress'
import FieldValidation from '@/components/forms/FieldValidation'
import ReceiptUpload from '@/components/forms/ReceiptUpload'
import CategorySuggestions from '@/components/forms/CategorySuggestions'
import RecurringExpenseTemplate from '@/components/forms/RecurringExpenseTemplate'

const FORM_SECTIONS = [
  { id: 'basic', label: 'Basic Info', completed: false },
  { id: 'diesel', label: 'Diesel', completed: false },
  { id: 'def', label: 'DEF', completed: false },
  { id: 'other', label: 'Other', completed: false },
];

interface ExpenseTemplate {
  id: string;
  description: string;
  amount: number;
  location: string;
}

export default function DailyExpenseForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    date: '',
    diesel_amount: '',
    diesel_location: '',
    def_amount: '',
    def_location: '',
    other_expense_description: '',
    other_expense_amount: '',
    other_expense_location: '',
    total: ''
  })
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  
  // Field validation states
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  
  // Collapsible sections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    basic: false,
    diesel: false,
    def: false,
    other: false,
  })
  
  // Templates and suggestions
  const [savedTemplates, setSavedTemplates] = useState<ExpenseTemplate[]>([])
  const [recentCategories, setRecentCategories] = useState<string[]>([])
  const [popularCategories, setPopularCategories] = useState<string[]>([])

  useEffect(() => {
    // Get current user info
    const fetchUser = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (user) {
          setCurrentUser(user)
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }
    
    fetchUser()
    loadRecentExpenses()
    loadSavedTemplates()
  }, [])

  // Auto-populate date
  useEffect(() => {
    if (!formData.date) {
      const today = new Date().toISOString().split('T')[0]
      setFormData(prev => ({ ...prev, date: today }))
    }
  }, [])

  // Calculate total
  useEffect(() => {
    const total = 
      parseFloat(formData.diesel_amount || '0') + 
      parseFloat(formData.def_amount || '0') + 
      parseFloat(formData.other_expense_amount || '0')
    setFormData(prev => ({ ...prev, total: total.toFixed(2) }))
  }, [formData.diesel_amount, formData.def_amount, formData.other_expense_amount])

  const loadRecentExpenses = async () => {
    try {
      const expenses = await dailyExpenseService.getExpenses()
      if (expenses && expenses.length > 0) {
        // Extract recent categories from other_expense_description
        const categories = expenses
          .map(e => e.other_expense_description)
          .filter((cat): cat is string => !!cat)
          .slice(0, 10)
        setRecentCategories(Array.from(new Set(categories)))
        
        // Popular categories (most frequent)
        const categoryCounts: Record<string, number> = {}
        expenses.forEach(e => {
          if (e.other_expense_description) {
            categoryCounts[e.other_expense_description] = (categoryCounts[e.other_expense_description] || 0) + 1
          }
        })
        const popular = Object.entries(categoryCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([cat]) => cat)
        setPopularCategories(popular)
      }
    } catch (error) {
      console.error('Error loading recent expenses:', error)
    }
  }

  const loadSavedTemplates = () => {
    // Load from localStorage
    try {
      const saved = localStorage.getItem('expense_templates')
      if (saved) {
        setSavedTemplates(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading saved templates:', error)
    }
  }

  const saveTemplate = (template: ExpenseTemplate) => {
    const updated = [...savedTemplates, template]
    setSavedTemplates(updated)
    localStorage.setItem('expense_templates', JSON.stringify(updated))
    toast.success('Template saved successfully!')
  }

  const deleteTemplate = (id: string) => {
    const updated = savedTemplates.filter(t => t.id !== id)
    setSavedTemplates(updated)
    localStorage.setItem('expense_templates', JSON.stringify(updated))
    toast.success('Template deleted')
  }

  const applyTemplate = (template: ExpenseTemplate) => {
    setFormData(prev => ({
      ...prev,
      other_expense_description: template.description,
      other_expense_amount: template.amount > 0 ? template.amount.toString() : '',
      other_expense_location: template.location,
    }))
    toast.success('Template applied!')
  }

  // Calculate form progress
  const calculateProgress = () => {
    let completedSteps = 0
    const steps = FORM_SECTIONS.map((section) => {
      let completed = false
      
      switch (section.id) {
        case 'basic':
          completed = !!formData.date
          break
        case 'diesel':
          completed = !!(formData.diesel_amount && formData.diesel_location)
          break
        case 'def':
          completed = !!(formData.def_amount && formData.def_location)
          break
        case 'other':
          completed = true // Optional
          break
      }
      
      if (completed) completedSteps++
      return { ...section, completed }
    })
    
    return { steps, currentStep: completedSteps, totalSteps: FORM_SECTIONS.length }
  }

  const { steps, currentStep, totalSteps } = calculateProgress()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Mark required fields as touched
    setTouchedFields({
      date: true,
      diesel_amount: true,
      diesel_location: true,
      def_amount: true,
      def_location: true,
    })
    
    // Validate required fields
    const errors: Record<string, string> = {}
    if (!formData.date) errors.date = 'Date is required'
    if (!formData.diesel_amount) errors.diesel_amount = 'Diesel amount is required'
    if (!formData.diesel_location) errors.diesel_location = 'Diesel location is required'
    if (!formData.def_amount) errors.def_amount = 'DEF amount is required'
    if (!formData.def_location) errors.def_location = 'DEF location is required'
    
    setFieldErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      toast.error('Please fill in all required fields')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      if (!authService.isAuthenticated()) {
        router.push('/auth/login')
        return
      }

      // Calculate total
      const total = 
        parseFloat(formData.diesel_amount || '0') + 
        parseFloat(formData.def_amount || '0') + 
        parseFloat(formData.other_expense_amount || '0')

      const expenseData = {
        ...formData,
        diesel_amount: parseFloat(formData.diesel_amount),
        def_amount: parseFloat(formData.def_amount),
        other_expense_amount: formData.other_expense_amount ? parseFloat(formData.other_expense_amount) : undefined,
        total: total
      }

      await dailyExpenseService.createExpense(expenseData)
      
      // TODO: Upload receipt if file is present
      if (receiptFile) {
        // In a real implementation, you would upload the file to a storage service
        console.log('Receipt file to upload:', receiptFile.name)
        toast.success('Receipt will be uploaded (feature in development)')
      }
      
      toast.success('Daily expense saved successfully!')
      setTimeout(() => router.push('/dashboard/transactions'), 1200)
    } catch (error: any) {
      console.error('Error creating daily expense:', error)
      toast.error(error.response?.data?.detail || 'Failed to create daily expense')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Mark field as touched
    if (!touchedFields[name]) {
      setTouchedFields(prev => ({ ...prev, [name]: true }))
    }
    
    // Clear errors when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  function SectionHeader({ 
    icon: Icon, 
    title, 
    isCollapsed, 
    onToggle 
  }: { 
    icon: any; 
    title: string;
    isCollapsed?: boolean;
    onToggle?: () => void;
  }) {
    return (
      <div 
        className={`flex items-center justify-between mb-4 ${onToggle ? 'cursor-pointer' : ''}`}
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-6 w-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800 tracking-tight">{title}</h2>
        </div>
        {onToggle && (
          isCollapsed ? (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronUpIcon className="h-5 w-5 text-gray-400" />
          )
        )}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white shadow-xl rounded-2xl mt-4 sm:mt-8 mb-4 sm:mb-8 border border-blue-100">
      <FormHeader />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-700 tracking-tight">Daily Expense Form</h1>
        <button
          onClick={() => router.push('/dashboard/transactions')}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Back to Transactions
        </button>
      </div>

      {/* Form Progress Indicator */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <FormProgress 
          currentStep={currentStep} 
          totalSteps={totalSteps} 
          steps={steps}
        />
      </div>

      {/* Total Amount Display */}
      <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-gray-700">Total Expense:</span>
          <span className="text-2xl sm:text-3xl font-bold text-green-700 ml-3">${parseFloat(formData.total || '0').toFixed(2)}</span>
        </div>
        <CalculatorIcon className="h-8 w-8 text-green-600" />
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information - Collapsible */}
        <div className="border border-blue-100 rounded-lg p-4 sm:p-6 bg-blue-50">
          <SectionHeader
            icon={TagIcon}
            title="Basic Information"
            isCollapsed={collapsedSections.basic}
            onToggle={() => toggleSection('basic')}
          />
          {!collapsedSections.basic && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="driver_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Driver Name
                </label>
                <input
                  type="text"
                  name="driver_name"
                  id="driver_name"
                  value={currentUser?.full_name || 'Loading...'}
                  disabled
                  className="input bg-gray-100 cursor-not-allowed text-gray-600"
                  placeholder="Loading user name..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {currentUser ? `Auto-populated from your account (${currentUser.email})` : 'Loading user data...'}
                </p>
              </div>
              <FieldValidation
                error={fieldErrors.date}
                touched={touchedFields.date}
                required
              >
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    id="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, date: true }))}
                    className={`input ${fieldErrors.date && touchedFields.date ? 'border-red-500' : ''}`}
                  />
                </div>
              </FieldValidation>
            </div>
          )}
        </div>

        {/* Diesel Expenses - Collapsible */}
        <div className="border border-blue-100 rounded-lg p-4 sm:p-6 bg-gray-50">
          <SectionHeader
            icon={TruckIcon}
            title="Diesel Expenses"
            isCollapsed={collapsedSections.diesel}
            onToggle={() => toggleSection('diesel')}
          />
          {!collapsedSections.diesel && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldValidation
                error={fieldErrors.diesel_amount}
                touched={touchedFields.diesel_amount}
                required
              >
                <div>
                  <label htmlFor="diesel_amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Diesel Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="diesel_amount"
                    id="diesel_amount"
                    required
                    value={formData.diesel_amount}
                    onChange={handleChange}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, diesel_amount: true }))}
                    className={`input ${fieldErrors.diesel_amount && touchedFields.diesel_amount ? 'border-red-500' : ''}`}
                    placeholder="0.00"
                  />
                </div>
              </FieldValidation>

              <FieldValidation
                error={fieldErrors.diesel_location}
                touched={touchedFields.diesel_location}
                required
              >
                <div>
                  <label htmlFor="diesel_location" className="block text-sm font-medium text-gray-700 mb-1">
                    Diesel Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="diesel_location"
                    id="diesel_location"
                    required
                    value={formData.diesel_location}
                    onChange={handleChange}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, diesel_location: true }))}
                    className={`input ${fieldErrors.diesel_location && touchedFields.diesel_location ? 'border-red-500' : ''}`}
                    placeholder="Enter location"
                    style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                  />
                </div>
              </FieldValidation>
            </div>
          )}
        </div>

        {/* DEF Expenses - Collapsible */}
        <div className="border border-blue-100 rounded-lg p-4 sm:p-6 bg-blue-50">
          <SectionHeader
            icon={TruckIcon}
            title="DEF Expenses"
            isCollapsed={collapsedSections.def}
            onToggle={() => toggleSection('def')}
          />
          {!collapsedSections.def && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldValidation
                error={fieldErrors.def_amount}
                touched={touchedFields.def_amount}
                required
              >
                <div>
                  <label htmlFor="def_amount" className="block text-sm font-medium text-gray-700 mb-1">
                    DEF Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="def_amount"
                    id="def_amount"
                    required
                    value={formData.def_amount}
                    onChange={handleChange}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, def_amount: true }))}
                    className={`input ${fieldErrors.def_amount && touchedFields.def_amount ? 'border-red-500' : ''}`}
                    placeholder="0.00"
                  />
                </div>
              </FieldValidation>

              <FieldValidation
                error={fieldErrors.def_location}
                touched={touchedFields.def_location}
                required
              >
                <div>
                  <label htmlFor="def_location" className="block text-sm font-medium text-gray-700 mb-1">
                    DEF Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="def_location"
                    id="def_location"
                    required
                    value={formData.def_location}
                    onChange={handleChange}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, def_location: true }))}
                    className={`input ${fieldErrors.def_location && touchedFields.def_location ? 'border-red-500' : ''}`}
                    placeholder="Enter location"
                    style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                  />
                </div>
              </FieldValidation>
            </div>
          )}
        </div>

        {/* Other Expenses - Collapsible */}
        <div className="border border-blue-100 rounded-lg p-4 sm:p-6 bg-gray-50">
          <SectionHeader
            icon={TagIcon}
            title="Other Expenses"
            isCollapsed={collapsedSections.other}
            onToggle={() => toggleSection('other')}
          />
          {!collapsedSections.other && (
            <>
              {/* Recurring Expense Templates */}
              <div className="mb-4">
                <RecurringExpenseTemplate
                  onApply={applyTemplate}
                  savedTemplates={savedTemplates}
                  onSaveTemplate={saveTemplate}
                  onDeleteTemplate={deleteTemplate}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="other_expense_description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <CategorySuggestions
                    value={formData.other_expense_description}
                    onChange={(value) => {
                      setFormData(prev => ({ ...prev, other_expense_description: value }))
                    }}
                    recentCategories={recentCategories}
                    popularCategories={popularCategories}
                  />
                </div>

                <div>
                  <label htmlFor="other_expense_amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="other_expense_amount"
                    id="other_expense_amount"
                    value={formData.other_expense_amount}
                    onChange={handleChange}
                    className="input"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label htmlFor="other_expense_location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    name="other_expense_location"
                    id="other_expense_location"
                    value={formData.other_expense_location}
                    onChange={handleChange}
                    className="input"
                    placeholder="Enter location"
                    style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                  />
                </div>
              </div>

              {/* Receipt Upload */}
              <div className="mt-4">
                <ReceiptUpload
                  value={receiptFile}
                  onChange={setReceiptFile}
                  label="Receipt Upload (Optional)"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.push('/dashboard/transactions')}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium shadow-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-base font-medium rounded-lg shadow-sm text-white transition-colors ${
              isSubmitting
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            {isSubmitting ? 'Creating...' : 'Create Daily Expense'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .input {
          @apply border border-blue-200 rounded px-3 py-2 w-full mb-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm sm:text-base;
          word-wrap: break-word;
          overflow-wrap: break-word;
          white-space: normal;
        }
      `}</style>
    </div>
  )
}
