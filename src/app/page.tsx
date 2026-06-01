import Link from 'next/link'

const FLOAT_SYMBOLS = [
  { sym: '♠', x: '4%',  delay: '0s',   dur: '18s', size: 56, opacity: 0.10 },
  { sym: '♣', x: '18%', delay: '4s',   dur: '22s', size: 36, opacity: 0.08 },
  { sym: '♥', x: '34%', delay: '1s',   dur: '16s', size: 64, opacity: 0.09 },
  { sym: '♦', x: '52%', delay: '7s',   dur: '24s', size: 44, opacity: 0.07 },
  { sym: '♠', x: '68%', delay: '2.5s', dur: '20s', size: 30, opacity: 0.08 },
  { sym: '♥', x: '83%', delay: '5.5s', dur: '14s', size: 52, opacity: 0.10 },
  { sym: '♣', x: '92%', delay: '9s',   dur: '26s', size: 38, opacity: 0.07 },
  { sym: '♦', x: '76%', delay: '12s',  dur: '19s', size: 26, opacity: 0.06 },
]

const TICKER_ITEMS = [
  '🎡  Ruleta Europea', '🎰  Tragamonedas HD', '⚽  Liga 1 Perú',
  '🏆  Champions League', '🛡️  Verificación SERNAP', '💰  Saldo Virtual Gratis',
  '📊  Límites Personalizados', '🔒  100% Seguro',
  '🎡  Ruleta Europea', '🎰  Tragamonedas HD', '⚽  Liga 1 Perú',
  '🏆  Champions League', '🛡️  Verificación SERNAP', '💰  Saldo Virtual Gratis',
  '📊  Límites Personalizados', '🔒  100% Seguro',
]

export default function LandingPage() {
  return (
    <>
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(110vh) rotate(0deg);   opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { transform: translateY(-10vh) rotate(540deg); opacity: 0; }
        }
        @keyframes scrollTicker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes heroGlow {
          0%,100% { opacity:.45; }
          50%      { opacity:.8; }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(32px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes cardHover {
          from { transform:translateY(0)   scale(1); }
          to   { transform:translateY(-8px) scale(1.02); }
        }
        @keyframes borderPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(200,0,0,0); }
          50%      { box-shadow: 0 0 24px 4px rgba(200,0,0,.35); }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes shimmerText {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes pulseDot {
          0%,100% { transform:scale(1); opacity:1; }
          50%      { transform:scale(1.4); opacity:.6; }
        }

        .landing-game-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(200,0,0,0.18);
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(.22,1,.36,1), box-shadow 0.3s, border-color 0.3s;
          position: relative;
        }
        .landing-game-card:hover {
          transform: translateY(-10px) scale(1.02);
          border-color: rgba(200,0,0,0.55);
          box-shadow: 0 24px 48px rgba(200,0,0,0.2), 0 0 0 1px rgba(200,0,0,0.25);
        }
        .landing-game-card .play-overlay {
          position:absolute; inset:0;
          background: rgba(180,0,0,0.0);
          display:flex; align-items:center; justify-content:center;
          opacity:0; transition: opacity 0.3s, background 0.3s;
        }
        .landing-game-card:hover .play-overlay {
          opacity:1; background: rgba(180,0,0,0.18);
        }

        .step-card {
          transition: transform 0.25s, box-shadow 0.25s;
          cursor: default;
        }
        .step-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 40px rgba(200,0,0,0.14);
        }
        .step-num {
          width:48px; height:48px; border-radius:50%;
          background: rgba(200,0,0,0.15);
          border: 1.5px solid rgba(200,0,0,0.4);
          display:flex; align-items:center; justify-content:center;
          font-family:'Cinzel',serif; font-size:16px; font-weight:700; color:#FF4444;
          margin:0 auto 16px;
          transition: background 0.25s, transform 0.25s;
        }
        .step-card:hover .step-num {
          background: linear-gradient(135deg,#CC0000,#8B0000);
          color:#fff; transform:scale(1.12);
        }

        .btn-red-land {
          background: linear-gradient(135deg,#CC0000,#8B0000);
          color:#fff;
          font-family:'Cinzel',serif; font-weight:700; font-size:13px;
          letter-spacing:1px; text-transform:uppercase;
          border:none; border-radius:8px; padding:13px 32px;
          cursor:pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(200,0,0,0.35);
        }
        .btn-red-land:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(200,0,0,0.55);
        }

        .btn-outline-land {
          background: transparent;
          color:#EDE0C4;
          font-family:'Cinzel',serif; font-weight:700; font-size:13px;
          letter-spacing:1px; text-transform:uppercase;
          border:1.5px solid rgba(200,0,0,0.45); border-radius:8px; padding:12px 32px;
          cursor:pointer;
          transition: border-color 0.2s, color 0.2s, transform 0.2s;
        }
        .btn-outline-land:hover {
          border-color:#CC0000; color:#FF5555; transform:translateY(-2px);
        }

        .feature-pill {
          display:inline-flex; align-items:center; gap:6px;
          background:rgba(200,0,0,0.08); border:1px solid rgba(200,0,0,0.22);
          border-radius:999px; padding:5px 14px; font-size:12px; color:#FF8888;
          transition: background 0.2s, border-color 0.2s;
        }
        .feature-pill:hover { background:rgba(200,0,0,0.14); border-color:rgba(200,0,0,0.4); }

        html { scroll-behavior: smooth; }
      `}</style>

      <div style={{ background: '#07070F', color: '#EDE0C4', minHeight: '100vh', overflowX: 'hidden' }}>

        {/* ── Navbar ─────────────────────────────────────────────── */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
          height: '60px', background: 'rgba(7,7,15,0.94)', backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(200,0,0,0.15)',
          display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between',
        }}>
          <span className="font-cinzel" style={{ fontSize: '16px', fontWeight: 700, color: '#C9A227', letterSpacing: '1.5px' }}>
            ♠ TEKESUPU ♣
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/auth/login">
              <button className="btn-outline-land" style={{ padding: '7px 18px', fontSize: '11px' }}>Iniciar Sesión</button>
            </Link>
            <Link href="/auth/registro">
              <button className="btn-red-land" style={{ padding: '7px 18px', fontSize: '11px' }}>Registrarse</button>
            </Link>
          </div>
        </nav>

        {/* ── Hero ────────────────────────────────────────────────── */}
        <section style={{
          minHeight: '100vh', position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', textAlign: 'center', padding: '80px 24px 60px',
        }}>
          {/* Background glows */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 70% 55% at 50% 40%, rgba(160,0,0,0.22) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(100,0,0,0.12) 0%, transparent 60%)',
            animation: 'heroGlow 5s ease-in-out infinite',
          }} />
          {/* Grain texture */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.03,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
          }} />

          {/* Floating symbols */}
          {FLOAT_SYMBOLS.map((s, i) => (
            <div key={i} style={{
              position: 'absolute', left: s.x, bottom: '-10%',
              fontSize: `${s.size}px`, opacity: s.opacity,
              color: s.sym === '♥' || s.sym === '♦' ? '#CC0000' : '#EDE0C4',
              fontFamily: 'serif', lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
              animation: `floatUp ${s.dur} ${s.delay} linear infinite`,
            }}>
              {s.sym}
            </div>
          ))}

          {/* Badge */}
          <div style={{ marginBottom: '24px', animation: 'fadeUp .8s ease both' }}>
            <span className="feature-pill" style={{ fontSize: '11px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#CC0000', display: 'inline-block', animation: 'pulseDot 2s infinite' }} />
              Casino Virtual con Juego Responsable
            </span>
          </div>

          {/* Title */}
          <h1 className="font-cinzel" style={{
            fontSize: 'clamp(36px,9vw,80px)', fontWeight: 900, lineHeight: 1.1,
            marginBottom: '22px', animation: 'fadeUp .9s .1s ease both',
            letterSpacing: '-1px',
          }}>
            Juega sin límites.<br />
            <span style={{
              background: 'linear-gradient(90deg,#CC0000,#FF4444,#CC0000)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: 'shimmerText 4s linear infinite',
              display: 'inline-block',
            }}>
              Apuesta con responsabilidad.
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 'clamp(14px,3vw,18px)', color: '#787890', maxWidth: '520px',
            lineHeight: 1.8, marginBottom: '40px', animation: 'fadeUp 1s .2s ease both',
            padding: '0 8px',
          }}>
            Acceso exclusivo para usuarios{' '}
            <strong style={{ color: '#EDE0C4' }}>verificados sin registros de ludopatía</strong>.
            Recibe S/ 1,000 de saldo virtual gratis.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '52px', animation: 'fadeUp 1s .3s ease both' }}>
            <Link href="/auth/registro">
              <button className="btn-red-land" style={{ fontSize: '14px', padding: '15px 36px' }}>
                Crear Cuenta — Es Gratis
              </button>
            </Link>
            <Link href="/auth/login">
              <button className="btn-outline-land" style={{ fontSize: '14px', padding: '14px 36px' }}>
                Ya tengo cuenta
              </button>
            </Link>
          </div>

          {/* Feature pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', animation: 'fadeUp 1s .4s ease both' }}>
            {['🛡️ Anti-Ludopatía', '🎰 3 Juegos', '📊 Límites Propios', '🔒 Saldo Virtual'].map(f => (
              <span key={f} className="feature-pill">{f}</span>
            ))}
          </div>

          {/* Scroll hint */}
          <div style={{ position: 'absolute', bottom: '28px', left: '50%', transform: 'translateX(-50%)', opacity: .35, animation: 'fadeUp 1s .8s ease both' }}>
            <svg width="20" height="32" viewBox="0 0 20 32" fill="none">
              <rect x="1" y="1" width="18" height="30" rx="9" stroke="#EDE0C4" strokeWidth="1.5"/>
              <circle cx="10" cy="9" r="2.5" fill="#EDE0C4" style={{ animation: 'floatUp 2s ease-in-out infinite alternate' }}/>
            </svg>
          </div>
        </section>

        {/* ── Ticker ──────────────────────────────────────────────── */}
        <div style={{
          overflow: 'hidden', borderTop: '1px solid rgba(200,0,0,0.18)', borderBottom: '1px solid rgba(200,0,0,0.18)',
          background: 'rgba(200,0,0,0.05)', padding: '12px 0',
        }}>
          <div style={{ display: 'flex', width: 'max-content', animation: 'scrollTicker 30s linear infinite' }}>
            {TICKER_ITEMS.map((item, i) => (
              <span key={i} style={{ padding: '0 28px', fontSize: '12px', color: '#FF8888', whiteSpace: 'nowrap', fontFamily: 'Cinzel,serif', letterSpacing: '0.5px' }}>
                {item}
                <span style={{ marginLeft: '28px', color: 'rgba(200,0,0,0.35)' }}>◆</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── Games ───────────────────────────────────────────────── */}
        <section style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(60px,8vw,100px) 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <p style={{ color: '#CC0000', fontSize: '11px', fontFamily: 'Cinzel,serif', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>
              ◆ Entretenimiento Virtual ◆
            </p>
            <h2 className="font-cinzel" style={{ fontSize: 'clamp(26px,5vw,42px)', fontWeight: 900, lineHeight: 1.2 }}>
              Tres experiencias.<br />
              <span style={{ color: '#CC0000' }}>Un solo casino.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '20px' }}>
            {[
              {
                icon: '🎡', name: 'Ruleta', tag: 'Más popular',
                desc: 'Apuesta a rojo/negro, par/impar o un número exacto. Rueda animada con física real y multiplicadores de hasta ×35.',
                bg: 'radial-gradient(ellipse at 30% 30%, rgba(180,0,0,0.22) 0%, transparent 65%)',
                href: '/auth/registro',
                stats: [{ l: 'Multiplicador', v: '×35' }, { l: 'Tipos de apuesta', v: '5' }],
              },
              {
                icon: '🎰', name: 'Tragamonedas', tag: 'Clásico',
                desc: 'Gira los 3 rodillos y busca combinaciones de símbolos. Diamantes, 7s dorados y más con multiplicadores de hasta ×15.',
                bg: 'radial-gradient(ellipse at 70% 30%, rgba(140,0,0,0.18) 0%, transparent 65%)',
                href: '/auth/registro',
                stats: [{ l: 'Multiplicador', v: '×15' }, { l: 'Símbolos', v: '8' }],
              },
              {
                icon: '⚽', name: 'Apuestas Deportivas', tag: 'En vivo',
                desc: 'Liga 1 Perú, La Liga, Champions League. Apuesta al resultado de partidos con cuotas dinámicas en tiempo real.',
                bg: 'radial-gradient(ellipse at 50% 20%, rgba(100,0,0,0.20) 0%, transparent 65%)',
                href: '/auth/registro',
                stats: [{ l: 'Ligas', v: '4+' }, { l: 'Cuotas', v: '×4.5' }],
              },
            ].map(g => (
              <Link key={g.name} href={g.href} style={{ textDecoration: 'none' }}>
                <div className="landing-game-card" style={{ background: `rgba(255,255,255,0.03)` }}>
                  {/* Card background glow */}
                  <div style={{ position: 'absolute', inset: 0, background: g.bg, pointerEvents: 'none' }} />
                  <div className="play-overlay">
                    <div style={{ background: 'rgba(200,0,0,0.9)', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                      ▶
                    </div>
                  </div>
                  <div style={{ padding: '28px', position: 'relative', zIndex: 1 }}>
                    {/* Tag */}
                    <div style={{ marginBottom: '16px' }}>
                      <span style={{ background: 'rgba(200,0,0,0.12)', border: '1px solid rgba(200,0,0,0.3)', borderRadius: '4px', padding: '3px 10px', fontSize: '10px', color: '#FF6666', fontFamily: 'Cinzel,serif', letterSpacing: '0.5px' }}>
                        {g.tag}
                      </span>
                    </div>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>{g.icon}</div>
                    <h3 className="font-cinzel" style={{ fontSize: '20px', color: '#EDE0C4', marginBottom: '10px', fontWeight: 700 }}>{g.name}</h3>
                    <p style={{ color: '#787890', fontSize: '13px', lineHeight: 1.7, marginBottom: '20px' }}>{g.desc}</p>
                    {/* Mini stats */}
                    <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid rgba(200,0,0,0.15)', paddingTop: '16px' }}>
                      {g.stats.map(s => (
                        <div key={s.l}>
                          <div className="font-cinzel" style={{ color: '#CC0000', fontSize: '18px', fontWeight: 700 }}>{s.v}</div>
                          <div style={{ color: '#787890', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── How it works ────────────────────────────────────────── */}
        <section style={{ background: 'rgba(200,0,0,0.03)', borderTop: '1px solid rgba(200,0,0,0.1)', borderBottom: '1px solid rgba(200,0,0,0.1)', padding: 'clamp(60px,8vw,100px) 24px' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '52px' }}>
              <p style={{ color: '#CC0000', fontSize: '11px', fontFamily: 'Cinzel,serif', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>
                ◆ Proceso de Registro ◆
              </p>
              <h2 className="font-cinzel" style={{ fontSize: 'clamp(24px,4vw,38px)', fontWeight: 900 }}>
                Acceso verificado en <span style={{ color: '#CC0000' }}>3 pasos</span>
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '20px' }}>
              {[
                { n: '01', icon: '📝', title: 'Te registras', desc: 'Ingresa tu nombre, email, DNI y contraseña. El proceso toma menos de 2 minutos.' },
                { n: '02', icon: '🔍', title: 'Verificamos tu DNI', desc: 'Consultamos el sistema nacional SERNAP para confirmar que no tienes registros de ludopatía.' },
                { n: '03', icon: '✅', title: 'Accedes al casino', desc: 'Con verificación exitosa obtienes acceso completo y S/ 1,000 de saldo virtual.' },
              ].map((s, i) => (
                <div key={s.n} className="step-card card-casino" style={{ padding: '28px 24px', textAlign: 'center', borderColor: 'rgba(200,0,0,0.15)' }}>
                  {i < 2 && (
                    <div style={{ position: 'absolute', right: '-12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(200,0,0,0.3)', fontSize: '18px', zIndex: 2, display: 'none' }}>→</div>
                  )}
                  <div className="step-num">{s.n}</div>
                  <div style={{ fontSize: '28px', marginBottom: '12px' }}>{s.icon}</div>
                  <h3 className="font-cinzel" style={{ fontSize: '15px', marginBottom: '10px', color: '#EDE0C4' }}>{s.title}</h3>
                  <p style={{ color: '#787890', fontSize: '13px', lineHeight: 1.65 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats ───────────────────────────────────────────────── */}
        <section style={{ maxWidth: '1000px', margin: '0 auto', padding: 'clamp(60px,8vw,80px) 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1px', background: 'rgba(200,0,0,0.12)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(200,0,0,0.18)' }}>
            {[
              { value: 'S/ 1,000', label: 'Saldo virtual de bienvenida', icon: '💰' },
              { value: '3',        label: 'Juegos disponibles',          icon: '🎮' },
              { value: '×35',      label: 'Multiplicador máximo',        icon: '📈' },
              { value: '100%',     label: 'Verificación anti-ludopatía', icon: '🛡️' },
            ].map(s => (
              <div key={s.label} style={{ padding: '32px 24px', textAlign: 'center', background: 'rgba(7,7,15,0.9)', transition: 'background 0.2s' }}
                onMouseEnter={undefined}>
                <div style={{ fontSize: '26px', marginBottom: '10px' }}>{s.icon}</div>
                <div className="font-cinzel" style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 900, color: '#CC0000', marginBottom: '6px' }}>{s.value}</div>
                <div style={{ color: '#787890', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA Banner ──────────────────────────────────────────── */}
        <section style={{
          background: 'linear-gradient(135deg, #1A0000 0%, #0D0000 40%, #1A0000 100%)',
          borderTop: '1px solid rgba(200,0,0,0.25)', borderBottom: '1px solid rgba(200,0,0,0.25)',
          padding: 'clamp(60px,8vw,90px) 24px', textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(200,0,0,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '620px', margin: '0 auto' }}>
            <h2 className="font-cinzel" style={{ fontSize: 'clamp(26px,5vw,44px)', fontWeight: 900, marginBottom: '16px', lineHeight: 1.15 }}>
              ¿Listo para la <span style={{ color: '#FF3333' }}>experiencia?</span>
            </h2>
            <p style={{ color: '#787890', fontSize: '15px', lineHeight: 1.7, marginBottom: '32px' }}>
              Regístrate gratis, verifica tu DNI y recibe <strong style={{ color: '#EDE0C4' }}>S/ 1,000 de saldo virtual</strong> para empezar a jugar de inmediato.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/auth/registro">
                <button className="btn-red-land" style={{ fontSize: '14px', padding: '15px 40px' }}>
                  Empezar Ahora — Gratis
                </button>
              </Link>
              <Link href="/auth/login">
                <button className="btn-outline-land" style={{ fontSize: '14px' }}>
                  Ya tengo cuenta
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Responsible Gaming ──────────────────────────────────── */}
        <section style={{ maxWidth: '700px', margin: '0 auto', padding: 'clamp(50px,6vw,70px) 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '14px' }}>🛡️</div>
          <h3 className="font-cinzel" style={{ fontSize: 'clamp(16px,3vw,22px)', marginBottom: '12px' }}>
            Compromiso con el <span style={{ color: '#CC0000' }}>Juego Responsable</span>
          </h3>
          <p style={{ color: '#787890', fontSize: '13px', lineHeight: 1.8, marginBottom: '20px' }}>
            Tekesupu es una plataforma educativa de entretenimiento. No involucra dinero real. Promovemos el entretenimiento responsable con límites configurables y verificación anti-ludopatía.
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Sin dinero real', 'Verificación SERNAP', 'Límites propios', 'Proyecto educativo'].map(f => (
              <span key={f} className="feature-pill" style={{ fontSize: '11px' }}>{f}</span>
            ))}
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <footer style={{ borderTop: '1px solid rgba(200,0,0,0.15)', padding: '28px 24px', textAlign: 'center' }}>
          <div className="font-cinzel" style={{ color: '#C9A227', fontSize: '14px', marginBottom: '8px', letterSpacing: '2px' }}>♠ TEKESUPU ♣</div>
          <p style={{ color: '#787890', fontSize: '11px' }}>© 2026 Tekesupu Casino · Solo para fines educativos · Tecsup</p>
        </footer>

      </div>
    </>
  )
}
