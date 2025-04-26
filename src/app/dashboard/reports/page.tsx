'use client'

import { useState } from 'react'
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline'

interface Report {
  id: string
  name: string
  description: string
  type: 'Daily' | 'Weekly' | 'Monthly'
  lastGenerated: string
  format: 'CSV' | 'Excel' | 'PDF'
}

const reports: Report[] = [
  {
    id: '1',
    name: 'Daily Transactions',
    description: 'Detailed report of all daily transportation transactions',
    type: 'Daily',
    lastGenerated: '2024-02-20',
    format: 'Excel',
  },
  {
    id: '2',
    name: 'Weekly Revenue Summary',
    description: 'Summary of revenue by location and service type',
    type: 'Weekly',
    lastGenerated: '2024-02-18',
    format: 'PDF',
  },
  {
    id: '3',
    name: 'Monthly Performance Metrics',
    description: 'Key performance indicators and analytics',
    type: 'Monthly',
    lastGenerated: '2024-02-01',
    format: 'CSV',
  },
]

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<string>('')
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  })

  const handleExport = (reportId: string) => {
    // TODO: Implement export functionality
    console.log('Exporting report:', reportId, 'with date range:', dateRange)
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
          <p className="mt-2 text-sm text-gray-700">
            Generate and download reports for your transportation operations.
          </p>
        </div>
      </div>

      {/* Date Range Selection */}
      <div className="mt-8 rounded-lg bg-white p-6 shadow">
        <h2 className="text-base font-semibold text-gray-900">Date Range</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:max-w-lg">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              id="start-date"
              name="start-date"
              value={dateRange.start}
              onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              id="end-date"
              name="end-date"
              value={dateRange.end}
              onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Available Reports */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Available Reports</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none"
            >
              <div className="flex flex-1">
                <div className="flex flex-col">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-900">{report.name}</p>
                    <p className="text-sm text-gray-500">{report.type}</p>
                  </div>
                  <p className="mt-1 flex text-sm text-gray-500">{report.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                        {report.format}
                      </span>
                      <span className="text-xs text-gray-500">
                        Last generated: {report.lastGenerated}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleExport(report.id)}
                      className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      <DocumentArrowDownIcon className="mr-1.5 h-5 w-5 text-gray-400" />
                      Export
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 