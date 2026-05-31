'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NuevaPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [msg, setMsg] = useState('')
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    // Supabase envía el token de recuperación en el hash de la URL.
    // Hay que escuchar el evento PASSWORD_RECOVERY antes de permitir updateUser.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleUpdate = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    if (password.length < 6) {
      setIsError(true)
      setMsg('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setLoading(true)
    setMsg('')
    setIsError(false)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setIsError(true)
      setMsg('Error al actualizar. Intenta de nuevo.')
    } else {
      setIsError(false)
      setMsg('¡Contraseña actualizada! Redirigiendo...')
      setTimeout(() => router.push('/auth/login'), 2000)
    }
    setLoading(false)
  }

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--casino-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--casino-muted)', fontSize: '14px' }}>Verificando enlace de recuperación...</p>
          <p style={{ color: 'var(--casino-muted)', fontSize: '12px', marginTop: '8px' }}>
            Si este mensaje no desaparece, el enlace puede haber expirado.{' '}
            <a href="/auth/recuperar" style={{ color: 'var(--casino-gold)' }}>Solicitar uno nuevo</a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--casino-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
      <div className="card-casino animate-fadeIn" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div className="font-cinzel" style={{ fontSize: '20px', color: 'var(--casino-gold)', marginBottom: '8px' }}>
            🔑 Nueva Contraseña
          </div>
          <p style={{ color: 'var(--casino-muted)', fontSize: '14px' }}>Ingresa tu nueva contraseña</p>
        </div>
        {msg && (
          <div style={{
            background: isError ? 'rgba(204,34,0,0.1)' : 'rgba(0,200,83,0.1)',
            border: `1px solid ${isError ? 'rgba(204,34,0,0.28)' : 'rgba(0,200,83,0.28)'}`,
            borderRadius: '8px', padding: '12px', marginBottom: '16px',
            fontSize: '13px', color: isError ? '#FF5533' : 'var(--casino-green)', textAlign: 'center'
          }}>
            {msg}
          </div>
        )}
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--casino-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '7px' }}>
              Nueva Contraseña
            </label>
            <input className="input-casino" type="password" placeholder="••••••••" minLength={6}
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button className="btn-gold" type="submit" style={{ width: '100%' }} disabled={loading || !password}>
            {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
