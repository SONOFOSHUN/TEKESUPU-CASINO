'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import UMLBadge from '@/components/UMLBadge'

export default function AdminLoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', adminCode: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'form' | 'verifying'>('form')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setStep('verifying')

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (authError) {
        setError('Credenciales incorrectas')
        setStep('form')
        setLoading(false)
        return
      }

      const res = await fetch('/api/admin-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminCode: form.adminCode }),
      })

      const data = await res.json()

      if (!res.ok) {
        await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined)
        setError(data.error || 'Error de acceso')
        setStep('form')
        setLoading(false)
        return
      }

      router.push('/admin/estadisticas')
      router.refresh()

    } catch {
      setError('Error de conexión')
      setStep('form')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at center, rgba(139,0,0,0.12) 0%, var(--casino-dark) 60%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 20px'
    }}>
      <div className="card-casino animate-fadeIn" style={{ width: '100%', maxWidth: '420px', padding: 'clamp(28px,5vw,44px)', borderColor: 'rgba(139,0,0,0.4)' }}>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔐</div>
          <div className="font-cinzel" style={{ fontSize: '20px', fontWeight: 700, color: '#FF5533', marginBottom: '8px' }}>
            Acceso Administrador
          </div>
          <p style={{ color: 'var(--casino-muted)', fontSize: '13px' }}>
            Panel de control — Solo personal autorizado
          </p>
        </div>

        {step === 'verifying' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ marginBottom: '16px' }}>
              <UMLBadge type="include" label="Validar credenciales admin" />
            </div>
            <span className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--casino-muted)', fontSize: '14px' }}>
              Verificando acceso...
            </p>
          </div>
        ) : (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {error && (
              <div style={{ background: 'rgba(204,34,0,0.1)', border: '1px solid rgba(204,34,0,0.3)', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#FF5533' }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ fontSize: '11px', color: 'var(--casino-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '7px' }}>
                Email
              </label>
              <input className="input-casino" type="email" placeholder="admin@tekesupu.pe"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--casino-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '7px' }}>
                Contraseña
              </label>
              <input className="input-casino" type="password" placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--casino-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '7px' }}>
                Código de Administrador
              </label>
              <input className="input-casino" type="password" placeholder="Código secreto"
                value={form.adminCode} onChange={e => setForm({ ...form, adminCode: e.target.value })} required />
            </div>

            <button className="btn-gold" type="submit" style={{ width: '100%', marginTop: '8px', background: 'linear-gradient(135deg, #8B0000, #CC2200)' }}
              disabled={loading || !form.email || !form.password || !form.adminCode}>
              Acceder al Panel
            </button>

            <Link href="/auth/login">
              <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--casino-muted)', cursor: 'pointer', marginTop: '4px' }}>
                ← Volver al login de usuarios
              </p>
            </Link>
          </form>
        )}

        <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(139,0,0,0.08)', border: '1px solid rgba(139,0,0,0.2)', borderRadius: '8px', fontSize: '11px', color: 'var(--casino-muted)', textAlign: 'center', lineHeight: 1.6 }}>
          ⚠️ Este acceso queda registrado. El uso no autorizado está prohibido.
        </div>
      </div>
    </div>
  )
}
