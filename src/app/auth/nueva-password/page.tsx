'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NuevaPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setMsg('Error al actualizar. Intenta de nuevo.')
    } else {
      setMsg('¡Contraseña actualizada! Redirigiendo...')
      setTimeout(() => router.push('/auth/login'), 2000)
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--casino-dark)', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 20px' }}>
      <div className="card-casino animate-fadeIn" style={{ width:'100%', maxWidth:'400px', padding:'40px' }}>
        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          <div className="font-cinzel" style={{ fontSize:'20px', color:'var(--casino-gold)', marginBottom:'8px' }}>
            🔑 Nueva Contraseña
          </div>
          <p style={{ color:'var(--casino-muted)', fontSize:'14px' }}>Ingresa tu nueva contraseña</p>
        </div>
        {msg && (
          <div style={{ background:'rgba(0,200,83,0.1)', border:'1px solid rgba(0,200,83,0.28)', borderRadius:'8px', padding:'12px', marginBottom:'16px', fontSize:'13px', color:'var(--casino-green)', textAlign:'center' }}>
            {msg}
          </div>
        )}
        <form onSubmit={handleUpdate} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          <div>
            <label style={{ fontSize:'11px', color:'var(--casino-muted)', textTransform:'uppercase', letterSpacing:'0.8px', display:'block', marginBottom:'7px' }}>
              Nueva Contraseña
            </label>
            <input className="input-casino" type="password" placeholder="••••••••" minLength={6}
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button className="btn-gold" type="submit" style={{ width:'100%' }} disabled={loading || !password}>
            {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
