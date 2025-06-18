'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  TruckIcon,
  DocumentTextIcon,
  ChartBarIcon,
  QuestionMarkCircleIcon,
  ArrowLeftOnRectangleIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Transactions', href: '/dashboard/transactions', icon: TruckIcon },
  { name: 'Bill of Lading', href: '/dashboard/bol', icon: DocumentTextIcon },
  {
    name: 'Reports',
    icon: ChartBarIcon,
    subItems: [
      { name: 'BOL Reports', href: '/dashboard/reports', icon: DocumentTextIcon },
      { name: 'Transaction Reports', href: '/dashboard/transactions/reports', icon: TruckIcon },
      { name: 'Daily Expense Reports', href: '/dashboard/transactions/daily-expense/reports', icon: ChartBarIcon },
    ],
  },
  { name: 'Support', href: '/dashboard/support', icon: QuestionMarkCircleIcon },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const toggleSubItems = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  const isItemActive = (item: any) => {
    if (item.href) {
      return pathname === item.href
    }
    if (item.subItems) {
      return item.subItems.some((subItem: any) => pathname === subItem.href)
    }
    return false
  }

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 z-40 bg-black bg-opacity-30 transition-opacity lg:hidden ${open ? 'block' : 'hidden'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transition-transform duration-300 transform
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0`}
      >
        {/* Close button for mobile */}
        <button
          className="absolute top-4 right-4 lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <XMarkIcon className="h-6 w-6 text-gray-500" />
        </button>
        <div className="flex h-16 flex-shrink-0 items-center px-4">
          <Link href="/dashboard" className="flex items-center">
            <span className="text-2xl font-bold text-gray-900">ITS</span>
          </Link>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto">
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = isItemActive(item)
              const isExpanded = expandedItems.includes(item.name)

              return (
                <div key={item.name}>
                  {item.subItems ? (
                    <>
                      <button
                        onClick={() => toggleSubItems(item.name)}
                        className={`w-full group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
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
                        {isExpanded ? (
                          <ChevronDownIcon className="ml-auto h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRightIcon className="ml-auto h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.subItems.map((subItem) => {
                            const isSubItemActive = pathname === subItem.href
                            return (
                              <Link
                                key={subItem.name}
                                href={subItem.href}
                                className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
                                  isSubItemActive
                                    ? 'bg-gray-100 text-gray-900'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                              >
                                <subItem.icon
                                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                                    isSubItemActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                                  }`}
                                  aria-hidden="true"
                                />
                                {subItem.name}
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
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
                  )}
                </div>
              )
            })}
          </nav>
        </div>
      </div>
    </>
  )
} 