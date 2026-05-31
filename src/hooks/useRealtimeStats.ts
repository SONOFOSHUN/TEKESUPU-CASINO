'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface AdminStats {
  totalUsuarios: number
  usuariosHoy: number
  bloqueados: number
  apuestasHoy: number
  apuestasTotales: number
  ingresosMes: number
  ingresosHoy: number
  saldoTotalUsuarios: number
  juegoMasPopular: string
  tasaVictoria: number
  porJuego: { juego: string, sesiones: number, ganancia: number }[]
  ultimasApuestas: {
    id: string
    juego: string
    tipo_apuesta: string
    monto: number
    ganancia: number
    resultado: string
    created_at: string
    profiles?: { nombre: string }
  }[]
  usuariosRecientes: {
    id: string
    nombre: string
    rol: string
    saldo_virtual: number
    created_at: string
  }[]
}

export function useRealtimeStats() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    const supabase = createClient()

    // Total usuarios (todos los profiles)
    const { count: totalUsuarios } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Usuarios registrados hoy (todos los roles)
    const hoy = new Date(); hoy.setHours(0,0,0,0)
    const { count: usuariosHoy } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', hoy.toISOString())

    // Bloqueados por ludopatía
    const { count: bloqueados } = await supabase
      .from('registros_ludopatia').select('*', { count: 'exact', head: true })

    // Apuestas hoy
    const { count: apuestasHoy } = await supabase
      .from('apuestas').select('*', { count: 'exact', head: true })
      .gte('created_at', hoy.toISOString())

    // Apuestas totales
    const { count: apuestasTotales } = await supabase
      .from('apuestas').select('*', { count: 'exact', head: true })

    // Ingresos del mes (suma de montos apostados)
    const mes = new Date(); mes.setDate(1); mes.setHours(0,0,0,0)
    const { data: apuestasMes } = await supabase
      .from('apuestas').select('monto, ganancia')
      .gte('created_at', mes.toISOString())
    const ingresosMes = apuestasMes?.reduce((acc, a) => acc + Number(a.monto), 0) || 0

    // Ingresos hoy
    const { data: apuestasHoyData } = await supabase
      .from('apuestas').select('monto, ganancia')
      .gte('created_at', hoy.toISOString())
    const ingresosHoy = apuestasHoyData?.reduce((acc, a) => acc + Number(a.monto), 0) || 0

    // Saldo total de todos los usuarios
    const { data: perfiles } = await supabase
      .from('profiles').select('saldo_virtual').eq('rol', 'usuario')
    const saldoTotalUsuarios = perfiles?.reduce((acc, p) => acc + Number(p.saldo_virtual), 0) || 0

    // Stats por juego
    const juegos = ['ruleta', 'tragamonedas', 'deportes']
    const porJuego = await Promise.all(juegos.map(async j => {
      const { data } = await supabase
        .from('apuestas').select('monto, ganancia').eq('juego', j)
      return {
        juego: j,
        sesiones: data?.length || 0,
        ganancia: data?.reduce((acc, a) => acc + Number(a.ganancia), 0) || 0
      }
    }))

    // Juego más popular
    const masPopular = porJuego.reduce((prev, curr) =>
      curr.sesiones > prev.sesiones ? curr : prev, porJuego[0])

    // Tasa de victoria global
    const { count: totalGanadas } = await supabase
      .from('apuestas').select('*', { count: 'exact', head: true })
      .eq('resultado', 'gano')
    const tasaVictoria = apuestasTotales
      ? Math.round(((totalGanadas || 0) / apuestasTotales) * 100)
      : 0

    // Últimas 10 apuestas con nombre de usuario
    const { data: ultimasApuestas } = await supabase
      .from('apuestas')
      .select('*, profiles(nombre)')
      .order('created_at', { ascending: false })
      .limit(10)

    // Usuarios más recientes
    const { data: usuariosRecientes } = await supabase
      .from('profiles')
      .select('id, nombre, rol, saldo_virtual, created_at')
      .order('created_at', { ascending: false })
      .limit(8)

    setStats({
      totalUsuarios: totalUsuarios || 0,
      usuariosHoy: usuariosHoy || 0,
      bloqueados: bloqueados || 0,
      apuestasHoy: apuestasHoy || 0,
      apuestasTotales: apuestasTotales || 0,
      ingresosMes,
      ingresosHoy,
      saldoTotalUsuarios,
      juegoMasPopular: masPopular?.juego || 'ruleta',
      tasaVictoria,
      porJuego,
      ultimasApuestas: ultimasApuestas || [],
      usuariosRecientes: usuariosRecientes || [],
    })
    setLoading(false)
  }

  useEffect(() => {
    void fetchStats() // eslint-disable-line react-hooks/set-state-in-effect
    const supabase = createClient()

    // Suscripción realtime a apuestas
    const apuestasChannel = supabase
      .channel('apuestas-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'apuestas' },
        () => { fetchStats() }
      )
      .subscribe()

    // Suscripción realtime a profiles
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => { fetchStats() }
      )
      .subscribe()

    // Refresh automático cada 30 segundos
    const interval = setInterval(fetchStats, 30000)

    return () => {
      supabase.removeChannel(apuestasChannel)
      supabase.removeChannel(profilesChannel)
      clearInterval(interval)
    }
  }, [])

  return { stats, loading, refresh: fetchStats }
}
