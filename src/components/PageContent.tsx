'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LogoutButton from '@/components/logout-button'
import { useAuth } from '@/context/authContext'
import { supabase } from '@/lib/supabase/client'

export default function PageContent() {
  const { user } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<{ first_name: string | null, last_name: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCompleteProfile, setShowCompleteProfile] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      if (!user?.email) return

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('email', user.email)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
          setShowCompleteProfile(true) 
        } else {
          setProfile(data)
          if (!data?.first_name) {
            setShowCompleteProfile(true)
          }
        }
      } catch (error) {
        console.error('Error:', error)
        setShowCompleteProfile(true)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user?.email])

  const displayName = profile?.first_name && profile?.last_name 
    ? `${profile.first_name} ${profile.last_name}`
    : user?.user_metadata?.name || user?.email

  const isProfileComplete = profile?.first_name && profile?.last_name

  return (
    <div style={{ padding: '2rem', background: '#e0f7fa', borderRadius: '10px', maxWidth: '600px', margin: '2rem auto', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontFamily: 'sans-serif' }}>

   
      {loading ? (
        <p style={{ marginTop: '1rem', color: '#666' }}>Loading profile...</p>
      ) : (
        <div style={{ marginTop: '1rem' }}>
          {profile?.first_name && profile?.last_name ? (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '1rem', color: '#555', margin: '0.5rem 0' }}>
                <strong>First Name:</strong> {profile.first_name}
              </p>
              <p style={{ fontSize: '1rem', color: '#555', margin: '0.5rem 0' }}>
                <strong>Last Name:</strong> {profile.last_name}
              </p>
            </div>
          ) : (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ color: '#d32f2f', fontStyle: 'italic', marginBottom: '1rem' }}>
                Please complete your profile by adding your name.
              </p>
              <button
                onClick={() => router.push('/complete-profile')}
                style={{
                  background: '#00796b',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Complete Profile
              </button>
            </div>
          )}
        </div>
      )}

      <p style={{ marginTop: '1rem', fontSize: '1rem', color: '#555' }}>Email:</p>
      <code style={{ display: 'block', padding: '0.5rem', background: '#ffffff', border: '1px solid #ccc', borderRadius: '5px', marginTop: '0.5rem', fontFamily: 'monospace' }}>{user?.email}</code>
      
      <p style={{ marginTop: '1rem', fontSize: '1rem', color: '#555' }}>Your unique user ID:</p>
      <code style={{ display: 'block', padding: '0.5rem', background: '#ffffff', border: '1px solid #ccc', borderRadius: '5px', marginTop: '0.5rem', fontFamily: 'monospace' }}>{user?.id}</code>
      
      <div style={{ marginTop: '2rem' }}>
        <LogoutButton />
      </div>
    </div>
  )
}