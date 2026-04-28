import React from 'react';
import { AlertTriangle, TrendingUp, Users, BarChart2 } from 'lucide-react';

interface KpiCardsProps {
  todayOccsLength: number;
  conformPct: number;
  checkedItems: number;
  totalExpected: number;
  uniqueOps: number;
  weekData: { day: string; occs: number }[];
}

export default function KpiCards({ todayOccsLength, conformPct, checkedItems, totalExpected, uniqueOps, weekData }: KpiCardsProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '20px', background: 'linear-gradient(180deg, var(--surface) 0%, var(--surface-2) 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'var(--warning-hl)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}><AlertTriangle size={20} /></div>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', background: 'var(--surface)', padding: '4px 8px', borderRadius: 99 }}>Hoje</span>
          </div>
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Alertas</div>
            <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--text)', lineHeight: 1 }}>{todayOccsLength}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', background: 'linear-gradient(180deg, var(--surface) 0%, var(--surface-2) 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'var(--success-hl)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}><TrendingUp size={20} /></div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Conformidade Geral</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
              <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--text)', lineHeight: 1 }}>{conformPct}%</div>
              <span style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)' }}>({checkedItems}/{totalExpected})</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', background: 'linear-gradient(180deg, var(--surface) 0%, var(--surface-2) 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(8,145,178,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0891b2' }}><Users size={20} /></div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Equipa Envolvida</div>
            <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--text)', lineHeight: 1 }}>{uniqueOps}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
            <BarChart2 size={18} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Histórico a 7 Dias</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 120, paddingBottom: 24, position: 'relative' }}>
            {weekData.map((d, i) => {
              const max = Math.max(...weekData.map(w => w.occs), 1);
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative' }}>
                  <div style={{ width: '100%', maxWidth: 48, height: `${Math.max((d.occs / max) * 100, d.occs > 0 ? 10 : 4)}%`, background: d.occs > 0 ? 'var(--warning)' : 'var(--divider)', borderRadius: '8px 8px 3px 3px', transition: 'all 0.5s ease', boxShadow: d.occs > 0 ? '0 4px 12px rgba(217,119,6,0.3)' : 'none' }} title={`${d.occs} ocorr.`} />
                  {d.occs > 0 && <span style={{ position: 'absolute', top: -24, fontSize: 12, fontWeight: 900, color: 'var(--warning)' }}>{d.occs}</span>}
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', position: 'absolute', bottom: 0 }}>{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
