'use client'

import React, { useEffect, useState } from 'react'
import { DocumentTextIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { dailyExpenseService, DailyExpenseData } from '@/services/dailyExpense'
import { api } from '@/services/auth'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString()
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

function downloadDailyExpensePdf(expense: DailyExpenseData) {
  const doc = new jsPDF()
  let y = 10

  // Title
  doc.setFontSize(18)
  doc.text('Daily Expense Report', 105, y, { align: 'center' })
  y += 10

  // Expense Details
  doc.setFontSize(12)
  doc.text(`Date: ${formatDate(expense.date)}`, 14, y)
  y += 8

  // Diesel
  doc.setFont('helvetica', 'bold')
  doc.text('Diesel:', 14, y)
  doc.setFont('helvetica', 'normal')
  y += 6
  doc.text(`Amount: ${formatCurrency(expense.diesel_amount)}`, 20, y)
  y += 6
  doc.text(`Location: ${expense.diesel_location}`, 20, y)
  y += 8

  // DEF
  doc.setFont('helvetica', 'bold')
  doc.text('DEF:', 14, y)
  doc.setFont('helvetica', 'normal')
  y += 6
  doc.text(`Amount: ${formatCurrency(expense.def_amount)}`, 20, y)
  y += 6
  doc.text(`Location: ${expense.def_location}`, 20, y)
  y += 8

  // Other Expenses
  if (expense.other_expense_description && expense.other_expense_amount) {
    doc.setFont('helvetica', 'bold')
    doc.text('Other Expenses:', 14, y)
    doc.setFont('helvetica', 'normal')
    y += 6
    doc.text(`Description: ${expense.other_expense_description}`, 20, y)
    y += 6
    doc.text(`Amount: ${formatCurrency(expense.other_expense_amount)}`, 20, y)
    if (expense.other_expense_location) {
      y += 6
      doc.text(`Location: ${expense.other_expense_location}`, 20, y)
    }
    y += 8
  }

  // Total
  doc.setFont('helvetica', 'bold')
  doc.text(`Total: ${formatCurrency(expense.total)}`, 14, y)

  doc.save(`DailyExpense_${expense.id}.pdf`)
}

export default function DailyExpenseReportsPage() {
  const [data, setData] = useState<DailyExpenseData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    console.log('DailyExpenseReportsPage mounted')
    const fetchData = async () => {
      console.log('Starting to fetch daily expenses')
      try {
        // Test API connection first
        console.log('Testing API connection...')
        const testResponse = await api.get('/api/transactions')
        console.log('API test response:', testResponse)
        
        setLoading(true)
        setError('')
        console.log('Calling dailyExpenseService.getExpenses()')
        const expenses = await dailyExpenseService.getExpenses()
        console.log('Successfully fetched expenses:', expenses)
        setData(expenses)
      } catch (err: any) {
        console.error('Error in page component:', {
          error: err,
          response: err.response?.data,
          status: err.response?.status,
          message: err.message,
          request: err.request
        })
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  console.log('Rendering DailyExpenseReportsPage with:', { data, loading, error })

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 mb-8 border border-blue-100">
      <h1 className="text-3xl font-extrabold mb-6 text-blue-700 tracking-tight flex items-center gap-2">
        <DocumentTextIcon className="h-8 w-8 text-blue-500" /> Daily Expense Reports
      </h1>
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-red-600 p-4 bg-red-50 rounded-md">
          <p className="font-semibold">Error loading daily expenses:</p>
          <p>{error}</p>
          <p className="text-sm mt-2">Please check the browser console for more details.</p>
        </div>
      ) : data.length === 0 ? (
        <div className="text-gray-500 p-4 bg-gray-50 rounded-md">
          No daily expenses found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-blue-100 text-blue-800">
                <th className="border px-2 py-1">Date</th>
                <th className="border px-2 py-1">Diesel</th>
                <th className="border px-2 py-1">DEF</th>
                <th className="border px-2 py-1">Other Expenses</th>
                <th className="border px-2 py-1">Total</th>
                <th className="border px-2 py-1">Download</th>
              </tr>
            </thead>
            <tbody>
              {data.map((expense) => (
                <tr key={expense.id} className="hover:bg-blue-50">
                  <td className="border px-2 py-1">{formatDate(expense.date)}</td>
                  <td className="border px-2 py-1">
                    <div className="font-medium">{formatCurrency(expense.diesel_amount)}</div>
                    <div className="text-xs text-gray-500">{expense.diesel_location}</div>
                  </td>
                  <td className="border px-2 py-1">
                    <div className="font-medium">{formatCurrency(expense.def_amount)}</div>
                    <div className="text-xs text-gray-500">{expense.def_location}</div>
                  </td>
                  <td className="border px-2 py-1">
                    {expense.other_expense_description && (
                      <>
                        <div className="font-medium">{formatCurrency(expense.other_expense_amount || 0)}</div>
                        <div className="text-xs text-gray-500">{expense.other_expense_description}</div>
                        {expense.other_expense_location && (
                          <div className="text-xs text-gray-500">{expense.other_expense_location}</div>
                        )}
                      </>
                    )}
                  </td>
                  <td className="border px-2 py-1 font-bold">{formatCurrency(expense.total)}</td>
                  <td className="border px-2 py-1 text-center">
                    <button
                      className="bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700 transition flex items-center gap-1 mx-auto"
                      onClick={() => downloadDailyExpensePdf(expense)}
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