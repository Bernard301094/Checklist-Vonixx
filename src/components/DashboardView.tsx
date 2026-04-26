/**
 * DashboardView v6 — Ultra-Premium + Fully Responsive
 * Mobile-first: fluid grids, clamp() spacing, touch targets ≥44px,
 * date-grouped timeline, glassmorphism cards.
 */
import { useState, useMemo } from 'react';
import {
  BarChart3, CheckCircle2, AlertTriangle, Images, ClipboardList,
  X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  User, Clock, MessageSquare, Camera, Calendar, Hash, Activity,
  LayoutGrid, TrendingUp, Users, Shield, Zap, Star,
  ArrowRight, Flame, Target
} from 'lucide-react';
import { OccurrenceData } from '../types';
import { CHECKLIST_DATA } from '../constants';

interface DashboardViewProps {
  occurrences: OccurrenceData[];
  checklistState: Record<string, boolean>;
}

/* ─── helpers ─────────────────────────────────────────────── */
function toLocalDateKey(isoOrDate: string | undefined): string {
  if (!isoOrDate) return new Date().toISOString().slice(0, 10);
  const d = new Date(isoOrDate);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDayStrip(dateKey: string): { dayNum: string; dayName: string; monthShort: string } {
  const d = new Date(dateKey + 'T12:00:00');
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return {
    dayNum: String(d.getDate()).padStart(2, '0'),
    dayName: days[d.getDay()],
    monthShort: months[d.getMonth()],
  };
}

function formatDateLabel(dateKey: string): string {
  const today = toLocalDateKey(new Date().toISOString());
  const yesterday = toLocalDateKey(new Date(Date.now() - 86400000).toISOString());
  if (dateKey === today) return 'Hoje';
  if (dateKey === yesterday) return 'Ontem';
  const d = new Date(dateKey + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function reporterLabel(raw: string): string {
  return raw.split(' - Auth:')[0].trim();
}

function initials(name: string): string {
  return name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .map(p => p[0]?.toUpperCase())
    .slice(0, 2)
    .join('');
}

const AVATAR_COLORS = [
  { fg: '#0d9488', bg: 'rgba(13,148,136,0.15)', glow: 'rgba(13,148,136,0.3)' },
  { fg: '#7c3aed', bg: 'rgba(124,58,237,0.15)', glow: 'rgba(124,58,237,0.3)' },
  { fg: '#db2777', bg: 'rgba(219,39,119,0.15)', glow: 'rgba(219,39,119,0.3)' },
  { fg: '#d97706', bg: 'rgba(217,119,6,0.15)',  glow: 'rgba(217,119,6,0.3)'  },
  { fg: '#16a34a', bg: 'rgba(22,163,74,0.15)',  glow: 'rgba(22,163,74,0.3)'  },
  { fg: '#2563eb', bg: 'rgba(37,99,235,0.15)',  glow: 'rgba(37,99,235,0.3)'  },
  { fg: '#e11d48', bg: 'rgba(225,29,72,0.15)',  glow: 'rgba(225,29,72,0.3)'  },
];

function getAvatarColor(name: string) {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

/* ─── Occurrence Detail Modal ──────────────────────────────── */
interface DetailModalProps {
  occurrence: OccurrenceData;
  onClose: () => void;
  onOpenPhoto: (photos: string[], idx: number) => void;
}

function OccurrenceDetailModal({ occurrence, onClose, onOpenPhoto }: DetailModalProps) {
  const reporter = reporterLabel(occurrence.reporter);
  const dateStr = occurrence.created_at
    ? new Date(occurrence.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';
  const avatar = getAvatarColor(reporter);

  return (
    <>
      <style>{`
        .occ-detail-overlay {
          position:fixed;inset:0;
          background:rgba(2,6,23,0.9);
          backdrop-filter:blur(20px);
          display:flex;align-items:center;justify-content:center;
          z-index:3000;padding:clamp(12px,4vw,20px);
          animation:fadeInOD 0.25s ease;
        }
        .occ-detail-box {
          width:100%;max-width:600px;
          background:linear-gradient(145deg,#0f172a,#1e293b);
          border:1px solid rgba(255,255,255,0.08);
          border-radius:clamp(16px,4vw,28px);
          box-shadow:0 40px 80px rgba(0,0,0,0.6),0 0 0 1px rgba(255,255,255,0.04);
          max-height:92dvh;display:flex;flex-direction:column;overflow:hidden;
          animation:slideUpOD 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media (max-width:480px) {
          .occ-detail-overlay{align-items:flex-end;padding:0;}
          .occ-detail-box{max-width:100%;border-bottom-left-radius:0;border-bottom-right-radius:0;max-height:96dvh;}
        }
        .occ-detail-header{padding:clamp(14px,4vw,22px) clamp(16px,4vw,24px);}
        .occ-detail-scroll{overflow-y:auto;flex:1;padding:clamp(16px,4vw,24px);scrollbar-width:thin;}
        .occ-reporter-row{display:flex;align-items:center;gap:clamp(10px,3vw,14px);padding:clamp(14px,3vw,18px) clamp(14px,3vw,20px);}
        .occ-photo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(90px,22vw,130px),1fr));gap:clamp(8px,2vw,10px);}
        @keyframes fadeInOD{from{opacity:0}to{opacity:1}}
        @keyframes slideUpOD{from{opacity:0;transform:translateY(40px) scale(0.97)}to{opacity:1;transform:none}}
      `}</style>
      <div className="occ-detail-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="occ-detail-box">
          {/* Header */}
          <div className="occ-detail-header" style={{ background:'linear-gradient(90deg,rgba(217,119,6,0.12),rgba(217,119,6,0.03))', borderBottom:'1px solid rgba(217,119,6,0.15)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:clamp(10,12,14), minWidth:0 }}>
              <div style={{ position:'relative', flexShrink:0 }}>
                <div style={{ width:46, height:46, borderRadius:14, background:'rgba(217,119,6,0.2)', border:'1px solid rgba(217,119,6,0.3)', color:'#f59e0b', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 20px rgba(217,119,6,0.25)' }}>
                  <AlertTriangle size={20} />
                </div>
                <div style={{ position:'absolute', top:-4, right:-4, width:14, height:14, borderRadius:'50%', background:'#ef4444', border:'2px solid #0f172a', animation:'pulseDot 2s infinite' }} />
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.14em', color:'rgba(251,191,36,0.7)', marginBottom:3 }}>⚠ PONTO CRÍTICO DETECTADO</div>
                <div style={{ fontSize:clamp(13,15,16), fontWeight:800, color:'#fff', letterSpacing:'-0.01em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{occurrence.section}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ width:44, height:44, borderRadius:10, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.6)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all 0.2s', flexShrink:0 }}>
              <X size={16} />
            </button>
          </div>

          <div className="occ-detail-scroll">
            {/* Reporter info */}
            <div className="occ-reporter-row" style={{ background:'rgba(255,255,255,0.03)', borderRadius:18, border:'1px solid rgba(255,255,255,0.06)', marginBottom:20 }}>
              <div style={{ width:48, height:48, borderRadius:'50%', background:avatar.bg, border:`2px solid ${avatar.fg}44`, color:avatar.fg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:900, flexShrink:0, boxShadow:`0 4px 16px ${avatar.glow}` }}>
                {initials(reporter)}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:15, fontWeight:800, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{reporter}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:3, fontWeight:600 }}>Operador responsável</div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:14, fontWeight:800, color:'rgba(255,255,255,0.85)' }}>{occurrence.time}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:2 }}>{dateStr}</div>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <div style={{ width:3, height:14, background:'#f59e0b', borderRadius:99 }} />
                  <span style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em', color:'#f59e0b' }}>Não Conformidade</span>
                </div>
                <div style={{ padding:'clamp(14px,4vw,18px) clamp(14px,4vw,20px)', background:'rgba(217,119,6,0.08)', border:'1px solid rgba(217,119,6,0.2)', borderRadius:18, borderLeft:'3px solid #f59e0b' }}>
                  <p style={{ fontSize:clamp(13,14,15), fontWeight:700, lineHeight:1.6, color:'#fff', margin:0 }}>{occurrence.item}</p>
                </div>
              </div>

              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <div style={{ width:3, height:14, background:'rgba(255,255,255,0.25)', borderRadius:99 }} />
                  <span style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.4)' }}>Observações</span>
                </div>
                <div style={{ padding:'clamp(14px,4vw,18px) clamp(14px,4vw,20px)', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:18 }}>
                  <p style={{ fontSize:14, lineHeight:1.8, fontWeight:500, color: occurrence.comment ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)', margin:0, fontStyle: occurrence.comment ? 'normal' : 'italic' }}>
                    {occurrence.comment || 'Nenhuma observação adicional registrada.'}
                  </p>
                </div>
              </div>

              {occurrence.photos.length > 0 && (
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <div style={{ width:3, height:14, background:'#0d9488', borderRadius:99 }} />
                    <span style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em', color:'#0d9488' }}>Evidências Fotográficas · {occurrence.photos.length}</span>
                  </div>
                  <div className="occ-photo-grid">
                    {occurrence.photos.map((p, i) => (
                      <button key={i} type="button" onClick={() => onOpenPhoto(occurrence.photos, i)}
                        style={{ position:'relative', borderRadius:14, overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)', aspectRatio:'1', padding:0, cursor:'zoom-in', background:'rgba(255,255,255,0.04)', transition:'all 0.25s', minHeight:44 }}
                        onMouseEnter={e => { e.currentTarget.style.transform='scale(1.04)'; e.currentTarget.style.borderColor='rgba(13,148,136,0.4)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; }}>
                        <img src={p} alt={`Foto ${i+1}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} loading="lazy" />
                        <div style={{ position:'absolute', bottom:6, right:6, background:'rgba(0,0,0,0.7)', color:'#fff', fontSize:9, fontWeight:900, padding:'2px 7px', borderRadius:99, backdropFilter:'blur(8px)', letterSpacing:'0.05em' }}>{i+1}/{occurrence.photos.length}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function clamp(min: number, val: number, max: number): string {
  return `clamp(${min}px,${val}px,${max}px)`;
}

/* ─── Conformidade Detail Modal ────────────────────────────── */
function ConformDetailModal({ detail, onClose }: { detail: { sectionTitle: string; items: string[]; total: number }; onClose: () => void }) {
  const pct = Math.round((detail.items.length / detail.total) * 100);
  return (
    <>
      <style>{`
        .conf-detail-overlay{position:fixed;inset:0;background:rgba(2,6,23,0.9);backdrop-filter:blur(20px);display:flex;align-items:center;justify-content:center;z-index:3000;padding:clamp(12px,4vw,20px);animation:fadeInCF 0.25s ease;}
        .conf-detail-box{width:100%;max-width:540px;background:linear-gradient(145deg,#0f172a,#1e293b);border:1px solid rgba(255,255,255,0.08);border-radius:clamp(16px,4vw,28px);box-shadow:0 40px 80px rgba(0,0,0,0.6);max-height:92dvh;display:flex;flex-direction:column;overflow:hidden;animation:slideUpCF 0.35s cubic-bezier(0.16, 1, 0.3, 1);}
        @media(max-width:480px){.conf-detail-overlay{align-items:flex-end;padding:0;}.conf-detail-box{max-width:100%;border-bottom-left-radius:0;border-bottom-right-radius:0;max-height:96dvh;}}
        @keyframes fadeInCF{from{opacity:0}to{opacity:1}}
        @keyframes slideUpCF{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}
      `}</style>
      <div className="conf-detail-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="conf-detail-box">
          <div style={{ padding:'clamp(14px,4vw,22px) clamp(16px,4vw,24px)', background:'linear-gradient(90deg,rgba(22,163,74,0.12),rgba(22,163,74,0.03))', borderBottom:'1px solid rgba(22,163,74,0.15)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
              <div style={{ width:46, height:46, borderRadius:14, background:'rgba(22,163,74,0.2)', border:'1px solid rgba(22,163,74,0.3)', color:'#22c55e', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 20px rgba(22,163,74,0.25)', flexShrink:0 }}>
                <CheckCircle2 size={22} />
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.14em', color:'rgba(34,197,94,0.7)', marginBottom:3 }}>✓ ITENS VALIDADOS</div>
                <div style={{ fontSize:'clamp(13px,3.5vw,16px)', fontWeight:800, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{detail.sectionTitle}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ width:44, height:44, borderRadius:10, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.5)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ padding:'12px clamp(16px,4vw,24px)', borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.02)', display:'flex', alignItems:'center', gap:16, flexShrink:0 }}>
            <div style={{ flex:1, height:6, background:'rgba(255,255,255,0.06)', borderRadius:99, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,#16a34a,#22c55e)', borderRadius:99, transition:'all 1s ease' }} />
            </div>
            <span style={{ fontSize:13, fontWeight:900, color:'#22c55e', fontVariantNumeric:'tabular-nums', flexShrink:0 }}>{detail.items.length}/{detail.total} · {pct}%</span>
          </div>
          <div style={{ overflowY:'auto', flex:1, padding:'16px clamp(16px,4vw,24px)', display:'flex', flexDirection:'column', gap:8 }}>
            {detail.items.map((item, i) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'clamp(10px,3vw,12px) clamp(12px,3vw,16px)', borderRadius:14, background:'rgba(22,163,74,0.07)', border:'1px solid rgba(22,163,74,0.12)' }}>
                <CheckCircle2 size={16} style={{ color:'#22c55e', flexShrink:0, marginTop:2 }} />
                <span style={{ fontSize:13, fontWeight:600, lineHeight:1.5, color:'rgba(255,255,255,0.85)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── ConformSection ────────────────────────────────────────── */
function ConformSection({ title, sectionId, items, total, defaultOpen, onDetail }: { title: string; sectionId: string; items: string[]; total: number; defaultOpen: boolean; onDetail: (d: any) => void }) {
  const [open, setOpen] = useState(defaultOpen);
  const pct = total > 0 ? Math.round((items.length / total) * 100) : 0;
  const isComplete = pct === 100;

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, overflow:'hidden', transition:'all 0.2s', boxShadow:'0 2px 12px rgba(0,0,0,0.08)' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'clamp(12px,3vw,16px) clamp(14px,4vw,20px)', background: open ? 'rgba(22,163,74,0.05)' : 'transparent', borderBottom: open ? '1px solid rgba(22,163,74,0.1)' : 'none', cursor:'pointer', gap:12, minHeight:44 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0, flex:1 }}>
          <div style={{ width:40, height:40, borderRadius:12, background: isComplete ? 'rgba(22,163,74,0.2)' : 'rgba(22,163,74,0.1)', border:`1px solid ${isComplete ? 'rgba(22,163,74,0.4)' : 'rgba(22,163,74,0.2)'}`, color:'var(--success)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            {isComplete ? <Star size={18} fill="currentColor" /> : <CheckCircle2 size={18} />}
          </div>
          <div style={{ minWidth:0, flex:1 }}>
            <div style={{ fontSize:'clamp(12px,3.5vw,14px)', fontWeight:800, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--text)' }}>{title}</div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
              <div style={{ flex:1, height:4, background:'rgba(22,163,74,0.12)', borderRadius:99, overflow:'hidden', maxWidth:120 }}>
                <div style={{ height:'100%', width:`${pct}%`, background: isComplete ? 'linear-gradient(90deg,#16a34a,#22c55e)' : '#16a34a', borderRadius:99 }} />
              </div>
              <span style={{ fontSize:11, fontWeight:800, color:'var(--success)', whiteSpace:'nowrap' }}>{items.length}/{total} · {pct}%</span>
            </div>
          </div>
        </div>
        {open ? <ChevronUp size={18} style={{ color:'var(--success)', flexShrink:0 }} /> : <ChevronDown size={18} style={{ color:'var(--success)', flexShrink:0 }} />}
      </button>

      {open && (
        <div style={{ display:'flex', flexDirection:'column' }}>
          {items.map((item, i) => (
            <button key={`${sectionId}-${i}`} type="button" onClick={() => onDetail({ sectionTitle: title, items, total })}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'clamp(11px,3vw,13px) clamp(14px,4vw,24px)', borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none', background:'transparent', cursor:'pointer', textAlign:'left', transition:'background 0.15s', minHeight:44 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(22,163,74,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <CheckCircle2 size={14} style={{ color:'var(--success)', flexShrink:0 }} />
              <span style={{ fontSize:'clamp(12px,3vw,13px)', fontWeight:600, lineHeight:1.5, flex:1, color:'var(--text)' }}>{item}</span>
              <ArrowRight size={13} style={{ color:'var(--text-faint)', flexShrink:0 }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Day Strip ─────────────────────────────────────────────── */
function DayStrip({ days, selected, occCountByDay, onSelect }: { days: string[]; selected: string; occCountByDay: Record<string, number>; onSelect: (d: string) => void }) {
  const todayKey = toLocalDateKey(new Date().toISOString());
  return (
    <div style={{ overflowX:'auto', display:'flex', gap:8, padding:'4px 2px 12px', scrollbarWidth:'none', WebkitOverflowScrolling:'touch' } as any}>
      {days.map(dk => {
        const { dayNum, dayName, monthShort } = formatDayStrip(dk);
        const isSelected = dk === selected;
        const isToday = dk === todayKey;
        const count = occCountByDay[dk] || 0;
        return (
          <button
            key={dk}
            type="button"
            onClick={() => onSelect(dk)}
            style={{
              flexShrink: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 4,
              padding: 'clamp(10px,3vw,14px) clamp(14px,4vw,18px)',
              borderRadius: 20,
              border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
              background: isSelected
                ? 'linear-gradient(145deg,rgba(13,148,136,0.2),rgba(13,148,136,0.08))'
                : 'var(--surface)',
              cursor: 'pointer',
              minWidth: 'clamp(60px,16vw,72px)',
              minHeight: 44,
              transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              position: 'relative',
              boxShadow: isSelected ? '0 8px 24px rgba(13,148,136,0.25),0 0 0 1px rgba(13,148,136,0.15)' : 'none',
              transform: isSelected ? 'translateY(-3px) scale(1.05)' : 'scale(1)',
            } as any}
          >
            {isToday && (
              <span style={{ position:'absolute', top:-9, background:'linear-gradient(90deg,#0d9488,#0891b2)', color:'#fff', fontSize:8, fontWeight:900, padding:'2px 7px', borderRadius:99, letterSpacing:'0.1em', boxShadow:'0 4px 10px rgba(13,148,136,0.4)' }}>HOJE</span>
            )}
            <span style={{ fontSize:10, fontWeight:800, color: isSelected ? 'var(--primary)' : 'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{dayName}</span>
            <span style={{ fontSize:'clamp(18px,5vw,22px)', fontWeight:900, lineHeight:1, color: isSelected ? 'var(--primary)' : 'var(--text)' }}>{dayNum}</span>
            <span style={{ fontSize:10, color: isSelected ? 'var(--primary)' : 'var(--text-muted)', fontWeight:700, letterSpacing:'0.05em' }}>{monthShort.toUpperCase()}</span>
            <div style={{ marginTop:4 }}>
              {count > 0 ? (
                <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', minWidth:22, height:22, borderRadius:99, fontSize:10, fontWeight:900, background: isSelected ? 'rgba(217,119,6,0.9)' : 'rgba(217,119,6,0.15)', color: isSelected ? '#fff' : '#d97706', padding:'0 6px', boxShadow: isSelected ? '0 4px 10px rgba(217,119,6,0.4)' : 'none' }}>{count}</span>
              ) : (
                <div style={{ width:8, height:8, borderRadius:'50%', background:'#22c55e', opacity:0.7, boxShadow:'0 0 6px rgba(34,197,94,0.5)' }} />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Date Section Header ───────────────────────────────────── */
function DateSectionHeader({ dateKey, count }: { dateKey: string; count: number }) {
  const label = formatDateLabel(dateKey);
  const isToday = dateKey === toLocalDateKey(new Date().toISOString());
  const { dayName, monthShort, dayNum } = formatDayStrip(dateKey);
  const fullDate = new Date(dateKey + 'T12:00:00');
  const year = fullDate.getFullYear();

  return (
    <div style={{ display:'flex', alignItems:'center', gap:'clamp(8px,3vw,16px)', margin:'8px 0 16px', flexWrap:'wrap' } as any}>
      {/* Date block */}
      <div style={{
        display:'flex', flexDirection:'column', alignItems:'center',
        padding:'clamp(8px,2vw,10px) clamp(12px,3vw,16px)', borderRadius:16,
        background: isToday
          ? 'linear-gradient(135deg,rgba(13,148,136,0.25),rgba(8,145,178,0.15))'
          : 'var(--surface-2)',
        border: isToday ? '1px solid rgba(13,148,136,0.3)' : '1px solid var(--border)',
        boxShadow: isToday ? '0 4px 16px rgba(13,148,136,0.2)' : 'none',
        minWidth:'clamp(48px,12vw,56px)', flexShrink:0,
      } as any}>
        <span style={{ fontSize:9, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.12em', color: isToday ? 'var(--primary)' : 'var(--text-muted)' }}>{dayName}</span>
        <span style={{ fontSize:'clamp(18px,5vw,22px)', fontWeight:900, lineHeight:1.1, color: isToday ? 'var(--primary)' : 'var(--text)' }}>{dayNum}</span>
        <span style={{ fontSize:9, fontWeight:800, color: isToday ? 'var(--primary)' : 'var(--text-muted)', textTransform:'uppercase' }}>{monthShort} {year}</span>
      </div>

      {/* Divider line — hidden on very small screens */}
      <div style={{ flex:1, height:1, background:'var(--border)', position:'relative', minWidth:20 }}>
        <div style={{ position:'absolute', top:'50%', left:0, transform:'translateY(-50%)', width:60, height:2, background: isToday ? 'linear-gradient(90deg,var(--primary),transparent)' : 'linear-gradient(90deg,var(--border),transparent)', borderRadius:99 }} />
      </div>

      {/* Badge */}
      <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0, flexWrap:'wrap' }}>
        {isToday && (
          <span style={{ fontSize:9, fontWeight:900, padding:'3px 8px', borderRadius:99, background:'linear-gradient(90deg,#0d9488,#0891b2)', color:'#fff', letterSpacing:'0.1em', boxShadow:'0 4px 10px rgba(13,148,136,0.35)' }}>HOJE</span>
        )}
        {count > 0 ? (
          <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:'clamp(10px,2.5vw,11px)', fontWeight:800, padding:'4px clamp(8px,2vw,12px)', borderRadius:99, background:'rgba(217,119,6,0.1)', color:'#d97706', border:'1px solid rgba(217,119,6,0.2)' }}>
            <Flame size={11} /> {count} {count === 1 ? 'alerta' : 'alertas'}
          </span>
        ) : (
          <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:'clamp(10px,2.5vw,11px)', fontWeight:800, padding:'4px clamp(8px,2vw,12px)', borderRadius:99, background:'rgba(22,163,74,0.08)', color:'#16a34a', border:'1px solid rgba(22,163,74,0.15)' }}>
            <Shield size={11} /> Sem alertas
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Employee Card ─────────────────────────────────────────── */
function EmployeeCard({ reporter, occs, onSelectOcc }: { reporter: string; occs: OccurrenceData[]; onSelectOcc: (occ: OccurrenceData) => void }) {
  const [expanded, setExpanded] = useState(true);
  const avatar = getAvatarColor(reporter);

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, overflow:'hidden', boxShadow:'0 4px 16px rgba(0,0,0,0.06)', transition:'box-shadow 0.2s' }}>
      {/* Card header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'clamp(12px,3vw,16px) clamp(14px,4vw,20px)', background:'linear-gradient(90deg, var(--surface-2) 0%, var(--surface) 100%)', borderBottom: expanded ? '1px solid var(--border)' : 'none', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'clamp(10px,3vw,14px)', minWidth:0, flex:1 }}>
          <div style={{ position:'relative', flexShrink:0 }}>
            <div style={{ width:48, height:48, borderRadius:'50%', background:avatar.bg, border:`2px solid ${avatar.fg}44`, color:avatar.fg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900, boxShadow:`0 4px 14px ${avatar.glow}` }}>
              {initials(reporter)}
            </div>
            <div style={{ position:'absolute', bottom:0, right:0, width:14, height:14, borderRadius:'50%', background:'#f59e0b', border:'2px solid var(--surface)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <AlertTriangle size={7} color="#fff" />
            </div>
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:'clamp(13px,3.5vw,15px)', fontWeight:800, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{reporter}</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:5, flexWrap:'wrap' }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:4, height:22, padding:'0 10px', borderRadius:99, fontSize:10, fontWeight:900, background:'rgba(217,119,6,0.1)', color:'#d97706', border:'1px solid rgba(217,119,6,0.15)', whiteSpace:'nowrap' }}>
                <AlertTriangle size={10} /> {occs.length} {occs.length === 1 ? 'alerta' : 'alertas'}
              </span>
              {occs.some(o => o.photos.length > 0) && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:4, height:22, padding:'0 10px', borderRadius:99, fontSize:10, fontWeight:900, background:'rgba(13,148,136,0.1)', color:'var(--primary)', border:'1px solid rgba(13,148,136,0.15)', whiteSpace:'nowrap' }}>
                  <Camera size={10} /> {occs.reduce((a, o) => a + o.photos.length, 0)}
                </span>
              )}
            </div>
          </div>
        </div>
        <button type="button" onClick={() => setExpanded(e => !e)}
          style={{ width:44, height:44, borderRadius:10, background:'var(--surface-2)', border:'1px solid var(--border)', color:'var(--text-muted)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div style={{ display:'flex', flexDirection:'column' }}>
          {occs.map((occ, i) => (
            <button
              key={occ.id}
              type="button"
              onClick={() => onSelectOcc(occ)}
              style={{ width:'100%', display:'flex', alignItems:'flex-start', gap:'clamp(10px,3vw,14px)', padding:'clamp(12px,3vw,16px) clamp(14px,4vw,20px)', borderBottom: i < occs.length - 1 ? '1px solid var(--border)' : 'none', background:'transparent', cursor:'pointer', textAlign:'left', transition:'background 0.15s', minHeight:44 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ width:3, height:36, background:'linear-gradient(180deg,#f59e0b,rgba(217,119,6,0.3))', borderRadius:99, flexShrink:0, marginTop:2 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:10, fontWeight:900, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>{occ.section}</div>
                <div style={{ fontSize:'clamp(12px,3.5vw,14px)', fontWeight:800, color:'var(--text)', lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{occ.item}</div>
                {occ.comment && (
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:500, fontStyle:'italic' }}>"{occ.comment}"</div>
                )}
              </div>
              <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, fontWeight:800, color:'var(--text-muted)', fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap' }}>
                  <Clock size={11} /> {occ.time}
                </span>
                {occ.photos.length > 0 && (
                  <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, fontWeight:700, color:'var(--primary)', whiteSpace:'nowrap' }}>
                    <Camera size={10} /> {occ.photos.length}
                  </span>
                )}
                <ChevronRight size={14} style={{ color:'var(--text-faint)' }} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Stat Card ─────────────────────────────────────────────── */
function StatCard({ label, value, sub, icon: Icon, color, bg, gradient }: { label: string; value: string; sub?: string; icon: any; color: string; bg: string; gradient: string }) {
  return (
    <div
      style={{ padding:'clamp(16px,4vw,22px)', display:'flex', flexDirection:'column', gap:'clamp(10px,3vw,16px)', background:gradient, border:'1px solid var(--border)', borderRadius:20, position:'relative', overflow:'hidden', boxShadow:'0 4px 16px rgba(0,0,0,0.06)', transition:'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform='translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow='0 12px 28px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform='none'; (e.currentTarget as HTMLDivElement).style.boxShadow='0 4px 16px rgba(0,0,0,0.06)'; }}
    >
      {/* Decorative circle */}
      <div style={{ position:'absolute', top:-20, right:-20, width:90, height:90, borderRadius:'50%', background:bg, opacity:0.35 }} />
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', position:'relative' }}>
        <div style={{ width:'clamp(38px,10vw,48px)', height:'clamp(38px,10vw,48px)', borderRadius:14, background:bg, color:color, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 4px 14px ${color}33` }}>
          <Icon size={22} />
        </div>
        <Zap size={14} style={{ color, opacity:0.4, marginTop:4 }} />
      </div>
      <div style={{ position:'relative' }}>
        <div style={{ fontSize:'clamp(9px,2.5vw,11px)', fontWeight:900, color:'var(--text-muted)', letterSpacing:'0.12em', marginBottom:6, textTransform:'uppercase' }}>{label}</div>
        <div style={{ fontSize:'clamp(22px,6vw,30px)', fontWeight:900, color:'var(--text)', lineHeight:1, letterSpacing:'-0.02em' }}>{value}</div>
        {sub && <div style={{ fontSize:'clamp(10px,2.5vw,11px)', color:'var(--text-muted)', fontWeight:700, marginTop:5 }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────── */
export default function DashboardView({ occurrences, checklistState }: DashboardViewProps) {
  const [lightbox, setLightbox] = useState<{ photos: string[]; index: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'ocorrencias' | 'conformidades'>('ocorrencias');
  const [selectedOcc, setSelectedOcc] = useState<OccurrenceData | null>(null);
  const [selectedConform, setSelectedConform] = useState<any>(null);
  const [timelineMode, setTimelineMode] = useState<'filter' | 'all'>('filter');

  const verifiedCount = Object.values(checklistState).filter(v => v).length;
  const maxChecks = CHECKLIST_DATA.reduce((acc, s) => acc + s.items.length, 0);
  const validationProgress = maxChecks > 0 ? Math.round((verifiedCount / maxChecks) * 100) : 0;
  const totalPhotos = occurrences.reduce((acc, occ) => acc + occ.photos.length, 0);

  const allDayKeys = useMemo(() => {
    const todayKey = toLocalDateKey(new Date().toISOString());
    const fromOcc = [...new Set(occurrences.map(o => toLocalDateKey(o.created_at)))];
    const allKeys = [...new Set([todayKey, ...fromOcc])];
    return allKeys.sort((a, b) => b.localeCompare(a)).slice(0, 14);
  }, [occurrences]);

  const occCountByDay = useMemo(() => {
    const map: Record<string, number> = {};
    occurrences.forEach(o => {
      const dk = toLocalDateKey(o.created_at);
      map[dk] = (map[dk] || 0) + 1;
    });
    return map;
  }, [occurrences]);

  const [selectedDay, setSelectedDay] = useState<string>(() => allDayKeys[0] || toLocalDateKey(new Date().toISOString()));

  const allGroupedByDate = useMemo(() => {
    const map: Record<string, OccurrenceData[]> = {};
    occurrences.forEach(o => {
      const dk = toLocalDateKey(o.created_at);
      if (!map[dk]) map[dk] = [];
      map[dk].push(o);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [occurrences]);

  const dayOccurrences = useMemo(() => occurrences.filter(o => toLocalDateKey(o.created_at) === selectedDay), [occurrences, selectedDay]);
  const employeeGroups = useMemo(() => {
    const map: Record<string, OccurrenceData[]> = {};
    dayOccurrences.forEach(occ => {
      const rep = reporterLabel(occ.reporter);
      if (!map[rep]) map[rep] = [];
      map[rep].push(occ);
    });
    return map;
  }, [dayOccurrences]);

  const conformSections = CHECKLIST_DATA.map(section => {
    const conformItems = section.items.filter(item => checklistState[`${section.id}__${item}`] === true);
    return { section, conformItems };
  }).filter(({ conformItems }) => conformItems.length > 0);

  const stats = [
    { label: 'CONFORMIDADE', value: `${validationProgress}%`, sub: `${verifiedCount} de ${maxChecks} itens`, icon: Target, color: validationProgress >= 90 ? '#16a34a' : '#0d9488', bg: validationProgress >= 90 ? 'rgba(22,163,74,0.15)' : 'rgba(13,148,136,0.15)', gradient: validationProgress >= 90 ? 'linear-gradient(145deg,rgba(22,163,74,0.06),var(--surface))' : 'linear-gradient(145deg,rgba(13,148,136,0.06),var(--surface))' },
    { label: 'OCORRÊNCIAS', value: String(occurrences.length), sub: `Total registrado`, icon: AlertTriangle, color: '#d97706', bg: 'rgba(217,119,6,0.15)', gradient: 'linear-gradient(145deg,rgba(217,119,6,0.06),var(--surface))' },
    { label: 'EVIDÊNCIAS', value: String(totalPhotos), sub: `Fotos enviadas`, icon: Images, color: '#7c3aed', bg: 'rgba(124,58,237,0.15)', gradient: 'linear-gradient(145deg,rgba(124,58,237,0.06),var(--surface))' },
    { label: 'OPERADORES', value: String(new Set(occurrences.map(o => reporterLabel(o.reporter))).size), sub: `Ativos no período`, icon: Users, color: '#2563eb', bg: 'rgba(37,99,235,0.15)', gradient: 'linear-gradient(145deg,rgba(37,99,235,0.06),var(--surface))' },
  ];

  return (
    <>
      <style>{`
        @keyframes pulseDot {
          0%,100%{transform:scale(1);opacity:1}
          50%{transform:scale(1.4);opacity:0.6}
        }

        /* ── Stats Grid ── */
        .dash-stats-grid {
          padding: clamp(12px,4vw,24px) clamp(12px,4vw,24px) 0;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: clamp(8px,2vw,14px);
        }
        @media (max-width: 700px) {
          .dash-stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 340px) {
          .dash-stats-grid { grid-template-columns: 1fr; }
        }

        /* ── Tab Bar ── */
        .dash-tab-bar {
          display: flex;
          border-bottom: 1px solid var(--divider);
          background: var(--surface);
          margin-top: clamp(14px,4vw,24px);
          padding: 0 clamp(12px,4vw,24px);
          overflow-x: auto;
          scrollbar-width: none;
        }
        .dash-tab-btn {
          padding: clamp(10px,3vw,14px) clamp(10px,3vw,24px);
          font-size: clamp(10px,2.5vw,12px);
          font-weight: 900;
          border-bottom: 3px solid transparent;
          background: transparent;
          display: flex;
          align-items: center;
          gap: clamp(5px,2vw,8px);
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.06em;
          flex: 1;
          justify-content: center;
          white-space: nowrap;
          min-height: 44px;
        }
        .dash-tab-btn .tab-count {
          padding: 2px 6px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 900;
        }
        @media (max-width: 400px) {
          .dash-tab-btn .tab-label { display: none; }
        }

        /* ── Timeline toggle ── */
        .timeline-toggle {
          display: flex;
          align-items: center;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
        }
        .tgl-btn {
          padding: clamp(6px,2vw,8px) clamp(10px,3vw,16px);
          font-size: clamp(9px,2.5vw,11px);
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          letter-spacing: 0.06em;
          min-height: 36px;
          white-space: nowrap;
        }

        /* ── Content scroll ── */
        .content-scroll {
          flex: 1;
          overflow-y: auto;
          padding: clamp(12px,4vw,24px);
          display: flex;
          flex-direction: column;
          gap: clamp(14px,4vw,24px);
        }

        /* ── Employee grid ── */
        .emp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 380px), 1fr));
          gap: clamp(10px,3vw,16px);
        }

        /* ── Conform grid ── */
        .conform-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
          gap: clamp(8px,2vw,12px);
        }

        /* ── Calendar card ── */
        .cal-card {
          padding: clamp(14px,4vw,20px) clamp(14px,4vw,24px);
        }
        .cal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: clamp(10px,3vw,16px);
          flex-wrap: wrap;
          gap: 10px;
        }

        /* ── Conform progress card ── */
        .conf-prog-card {
          padding: clamp(16px,4vw,24px);
          border-radius: 20px;
          background: linear-gradient(135deg,rgba(22,163,74,0.08),rgba(13,148,136,0.04));
          border: 1px solid rgba(22,163,74,0.2);
          position: relative;
          overflow: hidden;
        }
        .conf-prog-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: clamp(12px,3vw,18px);
          position: relative;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* ── Lightbox ── */
        .lightbox-nav-row {
          display: flex;
          align-items: center;
          gap: clamp(8px,3vw,12px);
        }
        .lb-btn {
          width: 44px; height: 44px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.15);
          color: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
        }
      `}</style>

      {/* ── Stats Grid ── */}
      <div className="dash-stats-grid">
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* ── Tab Bar ── */}
      <div className="dash-tab-bar">
        {[
          { id:'ocorrencias' as const, label:'LINHA DO TEMPO', count:occurrences.length, icon: Activity, color:'#d97706' },
          { id:'conformidades' as const, label:'CONFORMIDADE', count:verifiedCount, icon: CheckCircle2, color:'#16a34a' },
        ].map(tab => (
          <button key={tab.id} type="button" className="dash-tab-btn"
            onClick={() => setActiveTab(tab.id)}
            style={{ color: activeTab === tab.id ? tab.color : 'var(--text-muted)', borderBottomColor: activeTab === tab.id ? tab.color : 'transparent' }}>
            <tab.icon size={15} />
            <span className="tab-label">{tab.label}</span>
            <span className="tab-count" style={{ background: activeTab === tab.id ? `${tab.color}18` : 'var(--surface-2)', color: activeTab === tab.id ? tab.color : 'var(--text-muted)' }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="content-scroll">

        {activeTab === 'ocorrencias' && (
          <>
            {/* Day Strip card */}
            <div className="card cal-card">
              <div className="cal-header">
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <Calendar size={14} style={{ color:'var(--primary)' }} />
                  <span style={{ fontSize:'clamp(10px,2.5vw,12px)', fontWeight:900, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Histórico Operacional</span>
                </div>
                <div className="timeline-toggle">
                  <button className="tgl-btn"
                    onClick={() => setTimelineMode('filter')}
                    style={{ background: timelineMode === 'filter' ? 'var(--primary)' : 'transparent', color: timelineMode === 'filter' ? '#fff' : 'var(--text-muted)' }}>
                    POR DIA
                  </button>
                  <button className="tgl-btn"
                    onClick={() => setTimelineMode('all')}
                    style={{ background: timelineMode === 'all' ? 'var(--primary)' : 'transparent', color: timelineMode === 'all' ? '#fff' : 'var(--text-muted)' }}>
                    TODOS
                  </button>
                </div>
              </div>
              <DayStrip days={allDayKeys} selected={selectedDay} occCountByDay={occCountByDay} onSelect={dk => { setSelectedDay(dk); setTimelineMode('filter'); }} />
            </div>

            {/* ── FILTER MODE ── */}
            {timelineMode === 'filter' && (
              <div>
                <DateSectionHeader dateKey={selectedDay} count={dayOccurrences.length} />
                {dayOccurrences.length === 0 ? (
                  <div style={{ padding:'clamp(32px,8vw,56px) clamp(16px,4vw,24px)', textAlign:'center', background:'var(--surface)', border:'2px dashed var(--border)', borderRadius:20 }}>
                    <div style={{ width:60, height:60, borderRadius:'50%', background:'rgba(22,163,74,0.1)', color:'#16a34a', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 0 24px rgba(22,163,74,0.2)' }}>
                      <Shield size={28} />
                    </div>
                    <p style={{ fontSize:'clamp(13px,4vw,16px)', fontWeight:800, color:'var(--text)' }}>Dia sem intercorrências</p>
                    <p style={{ fontSize:'clamp(12px,3vw,14px)', color:'var(--text-muted)', marginTop:6, fontWeight:500 }}>A operação fluiu dentro do padrão neste período.</p>
                  </div>
                ) : (
                  <div className="emp-grid">
                    {Object.entries(employeeGroups).map(([rep, occs]) => (
                      <EmployeeCard key={rep} reporter={rep} occs={occs} onSelectOcc={setSelectedOcc} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── ALL MODE ── */}
            {timelineMode === 'all' && (
              <div style={{ display:'flex', flexDirection:'column', gap:'clamp(20px,5vw,32px)' }}>
                {allGroupedByDate.length === 0 ? (
                  <div style={{ padding:'clamp(32px,8vw,56px) clamp(16px,4vw,24px)', textAlign:'center', background:'var(--surface)', border:'2px dashed var(--border)', borderRadius:20 }}>
                    <div style={{ width:60, height:60, borderRadius:'50%', background:'rgba(22,163,74,0.1)', color:'#16a34a', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                      <Shield size={28} />
                    </div>
                    <p style={{ fontSize:'clamp(13px,4vw,16px)', fontWeight:800, color:'var(--text)' }}>Nenhuma ocorrência registrada</p>
                  </div>
                ) : (
                  allGroupedByDate.map(([dateKey, dayOccs]) => {
                    const empGroups: Record<string, OccurrenceData[]> = {};
                    dayOccs.forEach(occ => {
                      const rep = reporterLabel(occ.reporter);
                      if (!empGroups[rep]) empGroups[rep] = [];
                      empGroups[rep].push(occ);
                    });
                    return (
                      <div key={dateKey}>
                        <DateSectionHeader dateKey={dateKey} count={dayOccs.length} />
                        <div className="emp-grid">
                          {Object.entries(empGroups).map(([rep, occs]) => (
                            <EmployeeCard key={rep} reporter={rep} occs={occs} onSelectOcc={setSelectedOcc} />
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'conformidades' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'clamp(14px,4vw,20px)' }}>
            {/* Progress card */}
            <div className="conf-prog-card">
              <div style={{ position:'absolute', top:-30, right:-30, width:140, height:140, borderRadius:'50%', background:'rgba(22,163,74,0.06)' }} />
              <div className="conf-prog-header">
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 8px rgba(34,197,94,0.6)' }} />
                    <h3 style={{ fontSize:'clamp(10px,2.5vw,12px)', fontWeight:900, color:'#16a34a', letterSpacing:'0.1em' }}>CONFORMIDADE DA PLANTA</h3>
                  </div>
                  <p style={{ fontSize:'clamp(11px,3vw,13px)', fontWeight:600, color:'var(--text-muted)' }}>{verifiedCount} de {maxChecks} pontos de controle verificados</p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:'clamp(28px,7vw,36px)', fontWeight:900, color:'#16a34a', lineHeight:1, letterSpacing:'-0.03em' }}>{validationProgress}%</div>
                  <div style={{ fontSize:'clamp(10px,2.5vw,11px)', fontWeight:700, color:'var(--text-muted)', marginTop:4 }}>
                    {validationProgress >= 90 ? '🏆 Excelente' : validationProgress >= 70 ? '✅ Bom' : '⚡ Em progresso'}
                  </div>
                </div>
              </div>
              <div style={{ height:10, background:'rgba(22,163,74,0.1)', borderRadius:999, overflow:'hidden', position:'relative' }}>
                <div style={{ height:'100%', width:`${validationProgress}%`, background:'linear-gradient(90deg,#16a34a,#22c55e,#4ade80)', borderRadius:999, transition:'all 1s ease', boxShadow:'0 2px 10px rgba(34,197,94,0.4)' }} />
              </div>
            </div>

            {/* Sections */}
            <div className="conform-grid">
              {conformSections.map(({ section, conformItems }, i) => (
                <ConformSection key={section.id} title={section.title} sectionId={section.id} items={conformItems} total={section.items.length} defaultOpen={i === 0} onDetail={setSelectedConform} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedOcc && <OccurrenceDetailModal occurrence={selectedOcc} onClose={() => setSelectedOcc(null)} onOpenPhoto={(p, i) => { setSelectedOcc(null); setLightbox({ photos: p, index: i }); }} />}
      {selectedConform && <ConformDetailModal detail={selectedConform} onClose={() => setSelectedConform(null)} />}

      {/* Lightbox */}
      {lightbox && (
        <div style={{ position:'fixed', inset:0, background:'rgba(2,6,23,0.96)', backdropFilter:'blur(16px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:4000, padding:'clamp(12px,4vw,24px)' }}>
          <button onClick={() => setLightbox(null)} style={{ position:'absolute', top:'clamp(12px,3vw,24px)', right:'clamp(12px,3vw,24px)', width:48, height:48, borderRadius:'50%', background:'rgba(255,255,255,0.08)', color:'#fff', border:'1px solid rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', backdropFilter:'blur(8px)' }}>
            <X size={24}/>
          </button>
          <div style={{ maxWidth:'min(1200px,94vw)', width:'100%', display:'flex', flexDirection:'column', alignItems:'center', gap:'clamp(10px,3vw,16px)' }}>
            <img src={lightbox.photos[lightbox.index]} alt={`Foto ${lightbox.index + 1}`} style={{ maxWidth:'100%', maxHeight:'80dvh', objectFit:'contain', borderRadius:'clamp(12px,4vw,20px)', boxShadow:'0 40px 80px rgba(0,0,0,0.8)' }}/>
            <div className="lightbox-nav-row">
              {lightbox.index > 0 && (
                <button className="lb-btn" onClick={() => setLightbox(l => l && { ...l, index: l.index - 1 })}>
                  <ChevronLeft size={18} />
                </button>
              )}
              <div style={{ background:'rgba(255,255,255,0.08)', padding:'6px clamp(12px,4vw,16px)', borderRadius:99, color:'rgba(255,255,255,0.8)', fontSize:13, fontWeight:700, backdropFilter:'blur(8px)', whiteSpace:'nowrap' }}>
                {lightbox.index + 1} / {lightbox.photos.length}
              </div>
              {lightbox.index < lightbox.photos.length - 1 && (
                <button className="lb-btn" onClick={() => setLightbox(l => l && { ...l, index: l.index + 1 })}>
                  <ChevronRight size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
