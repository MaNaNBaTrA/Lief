'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function CurrentUserProfile() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const redirectToUserProfile = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          router.push('/login')
          return
        }

        router.push(`/profile/${user.id}`)
      } catch (error) {
        console.error('Error getting user:', error)
        router.push('/login')
      }
    }

    redirectToUserProfile()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to your profile...</p>
      </div>
    </div>
  )
}