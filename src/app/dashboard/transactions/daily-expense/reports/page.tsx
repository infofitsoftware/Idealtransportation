'use client'

import React, { useEffect, useState } from 'react'
import { DocumentTextIcon, ArrowDownTrayIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { dailyExpenseService, DailyExpenseData } from '@/services/dailyExpense'
import { useAccessControl } from '@/hooks/useAccessControl'
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

// Function to load logo as base64
async function loadLogoAsBase64(): Promise<string | null> {
  try {
    const response = await fetch('/logo_ideal.png');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading logo:', error);
    return null;
  }
}

async function downloadDailyExpensePdf(expense: DailyExpenseData) {
  const doc = new jsPDF()
  let y = -2 // Pulled logo up to match BOL and transaction layout

  // Company Header with Logo and Address on same line
  try {
    const logoBase64 = await loadLogoAsBase64();
    if (logoBase64) {
      // Larger logo on the left (same size as BOL and transaction: 80x40)
      doc.addImage(logoBase64, 'JPEG', 5, y, 80, 40);
      // Company name and address on the right, same positioning as BOL and transaction
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Ideal Transportation Solutions LLC', 85, y + 12, { align: 'left' });
      y += 12;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('16 Palmero Way, Manvel, Texas 77578', 85, y + 8, { align: 'left' });
      y += 8;
      doc.text('USDOT NO: 4193929', 85, y + 8, { align: 'left' });
      y += 25; // Same spacing as BOL and transaction
    } else {
      // Fallback without logo
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Ideal Transportation Solutions LLC', 105, y, { align: 'center' });
      y += 6;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('16 Palmero Way, Manvel, Texas 77578', 105, y, { align: 'center' });
      y += 6;
      doc.text('USDOT NO: 4193929', 105, y, { align: 'center' });
      y += 8;
    }
  } catch (err) {
    console.error('Error loading logo:', err);
    // Fallback without logo
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Ideal Transportation Solutions LLC', 105, y, { align: 'center' });
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('16 Palmero Way, Manvel, Texas 77578', 105, y, { align: 'center' });
    y += 6;
    doc.text('USDOT NO: 4193929', 105, y, { align: 'center' });
    y += 8;
  }

  // Divider line
  doc.setDrawColor(200, 200, 200)
  doc.line(14, y, 196, y)
  y += 10

  // Title
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Daily Expense Report', 105, y, { align: 'center' })
  y += 15

  // Report Details Box
  doc.setDrawColor(59, 130, 246) // Blue border
  doc.setFillColor(239, 246, 255) // Light blue background
  doc.roundedRect(14, y, 182, 25, 3, 3, 'FD')
  y += 8

  // Expense Details
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(`Date: ${formatDate(expense.date)}`, 20, y)
  doc.text(`Report ID: ${expense.id}`, 120, y)
  y += 8
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, y)
  y += 15

  // Diesel Section
  doc.setDrawColor(59, 130, 246)
  doc.setFillColor(239, 246, 255)
  doc.roundedRect(14, y, 182, 35, 3, 3, 'FD')
  y += 8
  doc.setFont('helvetica', 'bold')
  doc.text('Diesel Expenses:', 20, y)
  y += 8
  doc.setFont('helvetica', 'normal')
  doc.text(`Amount: ${formatCurrency(expense.diesel_amount)}`, 25, y)
  y += 6
  doc.text(`Location: ${expense.diesel_location}`, 25, y)
  y += 15

  // DEF Section
  doc.setDrawColor(59, 130, 246)
  doc.setFillColor(248, 250, 252) // Light gray background
  doc.roundedRect(14, y, 182, 35, 3, 3, 'FD')
  y += 8
  doc.setFont('helvetica', 'bold')
  doc.text('DEF Expenses:', 20, y)
  y += 8
  doc.setFont('helvetica', 'normal')
  doc.text(`Amount: ${formatCurrency(expense.def_amount)}`, 25, y)
  y += 6
  doc.text(`Location: ${expense.def_location}`, 25, y)
  y += 15

  // Other Expenses Section
  if (expense.other_expense_description && expense.other_expense_amount) {
    doc.setDrawColor(59, 130, 246)
    doc.setFillColor(239, 246, 255)
    doc.roundedRect(14, y, 182, 45, 3, 3, 'FD')
    y += 8
    doc.setFont('helvetica', 'bold')
    doc.text('Other Expenses:', 20, y)
    y += 8
    doc.setFont('helvetica', 'normal')
    doc.text(`Description: ${expense.other_expense_description}`, 25, y)
    y += 6
    doc.text(`Amount: ${formatCurrency(expense.other_expense_amount)}`, 25, y)
    if (expense.other_expense_location) {
      y += 6
      doc.text(`Location: ${expense.other_expense_location}`, 25, y)
    }
    y += 15
  }

  // Total Section
  doc.setDrawColor(34, 197, 94) // Green border
  doc.setFillColor(240, 253, 244) // Light green background
  doc.roundedRect(14, y, 182, 20, 3, 3, 'FD')
  y += 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(`Total Expenses: ${formatCurrency(expense.total)}`, 20, y)
  y += 20

  // Footer
  doc.setDrawColor(200, 200, 200)
  doc.line(14, y, 196, y)
  y += 8
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('This report was generated by Ideal Transportation Solutions LLC', 105, y, { align: 'center' })

  doc.save(`DailyExpense_${expense.id}.pdf`)
}

export default function DailyExpenseReportsPage() {
  const { currentUser, loading: accessLoading, hasAccess, isSuperuser } = useAccessControl();
  const [data, setData] = useState<DailyExpenseData[]>([])
  const [filteredData, setFilteredData] = useState<DailyExpenseData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [driverFilter, setDriverFilter] = useState('')

  useEffect(() => {
    console.log('DailyExpenseReportsPage mounted')
    const fetchData = async () => {
      console.log('Starting to fetch daily expenses')
      try {
        // Test API connection first
        console.log('Testing API connection...')
        const testResponse = await api.get('/transactions')
        console.log('API test response:', testResponse)
        
        setLoading(true)
        setError('')
        console.log('Calling dailyExpenseService.getExpenses()')
        const expenses = await dailyExpenseService.getExpenses()
        console.log('Successfully fetched expenses:', expenses)
        setData(expenses)
        setFilteredData(expenses)
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

  // Filter data based on date range, driver, and sort by date ascending
  useEffect(() => {
    let filtered = [...data] // Create a copy to avoid mutating original data

    if (fromDate) {
      filtered = filtered.filter(expense => 
        new Date(expense.date) >= new Date(fromDate)
      )
    }

    if (toDate) {
      filtered = filtered.filter(expense => 
        new Date(expense.date) <= new Date(toDate)
      )
    }

    if (driverFilter.trim()) {
      filtered = filtered.filter(expense => 
        expense.driver_name?.toLowerCase().includes(driverFilter.toLowerCase())
      )
    }

    // Sort by date in ascending order (oldest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return dateA.getTime() - dateB.getTime()
    })

    setFilteredData(filtered)
  }, [data, fromDate, toDate, driverFilter])

  const clearFilters = () => {
    setFromDate('')
    setToDate('')
    setDriverFilter('')
  }

  // Calculate expense statistics
  const expenseStats = React.useMemo(() => {
    const totalExpenses = filteredData.length
    const totalDiesel = filteredData.reduce((sum, e) => sum + e.diesel_amount, 0)
    const totalDef = filteredData.reduce((sum, e) => sum + e.def_amount, 0)
    const totalOther = filteredData.reduce((sum, e) => sum + (e.other_expense_amount || 0), 0)
    const totalAmount = filteredData.reduce((sum, e) => sum + e.total, 0)
    const avgExpense = totalExpenses > 0 ? totalAmount / totalExpenses : 0

    return {
      totalExpenses,
      totalDiesel,
      totalDef,
      totalOther,
      totalAmount,
      avgExpense
    }
  }, [filteredData])

  console.log('Rendering DailyExpenseReportsPage with:', { data, loading, error })

  // Access control check
  if (accessLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 mb-8 border border-blue-100">
        <div className="text-center py-8">
          <div className="text-gray-500">Checking access permissions...</div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="max-w-5xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 mb-8 border border-red-100">
        <div className="text-center py-8">
          <ShieldExclamationIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-700 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page. Only authorized users can view reports.
          </p>
          <p className="text-sm text-gray-500">
            Current user: {currentUser?.email || 'Not logged in'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 mb-8 border border-blue-100">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-blue-700 tracking-tight flex items-center gap-2">
          <DocumentTextIcon className="h-8 w-8 text-blue-500" /> Daily Expense Reports
        </h1>
        <div className="flex items-center gap-4">
          {isSuperuser && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Superuser Access
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Filter Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              id="fromDate"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="toDate" className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              id="toDate"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="driverFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Driver Name
            </label>
            <input
              type="text"
              id="driverFilter"
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              placeholder="Enter driver name..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
        {(fromDate || toDate || driverFilter) && (
          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredData.length} of {data.length} expenses
            {fromDate && toDate && ` from ${fromDate} to ${toDate}`}
            {fromDate && !toDate && ` from ${fromDate}`}
            {!fromDate && toDate && ` until ${toDate}`}
            {driverFilter && ` matching "${driverFilter}"`}
          </div>
        )}
      </div>

      {/* Expense Statistics */}
      {filteredData.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Expense Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <div className="text-sm text-gray-600">Total Expenses</div>
              <div className="text-2xl font-bold text-blue-600">{expenseStats.totalExpenses}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-green-200">
              <div className="text-sm text-gray-600">Total Diesel</div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(expenseStats.totalDiesel)}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-yellow-200">
              <div className="text-sm text-gray-600">Total DEF</div>
              <div className="text-2xl font-bold text-yellow-600">{formatCurrency(expenseStats.totalDef)}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-purple-200">
              <div className="text-sm text-gray-600">Total Amount</div>
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(expenseStats.totalAmount)}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-green-100 p-3 rounded-lg border border-green-300">
              <div className="text-sm text-green-700">Other Expenses</div>
              <div className="text-lg font-bold text-green-800">{formatCurrency(expenseStats.totalOther)}</div>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg border border-blue-300">
              <div className="text-sm text-blue-700">Average per Expense</div>
              <div className="text-lg font-bold text-blue-800">{formatCurrency(expenseStats.avgExpense)}</div>
            </div>
          </div>
        </div>
      )}
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-red-600 p-4 bg-red-50 rounded-md">
          <p className="font-semibold">Error loading daily expenses:</p>
          <p>{error}</p>
          <p className="text-sm mt-2">Please check the browser console for more details.</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-gray-500 p-4 bg-gray-50 rounded-md">
          No daily expenses found.
        </div>
      ) : (
        <div className="overflow-auto max-h-96 border border-gray-200 rounded-lg">
          <table className="min-w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-blue-100 text-blue-800">
                <th className="border px-3 py-2 text-left min-w-[120px] whitespace-nowrap">Date</th>
                <th className="border px-3 py-2 text-left min-w-[150px] whitespace-nowrap">Driver</th>
                <th className="border px-3 py-2 text-left min-w-[140px] whitespace-nowrap">Diesel</th>
                <th className="border px-3 py-2 text-left min-w-[140px] whitespace-nowrap">DEF</th>
                <th className="border px-3 py-2 text-left min-w-[180px] whitespace-nowrap">Other Expenses</th>
                <th className="border px-3 py-2 text-left min-w-[120px] whitespace-nowrap">Total</th>
                <th className="border px-3 py-2 text-center min-w-[100px] whitespace-nowrap">Download</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((expense) => (
                <tr key={expense.id} className="hover:bg-blue-50">
                  <td className="border px-3 py-2 whitespace-nowrap">{formatDate(expense.date)}</td>
                  <td className="border px-3 py-2">
                    <div className="font-semibold whitespace-nowrap">{expense.driver_name || 'N/A'}</div>
                  </td>
                  <td className="border px-3 py-2">
                    <div className="font-medium">{formatCurrency(expense.diesel_amount)}</div>
                    <div className="text-xs text-gray-500">{expense.diesel_location}</div>
                  </td>
                  <td className="border px-3 py-2">
                    <div className="font-medium">{formatCurrency(expense.def_amount)}</div>
                    <div className="text-xs text-gray-500">{expense.def_location}</div>
                  </td>
                  <td className="border px-3 py-2">
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
                  <td className="border px-3 py-2 font-bold text-green-600 whitespace-nowrap">{formatCurrency(expense.total)}</td>
                  <td className="border px-3 py-2 text-center">
                    <button
                      className="bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700 transition flex items-center gap-1 mx-auto whitespace-nowrap"
                      onClick={async () => await downloadDailyExpensePdf(expense)}
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