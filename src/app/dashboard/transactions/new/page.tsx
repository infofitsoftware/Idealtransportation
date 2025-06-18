'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon } from '@heroicons/react/24/outline'
import { transactionService } from '@/services/transaction'
import { authService } from '@/services/auth'
import toast from 'react-hot-toast'

export default function NewTransaction() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    date: '',
    carYear: '',
    carMake: '',
    carModel: '',
    carVin: '',
    pickupLocation: '',
    dropoffLocation: '',
    paymentType: '',
    amount: '',
    comments: ''
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

      await transactionService.createTransaction({
        date: formData.date,
        car_year: formData.carYear,
        car_make: formData.carMake,
        car_model: formData.carModel,
        car_vin: formData.carVin,
        pickup_location: formData.pickupLocation,
        dropoff_location: formData.dropoffLocation,
        payment_type: formData.paymentType,
        amount: parseFloat(formData.amount),
        comments: formData.comments
      })
      toast.success('Transaction saved successfully!')
      setTimeout(() => router.push('/dashboard/transactions'), 1200)
    } catch (error: any) {
      console.error('Error creating transaction:', error)
      toast.error(error.response?.data?.detail || 'Failed to create transaction')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">New Transaction</h1>
        <button
          onClick={() => router.push('/dashboard/transactions')}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
        >
          Back to Transactions
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              name="date"
              id="date"
              required
              value={formData.date}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="carYear" className="block text-sm font-medium text-gray-700">
              Car Year
            </label>
            <input
              type="text"
              name="carYear"
              id="carYear"
              value={formData.carYear}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="carMake" className="block text-sm font-medium text-gray-700">
              Car Make
            </label>
            <input
              type="text"
              name="carMake"
              id="carMake"
              value={formData.carMake}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="carModel" className="block text-sm font-medium text-gray-700">
              Car Model
            </label>
            <input
              type="text"
              name="carModel"
              id="carModel"
              value={formData.carModel}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="carVin" className="block text-sm font-medium text-gray-700">
              Car VIN
            </label>
            <input
              type="text"
              name="carVin"
              id="carVin"
              value={formData.carVin}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="pickupLocation" className="block text-sm font-medium text-gray-700">
              Pickup Location
            </label>
            <input
              type="text"
              name="pickupLocation"
              id="pickupLocation"
              required
              value={formData.pickupLocation}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="dropoffLocation" className="block text-sm font-medium text-gray-700">
              Dropoff Location
            </label>
            <input
              type="text"
              name="dropoffLocation"
              id="dropoffLocation"
              required
              value={formData.dropoffLocation}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="paymentType" className="block text-sm font-medium text-gray-700">
              Payment Type
            </label>
            <select
              name="paymentType"
              id="paymentType"
              required
              value={formData.paymentType}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select Payment Type</option>
              <option value="CASH">Cash</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Amount
            </label>
            <input
              type="number"
              name="amount"
              id="amount"
              required
              value={formData.amount}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="comments" className="block text-sm font-medium text-gray-700">
            Comments
          </label>
          <textarea
            name="comments"
            id="comments"
            rows={3}
            value={formData.comments}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            {isSubmitting ? 'Creating...' : 'Create Transaction'}
          </button>
        </div>
      </form>
    </div>
  )
} 