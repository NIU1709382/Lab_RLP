// src/proxy.js
import { NextResponse } from 'next/server'

export async function proxy(request) {
  const { pathname } = request.nextUrl

  const isOnDashboard = pathname.startsWith('/dashboard')
  const isOnLanding   = pathname === '/'

  // Supabase guarda la sessió en una cookie que comença per "sb-"
  const cookies = request.cookies.getAll()
  const hasSession = cookies.some(
    (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  )

  // Sense sessió intentant entrar al dashboard → redirigeix a /
  if (isOnDashboard && !hasSession) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Amb sessió a la landing → redirigeix al dashboard
  if (isOnLanding && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],
}