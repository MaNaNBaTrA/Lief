'use client'
import LogoutButton from '@/components/logout-button'
import { useAuth } from '@/context/authContext'

export default function PageContent() {
  const { user } = useAuth()

  return (
    <div style={{ padding: '2rem', background: '#e0f7fa', borderRadius: '10px', maxWidth: '600px', margin: '2rem auto', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontFamily: 'sans-serif' }}>

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