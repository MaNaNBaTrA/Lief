import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    console.log('API called');
    const { email } = await request.json()
    console.log('Email received:', email);

    if (!email || typeof email !== 'string') {
      console.log('Invalid email format');
      return NextResponse.json({ exists: false }, { status: 400 })
    }

    console.log('Querying database for:', email.toLowerCase());
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .limit(1)

    if (error) {
      console.error('Supabase error:', error);
      console.error('  - Message:', (error as any).message);
      console.error('  - Details:', (error as any).details);
      console.error('  - Hint:', (error as any).hint);
      console.error('  - Code:', (error as any).code);
      return NextResponse.json({ exists: false }, { status: 500 })
    }

    console.log('Query result:', data);
    return NextResponse.json({ exists: data.length > 0 })

  } catch (err: any) {
    console.error('API catch block error:', err);
    console.error('  - Error type:', typeof err);
    console.error('  - Error name:', err?.name);
    console.error('  - Error message:', err?.message);
    return NextResponse.json({ exists: false }, { status: 500 })
  }
}