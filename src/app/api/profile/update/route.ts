import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { firstName, lastName } = await request.json()

    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession()

    console.log('Session:', session)
    console.log('Session error:', sessionError)

    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        first_name: firstName, 
        last_name: lastName 
      })
      .eq('email', session.user.email)

    if (profileError) {
      console.error('Profile update error:', profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    const { error: authError } = await supabase.auth.updateUser({
      data: { name: `${firstName} ${lastName}` },
    })

    if (authError) {
      console.error('Auth update error:', authError)
    }

    return NextResponse.json({ message: 'Profile updated successfully' })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}