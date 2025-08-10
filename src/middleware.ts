import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res: response })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  //console.log('Middleware pathname:', pathname)
  //console.log('Session:', !!session)

  const publicPaths = ['/signin', '/signup', '/auth/callback']
  const isPublicPath = publicPaths.includes(pathname)

  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  if (session) {
    const userRole = session.user.user_metadata?.role || 'worker'

    if (pathname === '/signin' || pathname === '/signup') {
      if (userRole === 'manager') {
        return NextResponse.redirect(new URL('/manager', request.url))
      } else {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }

    if (pathname === '/' && userRole === 'manager') {
      return NextResponse.redirect(new URL('/manager', request.url))
    }

    if (pathname === '/dashboard' && userRole === 'manager') {
      return NextResponse.redirect(new URL('/manager/dashboard', request.url))
    }
    
    if (pathname.startsWith('/manager') && userRole !== 'manager') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|auth|_next/static|_next/image|favicon.ico).*)',
  ],
}