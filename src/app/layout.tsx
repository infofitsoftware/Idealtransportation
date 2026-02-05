import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ideal Transportation Solutions',
  description: 'Professional logistics and transportation services',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full bg-gray-50 dark:bg-gray-900">
      <body
        className={`${inter.className} h-full bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100`}
      >
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  )
} 