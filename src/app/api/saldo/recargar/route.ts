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

    // RPC transaccional: UPDATE atómico con bloqueo de fila
    const { data: nuevoSaldo, error } = await admin.rpc('recargar_saldo', {
      p_usuario_id: user.id,
      p_monto: monto,
    })

    if (error) {
      if (error.message?.includes('PERFIL_NO_ENCONTRADO')) {
        return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
      }
      // Fallback si la función RPC aún no existe en Supabase
      if (error.code === 'PGRST202' || error.message?.includes('does not exist')) {
        const { data: perfil } = await admin.from('profiles').select('saldo_virtual').eq('id', user.id).single()
        if (!perfil) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
        const nuevoSaldoFallback = Number(perfil.saldo_virtual) + monto
        const { error: e } = await admin.from('profiles').update({ saldo_virtual: nuevoSaldoFallback }).eq('id', user.id)
        if (e) return NextResponse.json({ error: 'Error actualizando saldo' }, { status: 500 })
        return NextResponse.json({ nuevoSaldo: nuevoSaldoFallback })
      }
      return NextResponse.json({ error: 'Error actualizando saldo' }, { status: 500 })
    }

    return NextResponse.json({ nuevoSaldo })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
