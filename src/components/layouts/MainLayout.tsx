'use client'

import { ReactNode, useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { Bars3Icon } from '@heroicons/react/24/outline'

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col lg:ml-0">
        <button
          className="lg:hidden fixed top-4 left-4 z-50 bg-white rounded-lg shadow-lg p-2.5 border border-gray-200 hover:bg-gray-50 transition-all"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <Bars3Icon className="h-6 w-6 text-gray-700" />
        </button>
        <Header />
        <main className="flex-1 py-8 bg-gradient-to-br from-gray-50 via-white to-gray-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
