import React, { useState } from 'react';
import {
  AlertTriangle, CheckCircle2, Clock, Calendar, Camera, X, ChevronDown, ChevronUp,
  BarChart2, Activity, Shield, LayoutDashboard, Search, Cpu, Layers, Target, XCircle
} from 'lucide-react';
import { OccurrenceData } from '../../types';

export function dateLabel(dk: string) {
  const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const yesterdayKey = () => {
    const d = new Date(); d.setDate(d.getDate()-1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  if (dk === todayKey()) return 'Hoje';
  if (dk === yesterdayKey()) return 'Ontem';
  const [y,m,day] = dk.split('-'); return `${day}/${m}/${y}`;
}

export function toLocalDateKey(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function machineLabel(raw: string): string {
  if (!raw) return '';
  const upper = raw.toUpperCase();
  if (upper.includes('ROMI 02') || upper.includes('ROMI 2') || upper.includes('ROMI2')) return 'ROMI 02';
  if (upper.includes('ROMI 01') || upper.includes('ROMI 1') || upper.includes('ROMI1')) return 'ROMI 01';
  const m = raw.split(' - Auth:')[0].match(/\|\s*[Mm]á?quina:\s*(.+)$/);
  return m ? m[1].trim() : '';
}

export function reporterLabel(raw: string): string {
  if (!raw) return 'Desconhecido';
  let label = raw.split(' - Auth:')[0].split(' | Máquina:')[0].split(' | maquina:')[0].trim();
  label = label.replace(/\s*\([^)]*\)\s*$/, '').trim();
  return label;
}

export function initials(name: string): string {
  if (!name) return 'U';
  return name.split(/[\s@._-]+/).filter(Boolean).map(p => p[0]?.toUpperCase()).slice(0, 2).join('');
}

const PALETTE = ['#0d9488','#7c3aed','#db2777','#d97706','#16a34a','#2563eb','#dc2626','#059669'];
export function avatarColor(name: string) {
  let h=0; for(let i=0;i<name.length;i++) h=(h*31+name.charCodeAt(i))%PALETTE.length;
  return PALETTE[h];
}

export function Lightbox({photos,index,onClose}:{photos:string[];index:number;onClose:()=>void}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(2,6,23,0.95)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9000,padding:16}} onClick={onClose}>
      <div style={{position:'relative', maxWidth:'90vw', maxHeight:'90vh'}} onClick={e=>e.stopPropagation()}>
        <img src={photos[index]} alt={`Foto ${index+1}`} style={{maxWidth:'100%',maxHeight:'85vh',objectFit:'contain',borderRadius:16,boxShadow:'0 32px 80px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)'}}/>
        <button onClick={onClose} style={{position:'absolute',top:-16,right:-16,width:40,height:40,borderRadius:'50%',background:'#fff',color:'#0f172a',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 4px 12px rgba(0,0,0,0.3)'}}><X size={20}/></button>
      </div>
    </div>
  );
}

export function CollaboratorAccordion({ reporter, shift, occs, onOpenPhoto }: { reporter: string; shift: string; occs: OccurrenceData[]; onOpenPhoto: (photos: string[], index: number) => void }) {
  const [open, setOpen] = useState(false);
  const color = avatarColor(reporter);

  return (
    <div className="card animate-in" style={{ padding: '16px', background: open ? 'var(--surface-2)' : 'var(--surface)', border: open ? '1px solid var(--primary)' : '1px solid var(--border)', transition: 'all 0.2s' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, boxShadow: `0 4px 12px ${color}40`, flexShrink: 0 }}>{initials(reporter)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reporter}</div>
              {shift && (
                <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(37,99,235,0.1)', color: '#2563eb', padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={10} /> {shift}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: 6 }}><span style={{ fontSize: '11px', fontWeight: 800, background: 'var(--warning-hl)', color: 'var(--warning)', padding: '2px 8px', borderRadius: '6px' }}>{occs.length} Alertas</span></div>
          </div>
        </div>
        <div style={{ color: 'var(--text-muted)', padding: '6px', borderRadius: '8px', background: 'var(--surface-2)' }}>{open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
      </div>
      {open && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {occs.map(occ => (
            <div key={occ.id} style={{ padding: '14px', borderRadius: '12px', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--sh-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--warning-hl)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><AlertTriangle size={16} /></div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--warning)', letterSpacing: '0.05em' }}>{occ.section}</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)', marginTop: 2, fontFamily: 'var(--font-display)' }}>{occ.item}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}><span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(37,99,235,0.1)', color: '#2563eb', padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}><Cpu size={10} style={{ display: 'inline', marginRight: 4 }} /> {machineLabel(occ.reporter) || 'MÁQUINA N/A'}</span></div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}><Clock size={12} /> {occ.time}</div>
              </div>
              {occ.comment && <div style={{ padding: '12px', background: 'var(--surface-2)', borderRadius: '8px', border: '1px dashed var(--border)', marginTop: '12px' }}><p style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500, margin: 0 }}>"{occ.comment}"</p></div>}
              {occ.photos.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', overflowX: 'auto', paddingBottom: 4 }}>
                  {occ.photos.map((p, i) => (
                    <button key={i} type="button" onClick={() => onOpenPhoto(occ.photos, i)} style={{ width: 60, height: 60, borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0, padding: 0, cursor: 'zoom-in' }}><img src={p} alt={`Foto ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" /></button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ConformityCollaboratorAccordion({ rep }: { rep: any }) {
  const [open, setOpen] = useState(false);
  const color = avatarColor(rep.name);

  return (
    <div className="card animate-in" style={{ padding: '20px', border: open ? `1px solid ${color}66` : '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, boxShadow: `0 4px 12px ${color}44`, flexShrink: 0 }}>{initials(rep.name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rep.name}</div>
              {rep.shift && (
                <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(37,99,235,0.1)', color: '#2563eb', padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={10} /> {rep.shift}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <div style={{ flex: 1, height: 6, background: 'var(--divider)', borderRadius: 99, overflow: 'hidden', maxWidth: 180 }}>
                <div style={{ height: '100%', width: `${rep.pct}%`, background: rep.pct === 100 ? 'var(--success)' : 'var(--primary)', transition: 'width 0.5s ease' }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 900, color: rep.pct === 100 ? 'var(--success)' : 'var(--primary)' }}>{rep.pct}%</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 4 }}>{rep.checked} de {rep.total} verificados ({rep.machines.length} Máquina{rep.machines.length > 1 ? 's' : ''})</div>
          </div>
        </div>
        <div style={{ color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '6px', borderRadius: '8px' }}>{open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
      </div>

      {open && (
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {rep.machines.map((mach: any) => (
            <div key={mach.name} style={{ background: 'var(--surface-2)', borderRadius: '16px', padding: '16px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '16px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(37,99,235,0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Cpu size={18} /></div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{mach.name}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{mach.pct}% ({mach.checked} itens validados)</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {mach.groups.map((group: any) => (
                  <ConformCategoryGroup key={group.label} groupLabel={group.label} sections={group.sections} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ConformCategoryGroup({ groupLabel, sections }: { groupLabel: string; sections: any[] }) {
  const [open, setOpen] = useState(false);
  const totalItems  = sections.reduce((a, s) => a + s.totalCount, 0);
  const checkedItms = sections.reduce((a, s) => a + s.checkedCount, 0);
  const pct   = totalItems > 0 ? Math.round((checkedItms / totalItems) * 100) : 0;
  const color = pct === 100 ? '#10b981' : pct >= 60 ? '#0d9488' : '#d97706';

  return (
    <div style={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
      <button type="button" onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: open ? 'var(--surface-2)' : 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Layers size={16} style={{ color }} />
          <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text)' }}>{groupLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: 13, fontWeight: 900, color }}>{pct}%</span>
          {open ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
        </div>
      </button>
      {open && (
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border)' }}>
          {sections.map((section: any) => <ConformSectionCard key={section.sectionId} section={section} />)}
        </div>
      )}
    </div>
  );
}

export function ConformSectionCard({ section }: { section: any }) {
  const [open, setOpen] = useState(false);
  const pct = section.totalCount > 0 ? Math.round((section.checkedCount / section.totalCount) * 100) : 0;
  const color = pct === 100 ? '#10b981' : pct >= 60 ? '#0d9488' : '#d97706';
  const bgColor = pct === 100 ? 'rgba(16,185,129,0.1)' : pct >= 60 ? 'rgba(13,148,136,0.1)' : 'rgba(217,119,6,0.1)';

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--surface)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 12, padding: '10px 14px' }} onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: '8px', background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {pct === 100 ? <CheckCircle2 size={16} style={{ color: '#10b981' }} /> : <Target size={16} style={{ color }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{section.sectionIndex}. {section.sectionTitle}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 900, color }}>{section.checkedCount}/{section.totalCount}</span>
          <div style={{ color: 'var(--text-muted)' }}>{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
        </div>
      </div>

      {open && (
        <div style={{ padding: '10px 14px', borderTop: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--surface-2)' }}>
          {section.items.map((item: any) => (
            <div key={item.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', borderRadius: 8, background: item.checked ? 'var(--success-hl)' : 'var(--danger-hl)', border: `1px solid ${item.checked ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'}` }}>
              <div style={{ flexShrink: 0, marginTop: 1 }}>{item.checked ? <CheckCircle2 size={16} style={{ color: 'var(--success)' }} /> : <XCircle size={16} style={{ color: 'var(--danger)' }} />}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4 }}>{item.itemText}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
