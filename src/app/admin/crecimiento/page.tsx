'use client'
import { useRealtimeStats } from '@/hooks/useRealtimeStats'

export default function CrecimientoPage() {
  const { stats, loading } = useRealtimeStats()

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
      <span className="spinner" />
    </div>
  )

  if (!stats) return null

  const activos = Math.max(0, stats.totalUsuarios - stats.bloqueados)

  return (
    <div>
      <h1 className="font-cinzel" style={{ fontSize: 'clamp(18px,3vw,24px)', marginBottom: '8px' }}>
        📈 Analizar Crecimiento de Usuarios
      </h1>
      <p style={{ color: 'var(--casino-muted)', marginBottom: '24px', fontSize: '13px' }}>
        Datos reales en tiempo real
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total usuarios', value: stats.totalUsuarios },
          { label: 'Activos', value: activos },
          { label: 'Nuevos hoy', value: stats.usuariosHoy },
          { label: 'Bloqueados', value: stats.bloqueados },
        ].map(s => (
          <div key={s.label} className="card-casino" style={{ padding: '18px' }}>
            <div className="font-cinzel" style={{ fontSize: '24px', color: 'var(--casino-gold)' }}>{s.value}</div>
            <div style={{ color: 'var(--casino-muted)', fontSize: '11px', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabla de usuarios recientes */}
      <div className="card-casino" style={{ overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--casino-border)' }}>
          <div className="font-cinzel" style={{ color: 'var(--casino-gold)', fontSize: '13px' }}>
            Usuarios Registrados Recientemente
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table-casino">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Saldo Virtual</th>
                <th>Registro</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {stats.usuariosRecientes.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--casino-muted)', padding: '24px' }}>Sin usuarios</td></tr>
              ) : (
                stats.usuariosRecientes.map(u => (
                  <tr key={u.id}>
                    <td className="font-cinzel" style={{ fontSize: '13px' }}>{u.nombre}</td>
                    <td>
                      <span className={u.rol === 'admin' ? 'badge-gold' : 'badge-green'} style={{ fontSize: '10px' }}>
                        {u.rol}
                      </span>
                    </td>
                    <td className="font-cinzel" style={{ color: 'var(--casino-gold)', fontSize: '13px' }}>
                      S/ {Number(u.saldo_virtual).toFixed(2)}
                    </td>
                    <td style={{ color: 'var(--casino-muted)', fontSize: '11px' }}>
                      {new Date(u.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td><span className="badge-green" style={{ fontSize: '10px' }}>Activo</span></td>
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
