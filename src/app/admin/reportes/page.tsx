'use client'
import { useState } from 'react'
import UMLBadge from '@/components/UMLBadge'

export default function ReportesPage() {
  const [tipo, setTipo] = useState('')
  const [generado, setGenerado] = useState(false)

  return (
    <div>
      <h1 className="font-cinzel" style={{ fontSize:'24px', marginBottom:'8px' }}>📄 Generar Reportes</h1>
      <div style={{ marginBottom:'24px', display:'flex', alignItems:'center', gap:'8px' }}>
        <UMLBadge type="include" label="Consultar estadísticas" />
        <span style={{ color:'var(--casino-muted)', fontSize:'13px' }}>— Reportes del rendimiento del sistema</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'14px', marginBottom:'22px' }}>
        {[
          { t:'financiero', i:'💰', n:'Reporte Financiero', d:'Ingresos, pagos, rentabilidad' },
          { t:'usuarios', i:'👥', n:'Reporte de Usuarios', d:'Registros, actividad, retención' },
          { t:'juegos', i:'🎮', n:'Reporte de Juegos', d:'Popularidad, ganancias por juego' },
          { t:'ludopatia', i:'🛡️', n:'Reporte Ludopatía', d:'Bloqueos, verificaciones, alertas' },
        ].map(r => (
          <div key={r.t} className="card-casino" style={{ padding:'22px', cursor:'pointer', borderColor: tipo===r.t ? 'rgba(201,162,39,0.5)' : 'var(--casino-border)', transition:'border-color 0.2s' }}
            onClick={() => setTipo(r.t)}>
            <div style={{ fontSize:'28px', marginBottom:'10px' }}>{r.i}</div>
            <div className="font-cinzel" style={{ fontSize:'14px', marginBottom:'7px' }}>{r.n}</div>
            <p style={{ color:'var(--casino-muted)', fontSize:'12px' }}>{r.d}</p>
          </div>
        ))}
      </div>

      <div className="card-casino" style={{ padding:'26px' }}>
        <div className="font-cinzel" style={{ marginBottom:'18px', color:'var(--casino-gold)', fontSize:'14px' }}>
          Configurar Reporte
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:'14px', marginBottom:'18px' }}>
          {[
            ['Período', ['Último mes','Últimos 3 meses','Año actual']],
            ['Formato', ['PDF','Excel','CSV']],
            ['Detalle', ['Resumen ejecutivo','Detallado','Con gráficos']],
          ].map(([label, opts]) => (
            <div key={label as string}>
              <label style={{ fontSize:'11px', color:'var(--casino-muted)', textTransform:'uppercase', letterSpacing:'0.8px', display:'block', marginBottom:'7px' }}>
                {label as string}
              </label>
              <select className="input-casino" style={{ background:'rgba(255,255,255,0.06)' }}>
                {(opts as string[]).map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
        <button className="btn-gold" onClick={() => { setGenerado(true); setTimeout(() => setGenerado(false), 3000) }}>
          📄 Generar Reporte
        </button>
        {generado && (
          <div style={{ marginTop:'14px', background:'rgba(0,200,83,0.1)', border:'1px solid rgba(0,200,83,0.25)', borderRadius:'8px', padding:'11px 14px', fontSize:'13px', color:'var(--casino-green)' }}>
            ✅ Reporte generado exitosamente.
          </div>
        )}
      </div>
    </div>
  )
}
