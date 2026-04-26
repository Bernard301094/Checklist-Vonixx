/**
 * DashboardView — Supervisor & Admin
 *
 * Design B+C:
 *   • Strip horizontal de dias (últimos 7 dias) com indicador de atividade
 *   • Cards por funcionário (sempre visíveis) para o dia selecionado
 *   • Cada card de registro → clic abre modal de detalhe
 *   • Tab Conformidades mantém design original melhorado
 */
import { useState, useMemo } from 'react';
import {
  BarChart3, CheckCircle2, AlertTriangle, Images, ClipboardList,
  X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  User, Clock, MessageSquare, Camera, Calendar, Hash,
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
  // Usa horário local para evitar desfasagem de fuso
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
          position:fixed;inset:0;background:rgba(2,6,23,0.88);
          backdrop-filter:blur(8px);display:flex;align-items:center;
          justify-content:center;z-index:3000;padding:var(--s4);
          animation:fadeInOD 0.15s ease;
        }
        .occ-detail-box {
          width:100%;max-width:560px;background:var(--surface);
          border:1px solid var(--border);border-radius:var(--r-2xl);
          box-shadow:var(--sh-xl);max-height:92dvh;
          display:flex;flex-direction:column;overflow:hidden;
          animation:slideUpOD 0.2s ease;
        }
        @media (max-width:480px) {
          .occ-detail-overlay{align-items:flex-end;padding:0;}
          .occ-detail-box{max-width:100%;border-bottom-left-radius:0;border-bottom-right-radius:0;max-height:96dvh;}
        }
        .occ-detail-scroll{overflow-y:auto;flex:1;}
        @keyframes fadeInOD{from{opacity:0}to{opacity:1}}
        @keyframes slideUpOD{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
      `}</style>
      <div className="occ-detail-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="occ-detail-box">
          <div style={{ padding:'var(--s4) var(--s5)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, background:'var(--sidebar-bg)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'var(--s3)' }}>
              <div style={{ width:40, height:40, borderRadius:'var(--r-xl)', background:'rgba(217,119,6,0.2)', color:'var(--warning)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <AlertTriangle size={18} />
              </div>
              <div>
                <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700, color:'rgba(255,255,255,0.45)', marginBottom:2 }}>Detalhe da Ocorrência</div>
                <div style={{ fontSize:'var(--text-sm)', fontWeight:700, color:'#fff' }}>{occurrence.section}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ width:36, height:36, borderRadius:'var(--r-lg)', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.7)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <X size={16} />
            </button>
          </div>

          <div className="occ-detail-scroll">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'var(--s3)', padding:'var(--s4) var(--s5)', borderBottom:'1px solid var(--border)' }}>
              {[
                { icon: User, label:'Funcionário', value: reporter },
                { icon: Calendar, label:'Data', value: dateStr },
                { icon: Clock, label:'Hora', value: occurrence.time },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{ display:'flex', flexDirection:'column', gap:'var(--s1)', padding:'var(--s3)', background:'var(--surface-2)', borderRadius:'var(--r-lg)', border:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:4, color:'var(--text-muted)' }}>
                    <Icon size={12} />
                    <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em' }}>{label}</span>
                  </div>
                  <div style={{ fontSize:'var(--text-xs)', fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ padding:'var(--s4) var(--s5)', display:'flex', flexDirection:'column', gap:'var(--s4)' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:'var(--s2)' }}>
                  <Hash size={13} style={{ color:'var(--warning)' }} />
                  <span style={{ fontSize:'var(--text-xs)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--warning)' }}>Fator crítico</span>
                </div>
                <div style={{ padding:'var(--s4)', background:'var(--warning-hl)', border:'1px solid rgba(217,119,6,0.18)', borderRadius:'var(--r-xl)' }}>
                  <p style={{ fontSize:'var(--text-sm)', fontWeight:700, lineHeight:1.5 }}>{occurrence.item}</p>
                </div>
              </div>

              <div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:'var(--s2)' }}>
                  <MessageSquare size={13} style={{ color:'var(--text-muted)' }} />
                  <span style={{ fontSize:'var(--text-xs)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--text-muted)' }}>Comentário do operador</span>
                </div>
                <div style={{ padding:'var(--s4)', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)' }}>
                  <p style={{ fontSize:'var(--text-sm)', lineHeight:1.7, fontWeight:500, color: occurrence.comment ? 'var(--text)' : 'var(--text-muted)' }}>
                    {occurrence.comment || 'Nenhum comentário informado.'}
                  </p>
                </div>
              </div>

              {occurrence.photos.length > 0 && (
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:'var(--s2)' }}>
                    <Camera size={13} style={{ color:'var(--primary)' }} />
                    <span style={{ fontSize:'var(--text-xs)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--primary)' }}>Evidências — {occurrence.photos.length} foto(s)</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:'var(--s3)' }}>
                    {occurrence.photos.map((p, i) => (
                      <button key={i} type="button" onClick={() => onOpenPhoto(occurrence.photos, i)}
                        style={{ position:'relative', borderRadius:'var(--r-lg)', overflow:'hidden', border:'1px solid var(--border)', aspectRatio:'1', padding:0, cursor:'zoom-in', background:'var(--surface-2)' }}>
                        <img src={p} alt={`Foto ${i+1}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} loading="lazy" />
                        <div style={{ position:'absolute', bottom:6, left:6, background:'rgba(15,23,42,0.75)', color:'#fff', fontSize:10, fontWeight:700, padding:'3px 7px', borderRadius:999 }}>{i+1}</div>
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
interface ConformDetail {
  sectionTitle: string;
  items: string[];
  total: number;
}

function ConformDetailModal({ detail, onClose }: { detail: ConformDetail; onClose: () => void }) {
  return (
    <>
      <style>{`
        .conf-detail-overlay{position:fixed;inset:0;background:rgba(2,6,23,0.88);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:3000;padding:var(--s4);animation:fadeInCF 0.15s ease;}
        .conf-detail-box{width:100%;max-width:520px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-2xl);box-shadow:var(--sh-xl);max-height:92dvh;display:flex;flex-direction:column;overflow:hidden;animation:slideUpCF 0.2s ease;}
        @media(max-width:480px){.conf-detail-overlay{align-items:flex-end;padding:0;}.conf-detail-box{max-width:100%;border-bottom-left-radius:0;border-bottom-right-radius:0;max-height:96dvh;}}
        @keyframes fadeInCF{from{opacity:0}to{opacity:1}}
        @keyframes slideUpCF{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
      `}</style>
      <div className="conf-detail-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="conf-detail-box">
          <div style={{ padding:'var(--s4) var(--s5)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, background:'var(--success-hl)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'var(--s3)' }}>
              <div style={{ width:40, height:40, borderRadius:'var(--r-xl)', background:'rgba(22,163,74,0.2)', color:'var(--success)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <CheckCircle2 size={18} />
              </div>
              <div>
                <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700, color:'var(--success)', marginBottom:2 }}>Itens Conformes</div>
                <div style={{ fontSize:'var(--text-sm)', fontWeight:700, color:'var(--text)' }}>{detail.sectionTitle}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ width:36, height:36, borderRadius:'var(--r-lg)', background:'rgba(22,163,74,0.15)', border:'1px solid rgba(22,163,74,0.25)', color:'var(--success)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ padding:'var(--s3) var(--s5)', borderBottom:'1px solid var(--border)', background:'var(--surface-2)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)', fontWeight:600 }}>{detail.items.length} de {detail.total} itens verificados</span>
            <span style={{ fontSize:'var(--text-xs)', fontWeight:800, color:'var(--success)' }}>{Math.round((detail.items.length / detail.total) * 100)}% desta seção</span>
          </div>
          <div style={{ overflowY:'auto', flex:1, padding:'var(--s4) var(--s5)', display:'flex', flexDirection:'column', gap:'var(--s2)' }}>
            {detail.items.map((item, i) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'var(--s3)', padding:'var(--s3) var(--s4)', borderRadius:'var(--r-lg)', background:'var(--success-hl)', border:'1px solid rgba(22,163,74,0.18)' }}>
                <CheckCircle2 size={16} style={{ color:'var(--success)', marginTop:2, flexShrink:0 }} />
                <span style={{ fontSize:'var(--text-sm)', fontWeight:600, lineHeight:1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── ConformSection — colapsável ─────────────────────────── */
interface ConformSectionProps {
  title: string;
  sectionId: string;
  items: string[];
  total: number;
  defaultOpen: boolean;
  onDetail: (d: ConformDetail) => void;
}

function ConformSection({ title, sectionId, items, total, defaultOpen, onDetail }: ConformSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const pct = total > 0 ? Math.round((items.length / total) * 100) : 0;

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', overflow:'hidden' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'var(--s3) var(--s4)', background:'var(--success-hl)', borderBottom: open ? '1px solid rgba(22,163,74,0.18)' : 'none', cursor:'pointer', gap:'var(--s3)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'var(--s3)', minWidth:0 }}>
          <div style={{ width:34, height:34, borderRadius:'var(--r-lg)', background:'rgba(22,163,74,0.18)', color:'var(--success)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <CheckCircle2 size={16} />
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:'var(--text-sm)', fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--text)' }}>{title}</div>
            <div style={{ fontSize:'var(--text-xs)', fontWeight:600, color:'var(--success)' }}>{items.length}/{total} itens conformes · {pct}%</div>
          </div>
        </div>
        {open ? <ChevronUp size={16} style={{ color:'var(--success)', flexShrink:0 }} /> : <ChevronDown size={16} style={{ color:'var(--success)', flexShrink:0 }} />}
      </button>

      {open && (
        <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
          {items.map((item, i) => (
            <button key={`${sectionId}-${i}`} type="button" onClick={() => onDetail({ sectionTitle: title, items, total })}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:'var(--s3)', padding:'var(--s3) var(--s5)', borderBottom: i < items.length - 1 ? '1px solid rgba(22,163,74,0.1)' : 'none', background:'transparent', cursor:'pointer', textAlign:'left', transition:'background var(--t)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(22,163,74,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <CheckCircle2 size={14} style={{ color:'var(--success)', flexShrink:0 }} />
              <span style={{ fontSize:'var(--text-sm)', fontWeight:600, lineHeight:1.5, flex:1 }}>{item}</span>
              <ChevronRight size={13} style={{ color:'var(--text-faint)', flexShrink:0 }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Day Strip ────────────────────────────────────────────── */
interface DayStripProps {
  days: string[];         // YYYY-MM-DD sorted desc
  selected: string;
  occCountByDay: Record<string, number>;
  onSelect: (d: string) => void;
}

function DayStrip({ days, selected, occCountByDay, onSelect }: DayStripProps) {
  const todayKey = toLocalDateKey(new Date().toISOString());

  return (
    <div style={{ overflowX:'auto', display:'flex', gap:'var(--s2)', padding:'var(--s2) 0', scrollbarWidth:'none' }}>
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
              gap: 'var(--s1)',
              padding: 'var(--s3) var(--s4)',
              borderRadius: 'var(--r-xl)',
              border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
              background: isSelected ? 'var(--primary-hl)' : 'var(--surface)',
              cursor: 'pointer',
              minWidth: 64,
              transition: 'all 150ms ease',
              position: 'relative',
            }}
          >
            {/* Today badge */}
            {isToday && (
              <span style={{ position:'absolute', top:-1, right:-1, background:'var(--primary)', color:'#fff', fontSize:9, fontWeight:800, padding:'1px 5px', borderRadius:999, letterSpacing:'0.05em' }}>HOJE</span>
            )}
            <span style={{ fontSize:'var(--text-xs)', fontWeight:700, color: isSelected ? 'var(--primary)' : 'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{dayName}</span>
            <span style={{ fontSize:'var(--text-lg)', fontWeight:800, lineHeight:1, color: isSelected ? 'var(--primary)' : 'var(--text)' }}>{dayNum}</span>
            <span style={{ fontSize:'var(--text-xs)', color: isSelected ? 'var(--primary)' : 'var(--text-muted)', fontWeight:600 }}>{monthShort}</span>
            {/* Occurrence indicator dot */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', marginTop:2 }}>
              {count > 0 ? (
                <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', minWidth:18, height:18, borderRadius:999, fontSize:10, fontWeight:800, background: isSelected ? 'var(--warning)' : 'var(--warning-hl)', color: isSelected ? '#fff' : 'var(--warning)', padding:'0 5px' }}>{count}</span>
              ) : (
                <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--success)', display:'block' }} />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Employee Card ─────────────────────────────────────────── */
interface EmployeeCardProps {
  reporter: string;
  occs: OccurrenceData[];
  onSelectOcc: (occ: OccurrenceData) => void;
}

function EmployeeCard({ reporter, occs, onSelectOcc }: EmployeeCardProps) {
  const [expanded, setExpanded] = useState(true);
  const ini = initials(reporter);

  // Avatar color based on name hash
  const colors = [
    ['#0891b2','#cffafe'], ['#7c3aed','#ede9fe'], ['#be185d','#fce7f3'],
    ['#b45309','#fef3c7'], ['#15803d','#dcfce7'], ['#0369a1','#e0f2fe'],
  ];
  const colorIdx = reporter.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  const [avatarBg, avatarFg] = colors[colorIdx];

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-2xl)', overflow:'hidden', boxShadow:'var(--sh-sm)' }}>
      {/* Employee header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'var(--s4) var(--s5)', background:'var(--surface-2)', borderBottom: expanded ? '1px solid var(--border)' : 'none' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'var(--s3)', minWidth:0 }}>
          <div style={{ width:42, height:42, borderRadius:'50%', background:avatarBg, color:avatarFg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, flexShrink:0, border:`2px solid ${avatarBg}` }}>
            {ini || <User size={16} />}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:'var(--text-sm)', fontWeight:800, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{reporter}</div>
            <div style={{ display:'flex', alignItems:'center', gap:'var(--s2)', marginTop:2 }}>
              <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', height:18, padding:'0 7px', borderRadius:999, fontSize:10, fontWeight:700, background:'var(--warning-hl)', color:'var(--warning)' }}>
                {occs.length} {occs.length === 1 ? 'ocorrência' : 'ocorrências'}
              </span>
              {occs.some(o => o.photos.length > 0) && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:3, height:18, padding:'0 7px', borderRadius:999, fontSize:10, fontWeight:700, background:'var(--primary-hl)', color:'var(--primary)' }}>
                  <Camera size={10} /> {occs.reduce((a, o) => a + o.photos.length, 0)} fotos
                </span>
              )}
            </div>
          </div>
        </div>
        <button type="button" onClick={() => setExpanded(e => !e)}
          style={{ width:32, height:32, borderRadius:'var(--r-lg)', background:'var(--surface)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
          {expanded ? <ChevronUp size={15} style={{ color:'var(--text-muted)' }} /> : <ChevronDown size={15} style={{ color:'var(--text-muted)' }} />}
        </button>
      </div>

      {/* Occurrence rows */}
      {expanded && (
        <div style={{ display:'flex', flexDirection:'column' }}>
          {occs.map((occ, i) => (
            <button
              key={occ.id}
              type="button"
              onClick={() => onSelectOcc(occ)}
              style={{
                width:'100%', display:'flex', alignItems:'center', gap:'var(--s3)',
                padding:'var(--s4) var(--s5)',
                borderBottom: i < occs.length - 1 ? '1px solid var(--border)' : 'none',
                background:'transparent', cursor:'pointer', textAlign:'left',
                transition:'background 150ms ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Accent bar */}
              <div style={{ width:3, alignSelf:'stretch', background:'var(--warning)', borderRadius:'var(--r-full)', flexShrink:0 }} />

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'var(--s2)', marginBottom:'var(--s1)', flexWrap:'wrap' }}>
                  <span style={{ fontSize:'var(--text-xs)', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{occ.section}</span>
                  {occ.photos.length > 0 && (
                    <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, fontWeight:700, color:'var(--primary)', background:'var(--primary-hl)', padding:'1px 6px', borderRadius:999 }}>
                      <Camera size={10} /> {occ.photos.length}
                    </span>
                  )}
                </div>
                <div style={{ fontSize:'var(--text-sm)', fontWeight:700, lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--text)' }}>
                  {occ.item}
                </div>
                {occ.comment && (
                  <div style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)', marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:500 }}>
                    {occ.comment}
                  </div>
                )}
              </div>

              <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'var(--s1)' }}>
                <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, fontWeight:700, color:'var(--text-muted)' }}>
                  <Clock size={10} /> {occ.time}
                </span>
                <ChevronRight size={13} style={{ color:'var(--text-faint)' }} />
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
  const [selectedConform, setSelectedConform] = useState<ConformDetail | null>(null);

  /* ── Stats ── */
  const verifiedCount = Object.values(checklistState).filter(v => v).length;
  const maxChecks = CHECKLIST_DATA.reduce((acc, s) => acc + s.items.length, 0);
  const validationProgress = maxChecks > 0 ? Math.round((verifiedCount / maxChecks) * 100) : 0;
  const totalPhotos = occurrences.reduce((acc, occ) => acc + occ.photos.length, 0);
  const totalSections = new Set(occurrences.map(occ => occ.section)).size;

  const stats = [
    { label: 'Progresso', value: `${validationProgress}%`, detail: `${verifiedCount}/${maxChecks} itens`, icon: BarChart3, tone: validationProgress >= 100 ? 'var(--success)' : validationProgress >= 50 ? 'var(--warning)' : 'var(--primary)', bg: validationProgress >= 100 ? 'var(--success-hl)' : validationProgress >= 50 ? 'var(--warning-hl)' : 'var(--primary-hl)' },
    { label: 'Ocorrências', value: String(occurrences.length), detail: 'Registros críticos', icon: AlertTriangle, tone: occurrences.length > 0 ? 'var(--warning)' : 'var(--success)', bg: occurrences.length > 0 ? 'var(--warning-hl)' : 'var(--success-hl)' },
    { label: 'Evidências', value: String(totalPhotos), detail: 'Fotos anexadas', icon: Images, tone: 'var(--primary)', bg: 'var(--primary-hl)' },
    { label: 'Seções', value: String(totalSections), detail: 'Áreas com ocorrência', icon: ClipboardList, tone: 'var(--text)', bg: 'var(--surface-2)' },
  ];

  /* ── Day strip: últimos 7 dias que tenham ocorrências + hoje ── */
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

  /* ── Occurrences for selected day, grouped by reporter ── */
  const dayOccurrences = useMemo(() => {
    return occurrences.filter(o => toLocalDateKey(o.created_at) === selectedDay);
  }, [occurrences, selectedDay]);

  const employeeGroups = useMemo(() => {
    const map: Record<string, OccurrenceData[]> = {};
    dayOccurrences.forEach(occ => {
      const rep = reporterLabel(occ.reporter);
      if (!map[rep]) map[rep] = [];
      map[rep].push(occ);
    });
    return map;
  }, [dayOccurrences]);

  /* ── Conformidades por seção ── */
  const conformSections = CHECKLIST_DATA.map(section => {
    const conformItems = section.items.filter(item => checklistState[`${section.id}__${item}`] === true);
    return { section, conformItems };
  }).filter(({ conformItems }) => conformItems.length > 0);

  const totalConformes = conformSections.reduce((acc, { conformItems }) => acc + conformItems.length, 0);

  /* ── Lightbox ── */
  const closeLightbox = () => setLightbox(null);
  const prevPhoto = () => setLightbox(p => p ? { ...p, index: p.index === 0 ? p.photos.length - 1 : p.index - 1 } : null);
  const nextPhoto = () => setLightbox(p => p ? { ...p, index: p.index === p.photos.length - 1 ? 0 : p.index + 1 } : null);

  return (
    <>
      {/* ── Stats Cards ── */}
      <div className="admin-stats-grid">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card animate-in" style={{ padding:'var(--s5)', display:'flex', alignItems:'center', gap:'var(--s4)' }}>
              <div style={{ width:46, height:46, borderRadius:'var(--r-xl)', background:stat.bg, color:stat.tone, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon size={21} />
              </div>
              <div>
                <div style={{ fontSize:'var(--text-xs)', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700, color:'var(--text-muted)', marginBottom:'var(--s1)' }}>{stat.label}</div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:'var(--text-lg)', fontWeight:700, lineHeight:1.1 }}>{stat.value}</div>
                <div style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)', marginTop:4, fontWeight:600 }}>{stat.detail}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Tabs ── */}
      <div className="mobile-tabs" style={{ display:'flex', gap:0, borderBottom:'1px solid var(--divider)', background:'var(--surface)', paddingInline:'var(--s5)' }}>
        {([
          { id:'ocorrencias' as const, label:'Ocorrências', count:occurrences.length, icon: AlertTriangle, active:'var(--warning)', hl:'var(--warning-hl)' },
          { id:'conformidades' as const, label:'Conformidades', count:totalConformes, icon: CheckCircle2, active:'var(--success)', hl:'var(--success-hl)' },
        ]).map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} type="button" className="mobile-tab-btn" onClick={() => setActiveTab(tab.id)}
              style={{ padding:'var(--s4) var(--s5)', fontSize:'var(--text-sm)', fontWeight:700, color: isActive ? tab.active : 'var(--text-muted)', borderBottom: isActive ? `2px solid ${tab.active}` : '2px solid transparent', background:'transparent', display:'flex', alignItems:'center', gap:'var(--s2)', cursor:'pointer', transition:'color 150ms ease', whiteSpace:'nowrap' }}>
              <Icon size={15} />
              {tab.label}
              <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', minWidth:20, height:20, borderRadius:999, fontSize:11, fontWeight:700, background: isActive ? tab.hl : 'var(--surface-2)', color: isActive ? tab.active : 'var(--text-muted)', padding:'0 6px' }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ── */}
      <div style={{ flex:1, overflowY:'auto', padding:'var(--s5)', display:'flex', flexDirection:'column', gap:'var(--s4)' }}>

        {/* ══ OCORRÊNCIAS ══ */}
        {activeTab === 'ocorrencias' && (
          occurrences.length === 0 ? (
            <div className="card" style={{ flex:1, minHeight:300, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'var(--s8)' }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'var(--success-hl)', color:'var(--success)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'var(--s4)' }}>
                <CheckCircle2 size={30} />
              </div>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:'var(--text-lg)', fontWeight:700 }}>Nenhuma ocorrência registrada</h2>
              <p style={{ fontSize:'var(--text-sm)', color:'var(--text-muted)', marginTop:'var(--s2)', maxWidth:440 }}>O checklist segue sem desvios registrados.</p>
            </div>
          ) : (
            <>
              {/* Day Strip */}
              <div className="card" style={{ padding:'var(--s4) var(--s5)', overflow:'hidden' }}>
                <div style={{ fontSize:'var(--text-xs)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:'var(--s3)', display:'flex', alignItems:'center', gap:'var(--s2)' }}>
                  <Calendar size={12} /> Selecionar dia
                </div>
                <DayStrip
                  days={allDayKeys}
                  selected={selectedDay}
                  occCountByDay={occCountByDay}
                  onSelect={setSelectedDay}
                />
              </div>

              {/* Day title */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'var(--s2)' }}>
                <div>
                  <h3 style={{ fontSize:'var(--text-base)', fontWeight:800, color:'var(--text)' }}>{formatFullDate(selectedDay)}</h3>
                  <p style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)', marginTop:2, fontWeight:600 }}>
                    {dayOccurrences.length === 0 ? 'Nenhuma ocorrência neste dia' : `${dayOccurrences.length} ocorrência(s) · ${Object.keys(employeeGroups).length} funcionário(s)`}
                  </p>
                </div>
              </div>

              {/* Employee cards */}
              {dayOccurrences.length === 0 ? (
                <div className="card" style={{ padding:'var(--s8)', textAlign:'center', background:'var(--surface-2)', border:'1px dashed var(--border)' }}>
                  <CheckCircle2 size={32} style={{ color:'var(--success)', margin:'0 auto 12px' }} />
                  <p style={{ fontSize:'var(--text-sm)', fontWeight:700, color:'var(--text-muted)' }}>Sem ocorrências neste dia</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'var(--s4)' }}>
                  {Object.entries(employeeGroups).map(([rep, occs]) => (
                    <EmployeeCard key={rep} reporter={rep} occs={occs} onSelectOcc={setSelectedOcc} />
                  ))}
                </div>
              )}
            </>
          )
        )}

        {/* ══ CONFORMIDADES ══ */}
        {activeTab === 'conformidades' && (
          conformSections.length === 0 ? (
            <div className="card" style={{ flex:1, minHeight:300, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'var(--s8)' }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'var(--surface-2)', color:'var(--text-muted)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'var(--s4)' }}>
                <ClipboardList size={30} />
              </div>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:'var(--text-lg)', fontWeight:700 }}>Nenhum item conforme ainda</h2>
              <p style={{ fontSize:'var(--text-sm)', color:'var(--text-muted)', marginTop:'var(--s2)', maxWidth:440 }}>Os colaboradores ainda não marcaram itens como conformes.</p>
            </div>
          ) : (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:'var(--s3)', padding:'var(--s3) var(--s4)', background:'var(--success-hl)', border:'1px solid rgba(22,163,74,0.18)', borderRadius:'var(--r-xl)' }}>
                <CheckCircle2 size={18} style={{ color:'var(--success)', flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'var(--text-xs)', fontWeight:800, color:'var(--success)' }}>
                    {totalConformes} de {maxChecks} itens verificados ({validationProgress}% do total)
                  </div>
                  <div style={{ marginTop:6, height:6, background:'rgba(22,163,74,0.15)', borderRadius:999, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${validationProgress}%`, background:'var(--success)', borderRadius:999, transition:'width 0.6s ease' }} />
                  </div>
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:'var(--s3)' }}>
                {conformSections.map(({ section, conformItems }, i) => (
                  <ConformSection
                    key={section.id}
                    title={section.title}
                    sectionId={section.id}
                    items={conformItems}
                    total={section.items.length}
                    defaultOpen={i === 0}
                    onDetail={setSelectedConform}
                  />
                ))}
              </div>
            </>
          )
        )}
      </div>

      {/* ── Modals ── */}
      {selectedOcc && (
        <OccurrenceDetailModal
          occurrence={selectedOcc}
          onClose={() => setSelectedOcc(null)}
          onOpenPhoto={(photos, idx) => { setSelectedOcc(null); setLightbox({ photos, index: idx }); }}
        />
      )}
      {selectedConform && <ConformDetailModal detail={selectedConform} onClose={() => setSelectedConform(null)} />}

      {/* ── Lightbox ── */}
      {lightbox && (
        <div style={{ position:'fixed', inset:0, background:'rgba(2,6,23,0.93)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:4000, padding:'var(--s4)' }}>
          <button type="button" onClick={closeLightbox} style={{ position:'absolute', top:20, right:20, width:44, height:44, borderRadius:'50%', background:'rgba(255,255,255,0.1)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,255,255,0.15)', cursor:'pointer' }}><X size={20} /></button>
          {lightbox.photos.length > 1 && (
            <button type="button" onClick={prevPhoto} style={{ position:'absolute', left:16, width:48, height:48, borderRadius:'50%', background:'rgba(255,255,255,0.1)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,255,255,0.15)', cursor:'pointer' }}><ChevronLeft size={22} /></button>
          )}
          <div style={{ maxWidth:'min(1100px,92vw)', maxHeight:'88vh', display:'flex', flexDirection:'column', gap:'var(--s3)', alignItems:'center' }}>
            <img src={lightbox.photos[lightbox.index]} alt={`Foto ampliada ${lightbox.index + 1}`} style={{ maxWidth:'100%', maxHeight:'80vh', objectFit:'contain', borderRadius:'var(--r-xl)', boxShadow:'var(--sh-xl)' }} />
            <div style={{ color:'rgba(255,255,255,0.8)', fontSize:'var(--text-sm)', fontWeight:600, textAlign:'center' }}>Foto {lightbox.index + 1} de {lightbox.photos.length}</div>
          </div>
          {lightbox.photos.length > 1 && (
            <button type="button" onClick={nextPhoto} style={{ position:'absolute', right:16, width:48, height:48, borderRadius:'50%', background:'rgba(255,255,255,0.1)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,255,255,0.15)', cursor:'pointer' }}><ChevronRight size={22} /></button>
          )}
        </div>
      )}
    </>
  );
}
