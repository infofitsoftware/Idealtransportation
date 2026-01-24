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
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { useAccessControl } from '@/hooks/useAccessControl'
import { useAuth } from '@/hooks/useAuth'

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
  { name: 'User Management', href: '/dashboard/users', icon: UserGroupIcon },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const { isSuperuser, currentUser, loading: accessLoading } = useAccessControl()
  const { logout, user: authUser } = useAuth()
  
  // Use currentUser from useAccessControl, fallback to authUser if needed
  const displayUser = currentUser || authUser
  
  // Determine if user is admin - check both sources and ensure boolean
  // Handle different types: boolean true, string 'true', number 1
  const userIsAdmin = Boolean(
    displayUser && (
      displayUser.is_superuser === true || 
      displayUser.is_superuser === 'true' ||
      displayUser.is_superuser === 1 ||
      displayUser.is_superuser === '1' ||
      isSuperuser === true
    )
  )
  
  // Debug logging (remove in production)
  useEffect(() => {
    if (displayUser) {
      console.log('Sidebar - User Info:', {
        email: displayUser.email,
        full_name: displayUser.full_name,
        is_superuser: displayUser.is_superuser,
        is_superuser_type: typeof displayUser.is_superuser,
        isSuperuser_from_hook: isSuperuser,
        userIsAdmin: userIsAdmin,
        shouldShowReports: userIsAdmin,
        shouldShowUserManagement: userIsAdmin
      })
    }
  }, [displayUser, isSuperuser, userIsAdmin])

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

  const handleLogout = async () => {
    try {
      await logout()
      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity lg:hidden ${open ? 'block' : 'hidden'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-gray-900 to-gray-800 shadow-2xl transition-transform duration-300 transform
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0`}
      >
        {/* Sidebar Header */}
        <div className="flex h-20 flex-shrink-0 items-center px-6 border-b border-gray-700">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
              <span className="text-xl font-bold text-white">ITS</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white">Ideal Transport</span>
              <span className="text-xs text-gray-400">Solutions</span>
            </div>
          </Link>
          {/* Close button for mobile */}
          <button
            className="ml-auto lg:hidden"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <XMarkIcon className="h-6 w-6 text-gray-400 hover:text-white transition-colors" />
          </button>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 border-b border-gray-700">
          {accessLoading ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 animate-pulse">
                <span className="text-sm font-semibold text-gray-400">...</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="h-4 bg-gray-700 rounded w-24 mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-700 rounded w-16 animate-pulse"></div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-md">
                <span className="text-sm font-semibold text-white">
                  {displayUser?.full_name?.charAt(0).toUpperCase() || 
                   displayUser?.email?.charAt(0).toUpperCase() || 
                   'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {displayUser?.full_name || displayUser?.email || 'User'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {userIsAdmin ? 'Administrator' : 'Driver'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              // Skip User Management if user is not admin
              if (item.name === 'User Management' && !userIsAdmin) {
                return null
              }
              // Skip Reports section if user is not admin
              if (item.name === 'Reports' && !userIsAdmin) {
                return null
              }
              const isActive = isItemActive(item)
              const isExpanded = expandedItems.includes(item.name)

              return (
                <div key={item.name}>
                  {item.subItems ? (
                    <>
                      <button
                        onClick={() => toggleSubItems(item.name)}
                        className={`w-full group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        <item.icon
                          className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                            isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                          }`}
                          aria-hidden="true"
                        />
                        {item.name}
                        {isExpanded ? (
                          <ChevronDownIcon className="ml-auto h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRightIcon className="ml-auto h-4 w-4 text-gray-400" />
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
                                className={`group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                                  isSubItemActive
                                    ? 'bg-gray-700 text-white'
                                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                }`}
                              >
                                <subItem.icon
                                  className={`mr-3 h-4 w-4 flex-shrink-0 ${
                                    isSubItemActive ? 'text-white' : 'text-gray-500 group-hover:text-white'
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
                      className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <item.icon
                        className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                          isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
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

          {/* Logout Button */}
          <div className="px-3 py-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-red-600 hover:text-white transition-all"
            >
              <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-white" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
