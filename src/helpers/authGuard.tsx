'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/authContext'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireRole?: 'manager' | 'worker'
  redirectTo?: string
}

export default function AuthGuard({
  children,
  requireAuth = false,
  requireRole,
  redirectTo = '/',
}: AuthGuardProps) {
  const { user, role, loading } = useAuth()
  const router = useRouter()
  const [isAllowed, setIsAllowed] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        router.replace(redirectTo)
        setIsAllowed(false)
        return
      }

      if (requireRole && role !== requireRole) {
        router.replace(redirectTo)
        setIsAllowed(false)
        return
      }

      if (!requireAuth && user) {
        router.replace(redirectTo)
        setIsAllowed(false)
        return
      }

      setIsAllowed(true)
    }
  }, [user, role, loading, requireAuth, requireRole, redirectTo, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="card w-96 bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <span className="loading loading-spinner loading-lg"></span>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return isAllowed ? <>{children}</> : null
}