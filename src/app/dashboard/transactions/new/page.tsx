'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, TruckIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'
import { transactionService, bolService, PendingWorkOrder } from '@/services/transaction'
import { authService } from '@/services/auth'
import toast from 'react-hot-toast'
import FormHeader from '@/components/FormHeader'

export default function NewTransaction() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    date: '',
    workOrderNo: '',
    collectedAmount: '',
    pickupLocation: '',
    dropoffLocation: '',
    paymentType: '',
    comments: ''
  })
  const [pendingWorkOrders, setPendingWorkOrders] = useState<PendingWorkOrder[]>([])
  const [selectedBOL, setSelectedBOL] = useState<PendingWorkOrder | null>(null)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load pending work orders on component mount
  useEffect(() => {
    loadPendingWorkOrders()
  }, [])

  const loadPendingWorkOrders = async () => {
    try {
      setIsLoading(true)
      const workOrders = await transactionService.getPendingWorkOrders()
      setPendingWorkOrders(workOrders)
    } catch (error: any) {
      console.error('Error loading pending work orders:', error)
      toast.error('Failed to load work orders')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle work order selection
  const handleWorkOrderChange = (workOrderNo: string) => {
    setFormData(prev => ({ ...prev, workOrderNo }))
    
    if (workOrderNo) {
      const selected = pendingWorkOrders.find(wo => wo.work_order_no === workOrderNo)
      setSelectedBOL(selected || null)
      
      // Reset collected amount when work order changes
      setFormData(prev => ({ ...prev, collectedAmount: '' }))
    } else {
      setSelectedBOL(null)
    }
  }

  // Calculate due amount
  const calculateDueAmount = () => {
    if (!selectedBOL || !formData.collectedAmount) return selectedBOL?.due_amount || 0
    
    const collected = parseFloat(formData.collectedAmount) || 0
    const remaining = selectedBOL.due_amount - collected
    return Math.max(0, remaining)
  }

  // Validate payment amount
  const validatePayment = () => {
    if (!selectedBOL || !formData.collectedAmount) return true
    
    const collected = parseFloat(formData.collectedAmount) || 0
    if (collected > selectedBOL.due_amount) {
      setError(`Payment amount cannot exceed remaining due amount of $${selectedBOL.due_amount}`)
      return false
    }
    
    if (collected <= 0) {
      setError('Payment amount must be greater than 0')
      return false
    }
    
    setError('')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!validatePayment()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      if (!authService.isAuthenticated()) {
        router.push('/auth/login')
        return
      }

      if (!selectedBOL) {
        toast.error('Please select a work order')
        return
      }

      await transactionService.createTransaction({
        date: formData.date,
        work_order_no: formData.workOrderNo,
        collected_amount: parseFloat(formData.collectedAmount),
        due_amount: calculateDueAmount(),
        bol_id: selectedBOL.id,
        pickup_location: formData.pickupLocation,
        dropoff_location: formData.dropoffLocation,
        payment_type: formData.paymentType,
        comments: formData.comments
      })
      
      toast.success('Payment recorded successfully!')
      setTimeout(() => router.push('/dashboard/transactions'), 1200)
    } catch (error: any) {
      console.error('Error creating transaction:', error)
      toast.error(error.response?.data?.detail || 'Failed to record payment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Validate payment amount when collected amount changes
    if (name === 'collectedAmount') {
      setTimeout(() => validatePayment(), 100)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 mb-8 border border-blue-100">
      <FormHeader />
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-blue-700 tracking-tight">Payment Form</h1>
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
        {/* Work Order Selection */}
        <div className="border border-blue-100 rounded-lg p-4 bg-blue-50">
          <h2 className="text-lg font-semibold text-gray-800 tracking-tight mb-4 flex items-center gap-2">
            <TruckIcon className="h-6 w-6 text-blue-600" />
            Work Order Selection
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="workOrderNo" className="block text-sm font-medium text-gray-700 mb-1">
                Work Order Number *
              </label>
              <select
                name="workOrderNo"
                id="workOrderNo"
                required
                value={formData.workOrderNo}
                onChange={(e) => handleWorkOrderChange(e.target.value)}
                className="input"
                disabled={isLoading}
              >
                <option value="">Select Work Order</option>
                {pendingWorkOrders.map((wo) => (
                  <option key={wo.work_order_no} value={wo.work_order_no}>
                    {wo.work_order_no} - {wo.driver_name} (Due: ${wo.due_amount})
                  </option>
                ))}
              </select>
              {isLoading && <p className="text-sm text-gray-500 mt-1">Loading work orders...</p>}
            </div>

            {selectedBOL && (
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <h3 className="font-semibold text-gray-800 mb-2">Work Order Details</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Driver:</span> {selectedBOL.driver_name}</p>
                  <p><span className="font-medium">Date:</span> {new Date(selectedBOL.date).toLocaleDateString()}</p>
                  <p><span className="font-medium">Total Amount:</span> ${selectedBOL.total_amount}</p>
                  <p><span className="font-medium">Already Collected:</span> ${selectedBOL.total_collected}</p>
                  <p><span className="font-medium text-red-600">Remaining Due:</span> ${selectedBOL.due_amount}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Information */}
        <div className="border border-blue-100 rounded-lg p-4 bg-green-50">
          <h2 className="text-lg font-semibold text-gray-800 tracking-tight mb-4 flex items-center gap-2">
            <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            Payment Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Date *
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
              <label htmlFor="collectedAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Amount *
              </label>
              <input
                type="number"
                name="collectedAmount"
                id="collectedAmount"
                required
                min="0.01"
                step="0.01"
                value={formData.collectedAmount}
                onChange={handleChange}
                className="input"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remaining Due
              </label>
              <input
                type="text"
                value={`$${calculateDueAmount().toFixed(2)}`}
                className="input bg-gray-100"
                readOnly
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="paymentType" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Type *
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
                <option value="CHECK">Check</option>
                <option value="ZELLE">Zelle</option>
              </select>
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
                value={formData.pickupLocation}
                onChange={handleChange}
                className="input"
                placeholder="Enter pickup location"
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
                value={formData.dropoffLocation}
                onChange={handleChange}
                className="input"
                placeholder="Enter dropoff location"
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
              placeholder="Enter any additional comments..."
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !selectedBOL}
            className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white ${
              isSubmitting || !selectedBOL ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            {isSubmitting ? 'Recording Payment...' : 'Record Payment'}
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