'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DocumentDuplicateIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'

const transactionTypes = [
  {
    name: 'Transportation',
    href: '/dashboard/transactions/new',
    icon: DocumentDuplicateIcon,
    description: 'Record transportation transactions',
  },
  {
    name: 'Daily Expenses',
    href: '/dashboard/transactions/daily-expense',
    icon: ClipboardDocumentListIcon,
    description: 'Record daily expenses',
  },
]

export default function TransactionsPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Transactions
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {transactionTypes.map((type) => (
          <Link
            key={type.name}
            href={type.href}
            className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400 focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2"
          >
            <div className="flex-shrink-0">
              <type.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="absolute inset-0" aria-hidden="true" />
              <p className="text-sm font-medium text-gray-900">{type.name}</p>
              <p className="truncate text-sm text-gray-500">{type.description}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Transactions</h3>
        <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <p className="text-sm text-gray-500">No recent transactions to display</p>
          </div>
        </div>
      </div>
    </div>
  )
} 