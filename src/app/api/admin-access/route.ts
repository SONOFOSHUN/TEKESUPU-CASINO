import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Rate limiting simple en memoria (reinicia con cada cold start en Vercel)
const attempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutos

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > MAX_ATTEMPTS
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'

  if (isRateLimited(ip)) {
    console.warn(`[admin-access] Rate limit excedido IP=${ip}`)
    return NextResponse.json({ error: 'Demasiados intentos. Espera 15 minutos.' }, { status: 429 })
  }

  try {
    // 1. Requiere sesión autenticada existente
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )
    const { data: { user: callerUser } } = await supabaseAuth.auth.getUser()
    if (!callerUser) {
      console.warn(`[admin-access] Sin sesión IP=${ip}`)
      return NextResponse.json({ error: 'Debes estar autenticado' }, { status: 401 })
    }

    const { email, password, adminCode } = await request.json()

    // 2. Verificar código admin
    if (!adminCode || adminCode !== process.env.ADMIN_CODE) {
      console.warn(`[admin-access] Código incorrecto caller=${callerUser.email} IP=${ip}`)
      return NextResponse.json({ error: 'Código de administrador incorrecto' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )

    // 3. Buscar usuario por email
    const { data: users } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const user = users?.users.find(u => u.email === email)
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // 4. Verificar credenciales del usuario a promover
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { error: signInError } = await anonClient.auth.signInWithPassword({ email, password })
    if (signInError) {
      console.warn(`[admin-access] Credenciales incorrectas target=${email} caller=${callerUser.email}`)
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    }

    // 5. Promover a admin
    await supabase.from('profiles').update({ rol: 'admin' }).eq('id', user.id)

    console.info(`[admin-access] AUDIT: ${email} promovido a admin por ${callerUser.email} desde IP=${ip} at=${new Date().toISOString()}`)
    return NextResponse.json({ success: true })

  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
