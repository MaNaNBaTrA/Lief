'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Loader from '@/components/LottieLoader'

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
    <div className="min-h-screen flex items-center justify-center">
      <Loader width={400} height={400}/>
    </div>
  )
}