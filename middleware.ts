import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  // Refresh token inválido o expirado → limpiar sesión y redirigir al login
  if (error?.name === 'AuthApiError') {
    const loginUrl = new URL('/auth/login', request.url)
    const response = NextResponse.redirect(loginUrl)
    request.cookies.getAll().forEach(({ name }) => {
      if (name.startsWith('sb-')) response.cookies.delete(name)
    })
    return response
  }

  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isProtectedPage = ['/dashboard', '/saldo', '/juegos', '/historial', '/limites', '/admin'].some(
    path => request.nextUrl.pathname.startsWith(path)
  )

  if (user && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!user && isProtectedPage) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (user && isAuthPage && request.nextUrl.pathname !== '/auth/admin-login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
