'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LimiteUsuario, EventoDeportivo } from '@/lib/types'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import UMLBadge from '@/components/UMLBadge'

export default function DeportesPage() {
  const router = useRouter()
  const { profile, loading: authLoading, isAuthenticated, refresh: refreshProfile } = useAuth()
  const [limites, setLimites] = useState<LimiteUsuario | null>(null)
  const [eventos, setEventos] = useState<EventoDeportivo[]>([])
  const [gastadoHoy, setGastadoHoy] = useState(0)
  const [selectedEvento, setSelectedEvento] = useState<EventoDeportivo | null>(null)
  const [selectedOdd, setSelectedOdd] = useState<{label: string, odds: number} | null>(null)
  const [betAmount, setBetAmount] = useState('')
  const [checking, setChecking] = useState('')
  const [result, setResult] = useState<{won: boolean, gain: number, bet: number, odds: number, pick: string, evento: EventoDeportivo} | null>(null)
  const [limitError, setLimitError] = useState<string>('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!profile) return
    const fetchData = async () => {
      const supabase = createClient()

      const { data: limitesData } = await supabase
        .from('limites_usuario').select('*').eq('usuario_id', profile.id).single()
      if (limitesData) setLimites(limitesData)

      const { data: eventosData } = await supabase
        .from('eventos_deportivos')
        .select('*')
        .eq('activo', true)
        .order('fecha_evento', { ascending: true })
      if (eventosData) setEventos(eventosData)

      const hoy = new Date(); hoy.setHours(0,0,0,0)
      const { data: apuestasHoy } = await supabase
        .from('apuestas').select('monto').eq('usuario_id', profile.id)
        .gte('created_at', hoy.toISOString())
      if (apuestasHoy) {
        setGastadoHoy(apuestasHoy.reduce((acc, a) => acc + Number(a.monto), 0))
      }
    }
    fetchData()
  }, [profile])

  const handleBet = async () => {
    const amt = parseFloat(betAmount)
    if (!amt || amt <= 0 || !profile || !selectedEvento || !selectedOdd) return

    setLimitError('')
    setError('')

    const supabase = createClient()

    // <<include>> Verificar saldo
    setChecking('saldo')
    await new Promise(r => setTimeout(r, 700))
    if (amt > Number(profile.saldo_virtual)) {
      setError('Saldo insuficiente.')
      setChecking('')
      return
    }

    // <<include>> Verificar límites
    setChecking('limite')
    await new Promise(r => setTimeout(r, 500))
    const limiteDiario = limites?.limite_diario || 500
    if (gastadoHoy + amt > limiteDiario) {
      setLimitError('diario')
      setChecking('')
      return
    }

    // Verificar límites semanal y mensual
    const semana = new Date()
    semana.setDate(semana.getDate() - 7)
    const { data: apuestasSemana } = await supabase
      .from('apuestas').select('monto')
      .eq('usuario_id', profile.id)
      .gte('created_at', semana.toISOString())
    const gastadoSemana = apuestasSemana?.reduce((acc, a) => acc + Number(a.monto), 0) || 0

    const mes = new Date(); mes.setDate(1); mes.setHours(0,0,0,0)
    const { data: apuestasMes } = await supabase
      .from('apuestas').select('monto')
      .eq('usuario_id', profile.id)
      .gte('created_at', mes.toISOString())
    const gastadoMes = apuestasMes?.reduce((acc, a) => acc + Number(a.monto), 0) || 0

    if (gastadoSemana + amt > (limites?.limite_semanal || 2000)) {
      setLimitError('semanal')
      setChecking('')
      return
    }
    if (gastadoMes + amt > (limites?.limite_mensual || 6000)) {
      setLimitError('mensual')
      setChecking('')
      return
    }
    setChecking('')

    // Simular resultado (45% chance de ganar)
    const won = Math.random() < 0.45
    const gain = won ? Math.round(amt * selectedOdd.odds * 100) / 100 : 0
    const nuevoSaldo = won
      ? Number(profile.saldo_virtual) + gain - amt
      : Number(profile.saldo_virtual) - amt

    const { error: errorApuesta } = await supabase.from('apuestas').insert({
      usuario_id: profile.id,
      juego: 'deportes',
      tipo_apuesta: `${selectedEvento.equipo_local} vs ${selectedEvento.equipo_visitante} — ${selectedOdd.label}`,
      monto: amt,
      ganancia: gain,
      resultado: won ? 'gano' : 'perdio'
    })
    if (errorApuesta) {
      setError('Error al guardar la apuesta. Intenta de nuevo.')
      return
    }
    const { error: errorSaldo } = await supabase.from('profiles')
      .update({ saldo_virtual: nuevoSaldo })
      .eq('id', profile.id)
    if (errorSaldo) {
      setError('Error al actualizar el saldo. Contacta soporte.')
      return
    }

    await refreshProfile()
    setGastadoHoy(g => g + amt)
    setResult({ won, gain, bet: amt, odds: selectedOdd.odds, pick: selectedOdd.label, evento: selectedEvento })
  }

  if (authLoading) return (
    <div style={{ minHeight:'100vh', background:'var(--casino-dark)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span className="spinner" />
    </div>
  )
  if (!isAuthenticated) { router.push('/auth/login'); return null }
  if (!profile) return null

  return (
    <div style={{ minHeight:'100vh', background:'var(--casino-dark)' }}>
      <Navbar />
      <div style={{ maxWidth:'100%', margin:'0 auto', padding:'clamp(70px,10vw,88px) 16px 48px' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px' }}>
          <Link href="/dashboard">
            <button className="btn-outline-casino" style={{ padding:'7px 14px', fontSize:'11px' }}>← Volver</button>
          </Link>
          <h1 className="font-cinzel" style={{ fontSize:'24px' }}>⚽ Apuestas Deportivas</h1>
        </div>
        <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', alignItems:'center', marginBottom:'24px' }}>
          <UMLBadge type="include" label="Realizar apuesta" />
          <span style={{ color:'var(--casino-muted)' }}>→</span>
          <UMLBadge type="include" label="Verificar saldo" />
          <span style={{ color:'var(--casino-muted)' }}>→</span>
          <UMLBadge type="include" label="Verificar límites" />
        </div>

        {/* Saldo */}
        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'16px' }}>
          <span className="font-cinzel" style={{ color:'var(--casino-gold)', fontSize:'16px' }}>
            💰 S/ {Number(profile.saldo_virtual).toFixed(2)}
          </span>
        </div>

        {!result ? (
          <>
            <h2 className="font-cinzel" style={{ fontSize:'16px', marginBottom:'14px', color:'var(--casino-gold)' }}>
              Eventos Disponibles
            </h2>

            {eventos.length === 0 ? (
              <div className="card-casino" style={{ padding:'40px', textAlign:'center' }}>
                <p style={{ color:'var(--casino-muted)' }}>No hay eventos disponibles.</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'14px', marginBottom:'22px' }}>
                {eventos.map(evento => (
                  <div key={evento.id} className="card-casino"
                    style={{ padding:'22px', cursor:'pointer', borderColor: selectedEvento?.id===evento.id ? 'rgba(201,162,39,0.5)' : 'var(--casino-border)', transition:'border-color 0.2s' }}
                    onClick={() => { setSelectedEvento(evento); setSelectedOdd(null) }}>

                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: selectedEvento?.id===evento.id ? '16px' : '0' }}>
                      <div>
                        <span className="badge-gold" style={{ fontSize:'10px', marginBottom:'8px', display:'inline-block' }}>
                          {evento.liga}
                        </span>
                        <div className="font-cinzel" style={{ fontSize:'15px' }}>
                          {evento.equipo_local} <span style={{ color:'var(--casino-muted)' }}>vs</span> {evento.equipo_visitante}
                        </div>
                      </div>
                      <div style={{ color:'var(--casino-muted)', fontSize:'12px', textAlign:'right' }}>
                        {new Date(evento.fecha_evento).toLocaleDateString('es-PE', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                      </div>
                    </div>

                    {/* Odds - solo si está seleccionado */}
                    {selectedEvento?.id===evento.id && (
                      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                        {[
                          { label: evento.equipo_local, odds: evento.odds_local },
                          { label: 'Empate', odds: evento.odds_empate },
                          { label: evento.equipo_visitante, odds: evento.odds_visitante },
                        ].map(o => (
                          <button key={o.label}
                            onClick={e => { e.stopPropagation(); setSelectedOdd(o) }}
                            style={{
                              flex:1, minWidth:'80px', padding:'11px 6px', borderRadius:'8px',
                              border:`1px solid ${selectedOdd?.label===o.label ? 'var(--casino-gold)' : 'var(--casino-border)'}`,
                              background: selectedOdd?.label===o.label ? 'rgba(201,162,39,0.12)' : 'rgba(255,255,255,0.03)',
                              cursor:'pointer', textAlign:'center', transition:'all 0.2s'
                            }}>
                            <div style={{ fontSize:'10px', color:'var(--casino-muted)', marginBottom:'4px', wordBreak:'break-word' }}>
                              {o.label}
                            </div>
                            <div className="font-cinzel" style={{ color:'var(--casino-gold)', fontSize:'16px', fontWeight:700 }}>
                              {Number(o.odds).toFixed(2)}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Formulario confirmación */}
            {selectedEvento && selectedOdd && (
              <div className="card-casino" style={{ padding:'24px' }}>
                <div className="font-cinzel" style={{ marginBottom:'14px', color:'var(--casino-gold)', fontSize:'14px' }}>
                  Confirmar Apuesta
                </div>
                <div style={{ fontSize:'13px', color:'var(--casino-muted)', marginBottom:'14px' }}>
                  {selectedEvento.equipo_local} vs {selectedEvento.equipo_visitante} —{' '}
                  <span style={{ color:'var(--casino-gold)' }}>{selectedOdd.label} @ {selectedOdd.odds}</span>
                </div>

                {/* Verificaciones */}
                {checking && (
                  <div style={{ display:'flex', gap:'8px', alignItems:'center', marginBottom:'12px' }}>
                    <span className="spinner" style={{ width:'18px', height:'18px', borderWidth:'2px' }} />
                    <UMLBadge type="include" label={checking==='saldo' ? 'Verificar saldo' : 'Verificar límites'} />
                  </div>
                )}

                {error && (
                  <div style={{ background:'rgba(204,34,0,0.1)', border:'1px solid rgba(204,34,0,0.28)', borderRadius:'8px', padding:'11px', marginBottom:'12px', fontSize:'13px', color:'#FF5533' }}>
                    {error}
                  </div>
                )}

                {!!limitError && (
                  <div style={{ background:'rgba(204,34,0,0.1)', border:'1px solid rgba(204,34,0,0.28)', borderRadius:'8px', padding:'11px', marginBottom:'12px', display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' }}>
                    <UMLBadge type="extend" label="Bloquear operación" />
                    <span style={{ fontSize:'13px', color:'#FF5533' }}>
                      Límite {limitError} de S/ {
                        limitError === 'diario' ? (limites?.limite_diario || 500) :
                        limitError === 'semanal' ? (limites?.limite_semanal || 2000) :
                        (limites?.limite_mensual || 6000)
                      } alcanzado.
                    </span>
                  </div>
                )}

                <div style={{ display:'flex', gap:'12px', alignItems:'flex-end' }}>
                  <div style={{ flex:1 }}>
                    <label style={{ fontSize:'11px', color:'var(--casino-muted)', textTransform:'uppercase', letterSpacing:'0.8px', display:'block', marginBottom:'7px' }}>
                      Monto a apostar (S/)
                    </label>
                    <input className="input-casino" type="number" placeholder="0.00"
                      value={betAmount} onChange={e => setBetAmount(e.target.value)} />
                  </div>
                  {betAmount && parseFloat(betAmount) > 0 && (
                    <div style={{ color:'var(--casino-muted)', fontSize:'12px', paddingBottom:'12px', whiteSpace:'nowrap' }}>
                      Ganarías:{' '}
                      <span className="font-cinzel" style={{ color:'var(--casino-green)' }}>
                        S/ {(parseFloat(betAmount) * selectedOdd.odds).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <button className="btn-gold" style={{ width:'100%', marginTop:'14px' }}
                  onClick={handleBet}
                  disabled={!betAmount || !!checking}>
                  Confirmar Apuesta
                </button>
              </div>
            )}
          </>
        ) : (
          /* Resultado - <<extend>> Visualizar resultados */
          <div className="card-casino animate-fadeIn" style={{ padding:'36px', textAlign:'center', borderColor: result.won ? 'rgba(0,200,83,0.4)' : 'rgba(204,34,0,0.35)' }}>
            <div style={{ marginBottom:'12px' }}>
              <UMLBadge type="extend" label="Visualizar resultados" />
            </div>
            <div style={{ fontSize:'44px', marginBottom:'14px' }}>{result.won ? '🏆' : '😔'}</div>
            <div className="font-cinzel" style={{ fontSize:'20px', color: result.won ? 'var(--casino-green)' : '#FF5533', marginBottom:'8px' }}>
              {result.won ? `¡Ganaste S/ ${result.gain.toFixed(2)}!` : `Perdiste S/ ${result.bet.toFixed(2)}`}
            </div>
            <p style={{ color:'var(--casino-muted)', fontSize:'13px', marginBottom:'8px' }}>
              {result.evento.equipo_local} vs {result.evento.equipo_visitante}
            </p>
            <p style={{ color:'var(--casino-muted)', fontSize:'13px', marginBottom:'22px' }}>
              Selección: <span style={{ color:'var(--casino-gold)' }}>{result.pick}</span> @ {result.odds} · Nuevo saldo: S/ {Number(profile.saldo_virtual).toFixed(2)}
            </p>
            <div style={{ display:'flex', gap:'11px', justifyContent:'center' }}>
              <button className="btn-gold" onClick={() => { setResult(null); setSelectedEvento(null); setSelectedOdd(null); setBetAmount('') }}>
                Nueva apuesta
              </button>
              <Link href="/historial">
                <button className="btn-outline-casino">Ver historial</button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
