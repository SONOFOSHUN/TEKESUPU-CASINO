'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LimiteUsuario } from '@/lib/types'
// createClient se mantiene para fetchData de límites locales
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import UMLBadge from '@/components/UMLBadge'

const ROULETTE = [
  {n:0,c:'green'},{n:32,c:'red'},{n:15,c:'black'},{n:19,c:'red'},{n:4,c:'black'},
  {n:21,c:'red'},{n:2,c:'black'},{n:25,c:'red'},{n:17,c:'black'},{n:34,c:'red'},
  {n:6,c:'black'},{n:27,c:'red'},{n:13,c:'black'},{n:36,c:'red'},{n:11,c:'black'},
  {n:30,c:'red'},{n:8,c:'black'},{n:23,c:'red'},{n:10,c:'black'},{n:5,c:'red'},
  {n:24,c:'black'},{n:16,c:'red'},{n:33,c:'black'},{n:1,c:'red'},{n:20,c:'black'},
  {n:14,c:'red'},{n:31,c:'black'},{n:9,c:'red'},{n:22,c:'black'},{n:18,c:'red'},
  {n:29,c:'black'},{n:7,c:'red'},{n:28,c:'black'},{n:12,c:'red'},{n:35,c:'black'},
  {n:3,c:'red'},{n:26,c:'black'}
]

const BET_TYPES = ['Rojo', 'Negro', 'Par', 'Impar', 'Número específico']

export default function RuletaPage() {
  const router = useRouter()
  const { profile, loading: authLoading, isAuthenticated, refresh: refreshProfile } = useAuth()
  const [limites, setLimites] = useState<LimiteUsuario | null>(null)
  const [betType, setBetType] = useState('')
  const [betNumber, setBetNumber] = useState('')
  const [betAmount, setBetAmount] = useState('')
  const [spinning, setSpinning] = useState(false)
  const [checking, setChecking] = useState('')
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState<{number:number, color:string, won:boolean, gain:number, bet:number, type:string, nuevoSaldo:number} | null>(null)
  const [limitError, setLimitError] = useState<string>('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!profile) return
    const fetchData = async () => {
      const supabase = createClient()

      const { data: limitesData } = await supabase
        .from('limites_usuario').select('*').eq('usuario_id', profile.id).single()
      if (limitesData) setLimites(limitesData)

    }
    fetchData()
  }, [profile])

  const handleSpin = async () => {
    if (!betType || !betAmount || !profile) return
    const amt = parseFloat(betAmount)
    if (amt <= 0) return

    setLimitError('')
    setError('')
    setResult(null)
    setSpinning(true)
    setChecking('saldo')

    // Animación cosmética y llamada al API en paralelo
    const newRot = rotation + 1440 + Math.random() * 720
    setRotation(newRot)

    const tipo = betType === 'Número específico' ? `Número ${betNumber}` : betType
    const apiCall = fetch('/api/apuesta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ juego: 'ruleta', tipo_apuesta: tipo, monto: amt, betNumber }),
    })
    const animDelay = new Promise(r => setTimeout(r, 4200))

    setChecking('limite')
    const [res] = await Promise.all([apiCall, animDelay])
    setChecking('')
    setSpinning(false)

    const data = await res.json()

    if (!res.ok) {
      if (data.error === 'LIMIT') {
        setLimitError(data.limitType)
      } else {
        setError(data.error || 'Error al procesar la apuesta.')
      }
      return
    }

    await refreshProfile()
    setResult({ number: data.segNumber, color: data.segColor, won: data.won, gain: data.gain, bet: amt, type: betType, nuevoSaldo: Number(data.nuevoSaldo) })
  }

  if (authLoading) return (
    <div style={{ minHeight:'100vh', background:'var(--casino-dark)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span className="spinner" />
    </div>
  )
  if (!isAuthenticated) { router.push('/auth/login'); return null }
  if (!profile) return null

  const segs = ROULETTE.length
  const saldoVisible = result?.nuevoSaldo ?? Number(profile.saldo_virtual)

  return (
    <div style={{ minHeight:'100vh', background:'var(--casino-dark)' }}>
      <Navbar />
      <div style={{ maxWidth:'100%', margin:'0 auto', padding:'clamp(70px,10vw,88px) 16px 48px' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px' }}>
          <Link href="/dashboard">
            <button className="btn-outline-casino" style={{ padding:'7px 14px', fontSize:'11px' }}>← Volver</button>
          </Link>
          <h1 className="font-cinzel" style={{ fontSize:'24px' }}>🎡 Ruleta</h1>
        </div>
        <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', alignItems:'center', marginBottom:'24px' }}>
          <UMLBadge type="include" label="Realizar apuesta" />
          <span style={{ color:'var(--casino-muted)' }}>→</span>
          <UMLBadge type="include" label="Verificar saldo" />
          <span style={{ color:'var(--casino-muted)' }}>→</span>
          <UMLBadge type="include" label="Verificar límites" />
        </div>

        {/* Saldo actual */}
        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'16px' }}>
          <span className="font-cinzel" style={{ color:'var(--casino-gold)', fontSize:'16px' }}>
            💰 S/ {saldoVisible.toFixed(2)}
          </span>
        </div>

        {/* Rueda SVG */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:'28px' }}>
          <div style={{ position:'relative', display:'inline-block', maxWidth:'280px', width:'100%' }}>

            {/* Triángulo indicador fijo (no gira) */}
            <div style={{
              position:'absolute', top:'-12px', left:'50%',
              transform:'translateX(-50%)',
              width:0, height:0,
              borderLeft:'10px solid transparent',
              borderRight:'10px solid transparent',
              borderTop:'20px solid #C9A227',
              zIndex:10,
              filter:'drop-shadow(0 0 6px rgba(201,162,39,0.8))'
            }} />

            {/* Círculo exterior decorativo fijo */}
            <div style={{
              position:'absolute', inset:'-8px',
              borderRadius:'50%',
              border:'3px solid rgba(201,162,39,0.4)',
              boxShadow:'0 0 20px rgba(201,162,39,0.15), inset 0 0 20px rgba(0,0,0,0.5)',
              pointerEvents:'none',
              zIndex:5
            }} />

            {/* SVG de la rueda que gira */}
            <svg
              width="100%" height="100%" viewBox="-110 -110 220 220"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? 'transform 4s cubic-bezier(0.17,0.67,0.12,1)' : 'none',
                borderRadius:'50%',
                display:'block',
                height:'auto',
              }}
            >
              {/* Carril exterior */}
              <circle cx="0" cy="0" r="108" fill="#1a1a1a" stroke="#C9A227" strokeWidth="1"/>
              <circle cx="0" cy="0" r="104" fill="none" stroke="rgba(201,162,39,0.3)" strokeWidth="0.5"/>

              {/* Segmentos */}
              {ROULETTE.map((seg, i) => {
                const a = (360/segs)*i
                const r1 = a*(Math.PI/180)
                const r2 = ((360/segs)*(i+1))*(Math.PI/180)
                const x1=Math.cos(r1)*100, y1=Math.sin(r1)*100
                const x2=Math.cos(r2)*100, y2=Math.sin(r2)*100
                const ma=(a+180/segs)*(Math.PI/180)
                const tx=Math.cos(ma)*76, ty=Math.sin(ma)*76
                const tx2=Math.cos(ma)*90, ty2=Math.sin(ma)*90
                return (
                  <g key={i}>
                    {/* Segmento principal */}
                    <path
                      d={`M 0 0 L ${x1} ${y1} A 100 100 0 0 1 ${x2} ${y2} Z`}
                      fill={seg.c==='green'?'#155c1f':seg.c==='red'?'#8B0000':'#1a1a1a'}
                      stroke="#C9A227" strokeWidth="0.5"
                    />
                    {/* Número en el carril exterior */}
                    <text x={tx2} y={ty2} textAnchor="middle" dominantBaseline="middle"
                      fontSize="5.5" fill={seg.c==='green'?'#4ade80':'white'}
                      fontFamily="Lato" fontWeight="bold">
                      {seg.n}
                    </text>
                    {/* Punto de color en cada segmento */}
                    <circle cx={tx*0.7} cy={ty*0.7} r="3"
                      fill={seg.c==='green'?'#22c55e':seg.c==='red'?'#ef4444':'#6b7280'}
                      opacity="0.6"
                    />
                  </g>
                )
              })}

              {/* Círculo interior decorativo */}
              <circle cx="0" cy="0" r="30" fill="#111" stroke="#C9A227" strokeWidth="1"/>
              <circle cx="0" cy="0" r="22" fill="#0a0a0a" stroke="rgba(201,162,39,0.4)" strokeWidth="0.5"/>

              {/* Centro */}
              <circle cx="0" cy="0" r="18" fill="url(#goldGrad)" stroke="#000" strokeWidth="1"/>
              <defs>
                <radialGradient id="goldGrad" cx="40%" cy="40%">
                  <stop offset="0%" stopColor="#F0D060"/>
                  <stop offset="100%" stopColor="#9A7A1E"/>
                </radialGradient>
              </defs>
              <text x="0" y="0" textAnchor="middle" dominantBaseline="middle"
                fontSize="10" fontWeight="bold" fill="#000" fontFamily="Cinzel">★</text>
            </svg>

            {/* Bolita indicadora animada cuando gira */}
            {spinning && (
              <div style={{
                position:'absolute',
                top:'50%', left:'50%',
                width:'10px', height:'10px',
                background:'white',
                borderRadius:'50%',
                boxShadow:'0 0 8px white',
                transform:'translate(-50%, -118px)',
                animation:'orbit 0.6s linear infinite',
                zIndex:8
              }}/>
            )}
          </div>
        </div>

        {/* CSS para la animación de la bolita */}
        <style>{`
          @keyframes orbit {
            from { transform: translate(-50%, -118px) rotate(0deg) translateX(0); }
            to { transform: translate(-50%, -118px) rotate(360deg) translateX(0); }
          }
        `}</style>

        {/* Verificaciones en curso */}
        {checking && (
          <div className="card-casino" style={{ padding:'14px', marginBottom:'18px', display:'flex', gap:'10px', alignItems:'center', justifyContent:'center' }}>
            <span className="spinner" style={{ width:'20px', height:'20px', borderWidth:'2px' }} />
            <UMLBadge type="include" label={checking==='saldo' ? 'Verificar saldo virtual' : 'Verificar límites de uso'} />
          </div>
        )}

        {/* Error saldo */}
        {error && (
          <div style={{ background:'rgba(204,34,0,0.1)', border:'1px solid rgba(204,34,0,0.28)', borderRadius:'8px', padding:'14px', marginBottom:'18px', fontSize:'13px', color:'#FF5533' }}>
            {error}
          </div>
        )}

        {/* Límite alcanzado - <<extend>> Bloquear operación */}
        {!!limitError && (
          <div style={{ background:'rgba(204,34,0,0.1)', border:'1px solid rgba(204,34,0,0.28)', borderRadius:'8px', padding:'14px', marginBottom:'18px', display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap' }}>
            <UMLBadge type="extend" label="Bloquear operación" />
            <span style={{ fontSize:'13px', color:'#FF5533' }}>
              Límite {limitError} de S/ {
                limitError === 'diario' ? (limites?.limite_diario || 500) :
                limitError === 'semanal' ? (limites?.limite_semanal || 2000) :
                (limites?.limite_mensual || 6000)
              } alcanzado.
            </span>
            <Link href="/limites">
              <button className="btn-outline-casino" style={{ padding:'5px 12px', fontSize:'11px' }}>Ajustar límites</button>
            </Link>
          </div>
        )}

        {/* Formulario de apuesta */}
        {!result && (
          <div className="card-casino" style={{ padding:'26px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'14px', marginBottom:'14px' }}>
              <div>
                <label style={{ fontSize:'11px', color:'var(--casino-muted)', textTransform:'uppercase', letterSpacing:'0.8px', display:'block', marginBottom:'7px' }}>
                  Tipo de apuesta
                </label>
                <select className="input-casino" value={betType} onChange={e => setBetType(e.target.value)}
                  style={{ background:'rgba(255,255,255,0.06)' }}>
                  <option value="">Seleccionar...</option>
                  {BET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:'11px', color:'var(--casino-muted)', textTransform:'uppercase', letterSpacing:'0.8px', display:'block', marginBottom:'7px' }}>
                  Monto a apostar (S/)
                </label>
                <input className="input-casino" type="number" placeholder="0.00"
                  value={betAmount} onChange={e => setBetAmount(e.target.value)} />
              </div>
            </div>

            {betType === 'Número específico' && (
              <div style={{ marginBottom:'14px' }}>
                <label style={{ fontSize:'11px', color:'var(--casino-muted)', textTransform:'uppercase', letterSpacing:'0.8px', display:'block', marginBottom:'7px' }}>
                  Número (0-36)
                </label>
                <input className="input-casino" type="number" min="0" max="36"
                  placeholder="0-36" value={betNumber} onChange={e => setBetNumber(e.target.value)} />
              </div>
            )}

            <button className="btn-gold" style={{ width:'100%' }}
              onClick={handleSpin}
              disabled={spinning || !!checking || !betType || !betAmount}>
              {spinning ? '🎡 Girando...' : '🎡 ¡Girar Ruleta!'}
            </button>
          </div>
        )}

        {/* Resultado - <<extend>> Visualizar resultados */}
        {result && (
          <div className="card-casino animate-fadeIn" style={{ padding:'32px', textAlign:'center', borderColor: result.won ? 'rgba(0,200,83,0.4)' : 'rgba(204,34,0,0.35)' }}>
            <div style={{ marginBottom:'12px' }}>
              <UMLBadge type="extend" label="Visualizar resultados" />
            </div>
            <div style={{ fontSize:'42px', marginBottom:'12px' }}>{result.won ? '🎉' : '😔'}</div>
            <div style={{ display:'inline-flex', gap:'10px', justifyContent:'center', marginBottom:'16px' }}>
              <div style={{
                background: result.color==='red'?'#6e0000':result.color==='green'?'#155c1f':'#111',
                border:'2px solid var(--casino-gold)', borderRadius:'8px', padding:'11px 18px', textAlign:'center'
              }}>
                <div className="font-cinzel" style={{ fontSize:'26px', fontWeight:900 }}>{result.number}</div>
                <div style={{ fontSize:'10px', color:'var(--casino-muted)', textTransform:'uppercase' }}>
                  {result.color==='red'?'Rojo':result.color==='black'?'Negro':'Verde'}
                </div>
              </div>
            </div>
            <div className="font-cinzel" style={{ fontSize:'20px', color: result.won ? 'var(--casino-green)' : '#FF5533', marginBottom:'8px' }}>
              {result.won ? `¡Ganaste S/ ${result.gain.toFixed(2)}!` : `Perdiste S/ ${result.bet.toFixed(2)}`}
            </div>
            <p style={{ color:'var(--casino-muted)', fontSize:'13px', marginBottom:'22px' }}>
              Apuesta: {result.type} · Nuevo saldo: S/ {result.nuevoSaldo.toFixed(2)}
            </p>
            <div style={{ display:'flex', gap:'11px', justifyContent:'center' }}>
              <button className="btn-gold" onClick={() => { setResult(null); setBetAmount(''); }}>
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
