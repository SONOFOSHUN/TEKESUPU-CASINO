'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'

const userLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/saldo', label: 'Saldo' },
  { href: '/juegos/ruleta', label: 'Ruleta' },
  { href: '/juegos/tragamonedas', label: 'Slots' },
  { href: '/juegos/deportes', label: 'Deportes' },
  { href: '/historial', label: 'Historial' },
  { href: '/limites', label: 'Límites' },
]

const adminLinks = [
  { href: '/admin/estadisticas', label: 'Estadísticas' },
  { href: '/admin/reportes', label: 'Reportes' },
  { href: '/admin/crecimiento', label: 'Crecimiento' },
  { href: '/admin/juegos', label: 'Uso de Juegos' },
]

export default function Navbar() {
  const { profile } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  const isAdmin = profile?.rol === 'admin' || profile?.rol === 'inversor'
  const links = isAdmin ? adminLinks : userLinks

  return (
    <>
      <style>{`
        .nav-links-desktop { display: flex; align-items: center; gap: 2px; }
        .nav-hamburger { display: none; }
        .nav-mobile-menu { display: none; }
        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .nav-hamburger { display: flex !important; }
          .nav-mobile-menu.open { display: flex !important; }
        }
      `}</style>

      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: 'rgba(7,7,15,0.96)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--casino-border)',
        height: '60px', display: 'flex', alignItems: 'center',
        padding: '0 20px', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link href={profile ? (isAdmin ? '/admin/estadisticas' : '/dashboard') : '/'}>
          <span className="font-cinzel" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--casino-gold)', letterSpacing: '1px', cursor: 'pointer' }}>
            ♠ TEKESUPU ♣
          </span>
        </Link>

        {/* Desktop links */}
        {!profile ? (
          <div className="nav-links-desktop" style={{ gap: '8px' }}>
            <Link href="/auth/login">
              <button className="btn-outline-casino" style={{ padding: '7px 16px', fontSize: '11px' }}>Login</button>
            </Link>
            <Link href="/auth/registro">
              <button className="btn-gold" style={{ padding: '7px 16px', fontSize: '11px' }}>Registrarse</button>
            </Link>
          </div>
        ) : (
          <>
            <div className="nav-links-desktop">
              {links.map(link => (
                <Link key={link.href} href={link.href}>
                  <span style={{
                    padding: '6px 10px', borderRadius: '6px', fontSize: '11px',
                    fontFamily: 'Cinzel, serif', cursor: 'pointer', transition: 'all 0.2s',
                    color: pathname === link.href ? 'var(--casino-gold)' : 'var(--casino-muted)',
                    background: pathname === link.href ? 'rgba(201,162,39,0.1)' : 'transparent',
                    display: 'inline-block',
                  }}>
                    {link.label}
                  </span>
                </Link>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--casino-gold), #9A7A1E)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, color: '#000', fontFamily: 'Cinzel', fontSize: '11px',
                }}>
                  {profile.nombre.substring(0, 2).toUpperCase()}
                </div>
                <button onClick={handleLogout} className="btn-outline-casino" style={{ padding: '5px 12px', fontSize: '10px' }}>
                  Salir
                </button>
              </div>
            </div>

            {/* Hamburger button */}
            <button
              className="nav-hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'none', flexDirection: 'column', gap: '5px',
                background: 'none', border: 'none', cursor: 'pointer', padding: '8px',
              }}
            >
              <span style={{ display: 'block', width: '22px', height: '2px', background: menuOpen ? 'var(--casino-gold)' : 'var(--casino-cream)', transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
              <span style={{ display: 'block', width: '22px', height: '2px', background: 'var(--casino-cream)', transition: 'all 0.2s', opacity: menuOpen ? 0 : 1 }} />
              <span style={{ display: 'block', width: '22px', height: '2px', background: menuOpen ? 'var(--casino-gold)' : 'var(--casino-cream)', transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
            </button>
          </>
        )}
      </nav>

      {/* Mobile menu overlay */}
      {profile && menuOpen && (
        <div
          className="nav-mobile-menu open"
          style={{
            position: 'fixed', top: '60px', left: 0, right: 0, zIndex: 199,
            background: 'rgba(7,7,15,0.98)', backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--casino-border)',
            flexDirection: 'column', padding: '16px',
            display: 'flex',
          }}
        >
          {/* User info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--casino-border)', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--casino-gold), #9A7A1E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#000', fontFamily: 'Cinzel', fontSize: '13px' }}>
              {profile.nombre.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-cinzel" style={{ fontSize: '13px', color: 'var(--casino-cream)' }}>{profile.nombre}</div>
              <div style={{ fontSize: '11px', color: 'var(--casino-muted)' }}>{profile.rol}</div>
            </div>
          </div>

          {/* Links */}
          {links.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
              <div style={{
                padding: '13px 12px', borderRadius: '8px', fontSize: '14px',
                fontFamily: 'Cinzel, serif', cursor: 'pointer', transition: 'all 0.2s',
                color: pathname === link.href ? 'var(--casino-gold)' : 'var(--casino-cream)',
                background: pathname === link.href ? 'rgba(201,162,39,0.1)' : 'transparent',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                {link.label}
              </div>
            </Link>
          ))}

          <button onClick={handleLogout} className="btn-outline-casino" style={{ width: '100%', marginTop: '16px' }}>
            Cerrar Sesión
          </button>
        </div>
      )}
    </>
  )
}
