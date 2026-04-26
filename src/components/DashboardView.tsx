/**
 * DashboardView v10 — Date → Machine → Collaborator → Occurrences
 * Fully responsive, mobile-first, touch-friendly.
 * v10: group by machine inside each date; inline occurrence rows show full detail;
 *      conformidade tab shows all items (checked + unchecked) with status.
 */
import { useState, useMemo } from 'react';
import {
  AlertTriangle, Images, CheckCircle2,
  X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Clock, Camera, Calendar, Activity,
  Users, Shield, Zap, Star,
  ArrowRight, Flame, Target, Search,
  BarChart2, UserCheck, Eye, Cpu, XCircle
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
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDayStrip(dateKey: string) {
  const d = new Date(dateKey + 'T12:00:00');
  const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return { dayNum: String(d.getDate()).padStart(2,'0'), dayName: days[d.getDay()], monthShort: months[d.getMonth()], year: d.getFullYear() };
}

function formatDateFull(dateKey: string): string {
  const today = toLocalDateKey(new Date().toISOString());
  const yesterday = toLocalDateKey(new Date(Date.now()-86400000).toISOString());
  if (dateKey === today) return 'Hoje';
  if (dateKey === yesterday) return 'Ontem';
  const d = new Date(dateKey + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
}

function reporterLabel(raw: string): string {
  const withoutAuth = raw.split(' - Auth:')[0].trim();
  return withoutAuth.split(' | Máquina:')[0].split(' | maquina:')[0].trim();
}

function machineLabel(raw: string): string | null {
  const withoutAuth = raw.split(' - Auth:')[0].trim();
  const machineMatch = withoutAuth.match(/\|\s*[Mm]á?quina:\s*(.+)$/);
  return machineMatch ? machineMatch[1].trim() : null;
}

function initials(name: string): string {
  return name.split(/[\s@._-]+/).filter(Boolean).map(p=>p[0]?.toUpperCase()).slice(0,2).join('');
}

const AVATAR_COLORS = [
  { fg:'#0d9488', bg:'rgba(13,148,136,0.15)', glow:'rgba(13,148,136,0.3)' },
  { fg:'#7c3aed', bg:'rgba(124,58,237,0.15)', glow:'rgba(124,58,237,0.3)' },
  { fg:'#db2777', bg:'rgba(219,39,119,0.15)', glow:'rgba(219,39,119,0.3)' },
  { fg:'#d97706', bg:'rgba(217,119,6,0.15)',  glow:'rgba(217,119,6,0.3)'  },
  { fg:'#16a34a', bg:'rgba(22,163,74,0.15)',  glow:'rgba(22,163,74,0.3)'  },
  { fg:'#2563eb', bg:'rgba(37,99,235,0.15)',  glow:'rgba(37,99,235,0.3)'  },
  { fg:'#e11d48', bg:'rgba(225,29,72,0.15)',  glow:'rgba(225,29,72,0.3)'  },
];
function getAvatarColor(name: string) {
  return AVATAR_COLORS[name.split('').reduce((a,c)=>a+c.charCodeAt(0),0) % AVATAR_COLORS.length];
}

/* ─── Inline Occurrence Detail Card ──────────────────────────
   Shown directly inside the CollaboratorCard when expanded,
   no modal needed — full details visible on tap/click.
*/
function OccurrenceDetailCard({ occ, onOpenPhoto }: {
  occ: OccurrenceData;
  onOpenPhoto: (photos: string[], index: number) => void;
}) {
  return (
    <div style={{
      margin: '0 clamp(10px,3vw,16px) clamp(8px,2vw,12px)',
      borderRadius: 16,
      border: '1px solid rgba(217,119,6,0.2)',
      background: 'rgba(217,119,6,0.05)',
      overflow: 'hidden',
    }}>
      {/* Header row */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'clamp(10px,3vw,14px) clamp(12px,3vw,16px)', borderBottom:'1px solid rgba(217,119,6,0.12)' }}>
        <AlertTriangle size={14} style={{ color:'#f59e0b', flexShrink:0 }}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:10, fontWeight:900, textTransform:'uppercase' as const, letterSpacing:'0.1em', color:'rgba(251,191,36,0.7)', marginBottom:2 }}>{occ.section}</div>
          <div style={{ fontSize:'clamp(12px,3.5vw,13px)', fontWeight:800, color:'var(--text)', lineHeight:1.4 }}>{occ.item}</div>
        </div>
        <div style={{ flexShrink:0, textAlign:'right' }}>
          <div style={{ fontSize:12, fontWeight:800, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4, justifyContent:'flex-end', fontVariantNumeric:'tabular-nums' }}>
            <Clock size={10}/> {occ.time}
          </div>
          {occ.photos.length > 0 && (
            <div style={{ fontSize:10, fontWeight:700, color:'var(--primary)', display:'flex', alignItems:'center', gap:3, justifyContent:'flex-end', marginTop:3 }}>
              <Camera size={9}/> {occ.photos.length}
            </div>
          )}
        </div>
      </div>

      {/* Comment */}
      {occ.comment && (
        <div style={{ padding:'clamp(8px,2vw,12px) clamp(12px,3vw,16px)', borderBottom: occ.photos.length > 0 ? '1px solid rgba(217,119,6,0.12)' : 'none' }}>
          <div style={{ fontSize:10, fontWeight:900, textTransform:'uppercase' as const, letterSpacing:'0.1em', color:'rgba(255,255,255,0.35)', marginBottom:5 }}>Observação</div>
          <p style={{ fontSize:'clamp(11px,3vw,13px)', lineHeight:1.7, fontWeight:500, color:'rgba(255,255,255,0.7)', fontStyle:'italic', margin:0 }}>"{occ.comment}"</p>
        </div>
      )}

      {/* Photos grid */}
      {occ.photos.length > 0 && (
        <div style={{ padding:'clamp(8px,2vw,10px) clamp(12px,3vw,16px)' }}>
          <div style={{ fontSize:10, fontWeight:900, textTransform:'uppercase' as const, letterSpacing:'0.1em', color:'rgba(13,148,136,0.7)', marginBottom:6 }}>Evidências · {occ.photos.length}</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(clamp(72px,18vw,110px),1fr))', gap:'clamp(5px,1.5vw,8px)' }}>
            {occ.photos.map((p, i) => (
              <button key={i} type="button" onClick={() => onOpenPhoto(occ.photos, i)}
                style={{ position:'relative', borderRadius:10, overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)', aspectRatio:'1', padding:0, cursor:'zoom-in', background:'rgba(255,255,255,0.04)', minHeight:44 }}
                onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.04)';e.currentTarget.style.borderColor='rgba(13,148,136,0.4)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';}}>
                <img src={p} alt={`Foto ${i+1}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} loading="lazy"/>
                <div style={{ position:'absolute', bottom:4, right:4, background:'rgba(0,0,0,0.7)', color:'#fff', fontSize:9, fontWeight:900, padding:'1px 5px', borderRadius:99, backdropFilter:'blur(8px)' }}>{i+1}/{occ.photos.length}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Collaborator Card (inside a machine group) ──────────── */
function CollaboratorCard({ reporter, occs, onOpenPhoto }: {
  reporter: string;
  occs: OccurrenceData[];
  onOpenPhoto: (photos: string[], index: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const av = getAvatarColor(reporter);
  const photoCount = occs.reduce((a, o) => a + o.photos.length, 0);

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:18, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.05)' }}>
      {/* Collaborator header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'clamp(10px,3vw,14px) clamp(12px,3vw,18px)', background:'linear-gradient(90deg,var(--surface-2) 0%,var(--surface) 100%)', borderBottom: expanded ? '1px solid var(--border)' : 'none', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'clamp(9px,2.5vw,12px)', minWidth:0, flex:1 }}>
          <div style={{ position:'relative', flexShrink:0 }}>
            <div style={{ width:40, height:40, borderRadius:'50%', background:av.bg, border:`2px solid ${av.fg}44`, color:av.fg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:900, boxShadow:`0 4px 12px ${av.glow}` }}>
              {initials(reporter)}
            </div>
            <div style={{ position:'absolute', bottom:0, right:0, width:13, height:13, borderRadius:'50%', background:'#f59e0b', border:'2px solid var(--surface)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <AlertTriangle size={6} color="#fff"/>
            </div>
          </div>
          <div style={{ minWidth:0, flex:1 }}>
            <div style={{ fontSize:'clamp(12px,3.5vw,14px)', fontWeight:800, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{reporter}</div>
            <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:4, flexWrap:'wrap' as const }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:3, height:20, padding:'0 8px', borderRadius:99, fontSize:10, fontWeight:900, background:'rgba(217,119,6,0.1)', color:'#d97706', border:'1px solid rgba(217,119,6,0.15)', whiteSpace:'nowrap' as const }}>
                <AlertTriangle size={8}/> {occs.length} {occs.length===1?'alerta':'alertas'}
              </span>
              {photoCount > 0 && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:3, height:20, padding:'0 8px', borderRadius:99, fontSize:10, fontWeight:900, background:'rgba(13,148,136,0.1)', color:'var(--primary)', border:'1px solid rgba(13,148,136,0.15)', whiteSpace:'nowrap' as const }}>
                  <Camera size={8}/> {photoCount} fotos
                </span>
              )}
            </div>
          </div>
        </div>
        <button type="button" onClick={() => setExpanded(e => !e)}
          style={{ width:40, height:40, borderRadius:10, background:'var(--surface-2)', border:'1px solid var(--border)', color:'var(--text-muted)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
          {expanded ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
        </button>
      </div>

      {/* Inline occurrence detail cards */}
      {expanded && (
        <div style={{ display:'flex', flexDirection:'column', gap: 'clamp(6px,2vw,10px)', paddingTop:'clamp(8px,2vw,10px)', paddingBottom:'clamp(6px,2vw,8px)' }}>
          {occs.map(occ => (
            <OccurrenceDetailCard key={occ.id} occ={occ} onOpenPhoto={onOpenPhoto}/>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Machine Group Block ─────────────────────────────────── */
function MachineGroup({ machine, occs, onOpenPhoto }: {
  machine: string;
  occs: OccurrenceData[];
  onOpenPhoto: (photos: string[], index: number) => void;
}) {
  const [open, setOpen] = useState(true);

  const collabGroups = useMemo(() => {
    const map: Record<string, OccurrenceData[]> = {};
    occs.forEach(o => { const r = reporterLabel(o.reporter); if (!map[r]) map[r] = []; map[r].push(o); });
    return map;
  }, [occs]);

  const photoCount = occs.reduce((a, o) => a + o.photos.length, 0);

  return (
    <div style={{ border:'1px solid rgba(99,102,241,0.2)', borderRadius:20, overflow:'hidden', background:'rgba(99,102,241,0.03)' }}>
      {/* Machine header */}
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:'clamp(10px,3vw,14px)', padding:'clamp(11px,3vw,15px) clamp(14px,4vw,20px)', background: open ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)', borderBottom: open ? '1px solid rgba(99,102,241,0.15)' : 'none', cursor:'pointer', minHeight:52 }}>
        <div style={{ width:40, height:40, borderRadius:12, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.25)', color:'#818cf8', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 4px 12px rgba(99,102,241,0.2)' }}>
          <Cpu size={18}/>
        </div>
        <div style={{ flex:1, minWidth:0, textAlign:'left' }}>
          <div style={{ fontSize:'clamp(13px,3.5vw,15px)', fontWeight:900, color:'#a5b4fc', letterSpacing:'-0.01em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{machine}</div>
          <div style={{ display:'flex', gap:'clamp(6px,2vw,10px)', marginTop:4, flexWrap:'wrap' as const }}>
            <span style={{ fontSize:10, fontWeight:800, color:'#d97706', display:'flex', alignItems:'center', gap:3 }}>
              <AlertTriangle size={9}/> {occs.length} {occs.length===1?'ocorrência':'ocorrências'}
            </span>
            <span style={{ fontSize:10, fontWeight:800, color:'#818cf8', display:'flex', alignItems:'center', gap:3 }}>
              <Users size={9}/> {Object.keys(collabGroups).length} {Object.keys(collabGroups).length===1?'operador':'operadores'}
            </span>
            {photoCount > 0 && (
              <span style={{ fontSize:10, fontWeight:800, color:'var(--primary)', display:'flex', alignItems:'center', gap:3 }}>
                <Camera size={9}/> {photoCount} fotos
              </span>
            )}
          </div>
        </div>
        <div style={{ flexShrink:0, color:'#818cf8' }}>
          {open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </div>
      </button>

      {/* Collaborator cards inside machine */}
      {open && (
        <div style={{ display:'flex', flexDirection:'column', gap:'clamp(8px,2vw,12px)', padding:'clamp(10px,3vw,14px) clamp(12px,3vw,16px)' }}>
          {Object.entries(collabGroups).map(([rep, repOccs]) => (
            <CollaboratorCard key={rep} reporter={rep} occs={repOccs} onOpenPhoto={onOpenPhoto}/>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Date Block Header ─────────────────────────────────────── */
function DateBlockHeader({ dateKey, occCount, collabCount, machineCount, isOpen, onToggle }:{
  dateKey:string; occCount:number; collabCount:number; machineCount:number; isOpen:boolean; onToggle:()=>void;
}) {
  const today = toLocalDateKey(new Date().toISOString());
  const isToday = dateKey===today;
  const {dayNum,dayName,monthShort,year} = formatDayStrip(dateKey);

  return (
    <button type="button" onClick={onToggle}
      style={{width:'100%',display:'flex',alignItems:'center',gap:'clamp(10px,3vw,16px)',padding:'clamp(12px,3vw,16px) clamp(14px,4vw,20px)',background:isToday?'linear-gradient(135deg,rgba(13,148,136,0.1),rgba(8,145,178,0.05))':'var(--surface)',border:'1px solid '+(isToday?'rgba(13,148,136,0.25)':'var(--border)'),borderRadius:20,cursor:'pointer',textAlign:'left',boxShadow:isToday?'0 4px 16px rgba(13,148,136,0.15)':'0 2px 8px rgba(0,0,0,0.04)',transition:'all 0.2s',flexWrap:'wrap' as const,minHeight:60}}
      onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.boxShadow=isToday?'0 8px 24px rgba(13,148,136,0.2)':'0 6px 18px rgba(0,0,0,0.08)';}}
      onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.boxShadow=isToday?'0 4px 16px rgba(13,148,136,0.15)':'0 2px 8px rgba(0,0,0,0.04)';}}>

      <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'clamp(6px,2vw,10px) clamp(10px,3vw,14px)',borderRadius:14,background:isToday?'rgba(13,148,136,0.15)':'var(--surface-2)',border:isToday?'1px solid rgba(13,148,136,0.25)':'1px solid var(--border)',minWidth:'clamp(44px,12vw,56px)',flexShrink:0}}>
        <span style={{fontSize:9,fontWeight:900,textTransform:'uppercase' as const,letterSpacing:'0.1em',color:isToday?'var(--primary)':'var(--text-muted)'}}>{dayName}</span>
        <span style={{fontSize:'clamp(17px,5vw,22px)',fontWeight:900,lineHeight:1.1,color:isToday?'var(--primary)':'var(--text)'}}>{dayNum}</span>
        <span style={{fontSize:9,fontWeight:800,color:isToday?'var(--primary)':'var(--text-muted)',textTransform:'uppercase' as const}}>{monthShort} {year}</span>
      </div>

      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,flexWrap:'wrap' as const}}>
          {isToday&&<span style={{fontSize:9,fontWeight:900,padding:'2px 8px',borderRadius:99,background:'linear-gradient(90deg,#0d9488,#0891b2)',color:'#fff',letterSpacing:'0.1em'}}>HOJE</span>}
          <span style={{fontSize:'clamp(12px,3.5vw,14px)',fontWeight:800,color:'var(--text)',textTransform:'capitalize' as const,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{formatDateFull(dateKey)}</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'clamp(6px,1.5vw,10px)',flexWrap:'wrap' as const}}>
          <span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:'clamp(10px,2.5vw,11px)',fontWeight:800,padding:'3px clamp(8px,2vw,10px)',borderRadius:99,background:occCount>0?'rgba(217,119,6,0.1)':'rgba(22,163,74,0.08)',color:occCount>0?'#d97706':'#16a34a',border:`1px solid ${occCount>0?'rgba(217,119,6,0.2)':'rgba(22,163,74,0.15)'}`}}>
            {occCount>0?<Flame size={10}/>:<Shield size={10}/>}
            {occCount>0?`${occCount} ${occCount===1?'alerta':'alertas'}`:'Sem alertas'}
          </span>
          {machineCount > 0 && (
            <span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:'clamp(10px,2.5vw,11px)',fontWeight:800,padding:'3px clamp(8px,2vw,10px)',borderRadius:99,background:'rgba(99,102,241,0.08)',color:'#818cf8',border:'1px solid rgba(99,102,241,0.15)'}}>
              <Cpu size={10}/> {machineCount} {machineCount===1?'máquina':'máquinas'}
            </span>
          )}
          <span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:'clamp(10px,2.5vw,11px)',fontWeight:800,padding:'3px clamp(8px,2vw,10px)',borderRadius:99,background:'rgba(37,99,235,0.08)',color:'#2563eb',border:'1px solid rgba(37,99,235,0.15)'}}>
            <Users size={10}/> {collabCount} {collabCount===1?'operador':'operadores'}
          </span>
        </div>
      </div>

      <div style={{flexShrink:0,color:'var(--text-muted)'}}>
        {isOpen?<ChevronUp size={18}/>:<ChevronDown size={18}/>}
      </div>
    </button>
  );
}

/* ─── Date Section (Date → Machine → Collaborator) ─────────── */
function DateSection({ dateKey, occs, onOpenPhoto }: {
  dateKey: string;
  occs: OccurrenceData[];
  onOpenPhoto: (photos: string[], index: number) => void;
}) {
  const today = toLocalDateKey(new Date().toISOString());
  const [open, setOpen] = useState(dateKey === today);

  // Group by machine name (or 'SEM MÁQUINA' if none)
  const machineGroups = useMemo(() => {
    const map: Record<string, OccurrenceData[]> = {};
    occs.forEach(o => {
      const m = machineLabel(o.reporter) || 'SEM MÁQUINA';
      if (!map[m]) map[m] = [];
      map[m].push(o);
    });
    return map;
  }, [occs]);

  const uniqueCollabs = useMemo(() => new Set(occs.map(o => reporterLabel(o.reporter))).size, [occs]);
  const machineCount = useMemo(() => Object.keys(machineGroups).filter(m => m !== 'SEM MÁQUINA').length, [machineGroups]);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      <DateBlockHeader
        dateKey={dateKey}
        occCount={occs.length}
        collabCount={uniqueCollabs}
        machineCount={machineCount}
        isOpen={open}
        onToggle={() => setOpen(o => !o)}
      />
      {open && (
        <div style={{ display:'flex', flexDirection:'column', gap:'clamp(8px,2vw,12px)', paddingTop:'clamp(10px,2vw,14px)' }}>
          {Object.entries(machineGroups)
            .sort(([a], [b]) => a === 'SEM MÁQUINA' ? 1 : b === 'SEM MÁQUINA' ? -1 : a.localeCompare(b))
            .map(([machine, machineOccs]) => (
              <MachineGroup key={machine} machine={machine} occs={machineOccs} onOpenPhoto={onOpenPhoto}/>
            ))
          }
        </div>
      )}
    </div>
  );
}

/* ─── Stat Card ─────────────────────────────────────────────── */
function StatCard({ label, value, sub, icon:Icon, color, bg, gradient }:{
  label:string; value:string; sub?:string; icon:any; color:string; bg:string; gradient:string;
}) {
  return (
    <div
      style={{padding:'clamp(14px,4vw,20px)',display:'flex',flexDirection:'column',gap:'clamp(8px,2vw,12px)',background:gradient,border:'1px solid var(--border)',borderRadius:20,position:'relative',overflow:'hidden',boxShadow:'0 4px 16px rgba(0,0,0,0.06)',transition:'transform 0.2s,box-shadow 0.2s'}}
      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(-3px)';(e.currentTarget as HTMLDivElement).style.boxShadow='0 12px 28px rgba(0,0,0,0.1)';}}
      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='none';(e.currentTarget as HTMLDivElement).style.boxShadow='0 4px 16px rgba(0,0,0,0.06)';}}>
      <div style={{position:'absolute',top:-20,right:-20,width:80,height:80,borderRadius:'50%',background:bg,opacity:0.35}}/>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',position:'relative'}}>
        <div style={{width:'clamp(34px,9vw,44px)',height:'clamp(34px,9vw,44px)',borderRadius:12,background:bg,color:color,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 4px 14px ${color}33`}}>
          <Icon size={20}/>
        </div>
        <Zap size={13} style={{color,opacity:0.4,marginTop:4}}/>
      </div>
      <div style={{position:'relative'}}>
        <div style={{fontSize:'clamp(9px,2.5vw,10px)',fontWeight:900,color:'var(--text-muted)',letterSpacing:'0.12em',marginBottom:4,textTransform:'uppercase' as const}}>{label}</div>
        <div style={{fontSize:'clamp(20px,5.5vw,28px)',fontWeight:900,color:'var(--text)',lineHeight:1,letterSpacing:'-0.02em'}}>{value}</div>
        {sub&&<div style={{fontSize:'clamp(9px,2.5vw,10px)',color:'var(--text-muted)',fontWeight:700,marginTop:4}}>{sub}</div>}
      </div>
    </div>
  );
}

/* ─── Collaborator Summary Row ──────────────────────────────── */
function CollaboratorSummaryRow({ reporter, totalOccs, totalPhotos, activeDays, machines, onFilter }:{
  reporter:string; totalOccs:number; totalPhotos:number; activeDays:number; machines:string[]; onFilter:()=>void;
}) {
  const av = getAvatarColor(reporter);
  return (
    <div style={{display:'flex',alignItems:'center',gap:'clamp(10px,3vw,14px)',padding:'clamp(10px,3vw,14px) clamp(12px,3vw,16px)',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,transition:'all 0.2s',cursor:'pointer'}}
      onClick={onFilter}
      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.background='var(--surface-2)';(e.currentTarget as HTMLDivElement).style.borderColor='var(--primary)';}}
      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.background='var(--surface)';(e.currentTarget as HTMLDivElement).style.borderColor='var(--border)';}}>
      <div style={{width:40,height:40,borderRadius:'50%',background:av.bg,border:`2px solid ${av.fg}44`,color:av.fg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:900,flexShrink:0}}>
        {initials(reporter)}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:'clamp(12px,3.5vw,14px)',fontWeight:800,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{reporter}</div>
        {machines.length>0&&(
          <div style={{display:'flex',flexWrap:'wrap' as const,gap:3,marginTop:3}}>
            {machines.map(m=>(
              <span key={m} style={{display:'inline-flex',alignItems:'center',gap:3,padding:'1px 7px',borderRadius:99,fontSize:9,fontWeight:800,background:'rgba(99,102,241,0.1)',color:'#818cf8',border:'1px solid rgba(99,102,241,0.18)',whiteSpace:'nowrap' as const}}>
                <Cpu size={7}/> {m}
              </span>
            ))}
          </div>
        )}
        <div style={{display:'flex',gap:'clamp(6px,2vw,10px)',marginTop:4,flexWrap:'wrap' as const}}>
          <span style={{fontSize:10,fontWeight:700,color:'#d97706',display:'flex',alignItems:'center',gap:3}}><AlertTriangle size={9}/>{totalOccs} alertas</span>
          {totalPhotos>0&&<span style={{fontSize:10,fontWeight:700,color:'var(--primary)',display:'flex',alignItems:'center',gap:3}}><Camera size={9}/>{totalPhotos} fotos</span>}
          <span style={{fontSize:10,fontWeight:700,color:'var(--text-muted)',display:'flex',alignItems:'center',gap:3}}><Calendar size={9}/>{activeDays}d ativo</span>
        </div>
      </div>
      <Eye size={15} style={{color:'var(--text-faint)',flexShrink:0}}/>
    </div>
  );
}

/* ─── Conformidade Section (with all items, checked + unchecked) ─ */
function ConformSectionFull({ section, checklistState }: {
  section: typeof CHECKLIST_DATA[number];
  checklistState: Record<string, boolean>;
}) {
  const [open, setOpen] = useState(false);
  const checkedItems   = section.items.filter(i => checklistState[`${section.id}__${i}`] === true);
  const uncheckedItems = section.items.filter(i => !checklistState[`${section.id}__${i}`]);
  const pct = section.items.length > 0 ? Math.round((checkedItems.length / section.items.length) * 100) : 0;
  const isComplete = pct === 100;

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.05)' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'clamp(12px,3vw,16px) clamp(14px,4vw,20px)', background: open ? 'rgba(22,163,74,0.05)' : 'transparent', borderBottom: open ? '1px solid rgba(22,163,74,0.1)' : 'none', cursor:'pointer', minHeight:52 }}>
        <div style={{ width:40, height:40, borderRadius:12, background: isComplete ? 'rgba(22,163,74,0.2)' : 'rgba(22,163,74,0.1)', border:`1px solid ${isComplete?'rgba(22,163,74,0.4)':'rgba(22,163,74,0.2)'}`, color:'var(--success)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          {isComplete ? <Star size={18} fill="currentColor"/> : <CheckCircle2 size={18}/>}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:'clamp(12px,3.5vw,14px)', fontWeight:800, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--text)' }}>{section.title}</div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:5 }}>
            <div style={{ flex:1, height:4, background:'rgba(22,163,74,0.12)', borderRadius:99, overflow:'hidden', maxWidth:120 }}>
              <div style={{ height:'100%', width:`${pct}%`, background: isComplete ? 'linear-gradient(90deg,#16a34a,#22c55e)' : '#16a34a', borderRadius:99 }}/>
            </div>
            <span style={{ fontSize:11, fontWeight:800, color:'var(--success)', whiteSpace:'nowrap' }}>{checkedItems.length}/{section.items.length} · {pct}%</span>
          </div>
        </div>
        {open ? <ChevronUp size={16} style={{ color:'var(--success)', flexShrink:0 }}/> : <ChevronDown size={16} style={{ color:'var(--success)', flexShrink:0 }}/>}
      </button>

      {open && (
        <div style={{ display:'flex', flexDirection:'column' }}>
          {/* Checked items */}
          {checkedItems.map((item, i) => (
            <div key={`ok-${i}`} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'clamp(10px,3vw,12px) clamp(14px,4vw,20px)', borderBottom:'1px solid var(--border)', background:'rgba(22,163,74,0.03)' }}>
              <CheckCircle2 size={14} style={{ color:'#22c55e', flexShrink:0, marginTop:2 }}/>
              <span style={{ fontSize:'clamp(11px,3vw,13px)', fontWeight:600, lineHeight:1.5, flex:1, color:'var(--text)' }}>{item}</span>
              <span style={{ fontSize:9, fontWeight:900, padding:'2px 7px', borderRadius:99, background:'rgba(22,163,74,0.12)', color:'#22c55e', flexShrink:0, whiteSpace:'nowrap' }}>OK</span>
            </div>
          ))}
          {/* Unchecked items */}
          {uncheckedItems.map((item, i) => (
            <div key={`nok-${i}`} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'clamp(10px,3vw,12px) clamp(14px,4vw,20px)', borderBottom: i < uncheckedItems.length - 1 ? '1px solid var(--border)' : 'none', background:'rgba(239,68,68,0.02)' }}>
              <XCircle size={14} style={{ color:'rgba(239,68,68,0.5)', flexShrink:0, marginTop:2 }}/>
              <span style={{ fontSize:'clamp(11px,3vw,13px)', fontWeight:600, lineHeight:1.5, flex:1, color:'var(--text-muted)' }}>{item}</span>
              <span style={{ fontSize:9, fontWeight:900, padding:'2px 7px', borderRadius:99, background:'rgba(239,68,68,0.1)', color:'#f87171', flexShrink:0, whiteSpace:'nowrap' }}>PENDENTE</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────── */
export default function DashboardView({ occurrences, checklistState }: DashboardViewProps) {
  const [lightbox, setLightbox]       = useState<{photos:string[];index:number}|null>(null);
  const [activeTab, setActiveTab]     = useState<'timeline'|'colaboradores'|'conformidades'>('timeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCollab, setFilterCollab] = useState<string|null>(null);

  const verifiedCount      = Object.values(checklistState).filter(v=>v).length;
  const maxChecks          = CHECKLIST_DATA.reduce((acc,s)=>acc+s.items.length,0);
  const validationProgress = maxChecks>0?Math.round((verifiedCount/maxChecks)*100):0;
  const totalPhotos        = occurrences.reduce((acc,o)=>acc+o.photos.length,0);

  const uniqueCollabs = useMemo(()=>[...new Set(occurrences.map(o=>reporterLabel(o.reporter)))],[occurrences]);

  const filteredOccs = useMemo(()=>{
    let list = occurrences;
    if (filterCollab) list = list.filter(o=>reporterLabel(o.reporter)===filterCollab);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(o=>
        o.section.toLowerCase().includes(q)||
        o.item.toLowerCase().includes(q)||
        (o.comment||'').toLowerCase().includes(q)||
        reporterLabel(o.reporter).toLowerCase().includes(q)||
        (machineLabel(o.reporter)||'').toLowerCase().includes(q)
      );
    }
    return list;
  },[occurrences,filterCollab,searchQuery]);

  const groupedByDate = useMemo(()=>{
    const map: Record<string,OccurrenceData[]> = {};
    filteredOccs.forEach(o=>{ const dk=toLocalDateKey(o.created_at); if(!map[dk])map[dk]=[]; map[dk].push(o); });
    return Object.entries(map).sort(([a],[b])=>b.localeCompare(a));
  },[filteredOccs]);

  const collabStats = useMemo(()=>{
    const map: Record<string,{occs:number;photos:number;days:Set<string>;machines:Set<string>}> = {};
    occurrences.forEach(o=>{
      const r=reporterLabel(o.reporter);
      if(!map[r])map[r]={occs:0,photos:0,days:new Set(),machines:new Set()};
      map[r].occs++;
      map[r].photos+=o.photos.length;
      map[r].days.add(toLocalDateKey(o.created_at));
      const m=machineLabel(o.reporter); if(m) map[r].machines.add(m);
    });
    return Object.entries(map).sort(([,a],[,b])=>b.occs-a.occs).map(([r,s])=>({reporter:r,...s,activeDays:s.days.size,machines:[...s.machines]}));
  },[occurrences]);

  const stats = [
    {label:'CONFORMIDADE',value:`${validationProgress}%`,sub:`${verifiedCount}/${maxChecks} itens`,icon:Target,color:validationProgress>=90?'#16a34a':'#0d9488',bg:validationProgress>=90?'rgba(22,163,74,0.15)':'rgba(13,148,136,0.15)',gradient:validationProgress>=90?'linear-gradient(145deg,rgba(22,163,74,0.06),var(--surface))':'linear-gradient(145deg,rgba(13,148,136,0.06),var(--surface))'},
    {label:'OCORRÊNCIAS',value:String(occurrences.length),sub:`Total registrado`,icon:AlertTriangle,color:'#d97706',bg:'rgba(217,119,6,0.15)',gradient:'linear-gradient(145deg,rgba(217,119,6,0.06),var(--surface))'},
    {label:'EVIDÊNCIAS',value:String(totalPhotos),sub:`Fotos enviadas`,icon:Images,color:'#7c3aed',bg:'rgba(124,58,237,0.15)',gradient:'linear-gradient(145deg,rgba(124,58,237,0.06),var(--surface))'},
    {label:'COLABORADORES',value:String(uniqueCollabs.length),sub:`Ativos no período`,icon:Users,color:'#2563eb',bg:'rgba(37,99,235,0.15)',gradient:'linear-gradient(145deg,rgba(37,99,235,0.06),var(--surface))'},
  ];

  const tabs = [
    {id:'timeline'      as const, label:'LINHA DO TEMPO', icon:Activity,    color:'#d97706', count:occurrences.length},
    {id:'colaboradores' as const, label:'COLABORADORES',  icon:UserCheck,   color:'#2563eb', count:uniqueCollabs.length},
    {id:'conformidades' as const, label:'CONFORMIDADE',   icon:CheckCircle2,color:'#16a34a', count:verifiedCount},
  ];

  return (
    <>
      <style>{`
        @keyframes pulseDot{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.4);opacity:0.6}}

        .dash-stats{padding:clamp(12px,4vw,20px) clamp(12px,4vw,20px) 0;display:grid;grid-template-columns:repeat(4,1fr);gap:clamp(7px,2vw,12px);}
        @media(max-width:700px){.dash-stats{grid-template-columns:repeat(2,1fr);}}
        @media(max-width:340px){.dash-stats{grid-template-columns:1fr;}}

        .dash-tabs{display:flex;border-bottom:1px solid var(--divider);background:var(--surface);margin-top:clamp(12px,3vw,20px);padding:0 clamp(12px,4vw,20px);overflow-x:auto;scrollbar-width:none;}
        .dash-tab{padding:clamp(10px,3vw,13px) clamp(8px,3vw,20px);font-size:clamp(9px,2.5vw,11px);font-weight:900;border-bottom:3px solid transparent;background:transparent;display:flex;align-items:center;gap:clamp(4px,1.5vw,7px);cursor:pointer;transition:all 0.2s;letter-spacing:0.06em;flex:1;justify-content:center;white-space:nowrap;min-height:44px;}
        .dash-tab .tab-count{padding:2px 6px;border-radius:99px;font-size:10px;font-weight:900;}
        @media(max-width:420px){.dash-tab .tab-label{display:none;}}

        .content-area{flex:1;overflow-y:auto;padding:clamp(12px,4vw,20px);display:flex;flex-direction:column;gap:clamp(12px,3vw,20px);}

        .search-row{display:flex;align-items:center;gap:clamp(8px,2vw,10px);flex-wrap:wrap;}
        .search-input-wrap{flex:1;min-width:160px;position:relative;}
        .search-input{width:100%;padding:clamp(8px,2vw,10px) clamp(10px,3vw,14px) clamp(8px,2vw,10px) 36px;background:var(--surface);border:1px solid var(--border);border-radius:12px;font-size:clamp(12px,3vw,13px);font-weight:600;color:var(--text);outline:none;transition:all 0.2s;}
        .search-input:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(13,148,136,0.1);}
        .filter-chip{display:inline-flex;align-items:center;gap:6px;padding:clamp(6px,2vw,8px) clamp(10px,3vw,14px);border-radius:99px;font-size:clamp(10px,2.5vw,11px);font-weight:800;border:1px solid;cursor:pointer;transition:all 0.2s;white-space:nowrap;min-height:36px;background:rgba(37,99,235,0.1);border-color:rgba(37,99,235,0.25);color:#2563eb;}

        .timeline-stack{display:flex;flex-direction:column;gap:clamp(14px,4vw,24px);}
        .collab-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr));gap:clamp(8px,2vw,12px);}
        .conform-grid{display:flex;flex-direction:column;gap:clamp(8px,2vw,12px);}

        .empty-state{padding:clamp(32px,8vw,56px) clamp(16px,4vw,24px);text-align:center;background:var(--surface);border:2px dashed var(--border);border-radius:20px;}
        .lb-btn{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;}
        .conf-prog{padding:clamp(14px,4vw,22px);border-radius:20px;background:linear-gradient(135deg,rgba(22,163,74,0.08),rgba(13,148,136,0.04));border:1px solid rgba(22,163,74,0.2);position:relative;overflow:hidden;}
      `}</style>

      {/* Stats */}
      <div className="dash-stats">
        {stats.map(s=><StatCard key={s.label} {...s}/>)}
      </div>

      {/* Tabs */}
      <div className="dash-tabs">
        {tabs.map(tab=>(
          <button key={tab.id} type="button" className="dash-tab"
            onClick={()=>setActiveTab(tab.id)}
            style={{color:activeTab===tab.id?tab.color:'var(--text-muted)',borderBottomColor:activeTab===tab.id?tab.color:'transparent'}}>
            <tab.icon size={14}/>
            <span className="tab-label">{tab.label}</span>
            <span className="tab-count" style={{background:activeTab===tab.id?`${tab.color}18`:'var(--surface-2)',color:activeTab===tab.id?tab.color:'var(--text-muted)'}}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="content-area">

        {/* ── TIMELINE tab ── */}
        {activeTab==='timeline'&&(
          <>
            <div className="search-row">
              <div className="search-input-wrap">
                <Search size={14} style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)',pointerEvents:'none'}}/>
                <input className="search-input" placeholder="Buscar seção, item, máquina, colaborador…" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/>
              </div>
              {filterCollab&&(
                <button className="filter-chip" onClick={()=>setFilterCollab(null)}>
                  <UserCheck size={11}/> {filterCollab} <X size={10}/>
                </button>
              )}
            </div>

            {groupedByDate.length===0?(
              <div className="empty-state">
                <div style={{width:56,height:56,borderRadius:'50%',background:'rgba(22,163,74,0.1)',color:'#16a34a',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',boxShadow:'0 0 24px rgba(22,163,74,0.2)'}}>
                  <Shield size={26}/>
                </div>
                <p style={{fontSize:'clamp(13px,4vw,15px)',fontWeight:800,color:'var(--text)'}}>  
                  {searchQuery||filterCollab?'Nenhum resultado encontrado':'Nenhuma ocorrência registrada'}
                </p>
                <p style={{fontSize:'clamp(11px,3vw,13px)',color:'var(--text-muted)',marginTop:6,fontWeight:500}}>
                  {searchQuery||filterCollab?'Tente ajustar os filtros.':'A operação está limpa no período.'}
                </p>
              </div>
            ):(
              <div className="timeline-stack">
                {groupedByDate.map(([dk,dayOccs])=>(
                  <DateSection key={dk} dateKey={dk} occs={dayOccs} onOpenPhoto={(p,i)=>setLightbox({photos:p,index:i})}/>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── COLABORADORES tab ── */}
        {activeTab==='colaboradores'&&(
          <>
            <div style={{display:'flex',alignItems:'center',gap:10,padding:'clamp(12px,3vw,16px) clamp(14px,4vw,20px)',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16}}>
              <BarChart2 size={16} style={{color:'var(--primary)',flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'clamp(11px,3vw,13px)',fontWeight:800,color:'var(--text)'}}>Resumo por Colaborador</div>
                <div style={{fontSize:'clamp(10px,2.5vw,11px)',color:'var(--text-muted)',marginTop:2}}>Clique para filtrar a linha do tempo</div>
              </div>
            </div>
            {collabStats.length===0?(
              <div className="empty-state">
                <p style={{fontSize:'clamp(13px,4vw,15px)',fontWeight:800,color:'var(--text)'}}>Sem dados de colaboradores</p>
              </div>
            ):(
              <div className="collab-grid">
                {collabStats.map(c=>(
                  <CollaboratorSummaryRow
                    key={c.reporter}
                    reporter={c.reporter}
                    totalOccs={c.occs}
                    totalPhotos={c.photos}
                    activeDays={c.activeDays}
                    machines={c.machines}
                    onFilter={()=>{ setFilterCollab(c.reporter); setActiveTab('timeline'); }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── CONFORMIDADES tab ── */}
        {activeTab==='conformidades'&&(
          <div style={{display:'flex',flexDirection:'column',gap:'clamp(12px,3vw,18px)'}}>
            {/* Progress header */}
            <div className="conf-prog">
              <div style={{position:'absolute',top:-30,right:-30,width:130,height:130,borderRadius:'50%',background:'rgba(22,163,74,0.06)'}}/>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'clamp(12px,3vw,18px)',position:'relative',gap:12,flexWrap:'wrap' as const}}>
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:'#22c55e',boxShadow:'0 0 8px rgba(34,197,94,0.6)'}}/>
                    <h3 style={{fontSize:'clamp(10px,2.5vw,11px)',fontWeight:900,color:'#16a34a',letterSpacing:'0.1em'}}>CONFORMIDADE DA PLANTA</h3>
                  </div>
                  <p style={{fontSize:'clamp(11px,3vw,13px)',fontWeight:600,color:'var(--text-muted)'}}>{verifiedCount} de {maxChecks} pontos de controle verificados</p>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:'clamp(26px,7vw,34px)',fontWeight:900,color:'#16a34a',lineHeight:1,letterSpacing:'-0.03em'}}>{validationProgress}%</div>
                  <div style={{fontSize:'clamp(10px,2.5vw,11px)',fontWeight:700,color:'var(--text-muted)',marginTop:4}}>
                    {validationProgress>=90?'🏆 Excelente':validationProgress>=70?'✅ Bom':'⚡ Em progresso'}
                  </div>
                </div>
              </div>
              <div style={{height:10,background:'rgba(22,163,74,0.1)',borderRadius:999,overflow:'hidden',position:'relative'}}>
                <div style={{height:'100%',width:`${validationProgress}%`,background:'linear-gradient(90deg,#16a34a,#22c55e,#4ade80)',borderRadius:999,transition:'all 1s ease',boxShadow:'0 2px 10px rgba(34,197,94,0.4)'}}/>
              </div>
            </div>

            {/* All sections with all items */}
            <div className="conform-grid">
              {CHECKLIST_DATA.map(section => (
                <ConformSectionFull key={section.id} section={section} checklistState={checklistState}/>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox&&(
        <div style={{position:'fixed',inset:0,background:'rgba(2,6,23,0.96)',backdropFilter:'blur(16px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:4000,padding:'clamp(12px,4vw,24px)'}}>
          <button onClick={()=>setLightbox(null)} style={{position:'absolute',top:'clamp(12px,3vw,24px)',right:'clamp(12px,3vw,24px)',width:48,height:48,borderRadius:'50%',background:'rgba(255,255,255,0.08)',color:'#fff',border:'1px solid rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',backdropFilter:'blur(8px)'}}>
            <X size={24}/>
          </button>
          <div style={{maxWidth:'min(1200px,94vw)',width:'100%',display:'flex',flexDirection:'column',alignItems:'center',gap:'clamp(10px,3vw,16px)'}}>
            <img src={lightbox.photos[lightbox.index]} alt={`Foto ${lightbox.index+1}`} style={{maxWidth:'100%',maxHeight:'80dvh',objectFit:'contain',borderRadius:'clamp(12px,4vw,20px)',boxShadow:'0 40px 80px rgba(0,0,0,0.8)'}} loading="lazy"/>
            <div style={{display:'flex',alignItems:'center',gap:'clamp(8px,3vw,12px)'}}>
              {lightbox.index>0&&(
                <button className="lb-btn" onClick={()=>setLightbox(l=>l&&{...l,index:l.index-1})}>
                  <ChevronLeft size={18}/>
                </button>
              )}
              <div style={{background:'rgba(255,255,255,0.08)',padding:'6px clamp(12px,4vw,16px)',borderRadius:99,color:'rgba(255,255,255,0.8)',fontSize:13,fontWeight:700,backdropFilter:'blur(8px)',whiteSpace:'nowrap'}}>
                {lightbox.index+1} / {lightbox.photos.length}
              </div>
              {lightbox.index<lightbox.photos.length-1&&(
                <button className="lb-btn" onClick={()=>setLightbox(l=>l&&{...l,index:l.index+1})}>
                  <ChevronRight size={18}/>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
