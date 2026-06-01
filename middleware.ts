import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    const isAuthPage = pathname.startsWith('/auth')
    const isAdminLoginPage = pathname === '/auth/admin-login'
    const isProtectedPage = [
      '/dashboard', '/saldo', '/juegos',
      '/historial', '/limites', '/admin'
    ].some(path => pathname.startsWith(path))

    // Sin sesión → redirigir a login
    if (!user && isProtectedPage) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Con sesión en página auth (excepto admin-login) → dashboard
    if (user && isAuthPage && !isAdminLoginPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // La landing (/) es accesible para todos, incluso autenticados

  } catch (error) {
    // Si falla el middleware, dejar pasar la request
    console.error('Middleware error:', error)
    return NextResponse.next({ request })
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
