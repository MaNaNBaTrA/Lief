'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Error signing out:', error.message)
      return
    }

    router.replace('/signin')
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: '10px',
        background: '#d9534f',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
      }}
    >
      Logout
    </button>
  )
}
