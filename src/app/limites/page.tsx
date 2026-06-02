'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LimiteUsuario } from '@/lib/types'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import UMLBadge from '@/components/UMLBadge'

export default function LimitesPage() {
  const router = useRouter()
  const { profile, loading: authLoading, isAuthenticated } = useAuth()
  const [limites, setLimites] = useState<LimiteUsuario | null>(null)
  const [gastadoHoy, setGastadoHoy] = useState(0)
  const [gastadoSemana, setGastadoSemana] = useState(0)
  const [gastadoMes, setGastadoMes] = useState(0)
  const [form, setForm] = useState({ limite_diario: 500, limite_semanal: 2000, limite_mensual: 6000, limite_sesion_min: 60 })
  const [saved, setSaved] = useState(false)
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

      const { data: limitesData } = await supabase
        .from('limites_usuario').select('*').eq('usuario_id', profile.id).single()
      if (limitesData) {
        setLimites(limitesData)
        setForm({
          limite_diario: limitesData.limite_diario,
          limite_semanal: limitesData.limite_semanal,
          limite_mensual: limitesData.limite_mensual,
          limite_sesion_min: limitesData.limite_sesion_min,
        })
      }

      const hoy = new Date(); hoy.setHours(0,0,0,0)
      const { data: dHoy } = await supabase.from('apuestas').select('monto')
        .eq('usuario_id', profile.id).gte('created_at', hoy.toISOString())
      if (dHoy) setGastadoHoy(dHoy.reduce((acc, a) => acc + Number(a.monto), 0))

      const semana = new Date(); semana.setDate(semana.getDate() - 7)
      const { data: dSemana } = await supabase.from('apuestas').select('monto')
        .eq('usuario_id', profile.id).gte('created_at', semana.toISOString())
      if (dSemana) setGastadoSemana(dSemana.reduce((acc, a) => acc + Number(a.monto), 0))

      const mes = new Date(); mes.setDate(1); mes.setHours(0,0,0,0)
      const { data: dMes } = await supabase.from('apuestas').select('monto')
        .eq('usuario_id', profile.id).gte('created_at', mes.toISOString())
      if (dMes) setGastadoMes(dMes.reduce((acc, a) => acc + Number(a.monto), 0))

      setLoading(false)
    }
    fetchData()
  }, [profile, authLoading, isAuthenticated, router])

  const handleSave = async () => {
    if (!profile || !limites) return
    const supabase = createClient()
    await supabase.from('limites_usuario')
      .update(form)
      .eq('usuario_id', profile.id)
    setLimites({ ...limites, ...form })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (authLoading || loading) return (
    <div style={{ minHeight:'100vh', background:'var(--casino-dark)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span className="spinner" />
    </div>
  )

  if (!profile) return null

  const BarraUso = ({ gastado, limite }: { gastado: number, limite: number }) => {
    const pct = Math.min(Math.round((gastado / limite) * 100), 100)
    return (
      <div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width:`${pct}%`, background: pct > 80 ? 'var(--casino-red-bright)' : 'var(--casino-gold)' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'4px', fontSize:'11px', color:'var(--casino-muted)' }}>
          <span>S/ {gastado.toFixed(2)} usado</span>
          <span>{pct}% de S/ {limite}</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--casino-dark)' }}>
      <Navbar />
      <div style={{ maxWidth:'1080px', margin:'0 auto', padding:'clamp(70px,10vw,88px) 16px 48px' }}>

        <h1 className="font-cinzel" style={{ fontSize:'26px', marginBottom:'8px' }}>🛡️ Configurar Límites de Uso</h1>
        <div style={{ marginBottom:'28px', display:'flex', alignItems:'center', gap:'8px' }}>
          <UMLBadge type="extend" label="Bloquear operación si límite alcanzado" />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'18px' }}>

          {/* Configuración */}
          <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
            <div className="card-casino" style={{ padding:'28px' }}>
              <div className="font-cinzel" style={{ fontSize:'14px', marginBottom:'22px', color:'var(--casino-gold)' }}>
                💰 Límites de Gasto
              </div>
              {[
                { key:'limite_diario', label:'Límite Diario', max:1000, step:50 },
                { key:'limite_semanal', label:'Límite Semanal', max:5000, step:100 },
                { key:'limite_mensual', label:'Límite Mensual', max:20000, step:500 },
              ].map(x => (
                <div key={x.key} style={{ marginBottom:'22px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                    <label className="font-cinzel" style={{ fontSize:'13px' }}>{x.label}</label>
                    <span className="font-cinzel" style={{ color:'var(--casino-gold)' }}>
                      S/ {form[x.key as keyof typeof form]}
                    </span>
                  </div>
                  <input type="range" min={x.step} max={x.max} step={x.step}
                    value={form[x.key as keyof typeof form]}
                    onChange={e => setForm({ ...form, [x.key]: parseInt(e.target.value) })}
                    style={{ width:'100%', accentColor:'var(--casino-gold)' }}
                  />
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'10px', color:'var(--casino-muted)', marginTop:'4px' }}>
                    <span>S/ {x.step}</span>
                    <span>S/ {x.max}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="card-casino" style={{ padding:'24px' }}>
              <div className="font-cinzel" style={{ fontSize:'14px', marginBottom:'18px', color:'var(--casino-gold)' }}>
                ⏱️ Duración de Sesión
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                <label className="font-cinzel" style={{ fontSize:'13px' }}>Máximo por sesión</label>
                <span className="font-cinzel" style={{ color:'var(--casino-gold)' }}>{form.limite_sesion_min} min</span>
              </div>
              <input type="range" min={15} max={240} step={15}
                value={form.limite_sesion_min}
                onChange={e => setForm({ ...form, limite_sesion_min: parseInt(e.target.value) })}
                style={{ width:'100%', accentColor:'var(--casino-gold)', marginBottom:'8px' }}
              />
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'10px', color:'var(--casino-muted)' }}>
                <span>15 min</span><span>240 min</span>
              </div>
            </div>
          </div>

          {/* Uso actual */}
          <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
            <div className="card-casino" style={{ padding:'24px' }}>
              <div className="font-cinzel" style={{ fontSize:'14px', marginBottom:'18px', color:'var(--casino-gold)' }}>
                📊 Uso Actual
              </div>
              {[
                { label:'Hoy', gastado: gastadoHoy, limite: form.limite_diario },
                { label:'Esta semana', gastado: gastadoSemana, limite: form.limite_semanal },
                { label:'Este mes', gastado: gastadoMes, limite: form.limite_mensual },
              ].map(x => (
                <div key={x.label} style={{ marginBottom:'18px' }}>
                  <div style={{ fontSize:'12px', color:'var(--casino-muted)', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.5px' }}>
                    {x.label}
                  </div>
                  <BarraUso gastado={x.gastado} limite={x.limite} />
                </div>
              ))}
            </div>

            <div className="card-casino" style={{ padding:'24px', background:'rgba(0,100,50,0.07)', borderColor:'rgba(0,200,83,0.18)' }}>
              <div style={{ fontSize:'30px', marginBottom:'10px' }}>🛡️</div>
              <div className="font-cinzel" style={{ color:'var(--casino-green)', marginBottom:'8px', fontSize:'14px' }}>
                Juego Responsable
              </div>
              <p style={{ color:'var(--casino-muted)', fontSize:'13px', lineHeight:1.65 }}>
                Los límites se aplican automáticamente en cada apuesta. Si alcanzas tu límite, las operaciones serán bloqueadas hasta el siguiente período.
              </p>
            </div>

            {saved && (
              <div style={{ background:'rgba(0,200,83,0.1)', border:'1px solid rgba(0,200,83,0.28)', borderRadius:'8px', padding:'14px', fontSize:'13px', color:'var(--casino-green)', textAlign:'center' }}>
                ✅ Límites guardados correctamente
              </div>
            )}

            <button className="btn-gold" style={{ width:'100%' }} onClick={handleSave}>
              Guardar Límites
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
