'use client'

import { useAccessControl } from '@/hooks/useAccessControl'
import AdminDashboard from '@/components/dashboard/AdminDashboard'
import DriverDashboard from '@/components/dashboard/DriverDashboard'

export default function Dashboard() {
  const { isSuperuser, loading } = useAccessControl()

  // Show loading state while checking user role
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Render role-based dashboard
  return isSuperuser ? <AdminDashboard /> : <DriverDashboard />
} 