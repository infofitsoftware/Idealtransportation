'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, TruckIcon, CurrencyDollarIcon, MapPinIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { transactionService, bolService, PendingWorkOrder } from '@/services/transaction'
import { authService } from '@/services/auth'
import toast from 'react-hot-toast'
import FormHeader from '@/components/FormHeader'
import FormProgress from '@/components/forms/FormProgress'
import FieldValidation from '@/components/forms/FieldValidation'
import PaymentMethodSelect from '@/components/forms/PaymentMethodSelect'
import WorkOrderSelect from '@/components/forms/WorkOrderSelect'

const FORM_SECTIONS = [
  { id: 'workOrder', label: 'Work Order', completed: false },
  { id: 'payment', label: 'Payment', completed: false },
  { id: 'location', label: 'Location', completed: false },
  { id: 'comments', label: 'Comments', completed: false },
];

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
  
  // Field validation states
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  
  // Collapsible sections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    workOrder: false,
    payment: false,
    location: false,
    comments: false,
  })
  
  // Smart defaults from recent transactions
  const [recentPaymentType, setRecentPaymentType] = useState<string>('')
  const [recentLocations, setRecentLocations] = useState<{ pickup: string; dropoff: string }>({ pickup: '', dropoff: '' })

  // Load pending work orders and recent transactions on component mount
  useEffect(() => {
    loadPendingWorkOrders()
    loadRecentTransactions()
  }, [])

  // Auto-populate date
  useEffect(() => {
    if (!formData.date) {
      const today = new Date().toISOString().split('T')[0]
      setFormData(prev => ({ ...prev, date: today }))
    }
  }, [])

  // Apply smart defaults (only when no work order selected or locations not yet set from BOL)
  useEffect(() => {
    if (recentPaymentType && !formData.paymentType) {
      setFormData(prev => ({ ...prev, paymentType: recentPaymentType }))
    }
    if (!selectedBOL && recentLocations.pickup && !formData.pickupLocation) {
      setFormData(prev => ({ ...prev, pickupLocation: recentLocations.pickup }))
    }
    if (!selectedBOL && recentLocations.dropoff && !formData.dropoffLocation) {
      setFormData(prev => ({ ...prev, dropoffLocation: recentLocations.dropoff }))
    }
  }, [recentPaymentType, recentLocations, selectedBOL])

  // Populate Pickup and Dropoff from BOL when work order is selected
  useEffect(() => {
    if (!selectedBOL) return

    let cancelled = false
    bolService.getBOL(selectedBOL.id).then((bol: any) => {
      if (cancelled || !bol) return
      const pickup = [bol.pickup_name, bol.pickup_address].filter(Boolean).join(', ').trim()
      const dropoff = [bol.delivery_name, bol.delivery_address].filter(Boolean).join(', ').trim()
      setFormData(prev => ({
        ...prev,
        ...(pickup && { pickupLocation: pickup }),
        ...(dropoff && { dropoffLocation: dropoff }),
      }))
    }).catch((err) => {
      if (!cancelled) console.error('Failed to load BOL details for locations:', err)
    })

    return () => { cancelled = true }
  }, [selectedBOL?.id])

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

  const loadRecentTransactions = async () => {
    try {
      const transactions = await transactionService.getTransactions()
      if (transactions && transactions.length > 0) {
        // Get most recent transaction
        const mostRecent = transactions[0]
        setRecentPaymentType(mostRecent.payment_type || '')
        setRecentLocations({
          pickup: mostRecent.pickup_location || '',
          dropoff: mostRecent.dropoff_location || '',
        })
      }
    } catch (error) {
      console.error('Error loading recent transactions:', error)
      // Silently fail - smart defaults are optional
    }
  }

  // Calculate form progress
  const calculateProgress = () => {
    let completedSteps = 0
    const steps = FORM_SECTIONS.map((section) => {
      let completed = false
      
      switch (section.id) {
        case 'workOrder':
          completed = !!selectedBOL && !!formData.workOrderNo
          break
        case 'payment':
          completed = !!(formData.date && formData.collectedAmount && formData.paymentType && !error)
          break
        case 'location':
          completed = !!(formData.pickupLocation || formData.dropoffLocation)
          break
        case 'comments':
          completed = true // Optional field
          break
      }
      
      if (completed) completedSteps++
      return { ...section, completed }
    })
    
    return { steps, currentStep: completedSteps, totalSteps: FORM_SECTIONS.length }
  }

  const { steps, currentStep, totalSteps } = calculateProgress()

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
    
    // Mark as touched
    if (!touchedFields.workOrderNo) {
      setTouchedFields(prev => ({ ...prev, workOrderNo: true }))
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
    if (!selectedBOL || !formData.collectedAmount) {
      setError('')
      setFieldErrors(prev => ({ ...prev, collectedAmount: '' }))
      return true
    }
    
    const collected = parseFloat(formData.collectedAmount) || 0
    if (collected > selectedBOL.due_amount) {
      const errorMsg = `Payment amount cannot exceed remaining due amount of $${selectedBOL.due_amount.toFixed(2)}`
      setError(errorMsg)
      setFieldErrors(prev => ({ ...prev, collectedAmount: errorMsg }))
      return false
    }
    
    if (collected <= 0) {
      const errorMsg = 'Payment amount must be greater than 0'
      setError(errorMsg)
      setFieldErrors(prev => ({ ...prev, collectedAmount: errorMsg }))
      return false
    }
    
    setError('')
    setFieldErrors(prev => ({ ...prev, collectedAmount: '' }))
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Mark all fields as touched
    setTouchedFields({
      workOrderNo: true,
      date: true,
      collectedAmount: true,
      paymentType: true,
    })
    
    if (!validatePayment()) {
      return
    }
    
    if (!selectedBOL) {
      setFieldErrors(prev => ({ ...prev, workOrderNo: 'Please select a work order' }))
      toast.error('Please select a work order')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      if (!authService.isAuthenticated()) {
        router.push('/auth/login')
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
    
    // Mark field as touched
    if (!touchedFields[name]) {
      setTouchedFields(prev => ({ ...prev, [name]: true }))
    }
    
    // Validate payment amount when collected amount changes
    if (name === 'collectedAmount') {
      setTimeout(() => validatePayment(), 100)
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
          <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 tracking-tight">{title}</h2>
        </div>
        {onToggle && (
          isCollapsed ? (
            <ChevronDownIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          ) : (
            <ChevronUpIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          )
        )}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white dark:bg-gray-800 shadow-xl rounded-2xl mt-4 sm:mt-8 mb-4 sm:mb-8 border border-blue-100 dark:border-gray-700">
      <FormHeader />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-700 dark:text-blue-400 tracking-tight">Payment Form</h1>
        <button
          onClick={() => router.push('/dashboard/transactions')}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          Back to Transactions
        </button>
      </div>

      {/* Form Progress Indicator */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-gray-600">
        <FormProgress 
          currentStep={currentStep} 
          totalSteps={totalSteps} 
          steps={steps}
        />
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Work Order Selection - Collapsible */}
        <div className="border border-blue-100 dark:border-gray-600 rounded-lg p-4 sm:p-6 bg-blue-50 dark:bg-blue-900/20">
          <SectionHeader
            icon={TruckIcon}
            title="Work Order Selection"
            isCollapsed={collapsedSections.workOrder}
            onToggle={() => toggleSection('workOrder')}
          />
          {!collapsedSections.workOrder && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldValidation
                error={fieldErrors.workOrderNo}
                touched={touchedFields.workOrderNo}
                required
              >
                <WorkOrderSelect
                  value={formData.workOrderNo}
                  onChange={(val) => {
                    handleWorkOrderChange(val);
                    setTouchedFields(prev => ({ ...prev, workOrderNo: true }));
                  }}
                  pendingWorkOrders={pendingWorkOrders}
                  loading={isLoading}
                  required
                  error={fieldErrors.workOrderNo}
                  touched={touchedFields.workOrderNo}
                />
              </FieldValidation>

              {selectedBOL && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-gray-600 shadow-sm">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Work Order Details</h3>
                  <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <p><span className="font-medium">Driver:</span> {selectedBOL.driver_name}</p>
                    <p><span className="font-medium">Date:</span> {new Date(selectedBOL.date).toLocaleDateString()}</p>
                    <p><span className="font-medium">Total Amount:</span> ${selectedBOL.total_amount.toFixed(2)}</p>
                    <p><span className="font-medium">Already Collected:</span> ${selectedBOL.total_collected.toFixed(2)}</p>
                    <p className="font-semibold text-red-600 dark:text-red-400">Remaining Due: ${selectedBOL.due_amount.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Payment Information - Collapsible */}
        <div className="border border-blue-100 dark:border-gray-600 rounded-lg p-4 sm:p-6 bg-green-50 dark:bg-green-900/20">
          <SectionHeader
            icon={CurrencyDollarIcon}
            title="Payment Information"
            isCollapsed={collapsedSections.payment}
            onToggle={() => toggleSection('payment')}
          />
          {!collapsedSections.payment && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FieldValidation
                  error={fieldErrors.date}
                  touched={touchedFields.date}
                  required
                >
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Payment Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="date"
                      id="date"
                      required
                      value={formData.date}
                      onChange={handleChange}
                      onBlur={() => setTouchedFields(prev => ({ ...prev, date: true }))}
                      className={`w-full rounded-md border px-3 py-2 mb-1 text-sm sm:text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition border-gray-300 dark:border-gray-600 ${fieldErrors.date && touchedFields.date ? 'border-red-500' : ''}`}
                    />
                  </div>
                </FieldValidation>

                <FieldValidation
                  error={fieldErrors.collectedAmount}
                  touched={touchedFields.collectedAmount}
                  required
                >
                  <div>
                    <label htmlFor="collectedAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Payment Amount <span className="text-red-500">*</span>
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
                      onBlur={() => {
                        setTouchedFields(prev => ({ ...prev, collectedAmount: true }))
                        validatePayment()
                      }}
                      className={`w-full rounded-md border px-3 py-2 mb-1 text-sm sm:text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition border-gray-300 dark:border-gray-600 ${fieldErrors.collectedAmount && touchedFields.collectedAmount ? 'border-red-500' : ''}`}
                      placeholder="0.00"
                    />
                  </div>
                </FieldValidation>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Remaining Due
                  </label>
                  <input
                    type="text"
                    value={`$${calculateDueAmount().toFixed(2)}`}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 mb-1 text-sm sm:text-base bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-not-allowed focus:outline-none"
                    readOnly
                  />
                </div>
              </div>

              <div className="mt-4">
                <FieldValidation
                  error={fieldErrors.paymentType}
                  touched={touchedFields.paymentType}
                  required
                >
                  <PaymentMethodSelect
                    value={formData.paymentType}
                    onChange={(value) => {
                      setFormData(prev => ({ ...prev, paymentType: value }))
                      setTouchedFields(prev => ({ ...prev, paymentType: true }))
                    }}
                    required
                    error={fieldErrors.paymentType}
                    touched={touchedFields.paymentType}
                  />
                </FieldValidation>
              </div>
            </>
          )}
        </div>

        {/* Location Information - Collapsible */}
        <div className="border border-blue-100 dark:border-gray-600 rounded-lg p-4 sm:p-6 bg-gray-50 dark:bg-gray-700/50">
          <SectionHeader
            icon={MapPinIcon}
            title="Location Information"
            isCollapsed={collapsedSections.location}
            onToggle={() => toggleSection('location')}
          />
          {!collapsedSections.location && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pickupLocation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pickup Location
                </label>
                <input
                  type="text"
                  name="pickupLocation"
                  id="pickupLocation"
                  value={formData.pickupLocation}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 mb-1 text-sm sm:text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Enter pickup location"
                  style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                />
                {recentLocations.pickup && !formData.pickupLocation && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Recent: {recentLocations.pickup}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="dropoffLocation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Dropoff Location
                </label>
                <input
                  type="text"
                  name="dropoffLocation"
                  id="dropoffLocation"
                  value={formData.dropoffLocation}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 mb-1 text-sm sm:text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Enter dropoff location"
                  style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                />
                {recentLocations.dropoff && !formData.dropoffLocation && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Recent: {recentLocations.dropoff}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Comments - Collapsible */}
        <div className="border border-blue-100 dark:border-gray-600 rounded-lg p-4 sm:p-6 bg-gray-50 dark:bg-gray-700/50">
          <SectionHeader
            icon={CurrencyDollarIcon}
            title="Additional Information"
            isCollapsed={collapsedSections.comments}
            onToggle={() => toggleSection('comments')}
          />
          {!collapsedSections.comments && (
            <div>
              <label htmlFor="comments" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Comments
              </label>
              <textarea
                name="comments"
                id="comments"
                rows={3}
                value={formData.comments}
                onChange={handleChange}
                className="w-full min-h-[80px] resize-y rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 mb-1 text-sm sm:text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="Enter any additional comments..."
                style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            type="button"
            onClick={() => router.push('/dashboard/transactions')}
            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !selectedBOL}
            className={`inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-base font-medium rounded-lg shadow-sm text-white transition-colors ${
              isSubmitting || !selectedBOL
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            {isSubmitting ? 'Recording Payment...' : 'Record Payment'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .input {
          @apply border border-blue-200 dark:border-gray-600 rounded px-3 py-2 w-full mb-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm sm:text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400;
          word-wrap: break-word;
          overflow-wrap: break-word;
          white-space: normal;
        }
        textarea.input {
          resize: vertical;
          min-height: 80px;
        }
      `}</style>
    </div>
  )
}
