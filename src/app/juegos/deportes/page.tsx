'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LimiteUsuario, EventoDeportivo } from '@/lib/types'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import UMLBadge from '@/components/UMLBadge'

const SPORT_ICONS: Record<string, string> = {
  'Liga 1': '⚽', 'Liga 1 Perú': '⚽', 'La Liga': '⚽',
  'Champions League': '🏆', 'Premier League': '⚽',
  'NBA': '🏀', 'NFL': '🏈', 'Tenis': '🎾',
}

function getIcon(liga: string) {
  for (const [key, icon] of Object.entries(SPORT_ICONS)) {
    if (liga.toLowerCase().includes(key.toLowerCase())) return icon
  }
  return '🏅'
}

function timeLabel(fechaStr: string) {
  const fecha = new Date(fechaStr)
  const now = new Date()
  const diffMs = fecha.getTime() - now.getTime()
  const diffH = diffMs / (1000 * 60 * 60)
  if (diffH < 0) return { label: 'EN VIVO', color: '#22c55e', dot: true }
  if (diffH < 2) return { label: `${Math.round(diffH * 60)}m`, color: '#f59e0b', dot: true }
  if (diffH < 24) return { label: `HOY ${fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`, color: '#f59e0b', dot: false }
  return {
    label: fecha.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
    color: 'var(--casino-muted)', dot: false
  }
}

export default function DeportesPage() {
  const router = useRouter()
  const { profile, loading: authLoading, isAuthenticated, refresh: refreshProfile } = useAuth()
  const [limites, setLimites] = useState<LimiteUsuario | null>(null)
  const [eventos, setEventos] = useState<EventoDeportivo[]>([])
  const [filtroLiga, setFiltroLiga] = useState('todos')
  const [selectedEvento, setSelectedEvento] = useState<EventoDeportivo | null>(null)
  const [selectedOdd, setSelectedOdd] = useState<{ label: string; odds: number } | null>(null)
  const [betAmount, setBetAmount] = useState('')
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<{ won: boolean; gain: number; bet: number; odds: number; pick: string; evento: EventoDeportivo; nuevoSaldo: number } | null>(null)
  const [limitError, setLimitError] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!profile) return
    const fetchData = async () => {
      const supabase = createClient()
      const [{ data: limitesData }, { data: eventosData }] = await Promise.all([
        supabase.from('limites_usuario').select('*').eq('usuario_id', profile.id).single(),
        supabase.from('eventos_deportivos').select('*').eq('activo', true).order('fecha_evento', { ascending: true }),
      ])
      if (limitesData) setLimites(limitesData)
      if (eventosData) setEventos(eventosData)
    }
    fetchData()
  }, [profile])

  const ligas = ['todos', ...Array.from(new Set(eventos.map(e => e.liga)))]
  const eventosFiltrados = filtroLiga === 'todos' ? eventos : eventos.filter(e => e.liga === filtroLiga)

  const handleSelectOdd = (evento: EventoDeportivo, odd: { label: string; odds: number }) => {
    if (selectedEvento?.id === evento.id && selectedOdd?.label === odd.label) {
      setSelectedOdd(null)
      setSelectedEvento(null)
    } else {
      setSelectedEvento(evento)
      setSelectedOdd(odd)
      setBetAmount('')
      setLimitError('')
      setError('')
    }
  }

  const handleBet = async () => {
    const amt = parseFloat(betAmount)
    if (!amt || amt <= 0 || !profile || !selectedEvento || !selectedOdd) return
    setLimitError('')
    setError('')
    setChecking(true)
    const tipo = `${selectedEvento.equipo_local} vs ${selectedEvento.equipo_visitante} — ${selectedOdd.label}`
    const res = await fetch('/api/apuesta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ juego: 'deportes', tipo_apuesta: tipo, monto: amt, odds: selectedOdd.odds }),
    })
    setChecking(false)
    const data = await res.json()
    if (!res.ok) {
      if (data.error === 'LIMIT') setLimitError(data.limitType)
      else setError(data.error || 'Error al procesar la apuesta.')
      return
    }
    await refreshProfile()
    setResult({ won: data.won, gain: data.gain, bet: amt, odds: selectedOdd.odds, pick: selectedOdd.label, evento: selectedEvento, nuevoSaldo: Number(data.nuevoSaldo) })
  }

  if (authLoading) return (
    <div style={{ minHeight: '100vh', background: 'var(--casino-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span className="spinner" />
    </div>
  )
  if (!isAuthenticated) { router.push('/auth/login'); return null }
  if (!profile) return null

  const saldoVisible = result?.nuevoSaldo ?? Number(profile.saldo_virtual)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--casino-dark)' }}>
      <Navbar />
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: 'clamp(70px,10vw,88px) 16px 48px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Link href="/dashboard">
            <button className="btn-outline-casino" style={{ padding: '7px 14px', fontSize: '11px' }}>← Volver</button>
          </Link>
          <h1 className="font-cinzel" style={{ fontSize: '24px' }}>⚽ Apuestas Deportivas</h1>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
          <UMLBadge type="include" label="Realizar apuesta" />
          <span style={{ color: 'var(--casino-muted)' }}>→</span>
          <UMLBadge type="include" label="Verificar saldo" />
          <span style={{ color: 'var(--casino-muted)' }}>→</span>
          <UMLBadge type="include" label="Verificar límites" />
        </div>

        {/* Saldo */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <span className="font-cinzel" style={{ color: 'var(--casino-gold)', fontSize: '16px' }}>
            💰 S/ {saldoVisible.toFixed(2)}
          </span>
        </div>

        {!result ? (
          <>
            {/* Filtros por liga */}
            {ligas.length > 2 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '18px' }}>
                {ligas.map(liga => (
                  <button key={liga}
                    className={filtroLiga === liga ? 'btn-gold' : 'btn-outline-casino'}
                    style={{ padding: '5px 14px', fontSize: '11px' }}
                    onClick={() => setFiltroLiga(liga)}>
                    {liga === 'todos' ? 'Todos' : liga}
                  </button>
                ))}
              </div>
            )}

            {eventosFiltrados.length === 0 ? (
              <div className="card-casino" style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
                <p style={{ color: 'var(--casino-muted)' }}>No hay eventos disponibles.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {eventosFiltrados.map(evento => {
                  const time = timeLabel(evento.fecha_evento)
                  const isSelected = selectedEvento?.id === evento.id
                  const odds = [
                    { label: evento.equipo_local, odds: evento.odds_local },
                    { label: 'Empate', odds: evento.odds_empate },
                    { label: evento.equipo_visitante, odds: evento.odds_visitante },
                  ]

                  return (
                    <div key={evento.id}>
                      <div className="card-casino" style={{
                        padding: '18px 20px',
                        borderColor: isSelected ? 'rgba(201,162,39,0.5)' : 'var(--casino-border)',
                        transition: 'border-color 0.2s',
                      }}>
                        {/* Liga + tiempo */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '13px' }}>{getIcon(evento.liga)}</span>
                            <span style={{ fontSize: '10px', color: 'var(--casino-gold)', fontFamily: 'Cinzel', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              {evento.liga}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            {time.dot && (
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: time.color, animation: 'pulse 1.5s infinite' }} />
                            )}
                            <span style={{ fontSize: '11px', color: time.color, fontWeight: time.dot ? 700 : 400 }}>
                              {time.label}
                            </span>
                          </div>
                        </div>

                        {/* Equipos */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div className="font-cinzel" style={{ fontSize: 'clamp(13px,2.5vw,16px)', color: 'var(--casino-cream)', lineHeight: 1.3 }}>
                              {evento.equipo_local}
                            </div>
                          </div>
                          <div style={{
                            background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.25)',
                            borderRadius: '6px', padding: '5px 10px',
                            color: 'var(--casino-gold)', fontSize: '11px', fontFamily: 'Cinzel', fontWeight: 700,
                          }}>
                            VS
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <div className="font-cinzel" style={{ fontSize: 'clamp(13px,2.5vw,16px)', color: 'var(--casino-cream)', lineHeight: 1.3 }}>
                              {evento.equipo_visitante}
                            </div>
                          </div>
                        </div>

                        {/* Odds siempre visibles */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                          {odds.map(o => {
                            const active = isSelected && selectedOdd?.label === o.label
                            return (
                              <button key={o.label}
                                onClick={() => handleSelectOdd(evento, o)}
                                style={{
                                  padding: '10px 6px', borderRadius: '8px', border: 'none',
                                  background: active
                                    ? 'linear-gradient(135deg, rgba(201,162,39,0.25), rgba(201,162,39,0.1))'
                                    : 'rgba(255,255,255,0.04)',
                                  outline: active ? '1.5px solid var(--casino-gold)' : '1px solid rgba(255,255,255,0.08)',
                                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                                }}>
                                <div style={{ fontSize: '9px', color: active ? 'var(--casino-gold)' : 'var(--casino-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px', wordBreak: 'break-word' }}>
                                  {o.label === 'Empate' ? 'X Empate' : o.label === evento.equipo_local ? '1 Local' : '2 Visita'}
                                </div>
                                <div className="font-cinzel" style={{ fontSize: '18px', fontWeight: 700, color: active ? 'var(--casino-gold)' : 'var(--casino-cream)' }}>
                                  {Number(o.odds).toFixed(2)}
                                </div>
                                <div style={{ fontSize: '9px', color: active ? 'rgba(201,162,39,0.7)' : 'var(--casino-muted)', marginTop: '2px', wordBreak: 'break-word', lineHeight: 1.2 }}>
                                  {o.label}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Panel de apuesta — aparece inline debajo de la tarjeta seleccionada */}
                      {isSelected && selectedOdd && (
                        <div className="card-casino animate-fadeIn" style={{
                          padding: '20px',
                          borderColor: 'rgba(201,162,39,0.35)',
                          background: 'rgba(201,162,39,0.04)',
                          borderTopLeftRadius: 0, borderTopRightRadius: 0,
                          marginTop: '-1px',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ fontSize: '13px', color: 'var(--casino-muted)' }}>
                              Apostando a{' '}
                              <span style={{ color: 'var(--casino-gold)', fontWeight: 700 }}>
                                {selectedOdd.label} @ {Number(selectedOdd.odds).toFixed(2)}
                              </span>
                            </div>
                            {betAmount && parseFloat(betAmount) > 0 && (
                              <div style={{ fontSize: '12px', color: 'var(--casino-muted)' }}>
                                Ganarías:{' '}
                                <span className="font-cinzel" style={{ color: 'var(--casino-green)', fontWeight: 700 }}>
                                  S/ {(parseFloat(betAmount) * selectedOdd.odds).toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Montos rápidos */}
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                            {[10, 25, 50, 100].map(q => (
                              <button key={q} className="btn-outline-casino"
                                style={{ padding: '5px 12px', fontSize: '11px', borderColor: parseFloat(betAmount) === q ? 'var(--casino-gold)' : undefined }}
                                onClick={() => setBetAmount(String(q))}>
                                S/ {q}
                              </button>
                            ))}
                          </div>

                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
                            <input className="input-casino" type="number" placeholder="Monto personalizado (S/)"
                              value={betAmount} onChange={e => setBetAmount(e.target.value)}
                              style={{ flex: 1 }} />
                          </div>

                          {error && (
                            <div style={{ background: 'rgba(204,34,0,0.1)', border: '1px solid rgba(204,34,0,0.28)', borderRadius: '8px', padding: '10px', marginBottom: '10px', fontSize: '13px', color: '#FF5533' }}>
                              {error}
                            </div>
                          )}
                          {!!limitError && (
                            <div style={{ background: 'rgba(204,34,0,0.1)', border: '1px solid rgba(204,34,0,0.28)', borderRadius: '8px', padding: '10px', marginBottom: '10px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <UMLBadge type="extend" label="Bloquear operación" />
                              <span style={{ fontSize: '13px', color: '#FF5533' }}>
                                Límite {limitError} de S/ {
                                  limitError === 'diario' ? (limites?.limite_diario || 500) :
                                  limitError === 'semanal' ? (limites?.limite_semanal || 2000) :
                                  (limites?.limite_mensual || 6000)
                                } alcanzado.
                              </span>
                            </div>
                          )}

                          <button className="btn-gold" style={{ width: '100%' }}
                            onClick={handleBet}
                            disabled={!betAmount || parseFloat(betAmount) <= 0 || checking}>
                            {checking ? (
                              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                                Procesando...
                              </span>
                            ) : `Confirmar apuesta S/ ${betAmount || '0'}`}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <div className="card-casino animate-fadeIn" style={{ padding: '36px', textAlign: 'center', borderColor: result.won ? 'rgba(0,200,83,0.4)' : 'rgba(204,34,0,0.35)' }}>
            <div style={{ marginBottom: '12px' }}>
              <UMLBadge type="extend" label="Visualizar resultados" />
            </div>
            <div style={{ fontSize: '48px', marginBottom: '14px' }}>{result.won ? '🏆' : '😔'}</div>
            <div className="font-cinzel" style={{ fontSize: '22px', color: result.won ? 'var(--casino-green)' : '#FF5533', marginBottom: '8px' }}>
              {result.won ? `¡Ganaste S/ ${result.gain.toFixed(2)}!` : `Perdiste S/ ${result.bet.toFixed(2)}`}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '14px', marginBottom: '20px', fontSize: '13px', color: 'var(--casino-muted)' }}>
              <div style={{ marginBottom: '6px' }}>
                <span style={{ color: 'var(--casino-cream)' }}>{result.evento.equipo_local}</span>
                {' '}<span style={{ color: 'var(--casino-muted)' }}>vs</span>{' '}
                <span style={{ color: 'var(--casino-cream)' }}>{result.evento.equipo_visitante}</span>
              </div>
              <div>
                Selección: <span style={{ color: 'var(--casino-gold)' }}>{result.pick}</span>
                {' '}@ <span className="font-cinzel" style={{ color: 'var(--casino-gold)' }}>{result.odds}</span>
              </div>
              <div style={{ marginTop: '6px' }}>
                Nuevo saldo: <span className="font-cinzel" style={{ color: 'var(--casino-gold)' }}>S/ {result.nuevoSaldo.toFixed(2)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '11px', justifyContent: 'center' }}>
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
