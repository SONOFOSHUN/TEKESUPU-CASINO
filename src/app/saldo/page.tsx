'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Apuesta } from '@/lib/types'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import UMLBadge from '@/components/UMLBadge'

export default function SaldoPage() {
  const router = useRouter()
  const { profile, loading: authLoading, isAuthenticated } = useAuth()
  const [apuestas, setApuestas] = useState<Apuesta[]>([])
  const [loading, setLoading] = useState(true)
  const [depositAmt, setDepositAmt] = useState('')
  const [msg, setMsg] = useState('')
  const [saldo, setSaldo] = useState(0)

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

      setSaldo(Number(profile.saldo_virtual))

      const { data: apuestasData } = await supabase
        .from('apuestas')
        .select('*')
        .eq('usuario_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (apuestasData) setApuestas(apuestasData)
      setLoading(false)
    }
    fetchData()
  }, [profile, authLoading, isAuthenticated, router])

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmt)
    if (!amt || amt <= 0 || !profile) return

    const res = await fetch('/api/saldo/recargar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monto: amt }),
    })
    const data = await res.json()

    if (res.ok) {
      setSaldo(data.nuevoSaldo)
      setMsg(`✅ +S/ ${amt.toFixed(2)} añadidos a tu saldo real`)
      setDepositAmt('')
      setTimeout(() => setMsg(''), 3000)
    } else {
      setMsg(`❌ ${data.error || 'Error al recargar'}`)
      setTimeout(() => setMsg(''), 3000)
    }
  }

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--casino-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="spinner" />
      </div>
    )
  }

  if (!profile) return null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--casino-dark)' }}>
      <Navbar />
      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: 'clamp(70px,10vw,88px) 16px 48px' }}>

        <h1 className="font-cinzel" style={{ fontSize: '26px', marginBottom: '8px' }}>💰 Saldo Real</h1>
        <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UMLBadge type="include" label="Verificar saldo" />
          <span style={{ color: 'var(--casino-muted)', fontSize: '13px' }}>— Gestiona tu saldo y movimientos</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginBottom: '28px' }}>

          {/* Balance */}
          <div className="card-casino" style={{ padding: '40px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(201,162,39,0.09), rgba(201,162,39,0.02))' }}>
            <div style={{ fontSize: '38px', marginBottom: '14px' }}>💰</div>
            <div className="font-cinzel" style={{ fontSize: '40px', fontWeight: 900, color: 'var(--casino-gold)', marginBottom: '8px' }}>
              S/ {saldo.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ color: 'var(--casino-muted)', fontSize: '13px' }}>Saldo disponible</div>
          </div>

          {/* Recarga */}
          <div className="card-casino" style={{ padding: '28px' }}>
            <div className="font-cinzel" style={{ fontSize: '14px', marginBottom: '18px', color: 'var(--casino-gold)' }}>
              Recargar Saldo Real
            </div>
            <div style={{ display: 'flex', gap: '7px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {[50, 100, 200, 500].map(a => (
                <button key={a} className="btn-outline-casino" style={{ padding: '7px 14px', fontSize: '12px' }}
                  onClick={() => setDepositAmt(String(a))}>
                  S/ {a}
                </button>
              ))}
            </div>
            <input
              className="input-casino"
              type="number"
              placeholder="Monto personalizado"
              value={depositAmt}
              onChange={e => setDepositAmt(e.target.value)}
              style={{ marginBottom: '10px' }}
            />
            {msg && (
              <div style={{ background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.28)', borderRadius: '8px', padding: '9px 13px', fontSize: '13px', color: 'var(--casino-green)', marginBottom: '10px' }}>
                {msg}
              </div>
            )}
            <button className="btn-gold" style={{ width: '100%' }} onClick={handleDeposit}
              disabled={!depositAmt || parseFloat(depositAmt) <= 0}>
              Recargar
            </button>
          </div>
        </div>

        {/* Movimientos */}
        <h2 className="font-cinzel" style={{ fontSize: '18px', marginBottom: '14px' }}>
          Movimientos Recientes
        </h2>

        {apuestas.length === 0 ? (
          <div className="card-casino" style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--casino-muted)', fontSize: '14px' }}>No hay movimientos aún.</p>
          </div>
        ) : (
          <div className="card-casino" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="table-casino">
              <thead>
                <tr>
                  <th>Juego</th>
                  <th>Descripción</th>
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
                        {a.resultado === 'gano' ? `+S/ ${Number(a.ganancia).toFixed(2)}` : `-S/ ${Number(a.monto).toFixed(2)}`}
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
      </div>
    </div>
  )
}
