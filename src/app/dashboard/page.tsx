'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Apuesta, LimiteUsuario } from '@/lib/types'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import UMLBadge from '@/components/UMLBadge'

export default function DashboardPage() {
  const router = useRouter()
  const { profile, loading: authLoading, isAuthenticated } = useAuth()
  const [apuestas, setApuestas] = useState<Apuesta[]>([])
  const [limites, setLimites] = useState<LimiteUsuario | null>(null)
  const [gastadoHoy, setGastadoHoy] = useState(0)
  const [totalPartidas, setTotalPartidas] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    // Solo redirigir a login si NO hay sesión activa (evita redirect loop con middleware)
    const fetchData = async () => {
      if (!isAuthenticated) {
        setLoading(false)
        router.replace('/auth/login')
        return
      }

      if (!profile) {
        setLoading(false)
        return
      }
      try {
        const supabase = createClient()

        if (profile.rol === 'admin' || profile.rol === 'inversor') {
          router.push('/admin/estadisticas')
          return
        }

        const { data: apuestasData } = await supabase
          .from('apuestas')
          .select('*')
          .eq('usuario_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5)
        if (apuestasData) setApuestas(apuestasData)

        const { count: totalPartidasCount } = await supabase
          .from('apuestas')
          .select('*', { count: 'exact', head: true })
          .eq('usuario_id', profile.id)
        if (totalPartidasCount !== null) setTotalPartidas(totalPartidasCount ?? 0)

        const { data: limitesData } = await supabase
          .from('limites_usuario')
          .select('*')
          .eq('usuario_id', profile.id)
          .single()
        if (limitesData) setLimites(limitesData)

        const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
        const { data: apuestasHoy } = await supabase
          .from('apuestas')
          .select('monto')
          .eq('usuario_id', profile.id)
          .gte('created_at', hoy.toISOString())
        if (apuestasHoy) {
          setGastadoHoy(apuestasHoy.reduce((acc, a) => acc + Number(a.monto), 0))
        }
      } catch (err) {
        console.error('Dashboard fetchData error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const handleFocus = () => fetchData()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [profile, authLoading, isAuthenticated, router])

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--casino-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="spinner" />
      </div>
    )
  }

  if (!profile) return null

  const limiteDiario = limites?.limite_diario || 500
  const pct = Math.min(Math.round((gastadoHoy / limiteDiario) * 100), 100)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--casino-dark)' }}>
      <Navbar />

      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: 'clamp(70px,10vw,88px) 16px 48px' }}>

        {/* Bienvenida */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--casino-gold), var(--casino-gold-dark, #9A7A1E))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#000', fontFamily: 'Cinzel', fontSize: '16px' }}>
            {profile.nombre.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-cinzel" style={{ fontSize: '19px', fontWeight: 600 }}>
              Bienvenido, {profile.nombre.split(' ')[0]}
            </div>
            <span className="badge-green" style={{ fontSize: '10px' }}>✓ Verificado sin ludopatía</span>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          {[
            { label: 'Saldo Real', value: `S/ ${Number(profile.saldo_virtual).toFixed(2)}`, icon: '💰', color: 'var(--casino-gold)' },
            { label: 'Gastado Hoy', value: `S/ ${gastadoHoy.toFixed(2)}`, icon: '🎯', color: 'var(--casino-cream)' },
            { label: 'Límite Diario', value: `S/ ${limiteDiario}`, icon: '🛡️', color: '#64B5F6' },
            { label: 'Partidas Jugadas', value: String(totalPartidas), icon: '🎮', color: 'var(--casino-cream)' },
          ].map(s => (
            <div key={s.label} className="card-casino" style={{ padding: '20px' }}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>{s.icon}</div>
              <div className="font-cinzel" style={{ fontSize: '20px', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ color: 'var(--casino-muted)', fontSize: '11px', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Barra límite diario */}
        <div className="card-casino" style={{ padding: '18px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--casino-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🛡️ Límite diario —
              <UMLBadge type="include" label="Verificar límites de uso" />
            </div>
            <span className="font-cinzel" style={{ color: pct > 80 ? '#FF5533' : 'var(--casino-gold)' }}>{pct}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%`, background: pct > 80 ? 'var(--casino-red-bright, #CC2200)' : 'var(--casino-gold)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--casino-muted)' }}>
            <span>S/ {gastadoHoy.toFixed(2)} gastados</span>
            <span>S/ {(limiteDiario - gastadoHoy).toFixed(2)} disponibles</span>
          </div>
        </div>

        {/* Juegos */}
        <h2 className="font-cinzel" style={{ marginBottom: '18px', fontSize: '20px' }}>
          <span style={{ color: 'var(--casino-gold)' }}>▸</span> Jugar Ahora
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '28px' }}>
          {[
            { icon: '🎡', name: 'Ruleta', href: '/juegos/ruleta', desc: 'Apuesta a número, color o sector', badges: ['Realizar apuesta', 'Verificar saldo'] },
            { icon: '🎰', name: 'Tragamonedas', href: '/juegos/tragamonedas', desc: 'Gira y busca la combinación ganadora', badges: ['Realizar apuesta', 'Verificar saldo'] },
            { icon: '⚽', name: 'Apuestas Deportivas', href: '/juegos/deportes', desc: 'Eventos deportivos en vivo simulados', badges: ['Realizar apuesta', 'Verificar límites'] },
          ].map(g => (
            <Link key={g.name} href={g.href}>
              <div className="card-casino" style={{ padding: '26px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(201,162,39,0.45)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--casino-border)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}>
                <div style={{ fontSize: '38px', marginBottom: '11px' }}>{g.icon}</div>
                <div className="font-cinzel" style={{ fontSize: '16px', marginBottom: '8px', color: 'var(--casino-gold)' }}>{g.name}</div>
                <p style={{ color: 'var(--casino-muted)', fontSize: '12px', marginBottom: '13px', lineHeight: 1.5 }}>{g.desc}</p>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {g.badges.map(b => <UMLBadge key={b} type="include" label={b} />)}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Historial reciente */}
        <h2 className="font-cinzel" style={{ marginBottom: '16px', fontSize: '20px' }}>
          <span style={{ color: 'var(--casino-gold)' }}>▸</span> Actividad Reciente
        </h2>

        {apuestas.length === 0 ? (
          <div className="card-casino" style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--casino-muted)', fontSize: '14px' }}>Aún no has realizado apuestas. ¡Empieza a jugar!</p>
          </div>
        ) : (
          <div className="card-casino" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: '14px' }}>
            <table className="table-casino">
              <thead>
                <tr>
                  <th>Juego</th>
                  <th>Apuesta</th>
                  <th>Monto</th>
                  <th>Resultado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {apuestas.map(a => (
                  <tr key={a.id}>
                    <td style={{ textTransform: 'capitalize' }}>{a.juego}</td>
                    <td style={{ color: 'var(--casino-muted)', fontSize: '12px' }}>{a.tipo_apuesta}</td>
                    <td className="font-cinzel">S/ {Number(a.monto).toFixed(2)}</td>
                    <td>
                      <span className={a.resultado === 'gano' ? 'badge-green' : 'badge-red'}>
                        {a.resultado === 'gano' ? `+S/ ${Number(a.ganancia).toFixed(2)}` : 'Perdió'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--casino-muted)', fontSize: '11px' }}>
                      {new Date(a.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Link href="/historial">
          <button className="btn-outline-casino">Ver historial completo →</button>
        </Link>

      </div>
    </div>
  )
}
