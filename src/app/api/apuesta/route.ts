import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const ROULETTE = [
  {n:0,c:'green'},{n:32,c:'red'},{n:15,c:'black'},{n:19,c:'red'},{n:4,c:'black'},
  {n:21,c:'red'},{n:2,c:'black'},{n:25,c:'red'},{n:17,c:'black'},{n:34,c:'red'},
  {n:6,c:'black'},{n:27,c:'red'},{n:13,c:'black'},{n:36,c:'red'},{n:11,c:'black'},
  {n:30,c:'red'},{n:8,c:'black'},{n:23,c:'red'},{n:10,c:'black'},{n:5,c:'red'},
  {n:24,c:'black'},{n:16,c:'red'},{n:33,c:'black'},{n:1,c:'red'},{n:20,c:'black'},
  {n:14,c:'red'},{n:31,c:'black'},{n:9,c:'red'},{n:22,c:'black'},{n:18,c:'red'},
  {n:29,c:'black'},{n:7,c:'red'},{n:28,c:'black'},{n:12,c:'red'},{n:35,c:'black'},
  {n:3,c:'red'},{n:26,c:'black'}
]
const SYMBOLS = ['🍒', '🍋', '💎', '🔔', '7️⃣', '⭐', '🍀', '🎰']
const PAYOUTS: Record<string, number> = {
  '💎': 15, '7️⃣': 12, '🔔': 10, '⭐': 8, '🍀': 6, '🎰': 5, '🍒': 3, '🍋': 2
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verificar sesión del usuario
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { juego, tipo_apuesta, monto: montoStr, betNumber, odds } = await req.json()
    const monto = parseFloat(montoStr)
    if (!monto || monto <= 0 || monto > 50000 || !juego || !tipo_apuesta) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    // 2. Operaciones atómicas con service role (saldo, límites, resultado)
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )

    const { data: profile } = await admin
      .from('profiles').select('saldo_virtual').eq('id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
    // Nota: el RPC realizar_apuesta también valida saldo con bloqueo de fila (FOR UPDATE)

    // Verificar límites (diario, semanal, mensual)
    const { data: limites } = await admin
      .from('limites_usuario').select('*').eq('usuario_id', user.id).single()

    const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
    const { data: apHoy } = await admin.from('apuestas').select('monto')
      .eq('usuario_id', user.id).gte('created_at', hoy.toISOString())
    const gastadoHoy = apHoy?.reduce((s, a) => s + Number(a.monto), 0) || 0
    if (gastadoHoy + monto > (limites?.limite_diario || 500)) {
      return NextResponse.json({ error: 'LIMIT', limitType: 'diario', limit: limites?.limite_diario || 500 }, { status: 400 })
    }

    const semana = new Date(); semana.setDate(semana.getDate() - 7)
    const { data: apSemana } = await admin.from('apuestas').select('monto')
      .eq('usuario_id', user.id).gte('created_at', semana.toISOString())
    const gastadoSemana = apSemana?.reduce((s, a) => s + Number(a.monto), 0) || 0
    if (gastadoSemana + monto > (limites?.limite_semanal || 2000)) {
      return NextResponse.json({ error: 'LIMIT', limitType: 'semanal', limit: limites?.limite_semanal || 2000 }, { status: 400 })
    }

    const mes = new Date(); mes.setDate(1); mes.setHours(0, 0, 0, 0)
    const { data: apMes } = await admin.from('apuestas').select('monto')
      .eq('usuario_id', user.id).gte('created_at', mes.toISOString())
    const gastadoMes = apMes?.reduce((s, a) => s + Number(a.monto), 0) || 0
    if (gastadoMes + monto > (limites?.limite_mensual || 6000)) {
      return NextResponse.json({ error: 'LIMIT', limitType: 'mensual', limit: limites?.limite_mensual || 6000 }, { status: 400 })
    }

    // 3. Calcular resultado en el servidor
    let won = false
    let gain = 0
    let extra: Record<string, unknown> = {}

    if (juego === 'ruleta') {
      const idx = Math.floor(Math.random() * ROULETTE.length)
      const seg = ROULETTE[idx]
      let multiplier = 2
      if (tipo_apuesta.startsWith('Número') && parseInt(betNumber) === seg.n) { won = true; multiplier = 35 }
      else if (tipo_apuesta === 'Rojo' && seg.c === 'red') won = true
      else if (tipo_apuesta === 'Negro' && seg.c === 'black') won = true
      else if (tipo_apuesta === 'Par' && seg.n % 2 === 0 && seg.n !== 0) won = true
      else if (tipo_apuesta === 'Impar' && seg.n % 2 !== 0) won = true
      gain = won ? monto * multiplier : 0
      extra = { segNumber: seg.n, segColor: seg.c }
    } else if (juego === 'tragamonedas') {
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
    } else if (juego === 'deportes') {
      won = Math.random() < 0.45
      const oddsValue = parseFloat(odds) || 2.0
      gain = won ? Math.round(monto * oddsValue * 100) / 100 : 0
    } else {
      return NextResponse.json({ error: 'Juego inválido' }, { status: 400 })
    }

    const nuevoSaldo = won
      ? Number(profile.saldo_virtual) + gain - monto
      : Number(profile.saldo_virtual) - monto

    // 4. Guardar con RPC transaccional (SELECT FOR UPDATE evita race conditions)
    const { error: rpcError } = await admin.rpc('realizar_apuesta', {
      p_usuario_id: user.id,
      p_juego: juego,
      p_tipo_apuesta: tipo_apuesta,
      p_monto: monto,
      p_ganancia: gain,
      p_resultado: won ? 'gano' : 'perdio',
    })

    if (rpcError) {
      if (rpcError.message?.includes('SALDO_INSUFICIENTE')) {
        return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Error guardando resultado' }, { status: 500 })
    }

    return NextResponse.json({ won, gain, nuevoSaldo, ...extra })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
