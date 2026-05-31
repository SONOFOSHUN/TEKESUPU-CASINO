'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Apuesta } from '@/lib/types'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import UMLBadge from '@/components/UMLBadge'
import Link from 'next/link'

export default function HistorialPage() {
  const router = useRouter()
  const { profile, loading: authLoading, isAuthenticated } = useAuth()
  const [apuestas, setApuestas] = useState<Apuesta[]>([])
  const [filtro, setFiltro] = useState<string>('todos')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    const fetchData = async () => {
      if (!isAuthenticated) {
        setLoading(false)
        router.replace('/auth/login')
        return
      }

      if (!profile) { setLoading(false); return }
      const supabase = createClient()

      const { data: apuestasData } = await supabase
        .from('apuestas').select('*')
        .eq('usuario_id', profile.id)
        .order('created_at', { ascending: false })
      if (apuestasData) setApuestas(apuestasData)

      setLoading(false)
    }
    fetchData()
  }, [profile, authLoading, isAuthenticated, router])

  if (authLoading || loading) return (
    <div style={{ minHeight:'100vh', background:'var(--casino-dark)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span className="spinner" />
    </div>
  )

  if (!profile) return null

  const filtradas = filtro === 'todos' ? apuestas : apuestas.filter(a => a.juego === filtro)
  const totalApostado = filtradas.reduce((acc, a) => acc + Number(a.monto), 0)
  const totalGanado = filtradas.reduce((acc, a) => acc + Number(a.ganancia), 0)
  const ganadas = filtradas.filter(a => a.resultado === 'gano').length
  const tasaExito = filtradas.length > 0 ? Math.round((ganadas / filtradas.length) * 100) : 0

  return (
    <div style={{ minHeight:'100vh', background:'var(--casino-dark)' }}>
      <Navbar />
      <div style={{ maxWidth:'1080px', margin:'0 auto', padding:'clamp(70px,10vw,88px) 16px 48px' }}>

        <h1 className="font-cinzel" style={{ fontSize:'26px', marginBottom:'8px' }}>📋 Historial de Apuestas</h1>
        <div style={{ marginBottom:'24px', display:'flex', alignItems:'center', gap:'8px' }}>
          <UMLBadge type="extend" label="Visualizar resultados" />
          <span style={{ color:'var(--casino-muted)', fontSize:'13px' }}>— Registro completo de tu actividad</span>
        </div>

        {/* Filtros */}
        <div style={{ display:'flex', gap:'8px', marginBottom:'20px', flexWrap:'wrap' }}>
          {[
            { key:'todos', label:'Todos' },
            { key:'ruleta', label:'🎡 Ruleta' },
            { key:'tragamonedas', label:'🎰 Tragamonedas' },
            { key:'deportes', label:'⚽ Deportes' },
          ].map(f => (
            <button key={f.key}
              className={filtro === f.key ? 'btn-gold' : 'btn-outline-casino'}
              style={{ padding:'7px 16px', fontSize:'11px' }}
              onClick={() => setFiltro(f.key)}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px, 1fr))', gap:'14px', marginBottom:'20px' }}>
          {[
            { label:'Total apostado', value:`S/ ${totalApostado.toFixed(2)}` },
            { label:'Total ganado', value:`S/ ${totalGanado.toFixed(2)}` },
            { label:'Partidas', value:String(filtradas.length) },
            { label:'Tasa de éxito', value:`${tasaExito}%` },
          ].map(s => (
            <div key={s.label} className="card-casino" style={{ padding:'18px' }}>
              <div className="font-cinzel" style={{ fontSize:'20px', color:'var(--casino-gold)' }}>{s.value}</div>
              <div style={{ color:'var(--casino-muted)', fontSize:'11px', marginTop:'4px', textTransform:'uppercase', letterSpacing:'0.6px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabla */}
        {filtradas.length === 0 ? (
          <div className="card-casino" style={{ padding:'40px', textAlign:'center' }}>
            <p style={{ color:'var(--casino-muted)' }}>No hay apuestas registradas.</p>
            <Link href="/dashboard">
              <button className="btn-gold" style={{ marginTop:'16px' }}>Ir a jugar</button>
            </Link>
          </div>
        ) : (
          <div className="card-casino" style={{ overflowX:'auto' }}>
            <table className="table-casino">
              <thead>
                <tr>
                  <th>Juego</th>
                  <th>Apuesta</th>
                  <th>Monto</th>
                  <th>Resultado</th>
                  <th>Ganancia</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((a) => (
                  <tr key={a.id}>
                    <td style={{ textTransform:'capitalize' }}>{a.juego}</td>
                    <td style={{ color:'var(--casino-muted)', fontSize:'12px' }}>{a.tipo_apuesta}</td>
                    <td className="font-cinzel">S/ {Number(a.monto).toFixed(2)}</td>
                    <td><span className={a.resultado === 'gano' ? 'badge-green' : 'badge-red'}>{a.resultado === 'gano' ? 'Ganó' : 'Perdió'}</span></td>
                    <td className="font-cinzel" style={{ color: a.resultado === 'gano' ? 'var(--casino-green)' : '#FF5533' }}>
                      {a.resultado === 'gano' ? `+S/ ${Number(a.ganancia).toFixed(2)}` : `-S/ ${Number(a.monto).toFixed(2)}`}
                    </td>
                    <td style={{ color:'var(--casino-muted)', fontSize:'11px' }}>
                      {new Date(a.created_at).toLocaleDateString('es-PE', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
