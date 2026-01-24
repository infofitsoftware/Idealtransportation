'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, CalculatorIcon, UserIcon, CalendarDaysIcon, TruckIcon } from '@heroicons/react/24/outline'
import { dailyExpenseService, DailyExpenseEntryData } from '@/services/dailyExpense'
import { authService } from '@/services/auth'
import toast from 'react-hot-toast'
import FormHeader from '@/components/FormHeader'
import ExpenseRow, { ExpenseRowData } from '@/components/forms/ExpenseRow'

export default function DailyExpenseForm() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Header fields
  const [headerData, setHeaderData] = useState({
    date: '',
    vehicle_number: '',
  })
  
  // Expense rows
  const [expenseRows, setExpenseRows] = useState<ExpenseRowData[]>([
    {
      id: `row-${Date.now()}`,
      expense_type: '',
      sub_type: '',
      amount: '',
      location: '',
      payment_mode: '',
      receipt_file: null,
      remarks: '',
    }
  ])
  
  // Validation states
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
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
    
    // Auto-populate date
    const today = new Date().toISOString().split('T')[0]
    setHeaderData(prev => ({ ...prev, date: today }))
  }, [])

  // Calculate total
  const calculateTotal = () => {
    return expenseRows.reduce((sum, row) => {
      const amount = parseFloat(row.amount || '0')
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0)
  }

  const handleHeaderChange = (field: string, value: string) => {
    setHeaderData(prev => ({ ...prev, [field]: value }))
    if (touchedFields[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleRowChange = (index: number, field: keyof ExpenseRowData, value: any) => {
    setExpenseRows(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
    
    // Clear error when user types
    const errorKey = `${index}_${field}`
    if (fieldErrors[errorKey]) {
      setFieldErrors(prev => {
        const updated = { ...prev }
        delete updated[errorKey]
        return updated
      })
    }
  }

  const addExpenseRow = () => {
    setExpenseRows(prev => [...prev, {
      id: `row-${Date.now()}-${Math.random()}`,
      expense_type: '',
      sub_type: '',
      amount: '',
      location: '',
      payment_mode: '',
      receipt_file: null,
      remarks: '',
    }])
  }

  const deleteExpenseRow = (index: number) => {
    if (expenseRows.length > 1) {
      setExpenseRows(prev => prev.filter((_, i) => i !== index))
      
      // Clear errors for deleted row
      setFieldErrors(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(key => {
          if (key.startsWith(`${index}_`)) {
            delete updated[key]
          }
        })
        return updated
      })
    } else {
      toast.error('At least one expense entry is required')
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    let isValid = true

    // Validate header
    if (!headerData.date) {
      errors.date = 'Date is required'
      isValid = false
    }

    // Validate rows
    expenseRows.forEach((row, index) => {
      if (!row.expense_type) {
        errors[`${index}_expense_type`] = 'Expense type is required'
        isValid = false
      }
      if (!row.amount || parseFloat(row.amount) <= 0) {
        errors[`${index}_amount`] = 'Valid amount is required'
        isValid = false
      }
      if (!row.location) {
        errors[`${index}_location`] = 'Location is required'
        isValid = false
      }
      if (!row.payment_mode) {
        errors[`${index}_payment_mode`] = 'Payment mode is required'
        isValid = false
      }
    })

    setFieldErrors(errors)
    
    // Mark all fields as touched
    const touched: Record<string, boolean> = { date: true }
    expenseRows.forEach((_, index) => {
      touched[`${index}_expense_type`] = true
      touched[`${index}_amount`] = true
      touched[`${index}_location`] = true
      touched[`${index}_payment_mode`] = true
    })
    setTouchedFields(touched)

    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      if (!authService.isAuthenticated()) {
        router.push('/auth/login')
        return
      }

      // Convert rows to API format
      const entries: DailyExpenseEntryData[] = expenseRows.map(row => ({
        expense_type: row.expense_type,
        sub_type: row.sub_type || null,
        amount: parseFloat(row.amount),
        location: row.location,
        payment_mode: row.payment_mode,
        receipt_url: null, // TODO: Upload receipt and get URL
        remarks: row.remarks || null,
      }))

      const expenseData = {
        date: headerData.date,
        vehicle_number: headerData.vehicle_number || null,
        entries: entries,
      }

      await dailyExpenseService.createExpense(expenseData)
      
      toast.success('Daily expense saved successfully!')
      setTimeout(() => router.push('/dashboard/transactions'), 1200)
    } catch (error: any) {
      console.error('Error creating daily expense:', error)
      toast.error(error.message || 'Failed to create daily expense')
    } finally {
      setIsSubmitting(false)
    }
  }

  const total = calculateTotal()

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 bg-white shadow-xl rounded-2xl mt-4 sm:mt-8 mb-4 sm:mb-8 border border-blue-100">
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

      {/* Total Amount Display */}
      <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-gray-700">Total Expense:</span>
          <span className="text-2xl sm:text-3xl font-bold text-green-700 ml-3">${total.toFixed(2)}</span>
        </div>
        <CalculatorIcon className="h-8 w-8 text-green-600" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Section */}
        <div className="border border-blue-100 rounded-lg p-4 sm:p-6 bg-blue-50">
          <h2 className="text-lg font-semibold text-gray-800 tracking-tight mb-4 flex items-center gap-2">
            <UserIcon className="h-6 w-6 text-blue-600" />
            Header Information
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Driver Name
              </label>
              <input
                type="text"
                value={currentUser?.full_name || 'Loading...'}
                disabled
                className="input bg-gray-100 cursor-not-allowed text-gray-600"
                placeholder="Loading user name..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {currentUser ? `Auto-populated from your account (${currentUser.email})` : 'Loading user data...'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <CalendarDaysIcon className="h-4 w-4 text-blue-400" />
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={headerData.date}
                onChange={(e) => handleHeaderChange('date', e.target.value)}
                onBlur={() => setTouchedFields(prev => ({ ...prev, date: true }))}
                className={`input ${fieldErrors.date && touchedFields.date ? 'border-red-500' : ''}`}
                required
              />
              {fieldErrors.date && touchedFields.date && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.date}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <TruckIcon className="h-4 w-4 text-blue-400" />
                Vehicle Number
              </label>
              <input
                type="text"
                value={headerData.vehicle_number}
                onChange={(e) => handleHeaderChange('vehicle_number', e.target.value)}
                className="input"
                placeholder="Optional vehicle identifier"
                style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
              />
            </div>
          </div>
        </div>

        {/* Expense Entries Section */}
        <div className="border border-blue-100 rounded-lg p-4 sm:p-6 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 tracking-tight">
              Expense Entries ({expenseRows.length})
            </h2>
            <button
              type="button"
              onClick={addExpenseRow}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <PlusIcon className="h-4 w-4" />
              Add Expense
            </button>
          </div>

          <div className="space-y-4">
            {expenseRows.map((row, index) => (
              <ExpenseRow
                key={row.id || index}
                row={row}
                index={index}
                onChange={handleRowChange}
                onDelete={deleteExpenseRow}
                touched={touchedFields}
                errors={fieldErrors}
              />
            ))}
          </div>
        </div>

        {/* Submit Buttons */}
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

      {/* Floating Action Button for Mobile */}
      <button
        type="button"
        onClick={addExpenseRow}
        className="fixed bottom-6 right-6 md:hidden h-14 w-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center z-50"
        aria-label="Add Expense"
      >
        <PlusIcon className="h-6 w-6" />
      </button>

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
