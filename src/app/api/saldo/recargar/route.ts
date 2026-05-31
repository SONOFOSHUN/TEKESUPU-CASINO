import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { monto: montoStr } = await req.json()
    const monto = parseFloat(montoStr)
    if (!monto || monto < 1 || monto > 10000) {
      return NextResponse.json({ error: 'Monto inválido (1 - 10,000)' }, { status: 400 })
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )

    const { data: profile } = await admin
      .from('profiles').select('saldo_virtual').eq('id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

    const nuevoSaldo = Number(profile.saldo_virtual) + monto
    const { error } = await admin
      .from('profiles').update({ saldo_virtual: nuevoSaldo }).eq('id', user.id)
    if (error) return NextResponse.json({ error: 'Error actualizando saldo' }, { status: 500 })

    return NextResponse.json({ nuevoSaldo })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
