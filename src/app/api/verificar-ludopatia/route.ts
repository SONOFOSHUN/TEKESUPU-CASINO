import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Este endpoint es llamado durante el registro (antes de crear sesión),
    // por eso no requiere auth. En producción real añadir rate-limiting (ej. Upstash).
    const { dni } = await request.json()

    if (!dni) {
      return NextResponse.json({ error: 'DNI requerido' }, { status: 400 })
    }

    // Usar service role para saltear RLS y consultar la tabla
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )

    const { data, error } = await supabase
      .from('registros_ludopatia')
      .select('dni, nombre, motivo')
      .eq('dni', dni.trim())
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, caso normal (no bloqueado)
      return NextResponse.json({ error: 'Error consultando registro' }, { status: 500 })
    }

    return NextResponse.json({
      tiene_ludopatia: !!data,
      motivo: data?.motivo || null,
    })

  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
