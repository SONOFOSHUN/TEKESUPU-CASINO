import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--casino-dark)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '24px'
    }}>
      <div style={{ fontSize: '64px', marginBottom: '24px' }}>♠</div>
      <h1 className="font-cinzel" style={{ fontSize: '80px', fontWeight: 900, color: 'var(--casino-gold)', lineHeight: 1, marginBottom: '16px' }}>
        404
      </h1>
      <p className="font-cinzel" style={{ fontSize: '20px', marginBottom: '12px' }}>
        Página no encontrada
      </p>
      <p style={{ color: 'var(--casino-muted)', fontSize: '14px', marginBottom: '32px', maxWidth: '400px', lineHeight: 1.6 }}>
        La página que buscas no existe o fue movida.
      </p>
      <Link href="/">
        <button className="btn-gold">Volver al inicio</button>
      </Link>
    </div>
  )
}
