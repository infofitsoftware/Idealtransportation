'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon } from '@heroicons/react/24/outline'
import { dailyExpenseService } from '@/services/dailyExpense'
import { authService } from '@/services/auth'
import toast from 'react-hot-toast'
import FormHeader from '@/components/FormHeader'

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
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
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

      await dailyExpenseService.createExpense({
        ...formData,
        diesel_amount: parseFloat(formData.diesel_amount),
        def_amount: parseFloat(formData.def_amount),
        other_expense_amount: formData.other_expense_amount ? parseFloat(formData.other_expense_amount) : undefined,
        total: total
      })
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
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 mb-8 border border-blue-100">
      <FormHeader />
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-blue-700 tracking-tight">Daily Expense Form</h1>
        <button
          onClick={() => router.push('/dashboard/transactions')}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
        >
          Back to Transactions
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="border border-blue-100 rounded-lg p-4 bg-blue-50">
          <h2 className="text-lg font-semibold text-gray-800 tracking-tight mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                name="date"
                id="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Diesel Expenses */}
        <div className="border border-blue-100 rounded-lg p-4 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800 tracking-tight mb-4">Diesel Expenses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="diesel_amount" className="block text-sm font-medium text-gray-700 mb-1">
                Diesel Amount
              </label>
              <input
                type="number"
                step="0.01"
                name="diesel_amount"
                id="diesel_amount"
                required
                value={formData.diesel_amount}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="diesel_location" className="block text-sm font-medium text-gray-700 mb-1">
                Diesel Location
              </label>
              <input
                type="text"
                name="diesel_location"
                id="diesel_location"
                required
                value={formData.diesel_location}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* DEF Expenses */}
        <div className="border border-blue-100 rounded-lg p-4 bg-blue-50">
          <h2 className="text-lg font-semibold text-gray-800 tracking-tight mb-4">DEF Expenses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="def_amount" className="block text-sm font-medium text-gray-700 mb-1">
                DEF Amount
              </label>
              <input
                type="number"
                step="0.01"
                name="def_amount"
                id="def_amount"
                required
                value={formData.def_amount}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="def_location" className="block text-sm font-medium text-gray-700 mb-1">
                DEF Location
              </label>
              <input
                type="text"
                name="def_location"
                id="def_location"
                required
                value={formData.def_location}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Other Expenses */}
        <div className="border border-blue-100 rounded-lg p-4 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800 tracking-tight mb-4">Other Expenses</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="other_expense_description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                name="other_expense_description"
                id="other_expense_description"
                value={formData.other_expense_description}
                onChange={handleChange}
                className="input"
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
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white ${
              isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            {isSubmitting ? 'Creating...' : 'Create Daily Expense'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .input {
          @apply border border-blue-200 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-200 transition;
        }
      `}</style>
    </div>
  )
} 