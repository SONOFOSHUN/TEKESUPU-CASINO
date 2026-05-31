'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LimiteUsuario } from '@/lib/types'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import UMLBadge from '@/components/UMLBadge'

const SYMBOLS = ['🍒', '🍋', '💎', '🔔', '7️⃣', '⭐', '🍀', '🎰']


export default function TragamondasPage() {
  const router = useRouter()
  const { profile, loading: authLoading, isAuthenticated, refresh: refreshProfile } = useAuth()
  const [limites, setLimites] = useState<LimiteUsuario | null>(null)
  const [reels, setReels] = useState(['🎰', '🎰', '🎰'])
  const [spinning, setSpinning] = useState(false)
  const [betAmount, setBetAmount] = useState('')
  const [checking, setChecking] = useState('')
  const [result, setResult] = useState<{won: boolean, gain: number, bet: number, reels: string[]} | null>(null)
  const [limitError, setLimitError] = useState<string>('')
  const [error, setError] = useState('')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!profile) return
    const fetchData = async () => {
      const supabase = createClient()

      const { data: limitesData } = await supabase
        .from('limites_usuario').select('*').eq('usuario_id', profile.id).single()
      if (limitesData) setLimites(limitesData)

    }
    fetchData()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [profile])

  const handleSpin = async () => {
    const amt = parseFloat(betAmount)
    if (!amt || amt <= 0 || !profile) return

    setLimitError('')
    setError('')
    setResult(null)
    setSpinning(true)
    setChecking('saldo')

    // Animación de rodillos y llamada al API en paralelo
    let count = 0
    intervalRef.current = setInterval(() => {
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ])
      count++
      if (count > 25) clearInterval(intervalRef.current!)
    }, 80)

    const apiCall = fetch('/api/apuesta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ juego: 'tragamonedas', tipo_apuesta: 'spin', monto: amt }),
    })
    const animDelay = new Promise(r => setTimeout(r, 2200))

    setChecking('limite')
    const [res] = await Promise.all([apiCall, animDelay])

    clearInterval(intervalRef.current!)
    setChecking('')

    const data = await res.json()

    if (!res.ok) {
      setSpinning(false)
      setReels(['🎰', '🎰', '🎰'])
      if (data.error === 'LIMIT') {
        setLimitError(data.limitType)
      } else {
        setError(data.error || 'Error al procesar la apuesta.')
      }
      return
    }

    // Mostrar resultado del servidor
    setReels(data.reels)
    setSpinning(false)
    await refreshProfile()
    setResult({ won: data.won, gain: data.gain, bet: amt, reels: data.reels })
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
          <h1 className="font-cinzel" style={{ fontSize:'24px' }}>🎰 Tragamonedas</h1>
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

        {/* Máquina */}
        <div className="card-casino" style={{ padding:'36px', textAlign:'center', marginBottom:'22px', background:'linear-gradient(180deg, rgba(139,0,0,0.09), rgba(0,0,0,0.25))' }}>
          <div className="font-cinzel" style={{ fontSize:'13px', color:'var(--casino-gold)', letterSpacing:'3px', marginBottom:'28px' }}>
            ★ TEKESUPU CASINO ★
          </div>

          {/* Tabla de premios */}
          <div style={{ display:'flex', justifyContent:'center', gap:'16px', marginBottom:'24px', flexWrap:'wrap' }}>
            {[['💎','×15'],['7️⃣','×12'],['🔔','×10'],['⭐','×8']].map(([s,m]) => (
              <div key={s} style={{ fontSize:'12px', color:'var(--casino-muted)', textAlign:'center' }}>
                <div style={{ fontSize:'20px' }}>{s}</div>
                <div style={{ color:'var(--casino-gold)' }}>{m}</div>
              </div>
            ))}
          </div>

          {/* Rodillos */}
          <div style={{ display:'flex', gap:'10px', justifyContent:'center', marginBottom:'28px' }}>
            {reels.map((s, i) => (
              <div key={i} style={{
                width:'clamp(75px, 22vw, 100px)', height:'clamp(75px, 22vw, 100px)',
                background:'rgba(0,0,0,0.7)',
                border:`2px solid ${result && result.won && reels[0]===reels[1]&&reels[1]===reels[2] ? 'var(--casino-green)' : 'var(--casino-gold)'}`,
                borderRadius:'12px',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'clamp(32px, 10vw, 44px)',
                boxShadow: result?.won ? '0 0 20px rgba(0,200,83,0.3)' : 'none',
                transition:'box-shadow 0.3s'
              }}>
                <span style={{ animation: spinning ? 'pulse 0.15s linear infinite' : 'none' }}>
                  {s}
                </span>
              </div>
            ))}
          </div>

          {/* Verificaciones */}
          {checking && (
            <div style={{ display:'flex', gap:'8px', alignItems:'center', justifyContent:'center', marginBottom:'16px' }}>
              <span className="spinner" style={{ width:'18px', height:'18px', borderWidth:'2px' }} />
              <UMLBadge type="include" label={checking==='saldo' ? 'Verificar saldo' : 'Verificar límites'} />
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ background:'rgba(204,34,0,0.1)', border:'1px solid rgba(204,34,0,0.28)', borderRadius:'8px', padding:'11px', marginBottom:'14px', fontSize:'13px', color:'#FF5533' }}>
              {error}
            </div>
          )}

          {/* Límite alcanzado */}
          {!!limitError && (
            <div style={{ background:'rgba(204,34,0,0.1)', border:'1px solid rgba(204,34,0,0.28)', borderRadius:'8px', padding:'11px', marginBottom:'14px', display:'flex', gap:'8px', alignItems:'center', justifyContent:'center', flexWrap:'wrap' }}>
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

          {/* Apuesta y botón */}
          <div style={{ display:'flex', gap:'11px', justifyContent:'center', alignItems:'center', marginBottom:'16px' }}>
            <input
              className="input-casino" type="number" placeholder="Monto S/"
              value={betAmount} onChange={e => setBetAmount(e.target.value)}
              style={{ width:'130px', textAlign:'center' }}
            />
            <button className="btn-gold" onClick={handleSpin}
              disabled={spinning || !betAmount || !!checking}
              style={{ fontSize:'14px', padding:'12px 28px' }}>
              {spinning ? 'Girando...' : '🎰 GIRAR'}
            </button>
          </div>

          <div style={{ display:'flex', gap:'20px', justifyContent:'center', fontSize:'12px', color:'var(--casino-muted)' }}>
            <span>3 iguales = multiplicador del símbolo</span>
            <span>2 iguales = ×2</span>
          </div>
        </div>

        {/* Resultado - <<extend>> Visualizar resultados */}
        {result && (
          <div className="card-casino animate-fadeIn" style={{ padding:'28px', textAlign:'center', borderColor: result.won ? 'rgba(0,200,83,0.4)' : 'rgba(204,34,0,0.35)' }}>
            <div style={{ marginBottom:'10px' }}>
              <UMLBadge type="extend" label="Visualizar resultados" />
            </div>
            <div style={{ fontSize:'36px', marginBottom:'8px' }}>{result.won ? '🎉' : '😔'}</div>
            <div className="font-cinzel" style={{ fontSize:'20px', color: result.won ? 'var(--casino-green)' : '#FF5533', marginBottom:'14px' }}>
              {result.won ? `¡Ganaste S/ ${result.gain.toFixed(2)}!` : `Perdiste S/ ${result.bet.toFixed(2)}`}
            </div>
            <p style={{ color:'var(--casino-muted)', fontSize:'13px', marginBottom:'20px' }}>
              Nuevo saldo: S/ {Number(profile.saldo_virtual).toFixed(2)}
            </p>
            <div style={{ display:'flex', gap:'11px', justifyContent:'center' }}>
              <button className="btn-gold" onClick={() => { setResult(null); setBetAmount('') }}>
                Volver a jugar
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
