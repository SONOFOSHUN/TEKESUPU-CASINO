import { randomUUID } from 'crypto'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

type Juego = 'ruleta' | 'tragamonedas' | 'deportes'
type DbError = {
  code?: string | null
  message?: string | null
  details?: string | null
  hint?: string | null
}

const DEFAULT_LIMITS = {
  diario: 500,
  semanal: 2000,
  mensual: 6000,
}

const ROULETTE = [
  { n: 0, c: 'green' }, { n: 32, c: 'red' }, { n: 15, c: 'black' }, { n: 19, c: 'red' }, { n: 4, c: 'black' },
  { n: 21, c: 'red' }, { n: 2, c: 'black' }, { n: 25, c: 'red' }, { n: 17, c: 'black' }, { n: 34, c: 'red' },
  { n: 6, c: 'black' }, { n: 27, c: 'red' }, { n: 13, c: 'black' }, { n: 36, c: 'red' }, { n: 11, c: 'black' },
  { n: 30, c: 'red' }, { n: 8, c: 'black' }, { n: 23, c: 'red' }, { n: 10, c: 'black' }, { n: 5, c: 'red' },
  { n: 24, c: 'black' }, { n: 16, c: 'red' }, { n: 33, c: 'black' }, { n: 1, c: 'red' }, { n: 20, c: 'black' },
  { n: 14, c: 'red' }, { n: 31, c: 'black' }, { n: 9, c: 'red' }, { n: 22, c: 'black' }, { n: 18, c: 'red' },
  { n: 29, c: 'black' }, { n: 7, c: 'red' }, { n: 28, c: 'black' }, { n: 12, c: 'red' }, { n: 35, c: 'black' },
  { n: 3, c: 'red' }, { n: 26, c: 'black' },
]

const SYMBOLS = [
  '\u{1F352}',
  '\u{1F34B}',
  '\u{1F48E}',
  '\u{1F514}',
  '7\uFE0F\u20E3',
  '\u2B50',
  '\u{1F340}',
  '\u{1F3B0}',
]

const PAYOUTS: Record<string, number> = {
  '\u{1F48E}': 15,
  '7\uFE0F\u20E3': 12,
  '\u{1F514}': 10,
  '\u2B50': 8,
  '\u{1F340}': 6,
  '\u{1F3B0}': 5,
  '\u{1F352}': 3,
  '\u{1F34B}': 2,
}

function logDbError(context: string, error?: DbError | null) {
  if (!error) return
  console.error(context, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  })
}

function apiError(message: string, status = 500, dbError?: DbError | null) {
  const detail = dbError?.message && process.env.NODE_ENV !== 'production'
    ? `: ${dbError.message}`
    : ''
  return NextResponse.json({ error: `${message}${detail}` }, { status })
}

function sumMonto(rows: { monto: number | string | null }[] | null) {
  return rows?.reduce((sum, row) => sum + Number(row.monto || 0), 0) || 0
}

function needsGeneratedId(error?: DbError | null) {
  const message = error?.message?.toLowerCase() || ''
  return error?.code === '23502' && message.includes('id')
}

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Configuracion de Supabase incompleta' }, { status: 500 })
    }

    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError) logDbError('Error leyendo usuario autenticado', authError)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { juego, tipo_apuesta, monto: montoStr, betNumber, odds } = await req.json()
    const monto = Number.parseFloat(String(montoStr))
    if (!monto || monto <= 0 || monto > 50000 || !juego || !tipo_apuesta) {
      return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 })
    }
    if (!['ruleta', 'tragamonedas', 'deportes'].includes(juego)) {
      return NextResponse.json({ error: 'Juego invalido' }, { status: 400 })
    }

    const juegoValido = juego as Juego
    const admin = createAdminClient(supabaseUrl, supabaseServiceKey)

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('saldo_virtual')
      .eq('id', user.id)
      .single()
    if (profileError) {
      logDbError('Error obteniendo perfil para apuesta', profileError)
      return apiError('Error obteniendo perfil', 500, profileError)
    }
    if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
    if (Number(profile.saldo_virtual) < monto) {
      return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 400 })
    }

    const { data: limites, error: limitesError } = await admin
      .from('limites_usuario')
      .select('*')
      .eq('usuario_id', user.id)
      .maybeSingle()
    if (limitesError) {
      logDbError('Error obteniendo limites para apuesta', limitesError)
      return apiError('Error verificando limites', 500, limitesError)
    }

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const { data: apHoy, error: apHoyError } = await admin
      .from('apuestas')
      .select('monto')
      .eq('usuario_id', user.id)
      .gte('created_at', hoy.toISOString())
    if (apHoyError) {
      logDbError('Error verificando limite diario', apHoyError)
      return apiError('Error verificando limites', 500, apHoyError)
    }
    const limiteDiario = limites?.limite_diario || DEFAULT_LIMITS.diario
    if (sumMonto(apHoy) + monto > limiteDiario) {
      return NextResponse.json({ error: 'LIMIT', limitType: 'diario', limit: limiteDiario }, { status: 400 })
    }

    const semana = new Date()
    semana.setDate(semana.getDate() - 7)
    const { data: apSemana, error: apSemanaError } = await admin
      .from('apuestas')
      .select('monto')
      .eq('usuario_id', user.id)
      .gte('created_at', semana.toISOString())
    if (apSemanaError) {
      logDbError('Error verificando limite semanal', apSemanaError)
      return apiError('Error verificando limites', 500, apSemanaError)
    }
    const limiteSemanal = limites?.limite_semanal || DEFAULT_LIMITS.semanal
    if (sumMonto(apSemana) + monto > limiteSemanal) {
      return NextResponse.json({ error: 'LIMIT', limitType: 'semanal', limit: limiteSemanal }, { status: 400 })
    }

    const mes = new Date()
    mes.setDate(1)
    mes.setHours(0, 0, 0, 0)
    const { data: apMes, error: apMesError } = await admin
      .from('apuestas')
      .select('monto')
      .eq('usuario_id', user.id)
      .gte('created_at', mes.toISOString())
    if (apMesError) {
      logDbError('Error verificando limite mensual', apMesError)
      return apiError('Error verificando limites', 500, apMesError)
    }
    const limiteMensual = limites?.limite_mensual || DEFAULT_LIMITS.mensual
    if (sumMonto(apMes) + monto > limiteMensual) {
      return NextResponse.json({ error: 'LIMIT', limitType: 'mensual', limit: limiteMensual }, { status: 400 })
    }

    let won = false
    let gain = 0
    let extra: Record<string, unknown> = {}

    if (juegoValido === 'ruleta') {
      const idx = Math.floor(Math.random() * ROULETTE.length)
      const seg = ROULETTE[idx]
      let multiplier = 2
      const parsedBetNumber = Number.parseInt(String(betNumber), 10)

      if (tipo_apuesta.startsWith('Numero') && parsedBetNumber === seg.n) {
        won = true
        multiplier = 35
      } else if (tipo_apuesta.startsWith('N\u00famero') && parsedBetNumber === seg.n) {
        won = true
        multiplier = 35
      } else if (tipo_apuesta === 'Rojo' && seg.c === 'red') {
        won = true
      } else if (tipo_apuesta === 'Negro' && seg.c === 'black') {
        won = true
      } else if (tipo_apuesta === 'Par' && seg.n % 2 === 0 && seg.n !== 0) {
        won = true
      } else if (tipo_apuesta === 'Impar' && seg.n % 2 !== 0) {
        won = true
      }

      gain = won ? monto * multiplier : 0
      extra = { segNumber: seg.n, segColor: seg.c }
    } else if (juegoValido === 'tragamonedas') {
      const isWin = Math.random() < 0.3
      let reels: string[]
      if (isWin) {
        const sym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
        reels = [sym, sym, sym]
      } else {
        do {
          reels = [
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          ]
        } while (reels[0] === reels[1] && reels[1] === reels[2])
      }

      const allEqual = reels[0] === reels[1] && reels[1] === reels[2]
      const twoEqual = !allEqual && (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2])
      const multiplier = allEqual ? (PAYOUTS[reels[0]] || 5) : twoEqual ? 2 : 0
      gain = multiplier > 0 ? monto * multiplier : 0
      won = gain > 0
      extra = { reels }
    } else {
      won = Math.random() < 0.45
      const oddsValue = Number.parseFloat(String(odds || 2)) || 2.0
      gain = won ? Math.round(monto * oddsValue * 100) / 100 : 0
    }

    const nuevoSaldo = won
      ? Number(profile.saldo_virtual) + gain - monto
      : Number(profile.saldo_virtual) - monto

    const { error: rpcError } = await admin.rpc('realizar_apuesta', {
      p_usuario_id: user.id,
      p_juego: juegoValido,
      p_tipo_apuesta: tipo_apuesta,
      p_monto: monto,
      p_ganancia: gain,
      p_resultado: won ? 'gano' : 'perdio',
    })

    if (rpcError) {
      if (rpcError.message?.includes('SALDO_INSUFICIENTE')) {
        return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 400 })
      }

      logDbError('RPC realizar_apuesta fallo; usando guardado directo', rpcError)

      const baseApuesta = {
        usuario_id: user.id,
        juego: juegoValido,
        tipo_apuesta,
        monto,
        ganancia: gain,
        resultado: won ? 'gano' : 'perdio',
        created_at: new Date().toISOString(),
      }

      let insertResult = await admin
        .from('apuestas')
        .insert(baseApuesta)
        .select('id')
        .single()

      if (needsGeneratedId(insertResult.error)) {
        insertResult = await admin
          .from('apuestas')
          .insert({ id: randomUUID(), ...baseApuesta })
          .select('id')
          .single()
      }

      if (insertResult.error) {
        logDbError('Error insertando apuesta', insertResult.error)
        return apiError('Error guardando resultado', 500, insertResult.error)
      }

      const { error: updateError } = await admin
        .from('profiles')
        .update({ saldo_virtual: nuevoSaldo })
        .eq('id', user.id)
      if (updateError) {
        logDbError('Error actualizando saldo tras apuesta', updateError)

        const insertedId = insertResult.data?.id
        if (insertedId !== undefined && insertedId !== null) {
          const { error: cleanupError } = await admin
            .from('apuestas')
            .delete()
            .eq('id', insertedId)
          logDbError('Error revirtiendo apuesta tras fallo de saldo', cleanupError)
        }

        return apiError('Error guardando resultado', 500, updateError)
      }
    }

    return NextResponse.json({ won, gain, nuevoSaldo, ...extra })
  } catch (error) {
    console.error('Error interno procesando apuesta', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
