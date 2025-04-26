'use client'

import { useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const revenueData = {
  labels: months,
  datasets: [
    {
      label: 'Revenue',
      data: [30000, 35000, 32000, 38000, 42000, 45000, 43000, 47000, 49000, 52000, 50000, 55000],
      borderColor: 'rgb(14, 165, 233)',
      backgroundColor: 'rgba(14, 165, 233, 0.5)',
    },
  ],
}

const deliveriesData = {
  labels: months,
  datasets: [
    {
      label: 'Deliveries',
      data: [150, 165, 155, 178, 190, 205, 200, 215, 225, 235, 230, 245],
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.5)',
    },
  ],
}

const locationData = {
  labels: ['Los Angeles', 'San Francisco', 'Seattle', 'Portland', 'San Diego', 'Las Vegas'],
  datasets: [
    {
      label: 'Deliveries by Location',
      data: [300, 250, 200, 180, 150, 120],
      backgroundColor: 'rgba(14, 165, 233, 0.5)',
    },
  ],
}

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
  },
}

export default function Analytics() {
  const [timeframe, setTimeframe] = useState('year')

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="mt-2 text-sm text-gray-700">
            Detailed insights into your transportation operations.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select
            id="timeframe"
            name="timeframe"
            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm sm:leading-6"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-base font-semibold text-gray-900">Revenue Over Time</h2>
          <div className="mt-6">
            <Line options={options} data={revenueData} />
          </div>
        </div>

        {/* Deliveries Chart */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-base font-semibold text-gray-900">Deliveries Over Time</h2>
          <div className="mt-6">
            <Line options={options} data={deliveriesData} />
          </div>
        </div>

        {/* Popular Locations */}
        <div className="rounded-lg bg-white p-6 shadow lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-900">Popular Locations</h2>
          <div className="mt-6">
            <Bar options={options} data={locationData} />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Average Delivery Time</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">2.4 days</p>
          <p className="mt-2 text-sm text-gray-500">3% better than last month</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Customer Satisfaction</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">4.8/5</p>
          <p className="mt-2 text-sm text-gray-500">Based on 1,250 reviews</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">On-Time Delivery Rate</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">98.5%</p>
          <p className="mt-2 text-sm text-gray-500">1.2% increase from last month</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Active Vehicles</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">48</p>
          <p className="mt-2 text-sm text-gray-500">2 more than last month</p>
        </div>
      </div>
    </div>
  )
} 