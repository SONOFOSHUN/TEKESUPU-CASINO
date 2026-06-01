import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const attempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000

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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY
    const adminCode = process.env.ADMIN_CODE

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey || !adminCode) {
      return NextResponse.json({ error: 'Configuracion admin incompleta' }, { status: 500 })
    }

    const { adminCode: submittedCode } = await request.json()

    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      console.warn(`[admin-access] Sin sesion IP=${ip}`)
      return NextResponse.json({ error: 'Debes estar autenticado' }, { status: 401 })
    }

    if (!submittedCode || submittedCode !== adminCode) {
      console.warn(`[admin-access] Codigo incorrecto user=${user.email} IP=${ip}`)
      return NextResponse.json({ error: 'Codigo de administrador incorrecto' }, { status: 401 })
    }

    const admin = createAdminClient(supabaseUrl, supabaseServiceKey)
    const { data: updatedProfile, error: updateError } = await admin
      .from('profiles')
      .update({ rol: 'admin' })
      .eq('id', user.id)
      .select('id')
      .maybeSingle()

    if (updateError) {
      console.error('[admin-access] Error actualizando rol admin:', updateError.message)
      return NextResponse.json({ error: 'Error actualizando permisos' }, { status: 500 })
    }

    if (!updatedProfile) {
      const meta = user.user_metadata || {}
      const { error: createError } = await admin
        .from('profiles')
        .upsert({
          id: user.id,
          nombre: meta.nombre || user.email?.split('@')[0] || 'Administrador',
          dni: meta.dni || '00000000',
          rol: 'admin',
          tiene_ludopatia: false,
          saldo_virtual: 1000,
        }, { onConflict: 'id' })

      if (createError) {
        console.error('[admin-access] Error creando perfil admin:', createError.message)
        return NextResponse.json({ error: 'Error creando perfil administrador' }, { status: 500 })
      }
    }

    console.info(`[admin-access] AUDIT: ${user.email} accedio como admin desde IP=${ip} at=${new Date().toISOString()}`)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[admin-access] Error interno:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
