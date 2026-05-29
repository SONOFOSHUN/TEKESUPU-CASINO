export interface Profile {
  id: string
  nombre: string
  dni: string
  rol: 'usuario' | 'admin' | 'inversor'
  tiene_ludopatia: boolean
  saldo_virtual: number
  created_at: string
}

export interface Apuesta {
  id: string
  usuario_id: string
  juego: 'ruleta' | 'tragamonedas' | 'deportes'
  tipo_apuesta: string
  monto: number
  ganancia: number
  resultado: 'gano' | 'perdio'
  created_at: string
}

export interface LimiteUsuario {
  id: string
  usuario_id: string
  limite_diario: number
  limite_semanal: number
  limite_mensual: number
  limite_sesion_min: number
}

export interface EventoDeportivo {
  id: string
  equipo_local: string
  equipo_visitante: string
  liga: string
  fecha_evento: string
  odds_local: number
  odds_empate: number
  odds_visitante: number
  activo: boolean
}
