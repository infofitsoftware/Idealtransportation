'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  TruckIcon,
  DocumentTextIcon,
  ChartBarIcon,
  QuestionMarkCircleIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Transactions', href: '/dashboard/transactions', icon: TruckIcon },
  { name: 'Bill of Lading', href: '/dashboard/bol', icon: DocumentTextIcon },
  { name: 'Reports', href: '/dashboard/reports', icon: ChartBarIcon },
  { name: 'Support', href: '/dashboard/support', icon: QuestionMarkCircleIcon },
]

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div
      className={`fixed inset-y-0 z-50 flex w-64 flex-col bg-white transition-all duration-300 ${
        isCollapsed ? '-translate-x-64' : 'translate-x-0'
      }`}
    >
      <div className="flex h-16 flex-shrink-0 items-center px-4">
        <Link href="/dashboard" className="flex items-center">
          <span className="text-2xl font-bold text-gray-900">ITS</span>
        </Link>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 h-6 w-6 flex-shrink-0 ${
                    isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="mt-auto border-t border-gray-200 p-4">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <ArrowLeftOnRectangleIcon
              className={`mr-3 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-gray-500 ${
                isCollapsed ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
            {isCollapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>
      </div>
    </div>
  )
} 