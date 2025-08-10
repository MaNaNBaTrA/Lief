'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

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
      //console.log('🔍 Checking if user exists in database:', session.user.email);
      const userExists = await checkUserExists(session.user.email);
      
      if (!userExists) {
        //console.log('➕ Creating new user in database');
        await addUserToPrisma(session.user.id, session.user.email);
        //console.log('✅ New user created in database');
      } else {
        //console.log('👤 User already exists in database');
      }
    } catch (error) {
      console.error('❌ Error handling user in database:', error);
    }
  }

  useEffect(() => {
    //console.log('🚀 AUTH CALLBACK PAGE LOADED')
    //console.log('Current URL:', window.location.href)
    //console.log('URL params:', window.location.search)

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      //console.log('🔄 Auth state change:', event)
      //console.log('Session from state change:', !!session, session?.user?.email)
      
      if (session) {
        //console.log('✅ Has session, handling database and redirecting to /')
        await handleUserInDatabase(session);
        router.replace('/') 
      } else {
        //console.log('❌ No session, redirecting to signin')
        router.replace('/signin')
      }
    })

   
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      //console.log('📋 Initial session check:', !!session, session?.user?.email)
      //console.log('Session error:', error)
      
      if (session) {
        //console.log('✅ Initial session found, handling database and redirecting to /')
        await handleUserInDatabase(session);
        router.replace('/')
      } else {
        //console.log('❌ No initial session found')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  return <p>Redirecting... (check console for logs)</p>
}