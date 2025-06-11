'use client'

import { ReactNode } from 'react'
import MainLayout from './MainLayout'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <MainLayout>{children}</MainLayout>
} 