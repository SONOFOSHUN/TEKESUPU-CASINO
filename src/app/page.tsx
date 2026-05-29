import Link from 'next/link'

export default function LandingPage() {
  return (
    <div style={{ minHeight:'100vh', background:'var(--casino-dark)' }}>

      {/* Navbar */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        height:'60px', background:'rgba(7,7,15,0.92)', backdropFilter:'blur(20px)',
        borderBottom:'1px solid var(--casino-border)',
        display:'flex', alignItems:'center', padding:'0 20px', justifyContent:'space-between'
      }}>
        <span className="font-cinzel" style={{ fontSize:'16px', fontWeight:700, color:'var(--casino-gold)', letterSpacing:'1px' }}>
          ♠ TEKESUPU ♣
        </span>
        <div style={{ display:'flex', gap:'8px' }}>
          <Link href="/auth/login">
            <button className="btn-outline-casino" style={{ padding:'7px 14px', fontSize:'11px' }}>Login</button>
          </Link>
          <Link href="/auth/registro">
            <button className="btn-gold" style={{ padding:'7px 14px', fontSize:'11px' }}>Registrarse</button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        minHeight:'100vh',
        background:'radial-gradient(ellipse at 25% 50%, rgba(139,0,0,0.14) 0%, transparent 55%), radial-gradient(ellipse at 75% 20%, rgba(201,162,39,0.07) 0%, transparent 50%)',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        textAlign:'center', padding:'80px 20px 60px'
      }}>
        <span className="badge-gold" style={{ marginBottom:'20px', display:'inline-block', fontSize:'11px' }}>
          ♠ Casino con Juego Responsable ♥
        </span>
        <h1 className="font-cinzel" style={{
          fontSize:'clamp(28px, 8vw, 72px)',
          fontWeight:900, lineHeight:1.15, marginBottom:'20px'
        }}>
          La Experiencia Premium<br/>
          <span style={{ color:'var(--casino-gold)', textShadow:'0 0 40px rgba(201,162,39,0.35)' }}>
            de Casino Virtual
          </span>
        </h1>
        <p style={{ fontSize:'clamp(14px, 4vw, 17px)', color:'var(--casino-muted)', maxWidth:'480px', marginBottom:'36px', lineHeight:1.75, padding:'0 8px' }}>
          Acceso exclusivo para usuarios{' '}
          <strong style={{ color:'var(--casino-cream)' }}>verificados sin registros de ludopatía</strong>.
        </p>
        <div style={{ display:'flex', gap:'10px', justifyContent:'center', flexWrap:'wrap', marginBottom:'48px' }}>
          <Link href="/auth/registro">
            <button className="btn-gold" style={{ fontSize:'13px', padding:'13px 28px' }}>Crear Cuenta Gratis</button>
          </Link>
          <Link href="/auth/login">
            <button className="btn-outline-casino" style={{ fontSize:'13px', padding:'13px 28px' }}>Iniciar Sesión</button>
          </Link>
        </div>
        <div style={{ display:'flex', gap:'20px', justifyContent:'center', flexWrap:'wrap' }}>
          {['🛡️ Anti-Ludopatía','🎰 Saldo Virtual','📊 Límites Propios'].map(f => (
            <span key={f} style={{ color:'var(--casino-muted)', fontSize:'12px' }}>{f}</span>
          ))}
        </div>
      </div>

      {/* Cómo funciona */}
      <div style={{ maxWidth:'1080px', margin:'0 auto', padding:'60px 20px' }}>
        <h2 className="font-cinzel" style={{ textAlign:'center', fontSize:'clamp(22px,5vw,32px)', marginBottom:'12px' }}>
          ¿Cómo funciona la <span style={{ color:'var(--casino-gold)' }}>verificación?</span>
        </h2>
        <p style={{ textAlign:'center', color:'var(--casino-muted)', marginBottom:'40px', fontSize:'14px', padding:'0 8px' }}>
          Verificamos que no tengas registros de ludopatía antes de crear tu cuenta
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'16px', marginBottom:'60px' }}>
          {[
            { n:'01', icon:'📝', title:'Te registras', desc:'Ingresas tus datos personales incluyendo tu DNI.' },
            { n:'02', icon:'🔍', title:'Verificamos tu DNI', desc:'Consultamos el sistema nacional SERNAP en tiempo real.' },
            { n:'03', icon:'✅', title:'Accedes al casino', desc:'Sin registros de ludopatía, obtienes acceso completo.' },
          ].map(s => (
            <div key={s.n} className="card-casino" style={{ padding:'24px', textAlign:'center' }}>
              <div style={{ fontSize:'32px', marginBottom:'12px' }}>{s.icon}</div>
              <div className="font-cinzel" style={{ color:'var(--casino-gold)', fontSize:'11px', letterSpacing:'2px', marginBottom:'8px' }}>PASO {s.n}</div>
              <div className="font-cinzel" style={{ fontSize:'15px', marginBottom:'10px' }}>{s.title}</div>
              <p style={{ color:'var(--casino-muted)', fontSize:'13px', lineHeight:1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Juegos */}
        <h2 className="font-cinzel" style={{ textAlign:'center', fontSize:'clamp(22px,5vw,32px)', marginBottom:'36px' }}>
          Nuestros <span style={{ color:'var(--casino-gold)' }}>Juegos</span>
        </h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'16px', marginBottom:'60px' }}>
          {[
            { icon:'🎡', name:'Ruleta', desc:'Apuesta a números, colores y sectores con rueda animada.' },
            { icon:'🎰', name:'Tragamonedas', desc:'Gira los rodillos y busca combinaciones ganadoras.' },
            { icon:'⚽', name:'Apuestas Deportivas', desc:'Eventos deportivos con cuotas de Liga 1 y La Liga.' },
          ].map(g => (
            <div key={g.name} className="card-casino" style={{ padding:'24px', textAlign:'center' }}>
              <div style={{ fontSize:'40px', marginBottom:'12px' }}>{g.icon}</div>
              <div className="font-cinzel" style={{ fontSize:'16px', marginBottom:'10px', color:'var(--casino-gold)' }}>{g.name}</div>
              <p style={{ color:'var(--casino-muted)', fontSize:'13px', lineHeight:1.6 }}>{g.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="card-casino" style={{ padding:'40px 24px', textAlign:'center', background:'linear-gradient(135deg, rgba(201,162,39,0.06), rgba(139,0,0,0.06))' }}>
          <h2 className="font-cinzel" style={{ fontSize:'clamp(18px,4vw,26px)', marginBottom:'14px' }}>
            ¿Listo para jugar <span style={{ color:'var(--casino-gold)' }}>responsablemente</span>?
          </h2>
          <p style={{ color:'var(--casino-muted)', marginBottom:'24px', fontSize:'14px' }}>
            Recibe S/ 1,000 de saldo virtual al registrarte.
          </p>
          <Link href="/auth/registro">
            <button className="btn-gold" style={{ fontSize:'13px', padding:'13px 32px' }}>Comenzar Ahora</button>
          </Link>
        </div>
      </div>

      {/* Responsabilidad */}
      <div style={{ background:'var(--casino-dark2)', padding:'50px 20px', textAlign:'center' }}>
        <div style={{ maxWidth:'560px', margin:'0 auto' }}>
          <div style={{ fontSize:'36px', marginBottom:'14px' }}>🛡️</div>
          <h2 className="font-cinzel" style={{ fontSize:'clamp(18px,4vw,24px)', marginBottom:'14px' }}>
            Compromiso con el <span style={{ color:'var(--casino-gold)' }}>Juego Responsable</span>
          </h2>
          <p style={{ color:'var(--casino-muted)', fontSize:'13px', lineHeight:1.8, marginBottom:'20px' }}>
            Tekesupu Casino es una plataforma educativa de entretenimiento virtual. No involucra dinero real. Todos los saldos son virtuales y promovemos el entretenimiento responsable.
          </p>
          <div style={{ display:'flex', gap:'8px', justifyContent:'center', flexWrap:'wrap' }}>
            {['Sin dinero real','Verificación anti-ludopatía','Límites configurables'].map(f => (
              <span key={f} className="badge-gold" style={{ fontSize:'10px' }}>{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop:'1px solid var(--casino-border)', padding:'28px 20px', textAlign:'center' }}>
        <div className="font-cinzel" style={{ color:'var(--casino-gold)', fontSize:'14px', marginBottom:'6px' }}>♠ TEKESUPU ♣</div>
        <p style={{ color:'var(--casino-muted)', fontSize:'11px' }}>© 2026 Tekesupu Casino. Solo para fines educativos.</p>
      </footer>
    </div>
  )
}
