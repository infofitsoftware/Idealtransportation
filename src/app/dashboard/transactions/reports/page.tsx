'use client'

import React, { useEffect, useState } from 'react'
import { DocumentTextIcon, ArrowDownTrayIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { transactionService, Transaction as ServiceTransaction } from '@/services/transaction'
import { useAccessControl } from '@/hooks/useAccessControl'
import * as XLSX from 'xlsx'

// Updated interface to match the service interface
interface Transaction {
  id: number
  date: string
  work_order_no: string
  collected_amount: number
  due_amount: number
  bol_id: number
  pickup_location: string
  dropoff_location: string
  payment_type: string
  comments?: string
  user_id: number
  // Broker information (will be populated from BOL)
  broker_name?: string
  broker_address?: string
  broker_phone?: string
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
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

async function downloadTransactionPdf(transaction: Transaction) {
  const doc = new jsPDF()
  let y = -2 // Pulled logo up to match BOL layout

  // Company Header with Logo and Address on same line
  try {
    const logoBase64 = await loadLogoAsBase64();
    if (logoBase64) {
      // Larger logo on the left (same size as BOL: 80x40)
      doc.addImage(logoBase64, 'JPEG', 5, y, 80, 40);
      // Company name and address on the right, same positioning as BOL
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Ideal Transportation Solutions LLC', 85, y + 12, { align: 'left' });
      y += 12;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('16 Palmero Way, Manvel, Texas 77578', 85, y + 8, { align: 'left' });
      y += 8;
      doc.text('USDOT NO: 4193929', 85, y + 8, { align: 'left' });
      y += 25; // Same spacing as BOL
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
  doc.text('Payment Transaction Report', 105, y, { align: 'center' })
  y += 15

  // Report Details Box
  doc.setDrawColor(59, 130, 246) // Blue border
  doc.setFillColor(239, 246, 255) // Light blue background
  doc.roundedRect(14, y, 182, 30, 3, 3, 'FD')
  y += 8

  // Transaction Details
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(`Transaction Date: ${formatDate(transaction.date)}`, 20, y)
  doc.text(`Transaction ID: ${transaction.id}`, 120, y)
  y += 8
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, y)
  y += 20

  // Work Order Information Section
  doc.setDrawColor(59, 130, 246)
  doc.setFillColor(239, 246, 255)
  doc.roundedRect(14, y, 182, 60, 3, 3, 'FD') // Increased height for broker info
  y += 8
  doc.setFont('helvetica', 'bold')
  doc.text('Work Order Information:', 20, y)
  y += 8
  doc.setFont('helvetica', 'normal')
  doc.text(`Work Order Number: ${transaction.work_order_no}`, 25, y)
  y += 6
  doc.text(`Bill of Lading ID: ${transaction.bol_id}`, 25, y)
  y += 6
  // Add broker information (we'll need to fetch this from BOL)
  doc.text(`Broker: ${transaction.broker_name || 'N/A'}`, 25, y)
  y += 6
  doc.text(`Broker Phone: ${transaction.broker_phone || 'N/A'}`, 25, y)
  y += 6
  doc.setFont('helvetica', 'bold')
  doc.text(`Payment Status: ${transaction.due_amount <= 0 ? 'FULLY PAID' : transaction.collected_amount > 0 ? 'PARTIALLY PAID' : 'PENDING PAYMENT'}`, 25, y)
  y += 15

  // Payment Summary Section
  doc.setDrawColor(59, 130, 246)
  doc.setFillColor(248, 250, 252) // Light gray background
  doc.roundedRect(14, y, 182, 50, 3, 3, 'FD')
  y += 8
  doc.setFont('helvetica', 'bold')
  doc.text('Payment Summary:', 20, y)
  y += 8
  doc.setFont('helvetica', 'normal')
  doc.text(`Payment Type: ${transaction.payment_type}`, 25, y)
  y += 6
  doc.setFont('helvetica', 'bold')
  doc.text(`Amount Collected in This Transaction: ${formatCurrency(transaction.collected_amount)}`, 25, y)
  y += 6
  doc.text(`Remaining Due After This Payment: ${formatCurrency(transaction.due_amount)}`, 25, y)
  y += 6
  // Calculate total amount (collected + due)
  const totalAmount = transaction.collected_amount + transaction.due_amount
  doc.text(`Total Work Order Amount: ${formatCurrency(totalAmount)}`, 25, y)
  y += 15

  // Location Information Section
  doc.setDrawColor(59, 130, 246)
  doc.setFillColor(239, 246, 255)
  doc.roundedRect(14, y, 182, 35, 3, 3, 'FD')
  y += 8
  doc.setFont('helvetica', 'bold')
  doc.text('Transportation Details:', 20, y)
  y += 8
  doc.setFont('helvetica', 'normal')
  doc.text(`Pickup Location: ${transaction.pickup_location}`, 25, y)
  y += 6
  doc.text(`Dropoff Location: ${transaction.dropoff_location}`, 25, y)
  y += 15

  // Comments Section (if exists)
  if (transaction.comments) {
    doc.setDrawColor(59, 130, 246)
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(14, y, 182, 30, 3, 3, 'FD')
    y += 8
    doc.setFont('helvetica', 'bold')
    doc.text('Additional Comments:', 20, y)
    y += 8
    doc.setFont('helvetica', 'normal')
    doc.text(transaction.comments, 25, y, { maxWidth: 160 })
    y += 15
  }

  // Payment Status Summary Box
  doc.setDrawColor(transaction.due_amount <= 0 ? 34 : transaction.collected_amount > 0 ? 245 : 239, 
                   transaction.due_amount <= 0 ? 197 : transaction.collected_amount > 0 ? 158 : 68, 
                   transaction.due_amount <= 0 ? 94 : transaction.collected_amount > 0 ? 11 : 54) // Green/Yellow/Red
  doc.setFillColor(transaction.due_amount <= 0 ? 240 : transaction.collected_amount > 0 ? 254 : 254, 
                   transaction.due_amount <= 0 ? 253 : transaction.collected_amount > 0 ? 243 : 242, 
                   transaction.due_amount <= 0 ? 244 : transaction.collected_amount > 0 ? 199 : 235) // Light green/yellow/red
  doc.roundedRect(14, y, 182, 20, 3, 3, 'FD')
  y += 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  const statusText = transaction.due_amount <= 0 ? 
    '✓ PAYMENT COMPLETE - All amounts have been collected' : 
    transaction.collected_amount > 0 ? 
    '⚠ PARTIAL PAYMENT - Additional payments may be required' : 
    '⚠ PAYMENT PENDING - No payments have been collected yet'
  doc.text(statusText, 20, y)
  y += 20

  // Footer
  doc.setDrawColor(200, 200, 200)
  doc.line(14, y, 196, y)
  y += 8
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('This payment transaction report was generated by Ideal Transportation Solutions LLC', 105, y, { align: 'center' })

  doc.save(`Payment_Transaction_${transaction.work_order_no}_${transaction.id}.pdf`)
}

export default function TransactionReportsPage() {
  const { currentUser, loading: accessLoading, hasAccess, isSuperuser } = useAccessControl();
  const [data, setData] = useState<Transaction[]>([])
  const [filteredData, setFilteredData] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const transactions = await transactionService.getTransactions()
        setData(transactions)
        setFilteredData(transactions)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filter data based on date range and sort by date ascending
  useEffect(() => {
    let filtered = [...data] // Create a copy to avoid mutating original data

    if (fromDate) {
      filtered = filtered.filter(transaction => 
        new Date(transaction.date) >= new Date(fromDate)
      )
    }

    if (toDate) {
      filtered = filtered.filter(transaction => 
        new Date(transaction.date) <= new Date(toDate)
      )
    }

    // Sort by date in ascending order (oldest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return dateA.getTime() - dateB.getTime()
    })

    setFilteredData(filtered)
  }, [data, fromDate, toDate])

  const clearFilters = () => {
    setFromDate('')
    setToDate('')
  }

  // Calculate payment statistics
  const paymentStats = React.useMemo(() => {
    const totalTransactions = filteredData.length
    const totalCollected = filteredData.reduce((sum, t) => sum + t.collected_amount, 0)
    const totalDue = filteredData.reduce((sum, t) => sum + t.due_amount, 0)
    const totalAmount = totalCollected + totalDue
    const completionPercentage = totalAmount > 0 ? ((totalCollected / totalAmount) * 100).toFixed(1) : '0.0'
    const fullyPaidCount = filteredData.filter(t => t.due_amount <= 0).length
    const partiallyPaidCount = filteredData.filter(t => t.due_amount > 0 && t.collected_amount > 0).length
    const pendingCount = filteredData.filter(t => t.due_amount > 0 && t.collected_amount <= 0).length

    return {
      totalTransactions,
      totalCollected,
      totalDue,
      totalAmount,
      completionPercentage,
      fullyPaidCount,
      partiallyPaidCount,
      pendingCount
    }
  }, [filteredData])

  const exportToExcel = () => {
    // Prepare data for Excel export
    const excelData = filteredData.map(transaction => ({
      'Date': formatDate(transaction.date),
      'Work Order No': transaction.work_order_no,
      'Broker Name': transaction.broker_name || '',
      'Broker Phone': transaction.broker_phone || '',
      'BOL ID': transaction.bol_id,
      'Pickup Location': transaction.pickup_location,
      'Dropoff Location': transaction.dropoff_location,
      'Payment Type': transaction.payment_type,
      'Amount Collected': transaction.collected_amount,
      'Due Amount': transaction.due_amount,
      'Status': transaction.due_amount <= 0 ? 'Paid' : transaction.collected_amount > 0 ? 'Partial' : 'Pending',
      'Comments': transaction.comments || ''
    }))

    // Create workbook
    const wb = XLSX.utils.book_new()
    
    // Add transactions worksheet
    const ws = XLSX.utils.json_to_sheet(excelData)
    
    // Set column widths for transactions
    const colWidths = [
      { wch: 12 }, // Date
      { wch: 15 }, // Work Order No
      { wch: 20 }, // Broker Name
      { wch: 15 }, // Broker Phone
      { wch: 10 }, // BOL ID
      { wch: 20 }, // Pickup Location
      { wch: 20 }, // Dropoff Location
      { wch: 15 }, // Payment Type
      { wch: 15 }, // Amount Collected
      { wch: 15 }, // Due Amount
      { wch: 10 }, // Status
      { wch: 30 }  // Comments
    ]
    ws['!cols'] = colWidths
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions')

    // Add summary worksheet
    const summaryData = [
      { 'Metric': 'Total Transactions', 'Value': paymentStats.totalTransactions },
      { 'Metric': 'Total Amount Collected', 'Value': paymentStats.totalCollected },
      { 'Metric': 'Total Amount Due', 'Value': paymentStats.totalDue },
      { 'Metric': 'Total Work Order Value', 'Value': paymentStats.totalAmount },
      { 'Metric': 'Payment Completion Rate', 'Value': `${paymentStats.completionPercentage}%` },
      { 'Metric': 'Fully Paid Transactions', 'Value': paymentStats.fullyPaidCount },
      { 'Metric': 'Partially Paid Transactions', 'Value': paymentStats.partiallyPaidCount },
      { 'Metric': 'Pending Payment Transactions', 'Value': paymentStats.pendingCount }
    ]
    
    const summaryWs = XLSX.utils.json_to_sheet(summaryData)
    summaryWs['!cols'] = [{ wch: 30 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Payment Summary')

    // Generate filename with date range
    let filename = 'Transaction_Report'
    if (fromDate && toDate) {
      filename += `_${fromDate}_to_${toDate}`
    } else if (fromDate) {
      filename += `_from_${fromDate}`
    } else if (toDate) {
      filename += `_until_${toDate}`
    }
    filename += '.xlsx'

    // Save the file
    XLSX.writeFile(wb, filename)
  }

  // Access control check
  if (accessLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 mb-8 border border-blue-100">
        <div className="text-center py-8">
          <div className="text-gray-500">Checking access permissions...</div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 mb-8 border border-red-100">
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
          <DocumentTextIcon className="h-8 w-8 text-blue-500" /> Transaction Reports
        </h1>
        <div className="flex items-center gap-4">
          {isSuperuser && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Superuser Access
            </span>
          )}
          <button
            onClick={exportToExcel}
            disabled={filteredData.length === 0}
            className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 ${
              filteredData.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
            }`}
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Export to Excel
          </button>
        </div>
      </div>

      {/* Date Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Filter by Date Range</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
        {(fromDate || toDate) && (
          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredData.length} of {data.length} transactions
            {fromDate && toDate && ` from ${fromDate} to ${toDate}`}
            {fromDate && !toDate && ` from ${fromDate}`}
            {!fromDate && toDate && ` until ${toDate}`}
          </div>
        )}
      </div>

      {/* Payment Statistics */}
      {filteredData.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <div className="text-sm text-gray-600">Total Transactions</div>
              <div className="text-2xl font-bold text-blue-600">{paymentStats.totalTransactions}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-green-200">
              <div className="text-sm text-gray-600">Total Collected</div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(paymentStats.totalCollected)}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-red-200">
              <div className="text-sm text-gray-600">Total Due</div>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(paymentStats.totalDue)}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-purple-200">
              <div className="text-sm text-gray-600">Completion Rate</div>
              <div className="text-2xl font-bold text-purple-600">{paymentStats.completionPercentage}%</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-green-100 p-3 rounded-lg border border-green-300">
              <div className="text-sm text-green-700">Fully Paid</div>
              <div className="text-lg font-bold text-green-800">{paymentStats.fullyPaidCount} transactions</div>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg border border-yellow-300">
              <div className="text-sm text-yellow-700">Partially Paid</div>
              <div className="text-lg font-bold text-yellow-800">{paymentStats.partiallyPaidCount} transactions</div>
            </div>
            <div className="bg-red-100 p-3 rounded-lg border border-red-300">
              <div className="text-sm text-red-700">Pending Payment</div>
              <div className="text-lg font-bold text-red-800">{paymentStats.pendingCount} transactions</div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
                 <div className="overflow-auto max-h-96 border border-gray-200 rounded-lg">
           <table className="min-w-full border-collapse text-sm">
             <thead className="sticky top-0 z-10">
               <tr className="bg-blue-100 text-blue-800">
                 <th className="border px-3 py-2 text-left min-w-[120px] whitespace-nowrap">Date</th>
                 <th className="border px-3 py-2 text-left min-w-[140px] whitespace-nowrap">Work Order</th>
                 <th className="border px-3 py-2 text-left min-w-[180px] whitespace-nowrap">Broker</th>
                 <th className="border px-3 py-2 text-left min-w-[80px] whitespace-nowrap">BOL ID</th>
                 <th className="border px-3 py-2 text-left min-w-[150px] whitespace-nowrap">Pickup</th>
                 <th className="border px-3 py-2 text-left min-w-[150px] whitespace-nowrap">Dropoff</th>
                 <th className="border px-3 py-2 text-left min-w-[120px] whitespace-nowrap">Payment Type</th>
                 <th className="border px-3 py-2 text-left min-w-[130px] whitespace-nowrap">Amount Collected</th>
                 <th className="border px-3 py-2 text-left min-w-[110px] whitespace-nowrap">Due Amount</th>
                 <th className="border px-3 py-2 text-left min-w-[80px] whitespace-nowrap">Status</th>
                 <th className="border px-3 py-2 text-center min-w-[100px] whitespace-nowrap">Download</th>
               </tr>
             </thead>
             <tbody>
               {filteredData.map((transaction) => (
                 <tr key={transaction.id} className="hover:bg-blue-50">
                   <td className="border px-3 py-2 whitespace-nowrap">{formatDate(transaction.date)}</td>
                   <td className="border px-3 py-2 font-medium whitespace-nowrap">{transaction.work_order_no}</td>
                   <td className="border px-3 py-2">
                     <div className="font-semibold whitespace-nowrap">{transaction.broker_name || 'N/A'}</div>
                     <div className="text-xs text-gray-500 whitespace-nowrap">{transaction.broker_phone}</div>
                   </td>
                   <td className="border px-3 py-2 whitespace-nowrap">{transaction.bol_id}</td>
                   <td className="border px-3 py-2 whitespace-nowrap">{transaction.pickup_location}</td>
                   <td className="border px-3 py-2 whitespace-nowrap">{transaction.dropoff_location}</td>
                   <td className="border px-3 py-2 whitespace-nowrap">{transaction.payment_type}</td>
                   <td className="border px-3 py-2 font-medium text-green-600 whitespace-nowrap">{formatCurrency(transaction.collected_amount)}</td>
                   <td className="border px-3 py-2 font-medium text-red-600 whitespace-nowrap">{formatCurrency(transaction.due_amount)}</td>
                   <td className="border px-3 py-2">
                     {transaction.due_amount <= 0 ? (
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                         Paid
                       </span>
                     ) : transaction.collected_amount > 0 ? (
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 whitespace-nowrap">
                         Partial
                       </span>
                     ) : (
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 whitespace-nowrap">
                         Pending
                       </span>
                     )}
                   </td>
                   <td className="border px-3 py-2 text-center">
                     <button
                       className="bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700 transition flex items-center gap-1 mx-auto whitespace-nowrap"
                       onClick={async () => await downloadTransactionPdf(transaction)}
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