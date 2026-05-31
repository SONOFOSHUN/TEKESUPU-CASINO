'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UsuarioDetalle {
  id: string
  nombre: string
  dni: string
  rol: string
  saldo_virtual: number
  created_at: string
  totalApuestas: number
  totalGanado: number
  totalApostado: number
  tasaExito: number
  juegoFavorito: string
  ultimaApuesta: string | null
}

interface Apuesta {
  id: string
  juego: string
  tipo_apuesta: string
  monto: number
  ganancia: number
  resultado: string
  created_at: string
}

export default function UsuariosAdminPage() {
  const [usuarios, setUsuarios] = useState<UsuarioDetalle[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<UsuarioDetalle | null>(null)
  const [apuestasUsuario, setApuestasUsuario] = useState<Apuesta[]>([])
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  const fetchUsuarios = async () => {
    const supabase = createClient()

    // 1. Traer todos los profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (!profiles || profiles.length === 0) {
      setUsuarios([])
      setLoading(false)
      return
    }

    // 2. Traer todas las apuestas de una vez
    const { data: todasApuestas } = await supabase
      .from('apuestas')
      .select('usuario_id, monto, ganancia, resultado, juego, created_at')

    // 3. Calcular stats por usuario en el cliente
    const detallados = profiles.map(p => {
      const apuestas = todasApuestas?.filter(a => a.usuario_id === p.id) || []

      const totalApuestas = apuestas.length
      const totalApostado = apuestas.reduce((acc, a) => acc + Number(a.monto), 0)
      const totalGanado = apuestas.reduce((acc, a) => acc + Number(a.ganancia), 0)
      const ganadas = apuestas.filter(a => a.resultado === 'gano').length
      const tasaExito = totalApuestas > 0 ? Math.round((ganadas / totalApuestas) * 100) : 0

      const conteoJuegos: Record<string, number> = {}
      apuestas.forEach(a => { conteoJuegos[a.juego] = (conteoJuegos[a.juego] || 0) + 1 })
      const juegoFavorito = Object.entries(conteoJuegos)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Sin apuestas'

      const apuestasOrdenadas = [...apuestas].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      const ultimaApuesta = apuestasOrdenadas[0]?.created_at || null

      return {
        ...p,
        totalApuestas,
        totalApostado,
        totalGanado,
        tasaExito,
        juegoFavorito,
        ultimaApuesta,
      }
    })

    setUsuarios(detallados)
    setLoading(false)
  }

  const verDetalle = async (usuario: UsuarioDetalle) => {
    setSelected(usuario)
    setLoadingDetalle(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('apuestas')
      .select('*')
      .eq('usuario_id', usuario.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setApuestasUsuario(data || [])
    setLoadingDetalle(false)
  }

  useEffect(() => {
    void fetchUsuarios() // eslint-disable-line react-hooks/set-state-in-effect

    const supabase = createClient()
    const channel = supabase.channel('usuarios-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchUsuarios)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'apuestas' }, fetchUsuarios)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const filtrados = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.dni.includes(busqueda)
  )

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
      <span className="spinner" />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="font-cinzel" style={{ fontSize: 'clamp(18px,3vw,24px)', marginBottom: '6px' }}>
            👤 Gestión de Usuarios
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--casino-green)', animation: 'pulse 2s infinite' }} />
            <span style={{ color: 'var(--casino-muted)', fontSize: '12px' }}>
              {usuarios.length} usuarios registrados · Tiempo real
            </span>
          </div>
        </div>
        <input
          className="input-casino"
          placeholder="Buscar por nombre o DNI..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ width: '240px' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? 'minmax(0,1fr) minmax(0,1fr)' : '1fr', gap: '16px', alignItems: 'start' }}>

        {/* Lista de usuarios */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtrados.length === 0 ? (
            <div className="card-casino" style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: 'var(--casino-muted)' }}>No se encontraron usuarios</p>
            </div>
          ) : (
            filtrados.map(u => (
              <div
                key={u.id}
                className="card-casino"
                onClick={() => verDetalle(u)}
                style={{
                  padding: '18px', cursor: 'pointer', transition: 'all 0.2s',
                  borderColor: selected?.id === u.id ? 'rgba(201,162,39,0.5)' : 'var(--casino-border)',
                  background: selected?.id === u.id ? 'rgba(201,162,39,0.04)' : 'rgba(255,255,255,0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                      background: u.rol === 'admin'
                        ? 'linear-gradient(135deg, #8B0000, #CC2200)'
                        : 'linear-gradient(135deg, var(--casino-gold), #9A7A1E)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, color: '#000', fontFamily: 'Cinzel', fontSize: '13px',
                    }}>
                      {u.nombre.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-cinzel" style={{ fontSize: '14px', marginBottom: '3px' }}>{u.nombre}</div>
                      <div style={{ fontSize: '11px', color: 'var(--casino-muted)' }}>DNI: {u.dni}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span
                      className={u.rol === 'admin' ? 'badge-red' : 'badge-green'}
                      style={{ fontSize: '10px', display: 'block', marginBottom: '4px' }}
                    >
                      {u.rol}
                    </span>
                    <div className="font-cinzel" style={{ color: 'var(--casino-gold)', fontSize: '13px' }}>
                      S/ {Number(u.saldo_virtual).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Mini stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {[
                    { label: 'Apuestas', value: u.totalApuestas },
                    { label: 'Apostado', value: `S/ ${u.totalApostado.toFixed(0)}` },
                    { label: 'Ganado', value: `S/ ${u.totalGanado.toFixed(0)}` },
                    { label: 'Éxito', value: `${u.tasaExito}%` },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center' }}>
                      <div className="font-cinzel" style={{ fontSize: '13px', color: 'var(--casino-gold)' }}>{s.value}</div>
                      <div style={{ fontSize: '10px', color: 'var(--casino-muted)', textTransform: 'uppercase' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '11px', color: 'var(--casino-muted)' }}>
                  <span>🎮 Favorito: <strong style={{ color: 'var(--casino-cream)', textTransform: 'capitalize' }}>{u.juegoFavorito}</strong></span>
                  <span>
                    {u.ultimaApuesta
                      ? `Última: ${new Date(u.ultimaApuesta).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
                      : 'Sin actividad'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Panel detalle */}
        {selected && (
          <div style={{ position: 'sticky', top: '84px' }}>
            <div className="card-casino" style={{ padding: '24px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--casino-gold), #9A7A1E)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, color: '#000', fontFamily: 'Cinzel', fontSize: '16px',
                  }}>
                    {selected.nombre.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-cinzel" style={{ fontSize: '16px', marginBottom: '4px' }}>{selected.nombre}</div>
                    <div style={{ fontSize: '12px', color: 'var(--casino-muted)' }}>DNI: {selected.dni}</div>
                    <div style={{ fontSize: '11px', color: 'var(--casino-muted)' }}>
                      Registrado: {new Date(selected.created_at).toLocaleDateString('es-PE')}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--casino-muted)', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>

              {/* Stats del usuario */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: 'Saldo actual', value: `S/ ${Number(selected.saldo_virtual).toFixed(2)}`, color: 'var(--casino-gold)' },
                  { label: 'Total apostado', value: `S/ ${selected.totalApostado.toFixed(2)}`, color: 'var(--casino-cream)' },
                  { label: 'Total ganado', value: `S/ ${selected.totalGanado.toFixed(2)}`, color: 'var(--casino-green)' },
                  { label: 'Tasa de éxito', value: `${selected.tasaExito}%`, color: 'var(--casino-cream)' },
                ].map(s => (
                  <div key={s.label} className="card-casino" style={{ padding: '14px', background: 'rgba(255,255,255,0.02)' }}>
                    <div className="font-cinzel" style={{ fontSize: '16px', color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '10px', color: 'var(--casino-muted)', textTransform: 'uppercase', marginTop: '3px' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Balance neto */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--casino-muted)' }}>Balance neto del usuario</span>
                  <span className="font-cinzel" style={{ color: selected.totalGanado - selected.totalApostado >= 0 ? 'var(--casino-green)' : '#FF5533' }}>
                    {selected.totalGanado - selected.totalApostado >= 0 ? '+' : ''}S/ {(selected.totalGanado - selected.totalApostado).toFixed(2)}
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{
                    width: `${Math.min(selected.tasaExito, 100)}%`,
                    background: selected.tasaExito > 50 ? 'var(--casino-green)' : 'var(--casino-gold)',
                  }} />
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--casino-muted)' }}>
                🎮 Juego favorito:{' '}
                <strong style={{ color: 'var(--casino-cream)', textTransform: 'capitalize' }}>
                  {selected.juegoFavorito}
                </strong>
              </div>
            </div>

            {/* Historial */}
            <div className="card-casino" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--casino-border)' }}>
                <div className="font-cinzel" style={{ color: 'var(--casino-gold)', fontSize: '13px' }}>
                  Historial de Apuestas
                </div>
              </div>
              {loadingDetalle ? (
                <div style={{ padding: '24px', textAlign: 'center' }}>
                  <span className="spinner" style={{ margin: '0 auto' }} />
                </div>
              ) : (
                <div style={{ overflowX: 'auto', maxHeight: '340px', overflowY: 'auto' }}>
                  <table className="table-casino">
                    <thead>
                      <tr>
                        <th>Juego</th>
                        <th>Monto</th>
                        <th>Resultado</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apuestasUsuario.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', color: 'var(--casino-muted)', padding: '20px' }}>
                            Sin apuestas
                          </td>
                        </tr>
                      ) : (
                        apuestasUsuario.map(a => (
                          <tr key={a.id}>
                            <td style={{ textTransform: 'capitalize', fontSize: '12px' }}>{a.juego}</td>
                            <td className="font-cinzel" style={{ fontSize: '12px' }}>S/ {Number(a.monto).toFixed(2)}</td>
                            <td>
                              <span className={a.resultado === 'gano' ? 'badge-green' : 'badge-red'} style={{ fontSize: '10px' }}>
                                {a.resultado === 'gano' ? `+S/ ${Number(a.ganancia).toFixed(2)}` : 'Perdió'}
                              </span>
                            </td>
                            <td style={{ color: 'var(--casino-muted)', fontSize: '10px' }}>
                              {new Date(a.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
