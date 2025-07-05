'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon } from '@heroicons/react/24/outline'
import { transactionService } from '@/services/transaction'
import { authService } from '@/services/auth'
import toast from 'react-hot-toast'
import FormHeader from '@/components/FormHeader'

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
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 mb-8 border border-blue-100">
      <FormHeader />
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-blue-700 tracking-tight">Transaction Form</h1>
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
        {/* Vehicle Information */}
        <div className="border border-blue-100 rounded-lg p-4 bg-blue-50">
          <h2 className="text-lg font-semibold text-gray-800 tracking-tight mb-4">Vehicle Information</h2>
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

            <div>
              <label htmlFor="carYear" className="block text-sm font-medium text-gray-700 mb-1">
                Car Year
              </label>
              <input
                type="text"
                name="carYear"
                id="carYear"
                value={formData.carYear}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="carMake" className="block text-sm font-medium text-gray-700 mb-1">
                Car Make
              </label>
              <input
                type="text"
                name="carMake"
                id="carMake"
                value={formData.carMake}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="carModel" className="block text-sm font-medium text-gray-700 mb-1">
                Car Model
              </label>
              <input
                type="text"
                name="carModel"
                id="carModel"
                value={formData.carModel}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="carVin" className="block text-sm font-medium text-gray-700 mb-1">
                Car VIN
              </label>
              <input
                type="text"
                name="carVin"
                id="carVin"
                value={formData.carVin}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="border border-blue-100 rounded-lg p-4 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800 tracking-tight mb-4">Location Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pickupLocation" className="block text-sm font-medium text-gray-700 mb-1">
                Pickup Location
              </label>
              <input
                type="text"
                name="pickupLocation"
                id="pickupLocation"
                required
                value={formData.pickupLocation}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="dropoffLocation" className="block text-sm font-medium text-gray-700 mb-1">
                Dropoff Location
              </label>
              <input
                type="text"
                name="dropoffLocation"
                id="dropoffLocation"
                required
                value={formData.dropoffLocation}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="border border-blue-100 rounded-lg p-4 bg-blue-50">
          <h2 className="text-lg font-semibold text-gray-800 tracking-tight mb-4">Payment Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="paymentType" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Type
              </label>
              <select
                name="paymentType"
                id="paymentType"
                required
                value={formData.paymentType}
                onChange={handleChange}
                className="input"
              >
                <option value="">Select Payment Type</option>
                <option value="CASH">Cash</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <input
                type="number"
                name="amount"
                id="amount"
                required
                value={formData.amount}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="border border-blue-100 rounded-lg p-4 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800 tracking-tight mb-4">Additional Information</h2>
          <div>
            <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-1">
              Comments
            </label>
            <textarea
              name="comments"
              id="comments"
              rows={3}
              value={formData.comments}
              onChange={handleChange}
              className="input w-full min-h-[80px]"
            />
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
            {isSubmitting ? 'Creating...' : 'Create Transaction'}
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