'use client'
import { useRealtimeStats } from '@/hooks/useRealtimeStats'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const GAME_COLORS: Record<string, string> = {
  ruleta: '#C9A227',
  tragamonedas: '#CC2200',
  deportes: '#1E88E5'
}

const tooltipStyle = {
  contentStyle: { background: '#0D0D1A', border: '1px solid rgba(201,162,39,0.28)', borderRadius: '8px', fontFamily: 'Lato', fontSize: '12px' }
}

export default function JuegosAdminPage() {
  const { stats, loading } = useRealtimeStats()

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
      <span className="spinner" />
    </div>
  )

  if (!stats) return null

  const totalSesiones = stats.porJuego.reduce((acc, j) => acc + j.sesiones, 0)

  return (
    <div>
      <h1 className="font-cinzel" style={{ fontSize: 'clamp(18px,3vw,24px)', marginBottom: '8px' }}>
        🎮 Evaluar Uso de Juegos
      </h1>
      <p style={{ color: 'var(--casino-muted)', marginBottom: '24px', fontSize: '13px' }}>
        Datos reales en tiempo real
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {stats.porJuego.map(g => {
          const pct = totalSesiones > 0 ? Math.round((g.sesiones / totalSesiones) * 100) : 0
          return (
            <div key={g.juego} className="card-casino" style={{ padding: '24px', borderTop: `3px solid ${GAME_COLORS[g.juego]}` }}>
              <div className="font-cinzel" style={{ fontSize: '15px', marginBottom: '16px', textTransform: 'capitalize' }}>
                {g.juego === 'ruleta' ? '🎡' : g.juego === 'tragamonedas' ? '🎰' : '⚽'} {g.juego}
              </div>
              {[
                { label: 'Sesiones totales', value: g.sesiones },
                { label: 'Ganancias pagadas', value: `S/ ${g.ganancia.toFixed(2)}` },
                { label: '% del total', value: `${pct}%` },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--casino-muted)' }}>{s.label}</span>
                  <span className="font-cinzel" style={{ color: GAME_COLORS[g.juego] }}>{s.value}</span>
                </div>
              ))}
              <div style={{ marginTop: '12px' }}>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: GAME_COLORS[g.juego] }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div className="card-casino" style={{ padding: '20px' }}>
          <div className="font-cinzel" style={{ marginBottom: '14px', color: 'var(--casino-gold)', fontSize: '13px' }}>
            Sesiones por Juego
          </div>
          <ResponsiveContainer width="100%" height={220}>
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

        <div className="card-casino" style={{ padding: '20px' }}>
          <div className="font-cinzel" style={{ marginBottom: '14px', color: 'var(--casino-gold)', fontSize: '13px' }}>
            Ganancias Pagadas por Juego
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.porJuego}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="juego" tick={{ fill: '#888', fontSize: 11 }} />
              <YAxis tick={{ fill: '#888', fontSize: 11 }} />
              <Tooltip {...tooltipStyle} formatter={(v) => [`S/ ${Number(v).toFixed(2)}`, 'Ganancia']} />
              <Bar dataKey="ganancia" radius={[6,6,0,0]} name="Ganancia">
                {stats.porJuego.map((entry, i) => (
                  <Cell key={i} fill={GAME_COLORS[entry.juego]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
