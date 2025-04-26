import { useState, useEffect } from 'react'
import { Transaction, transactionService } from '@/services/transaction'

interface TransactionFormProps {
  transaction?: Transaction
  onSubmit: (data: Omit<Transaction, 'id'>) => Promise<void>
  onCancel: () => void
}

export default function TransactionForm({ transaction, onSubmit, onCancel }: TransactionFormProps) {
  const [formData, setFormData] = useState<Omit<Transaction, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    car_year: '',
    car_make: '',
    car_model: '',
    car_vin: '',
    pickup_location: '',
    dropoff_location: '',
    payment_type: 'Cash',
    amount: 0,
    comments: '',
  })

  useEffect(() => {
    if (transaction) {
      setFormData({
        date: transaction.date,
        car_year: transaction.car_year,
        car_make: transaction.car_make,
        car_model: transaction.car_model,
        car_vin: transaction.car_vin,
        pickup_location: transaction.pickup_location,
        dropoff_location: transaction.dropoff_location,
        payment_type: transaction.payment_type,
        amount: transaction.amount,
        comments: transaction.comments || '',
      })
    }
  }, [transaction])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        {/* Date */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            type="date"
            name="date"
            id="date"
            value={formData.date}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            required
          />
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            Amount
          </label>
          <input
            type="number"
            name="amount"
            id="amount"
            value={formData.amount}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            required
            min="0"
            step="0.01"
          />
        </div>

        {/* Car Details */}
        <div>
          <label htmlFor="car_year" className="block text-sm font-medium text-gray-700">
            Car Year
          </label>
          <input
            type="text"
            name="car_year"
            id="car_year"
            value={formData.car_year}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="car_make" className="block text-sm font-medium text-gray-700">
            Car Make
          </label>
          <input
            type="text"
            name="car_make"
            id="car_make"
            value={formData.car_make}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="car_model" className="block text-sm font-medium text-gray-700">
            Car Model
          </label>
          <input
            type="text"
            name="car_model"
            id="car_model"
            value={formData.car_model}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="car_vin" className="block text-sm font-medium text-gray-700">
            VIN
          </label>
          <input
            type="text"
            name="car_vin"
            id="car_vin"
            value={formData.car_vin}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            required
          />
        </div>

        {/* Locations */}
        <div>
          <label htmlFor="pickup_location" className="block text-sm font-medium text-gray-700">
            Pickup Location
          </label>
          <input
            type="text"
            name="pickup_location"
            id="pickup_location"
            value={formData.pickup_location}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="dropoff_location" className="block text-sm font-medium text-gray-700">
            Dropoff Location
          </label>
          <input
            type="text"
            name="dropoff_location"
            id="dropoff_location"
            value={formData.dropoff_location}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            required
          />
        </div>

        {/* Payment Type */}
        <div>
          <label htmlFor="payment_type" className="block text-sm font-medium text-gray-700">
            Payment Type
          </label>
          <select
            name="payment_type"
            id="payment_type"
            value={formData.payment_type}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            required
          >
            <option value="Cash">Cash</option>
            <option value="Check">Check</option>
            <option value="Zelle">Zelle</option>
          </select>
        </div>
      </div>

      {/* Comments */}
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          {transaction ? 'Update' : 'Create'} Transaction
        </button>
      </div>
    </form>
  )
} 