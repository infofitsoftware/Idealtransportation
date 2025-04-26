'use client'

import { useState } from 'react'
import { Transaction, transactionService } from '@/services/transaction'
import TransactionForm from '@/components/TransactionForm'
import TransactionList from '@/components/TransactionList'

export default function TransactionsPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>()
  const [error, setError] = useState('')

  const handleCreate = async (data: Omit<Transaction, 'id'>) => {
    try {
      await transactionService.createTransaction(data)
      setShowForm(false)
      setError('')
    } catch (err) {
      setError('Failed to create transaction')
      console.error(err)
    }
  }

  const handleUpdate = async (data: Omit<Transaction, 'id'>) => {
    if (!editingTransaction?.id) return

    try {
      await transactionService.updateTransaction(editingTransaction.id, data)
      setShowForm(false)
      setEditingTransaction(undefined)
      setError('')
    } catch (err) {
      setError('Failed to update transaction')
      console.error(err)
    }
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setShowForm(true)
  }

  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
          <button
            onClick={() => {
              setEditingTransaction(undefined)
              setShowForm(true)
            }}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Add Transaction
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {showForm ? (
          <div className="mt-8">
            <TransactionForm
              transaction={editingTransaction}
              onSubmit={editingTransaction ? handleUpdate : handleCreate}
              onCancel={() => {
                setShowForm(false)
                setEditingTransaction(undefined)
              }}
            />
          </div>
        ) : (
          <div className="mt-8">
            <TransactionList onEdit={handleEdit} />
          </div>
        )}
      </div>
    </div>
  )
} 