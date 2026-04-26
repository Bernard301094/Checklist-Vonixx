/**
 * MyRecordsView — Vista de registros propios del colaborador
 * Aparece en la sección de perfil. Solo muestra registros del propio usuario.
 * Otros colaboradores NO pueden ver registros ajenos.
 */
import { useState, useMemo } from 'react';
import {
  AlertTriangle, CheckCircle2, Camera, Clock, Calendar,
  ChevronDown, ChevronUp, ChevronRight, X, Hash, MessageSquare,
  FileText, ShieldCheck,
} from 'lucide-react';
import { OccurrenceData } from '../types';
import { CHECKLIST_DATA } from '../constants';

interface MyRecordsViewProps {
  occurrences: OccurrenceData[];
  checklistState: Record<string, boolean>;
  reporterName: string;
}

function toLocalDateKey(iso: string | undefined): string {
  if (!iso) return new Date().toISOString().slice(0, 10);
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatFullDate(dk: string): string {
  const d = new Date(dk + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function reporterLabel(raw: string): string {
  return raw.split(' - Auth:')[0].trim();
}

/* ─── Occurrence Detail Modal (same style as Dashboard) ─────── */
function OccDetailModal({ occ, onClose, onPhoto }: { occ: OccurrenceData; onClose: () => void; onPhoto: (photos: string[], i: number) => void }) {
  const dateStr = occ.created_at
    ? new Date(occ.created_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' })
    : '—';

  return (
    <>
      <style>{`
        .myrec-overlay{position:fixed;inset:0;background:rgba(2,6,23,0.88);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:3000;padding:var(--s4);animation:fadeInMR 0.15s ease;}
        .myrec-box{width:100%;max-width:520px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-2xl);box-shadow:var(--sh-xl);max-height:92dvh;display:flex;flex-direction:column;overflow:hidden;animation:slideUpMR 0.2s ease;}
        @media(max-width:480px){.myrec-overlay{align-items:flex-end;padding:0;}.myrec-box{max-width:100%;border-bottom-left-radius:0;border-bottom-right-radius:0;max-height:96dvh;}}
        @keyframes fadeInMR{from{opacity:0}to{opacity:1}}
        @keyframes slideUpMR{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
      `}</style>
      <div className="myrec-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="myrec-box">
          <div style={{ padding:'var(--s4) var(--s5)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, background:'var(--sidebar-bg)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'var(--s3)' }}>
              <div style={{ width:40, height:40, borderRadius:'var(--r-xl)', background:'rgba(217,119,6,0.2)', color:'var(--warning)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <AlertTriangle size={18} />
              </div>
              <div>
                <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700, color:'rgba(255,255,255,0.45)', marginBottom:2 }}>Minha Ocorrência</div>
                <div style={{ fontSize:'var(--text-sm)', fontWeight:700, color:'#fff' }}>{occ.section}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ width:36, height:36, borderRadius:'var(--r-lg)', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.7)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ overflowY:'auto', flex:1 }}>
            {/* Meta */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--s3)', padding:'var(--s4) var(--s5)', borderBottom:'1px solid var(--border)' }}>
              {[
                { icon: Calendar, label:'Data', value: dateStr },
                { icon: Clock, label:'Hora', value: occ.time },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{ display:'flex', flexDirection:'column', gap:'var(--s1)', padding:'var(--s3)', background:'var(--surface-2)', borderRadius:'var(--r-lg)', border:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:4, color:'var(--text-muted)' }}>
                    <Icon size={12} />
                    <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em' }}>{label}</span>
                  </div>
                  <div style={{ fontSize:'var(--text-xs)', fontWeight:700, color:'var(--text)' }}>{value}</div>
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
                  <p style={{ fontSize:'var(--text-sm)', fontWeight:700, lineHeight:1.5 }}>{occ.item}</p>
                </div>
              </div>

              <div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:'var(--s2)' }}>
                  <MessageSquare size={13} style={{ color:'var(--text-muted)' }} />
                  <span style={{ fontSize:'var(--text-xs)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--text-muted)' }}>Meu comentário</span>
                </div>
                <div style={{ padding:'var(--s4)', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)' }}>
                  <p style={{ fontSize:'var(--text-sm)', lineHeight:1.7, fontWeight:500, color: occ.comment ? 'var(--text)' : 'var(--text-muted)' }}>
                    {occ.comment || 'Nenhum comentário informado.'}
                  </p>
                </div>
              </div>

              {occ.photos.length > 0 && (
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:'var(--s2)' }}>
                    <Camera size={13} style={{ color:'var(--primary)' }} />
                    <span style={{ fontSize:'var(--text-xs)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--primary)' }}>Minhas evidências — {occ.photos.length} foto(s)</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:'var(--s3)' }}>
                    {occ.photos.map((p, i) => (
                      <button key={i} type="button" onClick={() => onPhoto(occ.photos, i)}
                        style={{ position:'relative', borderRadius:'var(--r-lg)', overflow:'hidden', border:'1px solid var(--border)', aspectRatio:'1', padding:0, cursor:'zoom-in', background:'var(--surface-2)' }}>
                        <img src={p} alt={`Foto ${i+1}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} loading="lazy" />
                        <div style={{ position:'absolute', bottom:5, left:5, background:'rgba(15,23,42,0.75)', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:999 }}>{i+1}</div>
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

/* ─── Day Group ─────────────────────────────────────────────── */
function DayGroup({ dateKey, occs, onSelect }: { dateKey: string; occs: OccurrenceData[]; onSelect: (o: OccurrenceData) => void }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'var(--s2)' }}>
      {/* Date header */}
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ display:'flex', alignItems:'center', gap:'var(--s2)', background:'none', cursor:'pointer', textAlign:'left', padding:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'var(--s2)', padding:'var(--s2) var(--s3)', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:'var(--r-full)' }}>
          <Calendar size={12} style={{ color:'var(--primary)' }} />
          <span style={{ fontSize:'var(--text-xs)', fontWeight:800, color:'var(--text)' }}>{formatFullDate(dateKey)}</span>
        </div>
        <div style={{ flex:1, height:1, background:'var(--divider)' }} />
        <span style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4 }}>
          {occs.length} item(s)
          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </span>
      </button>

      {open && (
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--s2)', paddingLeft:'var(--s2)' }}>
          {occs.map(occ => (
            <button key={occ.id} type="button" onClick={() => onSelect(occ)}
              style={{ display:'flex', alignItems:'center', gap:'var(--s3)', padding:'var(--s3) var(--s4)', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', cursor:'pointer', textAlign:'left', transition:'background 150ms ease' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}>
              <div style={{ width:3, alignSelf:'stretch', background:'var(--warning)', borderRadius:'var(--r-full)', flexShrink:0 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'var(--text-xs)', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>{occ.section}</div>
                <div style={{ fontSize:'var(--text-sm)', fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{occ.item}</div>
                {occ.comment && (
                  <div style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{occ.comment}</div>
                )}
              </div>
              <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'var(--s1)' }}>
                {occ.photos.length > 0 && (
                  <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, fontWeight:700, color:'var(--primary)', background:'var(--primary-hl)', padding:'1px 6px', borderRadius:999 }}>
                    <Camera size={10} /> {occ.photos.length}
                  </span>
                )}
                <span style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:3 }}>
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

/* ─── Main Export ────────────────────────────────────────────── */
export default function MyRecordsView({ occurrences, checklistState, reporterName }: MyRecordsViewProps) {
  const [selectedOcc, setSelectedOcc] = useState<OccurrenceData | null>(null);
  const [lightbox, setLightbox] = useState<{ photos: string[]; index: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'ocorrencias' | 'conformidades'>('ocorrencias');

  // Filter: only MY occurrences
  const myOccs = useMemo(() => {
    return occurrences.filter(o => {
      const rep = reporterLabel(o.reporter).toLowerCase();
      const me = reporterName.trim().toLowerCase();
      return rep.includes(me) || me.includes(rep);
    });
  }, [occurrences, reporterName]);

  // Group by day
  const byDay = useMemo(() => {
    const map: Record<string, OccurrenceData[]> = {};
    myOccs.forEach(o => {
      const dk = toLocalDateKey(o.created_at);
      if (!map[dk]) map[dk] = [];
      map[dk].push(o);
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [myOccs]);

  // My conform items
  const myConforms = useMemo(() => {
    return CHECKLIST_DATA.map(section => {
      const items = section.items.filter(item => checklistState[`${section.id}__${item}`] === true);
      return { section, items };
    }).filter(({ items }) => items.length > 0);
  }, [checklistState]);

  const totalConforms = myConforms.reduce((a, c) => a + c.items.length, 0);
  const maxChecks = CHECKLIST_DATA.reduce((acc, s) => acc + s.items.length, 0);

  const closeLightbox = () => setLightbox(null);
  const prevPhoto = () => setLightbox(p => p ? { ...p, index: p.index === 0 ? p.photos.length-1 : p.index-1 } : null);
  const nextPhoto = () => setLightbox(p => p ? { ...p, index: p.index === p.photos.length-1 ? 0 : p.index+1 } : null);

  return (
    <section className="card" style={{ overflow:'hidden', marginBottom:'var(--s6)' }}>
      {/* Section header */}
      <div style={{ padding:'var(--s5) var(--s6)', borderBottom:'1px solid var(--divider)', background:'var(--surface)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'var(--s3)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'var(--s3)' }}>
          <div style={{ width:38, height:38, borderRadius:'var(--r-xl)', background:'var(--primary-hl)', color:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <FileText size={18} />
          </div>
          <div>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'var(--text-lg)', fontWeight:700 }}>Meus Registros</h2>
            <p style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)', marginTop:2 }}>Histórico pessoal — apenas você pode ver estes dados</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'var(--s2)', padding:'var(--s2) var(--s3)', background:'var(--primary-hl)', borderRadius:'var(--r-full)', border:'1px solid rgba(0,0,0,0.06)' }}>
          <ShieldCheck size={13} style={{ color:'var(--primary)' }} />
          <span style={{ fontSize:'var(--text-xs)', fontWeight:700, color:'var(--primary)' }}>Privado</span>
        </div>
      </div>

      {/* Privacy notice */}
      <div style={{ padding:'var(--s3) var(--s6)', background:'var(--surface-2)', borderBottom:'1px solid var(--divider)', display:'flex', alignItems:'center', gap:'var(--s2)' }}>
        <ShieldCheck size={13} style={{ color:'var(--text-muted)', flexShrink:0 }} />
        <p style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)', lineHeight:1.5 }}>
          Outros colaboradores <strong>não têm acesso</strong> aos seus registros. Supervisores e administradores podem visualizá-los no dashboard.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--divider)', paddingInline:'var(--s5)', background:'var(--surface)' }}>
        {[
          { id:'ocorrencias' as const, label:'Ocorrências', count:myOccs.length, icon:AlertTriangle, active:'var(--warning)', hl:'var(--warning-hl)' },
          { id:'conformidades' as const, label:'Conformidades', count:totalConforms, icon:CheckCircle2, active:'var(--success)', hl:'var(--success-hl)' },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              style={{ padding:'var(--s3) var(--s4)', fontSize:'var(--text-sm)', fontWeight:700, color: isActive ? tab.active : 'var(--text-muted)', borderBottom: isActive ? `2px solid ${tab.active}` : '2px solid transparent', background:'transparent', display:'flex', alignItems:'center', gap:'var(--s2)', cursor:'pointer', transition:'color 150ms ease', whiteSpace:'nowrap' }}>
              <Icon size={14} />
              {tab.label}
              <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', minWidth:20, height:20, borderRadius:999, fontSize:11, fontWeight:700, background: isActive ? tab.hl : 'var(--surface-2)', color: isActive ? tab.active : 'var(--text-muted)', padding:'0 6px' }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ padding:'var(--s5) var(--s6)', display:'flex', flexDirection:'column', gap:'var(--s4)' }}>

        {/* ── Ocorrências ── */}
        {activeTab === 'ocorrencias' && (
          myOccs.length === 0 ? (
            <div style={{ textAlign:'center', padding:'var(--s8)' }}>
              <CheckCircle2 size={36} style={{ color:'var(--success)', margin:'0 auto 12px' }} />
              <p style={{ fontSize:'var(--text-sm)', fontWeight:700, color:'var(--text-muted)' }}>Você ainda não registrou ocorrências.</p>
              <p style={{ fontSize:'var(--text-xs)', color:'var(--text-faint)', marginTop:4 }}>Use o botão ⚠ ao lado de cada item do checklist para registrar.</p>
            </div>
          ) : (
            byDay.map(([dk, occs]) => (
              <DayGroup key={dk} dateKey={dk} occs={occs} onSelect={setSelectedOcc} />
            ))
          )
        )}

        {/* ── Conformidades ── */}
        {activeTab === 'conformidades' && (
          myConforms.length === 0 ? (
            <div style={{ textAlign:'center', padding:'var(--s8)' }}>
              <CheckCircle2 size={36} style={{ color:'var(--text-faint)', margin:'0 auto 12px' }} />
              <p style={{ fontSize:'var(--text-sm)', fontWeight:700, color:'var(--text-muted)' }}>Nenhum item marcado como conforme ainda.</p>
            </div>
          ) : (
            <>
              {/* Progress bar */}
              <div style={{ display:'flex', alignItems:'center', gap:'var(--s3)', padding:'var(--s3) var(--s4)', background:'var(--success-hl)', border:'1px solid rgba(22,163,74,0.18)', borderRadius:'var(--r-xl)' }}>
                <CheckCircle2 size={16} style={{ color:'var(--success)', flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'var(--text-xs)', fontWeight:800, color:'var(--success)' }}>
                    {totalConforms} de {maxChecks} itens verificados por você
                  </div>
                  <div style={{ marginTop:5, height:5, background:'rgba(22,163,74,0.15)', borderRadius:999, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${Math.round((totalConforms/maxChecks)*100)}%`, background:'var(--success)', borderRadius:999, transition:'width 0.6s ease' }} />
                  </div>
                </div>
              </div>

              {myConforms.map(({ section, items }) => {
                const pct = Math.round((items.length / section.items.length) * 100);
                return (
                  <div key={section.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', overflow:'hidden' }}>
                    <div style={{ padding:'var(--s3) var(--s4)', background:'var(--success-hl)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'var(--s3)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'var(--s3)', minWidth:0 }}>
                        <CheckCircle2 size={16} style={{ color:'var(--success)', flexShrink:0 }} />
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontSize:'var(--text-sm)', fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{section.title}</div>
                          <div style={{ fontSize:'var(--text-xs)', fontWeight:600, color:'var(--success)' }}>{items.length}/{section.items.length} · {pct}%</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column' }}>
                      {items.map((item, i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:'var(--s3)', padding:'var(--s3) var(--s4) var(--s3) var(--s5)', borderBottom: i < items.length-1 ? '1px solid rgba(22,163,74,0.1)' : 'none' }}>
                          <CheckCircle2 size={13} style={{ color:'var(--success)', flexShrink:0 }} />
                          <span style={{ fontSize:'var(--text-sm)', fontWeight:600, lineHeight:1.5 }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )
        )}
      </div>

      {/* Modals */}
      {selectedOcc && (
        <OccDetailModal
          occ={selectedOcc}
          onClose={() => setSelectedOcc(null)}
          onPhoto={(photos, i) => { setSelectedOcc(null); setLightbox({ photos, index: i }); }}
        />
      )}

      {lightbox && (
        <div style={{ position:'fixed', inset:0, background:'rgba(2,6,23,0.93)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:4000, padding:'var(--s4)' }}>
          <button type="button" onClick={closeLightbox} style={{ position:'absolute', top:20, right:20, width:44, height:44, borderRadius:'50%', background:'rgba(255,255,255,0.1)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,255,255,0.15)', cursor:'pointer' }}><X size={20} /></button>
          {lightbox.photos.length > 1 && (
            <button type="button" onClick={prevPhoto} style={{ position:'absolute', left:16, width:48, height:48, borderRadius:'50%', background:'rgba(255,255,255,0.1)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,255,255,0.15)', cursor:'pointer' }}><ChevronLeft size={22} /></button>
          )}
          <div style={{ maxWidth:'min(1100px,92vw)', maxHeight:'88vh', display:'flex', flexDirection:'column', gap:'var(--s3)', alignItems:'center' }}>
            <img src={lightbox.photos[lightbox.index]} alt={`Foto ampliada ${lightbox.index + 1}`} style={{ maxWidth:'100%', maxHeight:'80vh', objectFit:'contain', borderRadius:'var(--r-xl)', boxShadow:'var(--sh-xl)' }} />
            <div style={{ color:'rgba(255,255,255,0.8)', fontSize:'var(--text-sm)', fontWeight:600 }}>Foto {lightbox.index + 1} de {lightbox.photos.length}</div>
          </div>
          {lightbox.photos.length > 1 && (
            <button type="button" onClick={nextPhoto} style={{ position:'absolute', right:16, width:48, height:48, borderRadius:'50%', background:'rgba(255,255,255,0.1)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,255,255,0.15)', cursor:'pointer' }}><ChevronRight size={22} /></button>
          )}
        </div>
      )}
    </section>
  );
}
