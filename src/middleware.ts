import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public pages
  if (
    pathname.startsWith('/Submit') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname === '/sw.js'
  ) {
    return NextResponse.next()
  }

  // Check for session cookie
  const hasSession = request.cookies.has('sb-vonpqysqaydtumiovbfx-auth-token') ||
    request.cookies.has('sb-access-token') ||
    request.cookies.getAll().some(c => c.name.includes('supabase') || c.name.includes('sb-'))

  if (!hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|sw.js).*)'],
}