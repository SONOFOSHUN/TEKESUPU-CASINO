'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RecuperarPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/nueva-password`,
    })
    if (error) {
      setError('Error al enviar el email. Verifica que esté registrado.')
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--casino-dark)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 24px'
    }}>
      <div className="card-casino animate-fadeIn" style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
        {!sent ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div className="font-cinzel" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--casino-gold)', marginBottom: '8px' }}>
                🔑 Recuperar Contraseña
              </div>
              <p style={{ color: 'var(--casino-muted)', fontSize: '14px' }}>
                Te enviaremos un link para restablecer tu contraseña
              </p>
            </div>
            {error && (
              <div style={{ background: 'rgba(204,34,0,0.1)', border: '1px solid rgba(204,34,0,0.3)', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#FF5533', marginBottom: '16px' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleRecuperar} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--casino-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '7px' }}>
                  Email
                </label>
                <input
                  className="input-casino"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <button className="btn-gold" type="submit" style={{ width: '100%' }} disabled={loading || !email}>
                {loading ? 'Enviando...' : 'Enviar Link de Recuperación'}
              </button>
              <Link href="/auth/login">
                <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--casino-muted)', cursor: 'pointer' }}>
                  ← Volver al login
                </p>
              </Link>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center' }} className="animate-fadeIn">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
            <div className="font-cinzel" style={{ fontSize: '18px', color: 'var(--casino-green)', marginBottom: '12px' }}>
              Email enviado
            </div>
            <p style={{ color: 'var(--casino-muted)', fontSize: '14px', lineHeight: 1.65, marginBottom: '24px' }}>
              Revisa tu bandeja de entrada y haz clic en el link para restablecer tu contraseña.
            </p>
            <Link href="/auth/login">
              <button className="btn-outline-casino">Volver al login</button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
