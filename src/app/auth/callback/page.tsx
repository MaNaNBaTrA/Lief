'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Loader from '@/components/LottieLoader'

export default function AuthCallback() {
  const router = useRouter()

  async function checkUserExists(email: string): Promise<boolean> {
    const query = `
      query CheckUser($email: String!) {
        userByEmail(email: $email) {
          id
        }
      }
    `;

    const variables = { email };

    const res = await fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });

    const json = await res.json();
    return !!json.data.userByEmail;
  }

  async function addUserToPrisma(id: string, email: string) {
    const mutation = `
      mutation CreateUser($data: CreateUserInput!) {
        createUser(data: $data) {
          id
          email
        }
      }
    `;

    const variables = {
      data: { id, email }
    };

    const res = await fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: mutation, variables }),
    });

    const json = await res.json();
    return json.data.createUser;
  }

  async function handleUserInDatabase(session: any) {
    if (!session?.user?.email) return;
    
    try {
      const userExists = await checkUserExists(session.user.email);
      
      if (!userExists) {
        await addUserToPrisma(session.user.id, session.user.email);
      }
    } catch (error) {
      console.error('❌ Error handling user in database:', error);
    }
  }

  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await handleUserInDatabase(session);
        router.replace('/')
      } else {
        router.replace('/signin')
      }
    })

    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (session) {
        await handleUserInDatabase(session);
        router.replace('/')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader width={400} height={400}/>
    </div>
  )
}