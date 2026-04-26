/**
 * DashboardView v4 — Premium Supervisor & Admin Command Center
 * Features a high-fidelity activity strip, employee-focused analytics cards,
 * and a modular compliance tracking system with glassmorphism.
 */
import { useState, useMemo } from 'react';
import {
  BarChart3, CheckCircle2, AlertTriangle, Images, ClipboardList,
  X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  User, Clock, MessageSquare, Camera, Calendar, Hash, Activity,
  LayoutGrid, TrendingUp, Users
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

function formatFullDate(dateKey: string): string {
  const d = new Date(dateKey + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
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

  return (
    <>
      <style>{`
        .occ-detail-overlay {
          position:fixed;inset:0;background:rgba(2,6,23,0.85);
          backdrop-filter:blur(12px);display:flex;align-items:center;
          justify-content:center;z-index:3000;padding:var(--s4);
          animation:fadeInOD 0.2s ease;
        }
        .occ-detail-box {
          width:100%;max-width:580px;background:var(--surface);
          border:1px solid var(--border);border-radius:var(--r-2xl);
          box-shadow:var(--sh-xl);max-height:92dvh;
          display:flex;flex-direction:column;overflow:hidden;
          animation:slideUpOD 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media (max-width:480px) {
          .occ-detail-overlay{align-items:flex-end;padding:0;}
          .occ-detail-box{max-width:100%;border-bottom-left-radius:0;border-bottom-right-radius:0;max-height:96dvh;}
        }
        .occ-detail-scroll{overflow-y:auto;flex:1; padding: 24px;}
        @keyframes fadeInOD{from{opacity:0}to{opacity:1}}
        @keyframes slideUpOD{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:none}}
      `}</style>
      <div className="occ-detail-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="occ-detail-box">
          <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--sidebar-border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, background:'var(--sidebar-bg)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:42, height:42, borderRadius:'var(--r-xl)', background:'rgba(217,119,6,0.2)', color:'var(--warning)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 4px 12px rgba(217,119,6,0.2)' }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.12em', fontWeight:800, color:'rgba(255,255,255,0.45)', marginBottom:2 }}>PONTO CRÍTICO DETECTADO</div>
                <div style={{ fontSize:15, fontWeight:800, color:'#fff', fontFamily:'var(--font-display)' }}>{occurrence.section}</div>
              </div>
            </div>
            <button onClick={onClose} className="action-btn" style={{ width:36, height:36 }}>
              <X size={16} />
            </button>
          </div>

          <div className="occ-detail-scroll">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
              {[
                { icon: User, label:'Responsável', value: reporter },
                { icon: Calendar, label:'Data', value: dateStr },
                { icon: Clock, label:'Registro', value: occurrence.time },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{ display:'flex', flexDirection:'column', gap:6, padding:'12px', background:'var(--surface-2)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:4, color:'var(--text-muted)' }}>
                    <Icon size={12} />
                    <span style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</span>
                  </div>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <Hash size={14} style={{ color:'var(--warning)' }} />
                  <span style={{ fontSize:12, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--warning)' }}>Descrição da Não Conformidade</span>
                </div>
                <div style={{ padding:'16px 20px', background:'var(--warning-hl)', border:'1px solid rgba(217,119,6,0.25)', borderRadius:'var(--r-xl)', boxShadow:'inset 0 1px 2px rgba(217,119,6,0.05)' }}>
                  <p style={{ fontSize:15, fontWeight:700, lineHeight:1.6, color:'var(--text)', fontFamily:'var(--font-display)' }}>{occurrence.item}</p>
                </div>
              </div>

              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <MessageSquare size={14} style={{ color:'var(--text-muted)' }} />
                  <span style={{ fontSize:12, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)' }}>Observações do Operador</span>
                </div>
                <div style={{ padding:'16px 20px', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)' }}>
                  <p style={{ fontSize:14, lineHeight:1.8, fontWeight:500, color: occurrence.comment ? 'var(--text)' : 'var(--text-muted)' }}>
                    {occurrence.comment || 'Nenhuma observação adicional registrada.'}
                  </p>
                </div>
              </div>

              {occurrence.photos.length > 0 && (
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <Camera size={14} style={{ color:'var(--primary)' }} />
                    <span style={{ fontSize:12, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--primary)' }}>Evidências — {occurrence.photos.length} Fotos</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:12 }}>
                    {occurrence.photos.map((p, i) => (
                      <button key={i} type="button" onClick={() => onOpenPhoto(occurrence.photos, i)}
                        style={{ position:'relative', borderRadius:'var(--r-xl)', overflow:'hidden', border:'1px solid var(--border)', aspectRatio:'1', padding:0, cursor:'zoom-in', background:'var(--surface-2)', transition:'transform 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.transform='scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
                        <img src={p} alt={`Foto ${i+1}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} loading="lazy" />
                        <div style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,0.6)', color:'#fff', fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:99, backdropFilter:'blur(4px)' }}>{i+1}</div>
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

/* ─── Conformidade Detail Modal ────────────────────────────── */
function ConformDetailModal({ detail, onClose }: { detail: { sectionTitle: string; items: string[]; total: number }; onClose: () => void }) {
  return (
    <>
      <style>{`
        .conf-detail-overlay{position:fixed;inset:0;background:rgba(2,6,23,0.85);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;z-index:3000;padding:var(--s4);animation:fadeInCF 0.2s ease;}
        .conf-detail-box{width:100%;max-width:540px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-2xl);box-shadow:var(--sh-xl);max-height:92dvh;display:flex;flex-direction:column;overflow:hidden;animation:slideUpCF 0.3s cubic-bezier(0.16, 1, 0.3, 1);}
        @media(max-width:480px){.conf-detail-overlay{align-items:flex-end;padding:0;}.conf-detail-box{max-width:100%;border-bottom-left-radius:0;border-bottom-right-radius:0;max-height:96dvh;}}
        @keyframes fadeInCF{from{opacity:0}to{opacity:1}}
        @keyframes slideUpCF{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:none}}
      `}</style>
      <div className="conf-detail-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="conf-detail-box">
          <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, background:'var(--success-hl)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:42, height:42, borderRadius:'var(--r-xl)', background:'rgba(22,163,74,0.2)', color:'var(--success)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:800, color:'var(--success)', marginBottom:2 }}>Itens Validados</div>
                <div style={{ fontSize:15, fontWeight:800, color:'var(--text)', fontFamily:'var(--font-display)' }}>{detail.sectionTitle}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ width:36, height:36, borderRadius:'var(--r-lg)', background:'rgba(22,163,74,0.15)', border:'1px solid rgba(22,163,74,0.25)', color:'var(--success)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ padding:'12px 24px', borderBottom:'1px solid var(--border)', background:'var(--surface-2)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, color:'var(--text-muted)', fontWeight:700 }}>{detail.items.length} de {detail.total} verificados</span>
            <span style={{ fontSize:12, fontWeight:900, color:'var(--success)', fontFamily:'var(--font-display)' }}>{Math.round((detail.items.length / detail.total) * 100)}% CONCLUÍDO</span>
          </div>
          <div style={{ overflowY:'auto', flex:1, padding:'20px 24px', display:'flex', flexDirection:'column', gap:10 }}>
            {detail.items.map((item, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:'var(--r-xl)', background:'var(--success-hl)', border:'1px solid rgba(22,163,74,0.15)' }}>
                <CheckCircle2 size={16} style={{ color:'var(--success)', flexShrink:0 }} />
                <span style={{ fontSize:14, fontWeight:700, lineHeight:1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── ConformSection — colapsável ─────────────────────────── */
function ConformSection({ title, sectionId, items, total, defaultOpen, onDetail }: { title: string; sectionId: string; items: string[]; total: number; defaultOpen: boolean; onDetail: (d: any) => void }) {
  const [open, setOpen] = useState(defaultOpen);
  const pct = total > 0 ? Math.round((items.length / total) * 100) : 0;

  return (
    <div className="card-hover" style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-2xl)', overflow:'hidden', transition:'all 0.2s' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', background: open ? 'var(--success-hl)' : 'transparent', borderBottom: open ? '1px solid rgba(22,163,74,0.15)' : 'none', cursor:'pointer', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
          <div style={{ width:38, height:38, borderRadius:'var(--r-xl)', background:'rgba(22,163,74,0.15)', color:'var(--success)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <CheckCircle2 size={18} />
          </div>
          <div style={{ minWidth:0, textAlign:'left' }}>
            <div style={{ fontSize:14, fontWeight:800, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--text)', fontFamily:'var(--font-display)' }}>{title}</div>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--success)', marginTop:2 }}>{items.length}/{total} Itens · {pct}%</div>
          </div>
        </div>
        {open ? <ChevronUp size={18} style={{ color:'var(--success)', flexShrink:0 }} /> : <ChevronDown size={18} style={{ color:'var(--success)', flexShrink:0 }} />}
      </button>

      {open && (
        <div style={{ display:'flex', flexDirection:'column', background:'linear-gradient(180deg, var(--surface) 0%, var(--surface-2) 100%)' }}>
          {items.map((item, i) => (
            <button key={`${sectionId}-${i}`} type="button" onClick={() => onDetail({ sectionTitle: title, items, total })}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'14px 24px', borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none', background:'transparent', cursor:'pointer', textAlign:'left', transition:'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(22,163,74,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <CheckCircle2 size={14} style={{ color:'var(--success)', flexShrink:0 }} />
              <span style={{ fontSize:13, fontWeight:600, lineHeight:1.5, flex:1, color:'var(--text)' }}>{item}</span>
              <ChevronRight size={14} style={{ color:'var(--text-faint)', flexShrink:0 }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Day Strip ────────────────────────────────────────────── */
function DayStrip({ days, selected, occCountByDay, onSelect }: { days: string[]; selected: string; occCountByDay: Record<string, number>; onSelect: (d: string) => void }) {
  const todayKey = toLocalDateKey(new Date().toISOString());

  return (
    <div style={{ overflowX:'auto', display:'flex', gap:10, padding:'4px 0 12px', scrollbarWidth:'none', position:'relative' }}>
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
              padding: '12px 16px',
              borderRadius: 'var(--r-2xl)',
              border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
              background: isSelected ? 'var(--primary-hl)' : 'var(--surface)',
              cursor: 'pointer',
              minWidth: 70,
              transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              position: 'relative',
              boxShadow: isSelected ? '0 8px 20px rgba(13,148,136,0.2)' : 'none',
              transform: isSelected ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            {isToday && (
              <span style={{ position:'absolute', top:-8, background:'var(--primary)', color:'#fff', fontSize:8, fontWeight:900, padding:'2px 6px', borderRadius:99, letterSpacing:'0.1em', boxShadow:'0 2px 6px rgba(13,148,136,0.3)' }}>HOJE</span>
            )}
            <span style={{ fontSize:10, fontWeight:800, color: isSelected ? 'var(--primary)' : 'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{dayName}</span>
            <span style={{ fontSize:20, fontWeight:900, lineHeight:1, color: isSelected ? 'var(--primary)' : 'var(--text)', fontFamily:'var(--font-display)' }}>{dayNum}</span>
            <span style={{ fontSize:10, color: isSelected ? 'var(--primary)' : 'var(--text-muted)', fontWeight:700, letterSpacing:'0.05em' }}>{monthShort.toUpperCase()}</span>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', marginTop:4 }}>
              {count > 0 ? (
                <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', minWidth:20, height:20, borderRadius:99, fontSize:10, fontWeight:900, background: isSelected ? 'var(--warning)' : 'var(--warning-hl)', color: isSelected ? '#fff' : 'var(--warning)', padding:'0 6px', boxShadow:'0 2px 6px rgba(217,119,6,0.2)' }}>{count}</span>
              ) : (
                <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--success)', opacity:0.8 }} />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Employee Card ─────────────────────────────────────────── */
function EmployeeCard({ reporter, occs, onSelectOcc }: { reporter: string; occs: OccurrenceData[]; onSelectOcc: (occ: OccurrenceData) => void }) {
  const [expanded, setExpanded] = useState(true);
  const ini = initials(reporter);
  const colors = [
    ['#0d9488','#f0fdfa'], ['#7c3aed','#f5f3ff'], ['#db2777','#fdf2f8'],
    ['#d97706','#fffbeb'], ['#16a34a','#f0fdf4'], ['#2563eb','#eff6ff'],
  ];
  const colorIdx = reporter.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  const [avatarFg, avatarBg] = colors[colorIdx];

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-2xl)', overflow:'hidden', boxShadow:'var(--sh-sm)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', background:'linear-gradient(90deg, var(--surface-2) 0%, var(--surface) 100%)', borderBottom: expanded ? '1px solid var(--border)' : 'none' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, minWidth:0 }}>
          <div style={{ width:46, height:46, borderRadius:'50%', background:avatarFg, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900, flexShrink:0, border:'2px solid #fff', boxShadow:`0 4px 12px ${avatarFg}44` }}>
            {ini}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:15, fontWeight:800, color:'var(--text)', fontFamily:'var(--font-display)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{reporter}</div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:4, height:20, padding:'0 10px', borderRadius:99, fontSize:10, fontWeight:800, background:'var(--warning-hl)', color:'var(--warning)', border:'1px solid rgba(217,119,6,0.1)' }}>
                <AlertTriangle size={10} /> {occs.length} {occs.length === 1 ? 'ALERTA' : 'ALERTAS'}
              </span>
              {occs.some(o => o.photos.length > 0) && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:4, height:20, padding:'0 10px', borderRadius:99, fontSize:10, fontWeight:800, background:'var(--primary-hl)', color:'var(--primary)', border:'1px solid rgba(13,148,136,0.1)' }}>
                  <Camera size={10} /> {occs.reduce((a, o) => a + o.photos.length, 0)} FOTOS
                </span>
              )}
            </div>
          </div>
        </div>
        <button type="button" onClick={() => setExpanded(e => !e)} className="action-btn" style={{ width:36, height:36 }}>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {expanded && (
        <div style={{ display:'flex', flexDirection:'column' }}>
          {occs.map((occ, i) => (
            <button
              key={occ.id}
              type="button"
              onClick={() => onSelectOcc(occ)}
              style={{
                width:'100%', display:'flex', alignItems:'center', gap:16,
                padding:'18px 24px',
                borderBottom: i < occs.length - 1 ? '1px solid var(--border)' : 'none',
                background:'transparent', cursor:'pointer', textAlign:'left',
                transition:'background 0.2s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ width:4, height:32, background:'var(--warning)', borderRadius:99, flexShrink:0 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:11, fontWeight:900, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{occ.section}</span>
                </div>
                <div style={{ fontSize:14, fontWeight:800, color:'var(--text)', fontFamily:'var(--font-display)', lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {occ.item}
                </div>
                {occ.comment && (
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:500, fontStyle:'italic' }}>
                    "{occ.comment}"
                  </div>
                )}
              </div>
              <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:800, color:'var(--text-faint)', fontVariantNumeric:'tabular-nums' }}>
                  <Clock size={11} /> {occ.time}
                </span>
                <ChevronRight size={16} style={{ color:'var(--text-faint)' }} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────── */
export default function DashboardView({ occurrences, checklistState }: DashboardViewProps) {
  const [lightbox, setLightbox] = useState<{ photos: string[]; index: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'ocorrencias' | 'conformidades'>('ocorrencias');
  const [selectedOcc, setSelectedOcc] = useState<OccurrenceData | null>(null);
  const [selectedConform, setSelectedConform] = useState<any>(null);

  const verifiedCount = Object.values(checklistState).filter(v => v).length;
  const maxChecks = CHECKLIST_DATA.reduce((acc, s) => acc + s.items.length, 0);
  const validationProgress = maxChecks > 0 ? Math.round((verifiedCount / maxChecks) * 100) : 0;
  const totalPhotos = occurrences.reduce((acc, occ) => acc + occ.photos.length, 0);

  const allDayKeys = useMemo(() => {
    const todayKey = toLocalDateKey(new Date().toISOString());
    const fromOcc = [...new Set(occurrences.map(o => toLocalDateKey(o.created_at)))];
    const allKeys = [...new Set([todayKey, ...fromOcc])];
    return allKeys.sort((a, b) => b.localeCompare(a)).slice(0, 7);
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
    { label: 'CONFORMIDADE', value: `${validationProgress}%`, sub: `${verifiedCount}/${maxChecks}`, icon: Activity, color: validationProgress >= 90 ? 'var(--success)' : 'var(--primary)', bg: validationProgress >= 90 ? 'var(--success-hl)' : 'var(--primary-hl)' },
    { label: 'OCORRÊNCIAS', value: String(occurrences.length), icon: AlertTriangle, color: 'var(--warning)', bg: 'var(--warning-hl)' },
    { label: 'EVIDÊNCIAS', value: String(totalPhotos), icon: Images, color: '#7c3aed', bg: '#f5f3ff' },
    { label: 'OPERADORES', value: String(new Set(occurrences.map(o => o.reporter)).size), icon: Users, color: '#2563eb', bg: '#eff6ff' },
  ];

  return (
    <>
      <style>{`
        .admin-stats-grid { 
          padding: 24px; 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); 
          gap: 16px; 
        }
        @media (max-width: 480px) {
          .admin-stats-grid { 
            grid-template-columns: repeat(2, 1fr); 
            padding: 16px; 
            gap: 12px; 
          }
        }
        @media (max-width: 360px) {
          .admin-stats-grid { 
            grid-template-columns: 1fr; 
          }
        }

        .dashboard-content-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 20px;
        }
        @media (max-width: 600px) {
          .dashboard-content-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }

        .mobile-tab-btn span { font-size: 11px; }
        @media (max-width: 360px) {
          .mobile-tab-btn { padding: 12px 8px !important; }
          .mobile-tab-btn span { font-size: 9px; }
        }
      `}</style>

      <div className="admin-stats-grid">
        {stats.map(stat => (
          <div key={stat.label} className="card card-hover" style={{ padding:'20px', display:'flex', alignItems:'center', gap:16, background:'linear-gradient(180deg, var(--surface) 0%, var(--surface-2) 100%)' }}>
            <div style={{ width:48, height:48, borderRadius:'var(--r-xl)', background:stat.bg, color:stat.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 4px 12px ${stat.color}22` }}>
              <stat.icon size={22} />
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:900, color:'var(--text-muted)', letterSpacing:'0.1em' }}>{stat.label}</div>
              <div style={{ fontSize:26, fontWeight:900, color:'var(--text)', fontFamily:'var(--font-display)', lineHeight:1.1 }}>{stat.value}</div>
              {stat.sub && <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:700, marginTop:2 }}>{stat.sub} itens</div>}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding:'0 24px', borderBottom:'1px solid var(--divider)', background:'var(--surface)', display:'flex', gap:0, marginTop:24 }}>
        {[
          { id:'ocorrencias' as const, label:'LINHA DO TEMPO', count:occurrences.length, icon: Activity, active:'var(--warning)', hl:'var(--warning-hl)' },
          { id:'conformidades' as const, label:'CONFORMIDADE', count:verifiedCount, icon: LayoutGrid, active:'var(--success)', hl:'var(--success-hl)' },
        ].map(tab => (
          <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
            style={{ padding:'16px 24px', fontSize:12, fontWeight:900, color: activeTab === tab.id ? tab.active : 'var(--text-muted)', borderBottom: activeTab === tab.id ? `3px solid ${tab.active}` : '3px solid transparent', background:'transparent', display:'flex', alignItems:'center', gap:10, cursor:'pointer', transition:'all 0.2s', letterSpacing:'0.1em', flex: 1, justifyContent:'center' }}>
            <tab.icon size={16} />
            <span>{tab.label}</span>
            <span style={{ background: activeTab === tab.id ? tab.hl : 'var(--surface-2)', color: activeTab === tab.id ? tab.active : 'var(--text-muted)', padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:900 }}>{tab.count}</span>
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'24px', display:'flex', flexDirection:'column', gap:24 }}>
        {activeTab === 'ocorrencias' && (
          <>
            <div className="card" style={{ padding:'20px 24px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                <Calendar size={14} style={{ color:'var(--primary)' }} />
                <span style={{ fontSize:12, fontWeight:900, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', fontFamily:'var(--font-display)' }}>Histórico Operacional</span>
              </div>
              <DayStrip days={allDayKeys} selected={selectedDay} occCountByDay={occCountByDay} onSelect={setSelectedDay} />
            </div>

            <div>
              <div style={{ marginBottom:16 }}>
                <h3 style={{ fontSize:18, fontWeight:900, color:'var(--text)', fontFamily:'var(--font-display)' }}>{formatFullDate(selectedDay).toUpperCase()}</h3>
                <div style={{ height:3, width:40, background:'var(--primary)', marginTop:6, borderRadius:99 }} />
              </div>

              {dayOccurrences.length === 0 ? (
                <div className="card" style={{ padding:'60px 24px', textAlign:'center', background:'var(--surface-2)', border:'2px dashed var(--border)', borderRadius:'var(--r-2xl)' }}>
                  <div style={{ width:56, height:56, borderRadius:'50%', background:'var(--success-hl)', color:'var(--success)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                    <Shield size={28} />
                  </div>
                  <p style={{ fontSize:16, fontWeight:800, color:'var(--text)', fontFamily:'var(--font-display)' }}>Dia sem intercorrências</p>
                  <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:4, fontWeight:500 }}>A operação fluiu conforme o padrão neste período.</p>
                </div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(400px, 1fr))', gap:20 }}>
                  {Object.entries(employeeGroups).map(([rep, occs]) => (
                    <EmployeeCard key={rep} reporter={rep} occs={occs} onSelectOcc={setSelectedOcc} />
                  ))}
                </div>
              )}
            </>
          </>
        )}

        {activeTab === 'conformidades' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div className="card" style={{ padding:'24px', background:'linear-gradient(135deg, var(--success-hl) 0%, var(--surface) 100%)', borderLeft:'6px solid var(--success)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
                <div>
                  <h3 style={{ fontSize:13, fontWeight:900, color:'var(--success)', letterSpacing:'0.1em', marginBottom:4 }}>CONFORMIDADE DA PLANTA</h3>
                  <p style={{ fontSize:13, fontWeight:600, color:'var(--text-muted)' }}>{verifiedCount} de {maxChecks} pontos de controle verificados</p>
                </div>
                <div style={{ fontSize:32, fontWeight:900, color:'var(--success)', fontFamily:'var(--font-display)' }}>{validationProgress}%</div>
              </div>
              <div style={{ height:10, background:'rgba(22,163,74,0.1)', borderRadius:999, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${validationProgress}%`, background:'var(--success)', borderRadius:999, transition:'all 1s ease' }} />
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:12 }}>
              {conformSections.map(({ section, conformItems }, i) => (
                <ConformSection key={section.id} title={section.title} sectionId={section.id} items={conformItems} total={section.items.length} defaultOpen={i === 0} onDetail={setSelectedConform} />
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedOcc && <OccurrenceDetailModal occurrence={selectedOcc} onClose={() => setSelectedOcc(null)} onOpenPhoto={(p, i) => { setSelectedOcc(null); setLightbox({ photos: p, index: i }); }} />}
      {selectedConform && <ConformDetailModal detail={selectedConform} onClose={() => setSelectedConform(null)} />}

      {lightbox && (
        <div style={{ position:'fixed', inset:0, background:'rgba(2,6,23,0.95)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:4000, padding:24 }}>
          <button onClick={() => setLightbox(null)} style={{ position:'absolute', top:24, right:24, width:48, height:48, borderRadius:'50%', background:'rgba(255,255,255,0.1)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}><X size={24}/></button>
          <div style={{ maxWidth:'min(1200px,94vw)', display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
            <img src={lightbox.photos[lightbox.index]} alt={`Foto ${lightbox.index + 1}`} style={{ maxWidth:'100%', maxHeight:'80vh', objectFit:'contain', borderRadius:16, boxShadow:'0 32px 80px rgba(0,0,0,0.7)' }}/>
            <div style={{ background:'rgba(255,255,255,0.1)', padding: '6px 16px', borderRadius: 99, color:'#fff',fontSize:13,fontWeight:700 }}>Foto {lightbox.index + 1} de {lightbox.photos.length}</div>
          </div>
        </div>
      )}
    </>
  );
}
