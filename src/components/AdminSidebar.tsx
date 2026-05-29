'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/admin/estadisticas', label: 'Estadísticas', icon: '◆' },
  { href: '/admin/usuarios', label: 'Gestión Usuarios', icon: '◆' },
  { href: '/admin/reportes', label: 'Generar Reportes', icon: '◆' },
  { href: '/admin/crecimiento', label: 'Crecimiento', icon: '◆' },
  { href: '/admin/juegos', label: 'Uso de Juegos', icon: '◆' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .admin-sidebar { display: none !important; }
        }
      `}</style>
      <div className="admin-sidebar" style={{
        width: '210px',
        minHeight: '100vh',
        background: 'var(--casino-dark2)',
        borderRight: '1px solid var(--casino-border)',
        padding: '20px 10px',
        paddingTop: '80px',
        flexShrink: 0,
      }}>
      <p className="font-cinzel text-casino-muted text-xs uppercase tracking-widest mb-3 px-3">
        Panel Admin
      </p>
      <div className="flex flex-col gap-1">
        {links.map(link => (
          <Link key={link.href} href={link.href}>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-all ${
              pathname === link.href
                ? 'text-casino-gold bg-casino-gold/10'
                : 'text-casino-muted hover:text-casino-cream hover:bg-white/5'
            }`}>
              <span style={{ color: pathname === link.href ? 'var(--casino-gold)' : 'rgba(255,255,255,0.3)', fontSize: '8px' }}>{link.icon}</span>
              <span>{link.label}</span>
            </div>
          </Link>
        ))}
        <div style={{ borderTop: '1px solid var(--casino-border)', marginTop: '16px', paddingTop: '16px' }}>
          <Link href="/dashboard">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-casino-muted hover:text-casino-cream hover:bg-white/5 cursor-pointer transition-all">
              👥 Vista usuario
            </div>
          </Link>
        </div>
      </div>
    </div>
    </>
  )
}
