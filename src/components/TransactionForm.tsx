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
    work_order_no: '',
    collected_amount: 0,
    due_amount: 0,
    bol_id: 0,
    pickup_location: '',
    dropoff_location: '',
    payment_type: 'CASH',
    comments: '',
    user_id: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  useEffect(() => {
    if (transaction) {
      setFormData({
        date: transaction.date,
        work_order_no: transaction.work_order_no,
        collected_amount: transaction.collected_amount,
        due_amount: transaction.due_amount,
        bol_id: transaction.bol_id,
        pickup_location: transaction.pickup_location,
        dropoff_location: transaction.dropoff_location,
        payment_type: transaction.payment_type,
        comments: transaction.comments || '',
        user_id: transaction.user_id,
        created_at: transaction.created_at,
        updated_at: transaction.updated_at,
      })
    }
  }, [transaction])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'collected_amount' || name === 'due_amount' || name === 'bol_id' ? parseFloat(value) || 0 : value
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

        {/* Work Order Number */}
        <div>
          <label htmlFor="work_order_no" className="block text-sm font-medium text-gray-700">
            Work Order Number
          </label>
          <input
            type="text"
            name="work_order_no"
            id="work_order_no"
            value={formData.work_order_no}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            required
          />
        </div>

        {/* Collected Amount */}
        <div>
          <label htmlFor="collected_amount" className="block text-sm font-medium text-gray-700">
            Collected Amount
          </label>
          <input
            type="number"
            name="collected_amount"
            id="collected_amount"
            value={formData.collected_amount}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            required
            min="0"
            step="0.01"
          />
        </div>

        {/* Due Amount */}
        <div>
          <label htmlFor="due_amount" className="block text-sm font-medium text-gray-700">
            Due Amount
          </label>
          <input
            type="number"
            name="due_amount"
            id="due_amount"
            value={formData.due_amount}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            required
            min="0"
            step="0.01"
          />
        </div>

        {/* BOL ID */}
        <div>
          <label htmlFor="bol_id" className="block text-sm font-medium text-gray-700">
            BOL ID
          </label>
          <input
            type="number"
            name="bol_id"
            id="bol_id"
            value={formData.bol_id}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            required
            min="1"
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
            <option value="CASH">Cash</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CHECK">Check</option>
            <option value="ZELLE">Zelle</option>
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