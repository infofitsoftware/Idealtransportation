'use client'

import React, { useEffect, useState } from 'react'
import { DocumentTextIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { transactionService } from '@/services/transaction'

interface Transaction {
  id: number
  date: string
  car_year: string
  car_make: string
  car_model: string
  car_vin: string
  pickup_location: string
  dropoff_location: string
  payment_type: string
  amount: number
  comments?: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString()
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

function downloadTransactionPdf(transaction: Transaction) {
  const doc = new jsPDF()
  let y = 10

  // Title
  doc.setFontSize(18)
  doc.text('Transaction Report', 105, y, { align: 'center' })
  y += 10

  // Transaction Details
  doc.setFontSize(12)
  doc.text(`Date: ${formatDate(transaction.date)}`, 14, y)
  y += 8
  doc.text(`Vehicle: ${transaction.car_year} ${transaction.car_make} ${transaction.car_model}`, 14, y)
  y += 8
  doc.text(`VIN: ${transaction.car_vin}`, 14, y)
  y += 8
  doc.text(`Pickup Location: ${transaction.pickup_location}`, 14, y)
  y += 8
  doc.text(`Dropoff Location: ${transaction.dropoff_location}`, 14, y)
  y += 8
  doc.text(`Payment Type: ${transaction.payment_type}`, 14, y)
  y += 8
  doc.text(`Amount: ${formatCurrency(transaction.amount)}`, 14, y)
  y += 8

  if (transaction.comments) {
    doc.text('Comments:', 14, y)
    y += 8
    doc.text(transaction.comments, 14, y, { maxWidth: 180 })
  }

  doc.save(`Transaction_${transaction.id}.pdf`)
}

export default function TransactionReportsPage() {
  const [data, setData] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const transactions = await transactionService.getTransactions()
        setData(transactions)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 mb-8 border border-blue-100">
      <h1 className="text-3xl font-extrabold mb-6 text-blue-700 tracking-tight flex items-center gap-2">
        <DocumentTextIcon className="h-8 w-8 text-blue-500" /> Transaction Reports
      </h1>
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-blue-100 text-blue-800">
                <th className="border px-2 py-1">Date</th>
                <th className="border px-2 py-1">Vehicle</th>
                <th className="border px-2 py-1">Pickup</th>
                <th className="border px-2 py-1">Dropoff</th>
                <th className="border px-2 py-1">Payment</th>
                <th className="border px-2 py-1">Amount</th>
                <th className="border px-2 py-1">Download</th>
              </tr>
            </thead>
            <tbody>
              {data.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-blue-50">
                  <td className="border px-2 py-1">{formatDate(transaction.date)}</td>
                  <td className="border px-2 py-1">
                    {transaction.car_year} {transaction.car_make} {transaction.car_model}
                    <div className="text-xs text-gray-500">VIN: {transaction.car_vin}</div>
                  </td>
                  <td className="border px-2 py-1">{transaction.pickup_location}</td>
                  <td className="border px-2 py-1">{transaction.dropoff_location}</td>
                  <td className="border px-2 py-1">{transaction.payment_type}</td>
                  <td className="border px-2 py-1 font-medium">{formatCurrency(transaction.amount)}</td>
                  <td className="border px-2 py-1 text-center">
                    <button
                      className="bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700 transition flex items-center gap-1 mx-auto"
                      onClick={() => downloadTransactionPdf(transaction)}
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" /> Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
} 