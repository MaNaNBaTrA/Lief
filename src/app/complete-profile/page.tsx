'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client' 

export default function CompleteProfilePage() {
  const router = useRouter()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          first_name: firstName, 
          last_name: lastName 
        })
        .eq('email', user.email)

      if (profileError) {
        throw new Error(profileError.message)
      }

      const { error: authError } = await supabase.auth.updateUser({
        data: { name: `${firstName} ${lastName}` },
      })

      if (authError) {
        console.error('Auth update error:', authError)
      }

      window.location.href = '/'
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: '2rem' }}>
      <h1>Complete Your Profile</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="firstName">First Name:</label>
          <input
            id="firstName"
            type="text"
            required
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="lastName">Last Name:</label>
          <input
            id="lastName"
            type="text"
            required
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" disabled={loading} style={{ padding: '0.75rem 1.5rem' }}>
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </form>
    </div>
  )
}