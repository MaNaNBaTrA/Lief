'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/authContext'
import Loader from '@/components/LottieLoader'

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
      <div className="min-h-screen flex items-center justify-center">
        <Loader width={400} height={400} />
      </div>
    )
  }

  return isAllowed ? <>{children}</> : null
}