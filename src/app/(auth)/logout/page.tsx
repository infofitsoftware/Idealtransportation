'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Logout() {
  const router = useRouter()

  useEffect(() => {
    // TODO: Implement logout functionality
    // Clear session/token
    console.log('Logging out...')
    
    // Redirect to home page
    router.push('/')
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Signing out...</h2>
        <p className="mt-2 text-sm text-gray-600">You will be redirected to the homepage.</p>
      </div>
    </div>
  )
} 