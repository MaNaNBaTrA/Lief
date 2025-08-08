'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        router.replace('/') 
      } else {
        router.replace('/signin')
      }
    })

   
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/')
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  return <p>Redirecting...</p>
}
