'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import UMLBadge from '@/components/UMLBadge'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--casino-dark)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(60px,8vw,80px) 16px',
    }}>
      <div className="card-casino animate-fadeIn" style={{ width: '100%', maxWidth: '420px', padding: 'clamp(24px,5vw,40px)' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="font-cinzel" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--casino-gold)', marginBottom: '8px' }}>
            ♠ Iniciar Sesión ♠
          </div>
          <p style={{ color: 'var(--casino-muted)', fontSize: '14px' }}>
            Accede a tu cuenta de Tekesupu
          </p>
        </div>

        {/* UML badge */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
          <UMLBadge type="include" label="Validar credenciales" />
        </div>

        {/* Loading state */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <span className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--casino-muted)', fontSize: '14px' }}>
              Verificando credenciales...
            </p>
          </div>
        ) : (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {error && (
              <div style={{
                background: 'rgba(204,34,0,0.1)',
                border: '1px solid rgba(204,34,0,0.3)',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '13px',
                color: '#FF5533',
              }}>
                {error}
              </div>
            )}

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

            <div>
              <label style={{ fontSize: '11px', color: 'var(--casino-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '7px' }}>
                Contraseña
              </label>
              <input
                className="input-casino"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ textAlign: 'right', marginTop: '-8px' }}>
              <Link href="/auth/recuperar" style={{ fontSize: '12px', color: 'var(--casino-muted)' }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              className="btn-gold"
              type="submit"
              style={{ width: '100%', marginTop: '8px' }}
              disabled={!email || !password}
            >
              Ingresar
            </button>

            <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--casino-muted)' }}>
              ¿No tienes cuenta?{' '}
              <Link href="/auth/registro" style={{ color: 'var(--casino-gold)', cursor: 'pointer' }}>
                Regístrate
              </Link>
            </p>

            <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--casino-border)' }}>
              <Link href="/auth/admin-login">
                <span style={{ fontSize: '11px', color: 'var(--casino-muted)', cursor: 'pointer', letterSpacing: '0.5px' }}>
                  🔐 Acceso Administrador
                </span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
