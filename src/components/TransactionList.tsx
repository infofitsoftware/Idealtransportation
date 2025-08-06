import { useState, useEffect } from 'react'
import { Transaction, transactionService } from '@/services/transaction'
import { PencilIcon, TrashIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'

interface TransactionListProps {
  onEdit: (transaction: Transaction) => void
}

export default function TransactionList({ onEdit }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterWorkOrder, setFilterWorkOrder] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      const data = await transactionService.getTransactions()
      setTransactions(data)
    } catch (err) {
      setError('Failed to load transactions')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return
    }

    try {
      await transactionService.deleteTransaction(id)
      setTransactions(transactions.filter(t => t.id !== id))
    } catch (err) {
      setError('Failed to delete transaction')
      console.error(err)
    }
  }

  // Filter transactions by work order number
  const filteredTransactions = transactions.filter(transaction =>
    filterWorkOrder === '' || 
    transaction.work_order_no.toLowerCase().includes(filterWorkOrder.toLowerCase())
  )

  // Get unique work order numbers for filter dropdown
  const uniqueWorkOrders = Array.from(new Set(transactions.map(t => t.work_order_no))).sort()

  // Get payment status indicator
  const getPaymentStatusIndicator = (transaction: Transaction) => {
    if (transaction.due_amount <= 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Paid
        </span>
      )
    } else if (transaction.collected_amount > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Partial
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Pending
        </span>
      )
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading transactions...</div>
  }

  if (error) {
    return <div className="text-center text-red-600 py-8">{error}</div>
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Payment Transactions</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            <FunnelIcon className="h-4 w-4" />
            Filters
          </button>
        </div>
        
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="workOrderFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Work Order
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="workOrderFilter"
                  value={filterWorkOrder}
                  onChange={(e) => setFilterWorkOrder(e.target.value)}
                  placeholder="Enter work order number..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="workOrderDropdown" className="block text-sm font-medium text-gray-700 mb-1">
                Quick Select Work Order
              </label>
              <select
                id="workOrderDropdown"
                value={filterWorkOrder}
                onChange={(e) => setFilterWorkOrder(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">All Work Orders</option>
                {uniqueWorkOrders.map(workOrder => (
                  <option key={workOrder} value={workOrder}>
                    {workOrder}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Work Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount Collected
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remaining Due
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    {filterWorkOrder ? 'No transactions found for the selected work order.' : 'No transactions found.'}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">{transaction.work_order_no}</div>
                      <div className="text-gray-500 text-xs">ID: {transaction.bol_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">{transaction.payment_type}</div>
                      <div className="text-gray-500 text-xs">
                        {transaction.pickup_location && `From: ${transaction.pickup_location}`}
                        {transaction.dropoff_location && ` To: ${transaction.dropoff_location}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-medium text-green-600">
                        ${transaction.collected_amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`font-medium ${transaction.due_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ${transaction.due_amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getPaymentStatusIndicator(transaction)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onEdit(transaction)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit transaction"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete transaction"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      {filteredTransactions.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {filteredTransactions.length}
              </div>
              <div className="text-sm text-gray-500">Total Transactions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                ${filteredTransactions.reduce((sum, t) => sum + t.collected_amount, 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">Total Collected</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                ${filteredTransactions.reduce((sum, t) => sum + t.due_amount, 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">Total Remaining</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 