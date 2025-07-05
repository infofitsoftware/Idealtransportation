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

// Function to load logo as base64
async function loadLogoAsBase64(): Promise<string | null> {
  try {
    const response = await fetch('/logo.jpeg');
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
      doc.text('Ideal Transportation Solutions Private Limited', 85, y + 12, { align: 'left' });
      y += 12;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('16 Palmero Way, Manvel, Texas 77578', 85, y + 8, { align: 'left' });
      y += 25; // Same spacing as BOL
    } else {
      // Fallback without logo
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Ideal Transportation Solutions Private Limited', 105, y, { align: 'center' });
      y += 6;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('16 Palmero Way, Manvel, Texas 77578', 105, y, { align: 'center' });
      y += 8;
    }
  } catch (err) {
    console.error('Error loading logo:', err);
    // Fallback without logo
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Ideal Transportation Solutions Private Limited', 105, y, { align: 'center' });
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('16 Palmero Way, Manvel, Texas 77578', 105, y, { align: 'center' });
    y += 8;
  }

  // Divider line
  doc.setDrawColor(200, 200, 200)
  doc.line(14, y, 196, y)
  y += 10

  // Title
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Transaction Report', 105, y, { align: 'center' })
  y += 15

  // Report Details Box
  doc.setDrawColor(59, 130, 246) // Blue border
  doc.setFillColor(239, 246, 255) // Light blue background
  doc.roundedRect(14, y, 182, 25, 3, 3, 'FD')
  y += 8

  // Transaction Details
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(`Date: ${formatDate(transaction.date)}`, 20, y)
  doc.text(`Transaction ID: ${transaction.id}`, 120, y)
  y += 8
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, y)
  y += 15

  // Vehicle Information Section
  doc.setDrawColor(59, 130, 246)
  doc.setFillColor(239, 246, 255)
  doc.roundedRect(14, y, 182, 40, 3, 3, 'FD')
  y += 8
  doc.setFont('helvetica', 'bold')
  doc.text('Vehicle Information:', 20, y)
  y += 8
  doc.setFont('helvetica', 'normal')
  doc.text(`Vehicle: ${transaction.car_year} ${transaction.car_make} ${transaction.car_model}`, 25, y)
  y += 6
  doc.text(`VIN: ${transaction.car_vin}`, 25, y)
  y += 15

  // Location Information Section
  doc.setDrawColor(59, 130, 246)
  doc.setFillColor(248, 250, 252) // Light gray background
  doc.roundedRect(14, y, 182, 35, 3, 3, 'FD')
  y += 8
  doc.setFont('helvetica', 'bold')
  doc.text('Location Information:', 20, y)
  y += 8
  doc.setFont('helvetica', 'normal')
  doc.text(`Pickup Location: ${transaction.pickup_location}`, 25, y)
  y += 6
  doc.text(`Dropoff Location: ${transaction.dropoff_location}`, 25, y)
  y += 15

  // Payment Information Section
  doc.setDrawColor(59, 130, 246)
  doc.setFillColor(239, 246, 255)
  doc.roundedRect(14, y, 182, 30, 3, 3, 'FD')
  y += 8
  doc.setFont('helvetica', 'bold')
  doc.text('Payment Information:', 20, y)
  y += 8
  doc.setFont('helvetica', 'normal')
  doc.text(`Payment Type: ${transaction.payment_type}`, 25, y)
  y += 6
  doc.setFont('helvetica', 'bold')
  doc.text(`Amount: ${formatCurrency(transaction.amount)}`, 25, y)
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

  // Footer
  doc.setDrawColor(200, 200, 200)
  doc.line(14, y, 196, y)
  y += 8
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('This report was generated by Ideal Transportation Solutions Private Limited', 105, y, { align: 'center' })

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