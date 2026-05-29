'use client'
import { useRealtimeStats } from '@/hooks/useRealtimeStats'
import UMLBadge from '@/components/UMLBadge'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const GAME_COLORS: Record<string, string> = {
  ruleta: '#C9A227',
  tragamonedas: '#CC2200',
  deportes: '#1E88E5'
}

const tooltipStyle = {
  contentStyle: {
    background: '#0D0D1A',
    border: '1px solid rgba(201,162,39,0.28)',
    borderRadius: '8px',
    fontFamily: 'Lato',
    fontSize: '12px'
  }
}

export default function EstadisticasPage() {
  const { stats, loading, refresh } = useRealtimeStats()

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
      <span className="spinner" />
    </div>
  )

  if (!stats) return null

  const pieData = stats.porJuego.map(j => ({
    name: j.juego.charAt(0).toUpperCase() + j.juego.slice(1),
    value: j.sesiones
  }))

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="font-cinzel" style={{ fontSize: 'clamp(18px,3vw,24px)', marginBottom: '6px' }}>
            📊 Estadísticas en Tiempo Real
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--casino-green)', animation: 'pulse 2s infinite' }} />
            <span style={{ color: 'var(--casino-muted)', fontSize: '12px' }}>
              Actualizando en tiempo real · Supabase Realtime
            </span>
          </div>
        </div>
        <button onClick={refresh} className="btn-outline-casino" style={{ padding: '7px 16px', fontSize: '11px' }}>
          🔄 Actualizar
        </button>
      </div>

      {/* Advertencia sesión compartida */}
      <div style={{
        background: 'rgba(201,162,39,0.08)',
        border: '1px solid rgba(201,162,39,0.25)',
        borderRadius: '8px', padding: '10px 16px',
        marginBottom: '20px',
        fontSize: '12px', color: 'var(--casino-muted)',
        display: 'flex', alignItems: 'center', gap: '8px'
      }}>
        ⚠️ Para demo: usa navegadores diferentes para la cuenta admin y usuario
        (ej: Chrome para usuario, Edge para admin).
        El mismo navegador comparte la sesión.
      </div>

      {/* KPIs principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Usuarios totales', value: stats.totalUsuarios, icon: '👥', sub: `+${stats.usuariosHoy} hoy` },
          { label: 'Apuestas totales', value: stats.apuestasTotales, icon: '🎮', sub: `${stats.apuestasHoy} hoy` },
          { label: 'Ingresos del mes', value: `S/ ${stats.ingresosMes.toFixed(0)}`, icon: '💰', sub: `S/ ${stats.ingresosHoy.toFixed(0)} hoy` },
          { label: 'Tasa de victoria', value: `${stats.tasaVictoria}%`, icon: '🏆', sub: 'usuarios ganando' },
          { label: 'Saldo en circulación', value: `S/ ${stats.saldoTotalUsuarios.toFixed(0)}`, icon: '💳', sub: 'todos los usuarios' },
          { label: 'Bloqueados', value: stats.bloqueados, icon: '🚫', sub: 'por ludopatía' },
        ].map(s => (
          <div key={s.label} className="card-casino" style={{ padding: '16px' }}>
            <div style={{ fontSize: '20px', marginBottom: '6px' }}>{s.icon}</div>
            <div className="font-cinzel" style={{ fontSize: 'clamp(16px,2.5vw,22px)', color: 'var(--casino-gold)', fontWeight: 700 }}>
              {s.value}
            </div>
            <div style={{ color: 'var(--casino-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>
              {s.label}
            </div>
            <div style={{ color: 'var(--casino-green)', fontSize: '11px', marginTop: '4px' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {/* Sesiones por juego */}
        <div className="card-casino" style={{ padding: '20px' }}>
          <div className="font-cinzel" style={{ marginBottom: '14px', color: 'var(--casino-gold)', fontSize: '13px' }}>
            Sesiones por Juego (Real)
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.porJuego}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="juego" tick={{ fill: '#888', fontSize: 11 }} />
              <YAxis tick={{ fill: '#888', fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="sesiones" radius={[6,6,0,0]} name="Sesiones">
                {stats.porJuego.map((entry, i) => (
                  <Cell key={i} fill={GAME_COLORS[entry.juego]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribución pie */}
        <div className="card-casino" style={{ padding: '20px' }}>
          <div className="font-cinzel" style={{ marginBottom: '14px', color: 'var(--casino-gold)', fontSize: '13px' }}>
            Distribución de Juegos (Real)
          </div>
          {pieData.every(d => d.value === 0) ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--casino-muted)', fontSize: '13px' }}>
              Sin apuestas registradas aún
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={Object.values(GAME_COLORS)[i]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Ganancias por juego */}
        <div className="card-casino" style={{ padding: '20px' }}>
          <div className="font-cinzel" style={{ marginBottom: '14px', color: 'var(--casino-gold)', fontSize: '13px' }}>
            Ganancias Pagadas por Juego (Real)
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.porJuego}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="juego" tick={{ fill: '#888', fontSize: 11 }} />
              <YAxis tick={{ fill: '#888', fontSize: 11 }} />
              <Tooltip {...tooltipStyle} formatter={(v) => [`S/ ${Number(v).toFixed(2)}`, 'Ganancia']} />
              <Bar dataKey="ganancia" radius={[6,6,0,0]} name="Ganancia pagada">
                {stats.porJuego.map((entry, i) => (
                  <Cell key={i} fill={GAME_COLORS[entry.juego]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Últimas apuestas en tiempo real */}
      <div className="card-casino" style={{ overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--casino-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="font-cinzel" style={{ color: 'var(--casino-gold)', fontSize: '13px' }}>
            Últimas Apuestas en Tiempo Real
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--casino-green)', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '11px', color: 'var(--casino-muted)' }}>LIVE</span>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table-casino">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Juego</th>
                <th>Apuesta</th>
                <th>Monto</th>
                <th>Resultado</th>
                <th>Hora</th>
              </tr>
            </thead>
            <tbody>
              {stats.ultimasApuestas.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--casino-muted)', padding: '24px' }}>
                  Sin apuestas aún
                </td></tr>
              ) : (
                stats.ultimasApuestas.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontSize: '12px' }}>
                      {(a.profiles as { nombre: string } | undefined)?.nombre || 'Usuario'}
                    </td>
                    <td style={{ textTransform: 'capitalize', fontSize: '12px' }}>{a.juego}</td>
                    <td style={{ color: 'var(--casino-muted)', fontSize: '11px' }}>{a.tipo_apuesta}</td>
                    <td className="font-cinzel" style={{ fontSize: '13px' }}>S/ {Number(a.monto).toFixed(2)}</td>
                    <td>
                      <span className={a.resultado === 'gano' ? 'badge-green' : 'badge-red'}>
                        {a.resultado === 'gano' ? `+S/ ${Number(a.ganancia).toFixed(2)}` : 'Perdió'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--casino-muted)', fontSize: '11px' }}>
                      {new Date(a.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
