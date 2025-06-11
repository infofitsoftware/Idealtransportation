'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/services/auth'
import DashboardLayout from '@/components/layouts/DashboardLayout'

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = authService.getToken()
        if (!token) {
          router.push('/auth/login')
          return
        }
        const userData = await authService.getCurrentUser()
        if (!userData) {
          router.push('/auth/login')
          return
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth/login')
      }
    }

    checkAuth()
  }, [router])

  return <DashboardLayout>{children}</DashboardLayout>
} 