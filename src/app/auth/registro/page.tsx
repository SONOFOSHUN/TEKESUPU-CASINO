'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import UMLBadge from '@/components/UMLBadge'

type Step = 'form' | 'checking' | 'blocked' | 'success'

export default function RegistroPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('form')
  const [form, setForm] = useState({ nombre: '', email: '', dni: '', password: '' })
  const [error, setError] = useState('')

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!/^\d{8}$/.test(form.dni)) {
      setError('El DNI debe tener exactamente 8 dígitos numéricos.')
      setStep('form')
      return
    }

    setStep('checking')

    try {
      // Consultar API de verificación de ludopatía
      const res = await fetch('/api/verificar-ludopatia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni: form.dni }),
      })

      const data = await res.json()

      if (data.tiene_ludopatia) {
        setStep('blocked')
        return
      }

      // Sin registro de ludopatía → registrar en Supabase Auth
      const supabase = createClient()
      const { error, data: signUpData } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            nombre: form.nombre,
            dni: form.dni,
            tiene_ludopatia: false,
            rol: 'usuario',
          }
        }
      })

      if (error) {
        setError(error.message)
        setStep('form')
        return
      }

      // Crear fila en profiles y limites_usuario inmediatamente
      if (signUpData?.user) {
        await supabase.from('profiles').insert({
          id: signUpData.user.id,
          nombre: form.nombre,
          dni: form.dni,
          rol: 'usuario',
          tiene_ludopatia: false,
          saldo_virtual: 1000,
        })
        await supabase.from('limites_usuario').insert({
          usuario_id: signUpData.user.id,
          limite_diario: 500,
          limite_semanal: 2000,
          limite_mensual: 6000,
          limite_sesion_min: 60,
        })
      }

      setStep('success')
      await new Promise(r => setTimeout(r, 1500))
      router.push('/dashboard')
      router.refresh()

    } catch {
      setError('Error de conexión. Intenta de nuevo.')
      setStep('form')
    }
  }

  const stepNumber = step === 'form' ? 1 : step === 'checking' ? 2 : 3

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--casino-dark)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(60px,8vw,80px) 16px',
    }}>
      <div className="card-casino animate-fadeIn" style={{ width: '100%', maxWidth: '460px', padding: 'clamp(24px,5vw,40px)' }}>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '32px' }}>
          {[{ n: 1, l: 'Datos' }, { n: 2, l: 'Verificación' }, { n: 3, l: 'Resultado' }].map((s, i) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '26px', height: '26px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700, fontFamily: 'Cinzel',
                background: stepNumber >= s.n ? 'var(--casino-gold)' : 'rgba(255,255,255,0.06)',
                color: stepNumber >= s.n ? '#000' : 'var(--casino-muted)',
              }}>
                {s.n}
              </div>
              <span style={{ fontSize: '11px', color: stepNumber >= s.n ? 'var(--casino-cream)' : 'var(--casino-muted)' }}>
                {s.l}
              </span>
              {i < 2 && <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '12px' }}>→</span>}
            </div>
          ))}
        </div>

        {/* PASO 1: Formulario */}
        {step === 'form' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div className="font-cinzel" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--casino-gold)', marginBottom: '8px' }}>
                ♦ Crear Cuenta ♦
              </div>
              <p style={{ color: 'var(--casino-muted)', fontSize: '14px' }}>Únete a Tekesupu Casino</p>
            </div>

            {error && (
              <div style={{ background: 'rgba(204,34,0,0.1)', border: '1px solid rgba(204,34,0,0.3)', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#FF5533', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleRegistro} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { key: 'nombre', label: 'Nombre completo', placeholder: 'Carlos Mendoza', type: 'text' },
                { key: 'email', label: 'Email', placeholder: 'tu@email.com', type: 'email' },
                { key: 'dni', label: 'DNI', placeholder: 'Ej: 87654321 (empieza con 1 = bloqueado demo)', type: 'text' },
                { key: 'password', label: 'Contraseña', placeholder: '••••••••', type: 'password' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: '11px', color: 'var(--casino-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '7px' }}>
                    {f.label}
                  </label>
                  <input
                    className="input-casino"
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    required
                  />
                </div>
              ))}
              <button
                className="btn-gold"
                type="submit"
                style={{ width: '100%', marginTop: '8px' }}
                disabled={!form.nombre || !form.email || !form.dni || !form.password}
              >
                Registrarse
              </button>
              <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--casino-muted)' }}>
                ¿Ya tienes cuenta?{' '}
                <Link href="/auth/login" style={{ color: 'var(--casino-gold)' }}>
                  Inicia sesión
                </Link>
              </p>
            </form>
          </>
        )}

        {/* PASO 2: Verificando ludopatía */}
        {step === 'checking' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ marginBottom: '20px' }}>
              <UMLBadge type="include" label="Verificar registro de ludopatía" />
            </div>
            <span className="spinner" style={{ margin: '0 auto 20px' }} />
            <div className="font-cinzel" style={{ fontSize: '15px', marginBottom: '8px' }}>
              Consultando SERNAP
            </div>
            <p style={{ color: 'var(--casino-muted)', fontSize: '13px' }}>
              Verificando registros de ludopatía en el sistema nacional...
            </p>
          </div>
        )}

        {/* PASO 3a: Bloqueado */}
        {step === 'blocked' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }} className="animate-fadeIn">
            <div style={{ fontSize: '44px', marginBottom: '14px' }}>🚫</div>
            <div className="font-cinzel" style={{ fontSize: '18px', color: '#FF5533', marginBottom: '12px' }}>
              Registro Bloqueado
            </div>
            <div style={{ background: 'rgba(204,34,0,0.1)', border: '1px solid rgba(204,34,0,0.28)', borderRadius: '8px', padding: '18px', marginBottom: '22px', fontSize: '13px', color: '#FF7755', lineHeight: 1.65 }}>
              Se encontró un registro de ludopatía activo asociado a tu DNI en el sistema SERNAP.
              No es posible crear una cuenta en esta plataforma.
            </div>
            <p style={{ color: 'var(--casino-muted)', fontSize: '12px', marginBottom: '20px' }}>
              ¿Crees que es un error? Contacta:{' '}
              <strong style={{ color: 'var(--casino-gold)' }}>soporte@tekesupu.pe</strong>
            </p>
            <button
              className="btn-outline-casino"
              onClick={() => { setStep('form'); setForm({ nombre: '', email: '', dni: '', password: '' }) }}
            >
              Volver a intentar
            </button>
          </div>
        )}

        {/* PASO 3b: Éxito */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }} className="animate-fadeIn">
            <div style={{ fontSize: '44px', marginBottom: '12px' }}>✅</div>
            <div className="font-cinzel" style={{ fontSize: '18px', color: 'var(--casino-green)', marginBottom: '8px' }}>
              ¡Registro Exitoso!
            </div>
            <p style={{ color: 'var(--casino-muted)' }}>Redirigiendo a tu dashboard...</p>
          </div>
        )}

      </div>
    </div>
  )
}
