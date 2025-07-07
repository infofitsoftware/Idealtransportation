'use client'

import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { Bars3Icon, XMarkIcon, PhoneIcon, EnvelopeIcon, MapPinIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Services', href: '/services' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
]

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const handleLoginClick = () => {
    // Clear any existing session data
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    // Force a hard navigation to the login page
    window.location.href = '/auth/login'
  }

  return (
    <header className="relative">
      {/* Info Header */}
      <div className="bg-primary-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between py-2 text-xs sm:text-sm">
            <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-6 mb-2 sm:mb-0">
              <div className="flex items-center space-x-2">
                <PhoneIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline sm:inline">+1 (555) 123-4567</span>
                <span className="xs:hidden sm:hidden">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <EnvelopeIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">info@idealtransportation.com</span>
                <span className="sm:hidden">info@idealtransportation.com</span>
              </div>
              <div className="hidden lg:flex items-center space-x-2">
                <MapPinIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>16 Palmero Way, Manvel, Texas 77578</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="hidden md:inline text-xs">24/7 Support Available</span>
              <button
                onClick={handleLoginClick}
                className="rounded-md bg-primary-600 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-500 transition-colors"
              >
                Client Login
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-28">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
                <Image
                  src="/logo.jpeg"
                  alt="Ideal Transportation Logo"
                  width={200}
                  height={43}
                  className="h-28 w-auto"
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-sm font-semibold transition-colors ${
                    pathname === item.href 
                      ? 'text-primary-600 border-b-2 border-primary-600' 
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:text-primary-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                onClick={() => setMobileMenuOpen(true)}
              >
                <span className="sr-only">Open main menu</span>
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <Dialog as="div" className="lg:hidden" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
          <div className="fixed inset-0 z-50" />
          <Dialog.Panel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center">
                <Image
                  src="/logo.jpeg"
                  alt="Ideal Transportation Logo"
                  width={250}
                  height={54}
                  className="w-auto"
                />
              </Link>
              <button
                type="button"
                className="rounded-md p-2 text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`block rounded-lg px-3 py-2 text-base font-semibold ${
                        pathname === item.href
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-900 hover:bg-gray-50'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
                <div className="py-6">
                  <button
                    onClick={() => {
                      handleLoginClick()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full text-left rounded-lg px-3 py-2.5 text-base font-semibold text-gray-900 hover:bg-gray-50"
                  >
                    Client Login
                  </button>
                </div>
              </div>
            </div>
          </Dialog.Panel>
        </Dialog>
      </nav>
    </header>
  )
} 