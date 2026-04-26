/**
 * DashboardView v9 — Admin & Supervisor Dashboard
 * Hierarchy: Date → Collaborator → Occurrences
 * Fully responsive, mobile-first, touch-friendly.
 * v9: show machine name inside CollaboratorCard and OccurrenceDetailModal.
 */
import { useState, useMemo } from 'react';
import {
  AlertTriangle, Images, CheckCircle2,
  X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Clock, Camera, Calendar, Activity,
  Users, Shield, Zap, Star,
  ArrowRight, Flame, Target, Search,
  BarChart2, UserCheck, Eye, Cpu
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

/**
 * Returns just the person's name + shift, stripping machine and auth.
 * "João Silva (Turno A) | Máquina: ROMI 01 - Auth: ..." → "João Silva (Turno A)"
 */
function reporterLabel(raw: string): string {
  const withoutAuth = raw.split(' - Auth:')[0].trim();
  return withoutAuth.split(' | Máquina:')[0].split(' | maquina:')[0].trim();
}

/**
 * Extracts the machine name from the reporter string.
 * "João Silva (Turno A) | Máquina: ROMI 01 - Auth: ..." → "ROMI 01"
 * Returns null if not present.
 */
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

/* ─── Occurrence Detail Modal ──────────────────────────────── */
function OccurrenceDetailModal({ occurrence, onClose, onOpenPhoto }: {
  occurrence: OccurrenceData; onClose: ()=>void; onOpenPhoto: (p:string[], i:number)=>void;
}) {
  const reporter = reporterLabel(occurrence.reporter);
  const machine  = machineLabel(occurrence.reporter);
  const dateStr = occurrence.created_at
    ? new Date(occurrence.created_at).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'}) : '—';
  const av = getAvatarColor(reporter);
  return (
    <>
      <style>{`
        .occ-ov{position:fixed;inset:0;background:rgba(2,6,23,0.92);backdrop-filter:blur(20px);display:flex;align-items:center;justify-content:center;z-index:3000;padding:clamp(12px,4vw,20px);animation:odFi .25s ease;}
        .occ-box{width:100%;max-width:600px;background:linear-gradient(145deg,#0f172a,#1e293b);border:1px solid rgba(255,255,255,0.08);border-radius:clamp(16px,4vw,28px);box-shadow:0 40px 80px rgba(0,0,0,0.6);max-height:92dvh;display:flex;flex-direction:column;overflow:hidden;animation:odSu .35s cubic-bezier(0.16,1,0.3,1);}
        @media(max-width:480px){.occ-ov{align-items:flex-end;padding:0;}.occ-box{max-width:100%;border-radius:clamp(16px,4vw,24px) clamp(16px,4vw,24px) 0 0;max-height:96dvh;}}
        @keyframes odFi{from{opacity:0}to{opacity:1}}
        @keyframes odSu{from{opacity:0;transform:translateY(40px) scale(.97)}to{opacity:1;transform:none}}
        .occ-scroll{overflow-y:auto;flex:1;padding:clamp(16px,4vw,24px);scrollbar-width:thin;}
        .occ-photo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(90px,22vw,130px),1fr));gap:clamp(8px,2vw,10px);}
      `}</style>
      <div className="occ-ov" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
        <div className="occ-box">
          <div style={{padding:'clamp(14px,4vw,22px) clamp(16px,4vw,24px)',background:'linear-gradient(90deg,rgba(217,119,6,0.12),rgba(217,119,6,0.03))',borderBottom:'1px solid rgba(217,119,6,0.15)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,gap:12}}>
            <div style={{display:'flex',alignItems:'center',gap:12,minWidth:0}}>
              <div style={{position:'relative',flexShrink:0}}>
                <div style={{width:46,height:46,borderRadius:14,background:'rgba(217,119,6,0.2)',border:'1px solid rgba(217,119,6,0.3)',color:'#f59e0b',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 20px rgba(217,119,6,0.25)'}}>
                  <AlertTriangle size={20}/>
                </div>
                <div style={{position:'absolute',top:-4,right:-4,width:14,height:14,borderRadius:'50%',background:'#ef4444',border:'2px solid #0f172a',animation:'pulseDot 2s infinite'}}/>
              </div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.14em',color:'rgba(251,191,36,0.7)',marginBottom:3}}>⚠ PONTO CRÍTICO</div>
                <div style={{fontSize:'clamp(13px,3.5vw,15px)',fontWeight:800,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{occurrence.section}</div>
              </div>
            </div>
            <button onClick={onClose} style={{width:44,height:44,borderRadius:10,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.6)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
              <X size={16}/>
            </button>
          </div>
          <div className="occ-scroll">
            {/* Reporter row */}
            <div style={{display:'flex',alignItems:'center',gap:'clamp(10px,3vw,14px)',padding:'clamp(14px,3vw,18px) clamp(14px,3vw,20px)',background:'rgba(255,255,255,0.03)',borderRadius:18,border:'1px solid rgba(255,255,255,0.06)',marginBottom:20}}>
              <div style={{width:48,height:48,borderRadius:'50%',background:av.bg,border:`2px solid ${av.fg}44`,color:av.fg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:900,flexShrink:0,boxShadow:`0 4px 16px ${av.glow}`}}>{initials(reporter)}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:800,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{reporter}</div>
                {machine && (
                  <div style={{display:'inline-flex',alignItems:'center',gap:5,marginTop:5,padding:'2px 10px',borderRadius:99,background:'rgba(99,102,241,0.15)',border:'1px solid rgba(99,102,241,0.25)',color:'#818cf8'}}>
                    <Cpu size={10}/>
                    <span style={{fontSize:11,fontWeight:800,whiteSpace:'nowrap'}}>{machine}</span>
                  </div>
                )}
                {!machine && (
                  <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginTop:3,fontWeight:600}}>Operador responsável</div>
                )}
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontSize:14,fontWeight:800,color:'rgba(255,255,255,0.85)'}}>{occurrence.time}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginTop:2}}>{dateStr}</div>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:18}}>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                  <div style={{width:3,height:14,background:'#f59e0b',borderRadius:99}}/>
                  <span style={{fontSize:11,fontWeight:800,textTransform:'uppercase' as const,letterSpacing:'0.1em',color:'#f59e0b'}}>Não Conformidade</span>
                </div>
                <div style={{padding:'clamp(14px,4vw,18px) clamp(14px,4vw,20px)',background:'rgba(217,119,6,0.08)',border:'1px solid rgba(217,119,6,0.2)',borderRadius:18,borderLeft:'3px solid #f59e0b'}}>
                  <p style={{fontSize:'clamp(13px,3.5vw,14px)',fontWeight:700,lineHeight:1.6,color:'#fff',margin:0}}>{occurrence.item}</p>
                </div>
              </div>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                  <div style={{width:3,height:14,background:'rgba(255,255,255,0.25)',borderRadius:99}}/>
                  <span style={{fontSize:11,fontWeight:800,textTransform:'uppercase' as const,letterSpacing:'0.1em',color:'rgba(255,255,255,0.4)'}}>Observações</span>
                </div>
                <div style={{padding:'clamp(14px,4vw,18px) clamp(14px,4vw,20px)',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:18}}>
                  <p style={{fontSize:14,lineHeight:1.8,fontWeight:500,color:occurrence.comment?'rgba(255,255,255,0.8)':'rgba(255,255,255,0.3)',margin:0,fontStyle:occurrence.comment?'normal':'italic'}}>
                    {occurrence.comment||'Nenhuma observação adicional registrada.'}
                  </p>
                </div>
              </div>
              {occurrence.photos.length>0&&(
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                    <div style={{width:3,height:14,background:'#0d9488',borderRadius:99}}/>
                    <span style={{fontSize:11,fontWeight:800,textTransform:'uppercase' as const,letterSpacing:'0.1em',color:'#0d9488'}}>Evidências · {occurrence.photos.length}</span>
                  </div>
                  <div className="occ-photo-grid">
                    {occurrence.photos.map((p,i)=>(
                      <button key={i} type="button" onClick={()=>onOpenPhoto(occurrence.photos,i)}
                        style={{position:'relative',borderRadius:14,overflow:'hidden',border:'1px solid rgba(255,255,255,0.08)',aspectRatio:'1',padding:0,cursor:'zoom-in',background:'rgba(255,255,255,0.04)',transition:'all 0.25s',minHeight:44}}
                        onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.04)';e.currentTarget.style.borderColor='rgba(13,148,136,0.4)';}}
                        onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';}}>
                        <img src={p} alt={`Foto ${i+1}`} style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy"/>
                        <div style={{position:'absolute',bottom:6,right:6,background:'rgba(0,0,0,0.7)',color:'#fff',fontSize:9,fontWeight:900,padding:'2px 7px',borderRadius:99,backdropFilter:'blur(8px)'}}>{i+1}/{occurrence.photos.length}</div>
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
function ConformDetailModal({ detail, onClose }: { detail: { sectionTitle:string; items:string[]; total:number }; onClose:()=>void }) {
  const pct = Math.round((detail.items.length/detail.total)*100);
  return (
    <>
      <style>{`
        .cf-ov{position:fixed;inset:0;background:rgba(2,6,23,0.92);backdrop-filter:blur(20px);display:flex;align-items:center;justify-content:center;z-index:3000;padding:clamp(12px,4vw,20px);animation:cfFi .25s ease;}
        .cf-box{width:100%;max-width:540px;background:linear-gradient(145deg,#0f172a,#1e293b);border:1px solid rgba(255,255,255,0.08);border-radius:clamp(16px,4vw,28px);box-shadow:0 40px 80px rgba(0,0,0,0.6);max-height:92dvh;display:flex;flex-direction:column;overflow:hidden;animation:cfSu .35s cubic-bezier(0.16,1,0.3,1);}
        @media(max-width:480px){.cf-ov{align-items:flex-end;padding:0;}.cf-box{max-width:100%;border-radius:clamp(16px,4vw,24px) clamp(16px,4vw,24px) 0 0;max-height:96dvh;}}
        @keyframes cfFi{from{opacity:0}to{opacity:1}}
        @keyframes cfSu{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}
      `}</style>
      <div className="cf-ov" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
        <div className="cf-box">
          <div style={{padding:'clamp(14px,4vw,22px) clamp(16px,4vw,24px)',background:'linear-gradient(90deg,rgba(22,163,74,0.12),rgba(22,163,74,0.03))',borderBottom:'1px solid rgba(22,163,74,0.15)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,gap:12}}>
            <div style={{display:'flex',alignItems:'center',gap:12,minWidth:0}}>
              <div style={{width:46,height:46,borderRadius:14,background:'rgba(22,163,74,0.2)',border:'1px solid rgba(22,163,74,0.3)',color:'#22c55e',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 20px rgba(22,163,74,0.25)',flexShrink:0}}>
                <CheckCircle2 size={22}/>
              </div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.14em',color:'rgba(34,197,94,0.7)',marginBottom:3}}>✓ ITENS VALIDADOS</div>
                <div style={{fontSize:'clamp(13px,3.5vw,15px)',fontWeight:800,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{detail.sectionTitle}</div>
              </div>
            </div>
            <button onClick={onClose} style={{width:44,height:44,borderRadius:10,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.5)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
              <X size={16}/>
            </button>
          </div>
          <div style={{padding:'12px clamp(16px,4vw,24px)',borderBottom:'1px solid rgba(255,255,255,0.06)',background:'rgba(255,255,255,0.02)',display:'flex',alignItems:'center',gap:16,flexShrink:0}}>
            <div style={{flex:1,height:6,background:'rgba(255,255,255,0.06)',borderRadius:99,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,#16a34a,#22c55e)',borderRadius:99,transition:'all 1s ease'}}/>
            </div>
            <span style={{fontSize:13,fontWeight:900,color:'#22c55e',fontVariantNumeric:'tabular-nums',flexShrink:0}}>{detail.items.length}/{detail.total} · {pct}%</span>
          </div>
          <div style={{overflowY:'auto',flex:1,padding:'16px clamp(16px,4vw,24px)',display:'flex',flexDirection:'column',gap:8}}>
            {detail.items.map((item,i)=>(
              <div key={i} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'clamp(10px,3vw,12px) clamp(12px,3vw,16px)',borderRadius:14,background:'rgba(22,163,74,0.07)',border:'1px solid rgba(22,163,74,0.12)'}}>
                <CheckCircle2 size={16} style={{color:'#22c55e',flexShrink:0,marginTop:2}}/>
                <span style={{fontSize:13,fontWeight:600,lineHeight:1.5,color:'rgba(255,255,255,0.85)'}}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── ConformSection ────────────────────────────────────────── */
function ConformSection({ title, sectionId, items, total, defaultOpen, onDetail }:{
  title:string; sectionId:string; items:string[]; total:number; defaultOpen:boolean; onDetail:(d:any)=>void;
}) {
  const [open,setOpen] = useState(defaultOpen);
  const pct = total>0?Math.round((items.length/total)*100):0;
  const isComplete = pct===100;
  return (
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:20,overflow:'hidden',transition:'all 0.2s',boxShadow:'0 2px 12px rgba(0,0,0,0.08)'}}>
      <button type="button" onClick={()=>setOpen(o=>!o)}
        style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'clamp(12px,3vw,16px) clamp(14px,4vw,20px)',background:open?'rgba(22,163,74,0.05)':'transparent',borderBottom:open?'1px solid rgba(22,163,74,0.1)':'none',cursor:'pointer',gap:12,minHeight:44}}>
        <div style={{display:'flex',alignItems:'center',gap:12,minWidth:0,flex:1}}>
          <div style={{width:40,height:40,borderRadius:12,background:isComplete?'rgba(22,163,74,0.2)':'rgba(22,163,74,0.1)',border:`1px solid ${isComplete?'rgba(22,163,74,0.4)':'rgba(22,163,74,0.2)'}`,color:'var(--success)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            {isComplete?<Star size={18} fill="currentColor"/>:<CheckCircle2 size={18}/>}
          </div>
          <div style={{minWidth:0,flex:1}}>
            <div style={{fontSize:'clamp(12px,3.5vw,14px)',fontWeight:800,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--text)'}}>{title}</div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginTop:6}}>
              <div style={{flex:1,height:4,background:'rgba(22,163,74,0.12)',borderRadius:99,overflow:'hidden',maxWidth:120}}>
                <div style={{height:'100%',width:`${pct}%`,background:isComplete?'linear-gradient(90deg,#16a34a,#22c55e)':'#16a34a',borderRadius:99}}/>
              </div>
              <span style={{fontSize:11,fontWeight:800,color:'var(--success)',whiteSpace:'nowrap'}}>{items.length}/{total} · {pct}%</span>
            </div>
          </div>
        </div>
        {open?<ChevronUp size={18} style={{color:'var(--success)',flexShrink:0}}/>:<ChevronDown size={18} style={{color:'var(--success)',flexShrink:0}}/>}
      </button>
      {open&&(
        <div style={{display:'flex',flexDirection:'column'}}>
          {items.map((item,i)=>(
            <button key={`${sectionId}-${i}`} type="button" onClick={()=>onDetail({sectionTitle:title,items,total})}
              style={{width:'100%',display:'flex',alignItems:'center',gap:12,padding:'clamp(11px,3vw,13px) clamp(14px,4vw,24px)',borderBottom:i<items.length-1?'1px solid var(--border)':'none',background:'transparent',cursor:'pointer',textAlign:'left',transition:'background 0.15s',minHeight:44}}
              onMouseEnter={e=>(e.currentTarget.style.background='rgba(22,163,74,0.04)')}
              onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
              <CheckCircle2 size={14} style={{color:'var(--success)',flexShrink:0}}/>
              <span style={{fontSize:'clamp(12px,3vw,13px)',fontWeight:600,lineHeight:1.5,flex:1,color:'var(--text)'}}>{item}</span>
              <ArrowRight size={13} style={{color:'var(--text-faint)',flexShrink:0}}/>
            </button>
          ))}
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

/* ─── Collaborator Card (inside a date section) ─────────────── */
function CollaboratorCard({ reporter, occs, onSelectOcc }:{
  reporter:string; occs:OccurrenceData[]; onSelectOcc:(occ:OccurrenceData)=>void;
}) {
  const [expanded, setExpanded] = useState(true);
  const av = getAvatarColor(reporter);
  const photoCount = occs.reduce((a,o)=>a+o.photos.length,0);

  // Collect unique machines for this collaborator across all their occurrences
  const machines = useMemo(()=>{
    const set = new Set<string>();
    occs.forEach(o=>{ const m=machineLabel(o.reporter); if(m) set.add(m); });
    return [...set];
  },[occs]);

  return (
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:20,overflow:'hidden',boxShadow:'0 4px 16px rgba(0,0,0,0.06)',transition:'box-shadow 0.2s'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'clamp(12px,3vw,16px) clamp(14px,4vw,20px)',background:'linear-gradient(90deg,var(--surface-2) 0%,var(--surface) 100%)',borderBottom:expanded?'1px solid var(--border)':'none',gap:10}}>
        <div style={{display:'flex',alignItems:'center',gap:'clamp(10px,3vw,14px)',minWidth:0,flex:1}}>
          <div style={{position:'relative',flexShrink:0}}>
            <div style={{width:46,height:46,borderRadius:'50%',background:av.bg,border:`2px solid ${av.fg}44`,color:av.fg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:900,boxShadow:`0 4px 14px ${av.glow}`}}>
              {initials(reporter)}
            </div>
            <div style={{position:'absolute',bottom:0,right:0,width:14,height:14,borderRadius:'50%',background:'#f59e0b',border:'2px solid var(--surface)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <AlertTriangle size={7} color="#fff"/>
            </div>
          </div>
          <div style={{minWidth:0,flex:1}}>
            <div style={{fontSize:'clamp(13px,3.5vw,15px)',fontWeight:800,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{reporter}</div>
            {/* Machine badges */}
            {machines.length>0&&(
              <div style={{display:'flex',flexWrap:'wrap' as const,gap:4,marginTop:4}}>
                {machines.map(m=>(
                  <span key={m} style={{display:'inline-flex',alignItems:'center',gap:4,height:20,padding:'0 8px',borderRadius:99,fontSize:10,fontWeight:800,background:'rgba(99,102,241,0.12)',color:'#818cf8',border:'1px solid rgba(99,102,241,0.2)',whiteSpace:'nowrap' as const}}>
                    <Cpu size={8}/> {m}
                  </span>
                ))}
              </div>
            )}
            <div style={{display:'flex',alignItems:'center',gap:6,marginTop:machines.length>0?4:5,flexWrap:'wrap' as const}}>
              <span style={{display:'inline-flex',alignItems:'center',gap:4,height:22,padding:'0 10px',borderRadius:99,fontSize:10,fontWeight:900,background:'rgba(217,119,6,0.1)',color:'#d97706',border:'1px solid rgba(217,119,6,0.15)',whiteSpace:'nowrap' as const}}>
                <AlertTriangle size={9}/> {occs.length} {occs.length===1?'alerta':'alertas'}
              </span>
              {photoCount>0&&(
                <span style={{display:'inline-flex',alignItems:'center',gap:4,height:22,padding:'0 10px',borderRadius:99,fontSize:10,fontWeight:900,background:'rgba(13,148,136,0.1)',color:'var(--primary)',border:'1px solid rgba(13,148,136,0.15)',whiteSpace:'nowrap' as const}}>
                  <Camera size={9}/> {photoCount}
                </span>
              )}
            </div>
          </div>
        </div>
        <button type="button" onClick={()=>setExpanded(e=>!e)}
          style={{width:44,height:44,borderRadius:10,background:'var(--surface-2)',border:'1px solid var(--border)',color:'var(--text-muted)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
          {expanded?<ChevronUp size={16}/>:<ChevronDown size={16}/>}
        </button>
      </div>

      {expanded&&(
        <div style={{display:'flex',flexDirection:'column'}}>
          {occs.map((occ,i)=>(
            <button key={occ.id} type="button" onClick={()=>onSelectOcc(occ)}
              style={{width:'100%',display:'flex',alignItems:'flex-start',gap:'clamp(10px,3vw,14px)',padding:'clamp(12px,3vw,14px) clamp(14px,4vw,20px)',borderBottom:i<occs.length-1?'1px solid var(--border)':'none',background:'transparent',cursor:'pointer',textAlign:'left',transition:'background 0.15s',minHeight:44}}
              onMouseEnter={e=>(e.currentTarget.style.background='var(--surface-2)')}
              onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
              <div style={{width:3,height:36,background:'linear-gradient(180deg,#f59e0b,rgba(217,119,6,0.3))',borderRadius:99,flexShrink:0,marginTop:2}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:10,fontWeight:900,color:'var(--text-muted)',textTransform:'uppercase' as const,letterSpacing:'0.1em',marginBottom:3}}>{occ.section}</div>
                <div style={{fontSize:'clamp(12px,3.5vw,13px)',fontWeight:800,color:'var(--text)',lineHeight:1.4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{occ.item}</div>
                {occ.comment&&(
                  <div style={{fontSize:11,color:'var(--text-muted)',marginTop:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:500,fontStyle:'italic'}}>"{occ.comment}"</div>
                )}
              </div>
              <div style={{flexShrink:0,display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5}}>
                <span style={{display:'flex',alignItems:'center',gap:4,fontSize:11,fontWeight:800,color:'var(--text-muted)',fontVariantNumeric:'tabular-nums',whiteSpace:'nowrap' as const}}>
                  <Clock size={10}/> {occ.time}
                </span>
                {occ.photos.length>0&&(
                  <span style={{display:'flex',alignItems:'center',gap:3,fontSize:10,fontWeight:700,color:'var(--primary)',whiteSpace:'nowrap' as const}}>
                    <Camera size={9}/> {occ.photos.length}
                  </span>
                )}
                <ChevronRight size={13} style={{color:'var(--text-faint)'}}/>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Date Block Header ─────────────────────────────────────── */
function DateBlockHeader({ dateKey, occCount, collabCount, isOpen, onToggle }:{
  dateKey:string; occCount:number; collabCount:number; isOpen:boolean; onToggle:()=>void;
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
        <div style={{display:'flex',alignItems:'center',gap:'clamp(8px,2vw,12px)',flexWrap:'wrap' as const}}>
          <span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:'clamp(10px,2.5vw,11px)',fontWeight:800,padding:'3px clamp(8px,2vw,10px)',borderRadius:99,background:occCount>0?'rgba(217,119,6,0.1)':'rgba(22,163,74,0.08)',color:occCount>0?'#d97706':'#16a34a',border:`1px solid ${occCount>0?'rgba(217,119,6,0.2)':'rgba(22,163,74,0.15)'}`}}>
            {occCount>0?<Flame size={10}/>:<Shield size={10}/>}
            {occCount>0?`${occCount} ${occCount===1?'alerta':'alertas'}`:'Sem alertas'}
          </span>
          <span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:'clamp(10px,2.5vw,11px)',fontWeight:800,padding:'3px clamp(8px,2vw,10px)',borderRadius:99,background:'rgba(37,99,235,0.08)',color:'#2563eb',border:'1px solid rgba(37,99,235,0.15)'}}>
            <Users size={10}/> {collabCount} {collabCount===1?'colaborador':'colaboradores'}
          </span>
        </div>
      </div>

      <div style={{flexShrink:0,color:'var(--text-muted)'}}>
        {isOpen?<ChevronUp size={18}/>:<ChevronDown size={18}/>}
      </div>
    </button>
  );
}

/* ─── Date Section (collapsible) ────────────────────────────── */
function DateSection({ dateKey, occs, onSelectOcc }:{
  dateKey:string; occs:OccurrenceData[]; onSelectOcc:(occ:OccurrenceData)=>void;
}) {
  const today = toLocalDateKey(new Date().toISOString());
  const [open, setOpen] = useState(dateKey===today);

  const empGroups = useMemo(()=>{
    const map: Record<string,OccurrenceData[]> = {};
    occs.forEach(o=>{ const r=reporterLabel(o.reporter); if(!map[r])map[r]=[]; map[r].push(o); });
    return map;
  },[occs]);

  return (
    <div style={{display:'flex',flexDirection:'column',gap:0}}>
      <DateBlockHeader
        dateKey={dateKey}
        occCount={occs.length}
        collabCount={Object.keys(empGroups).length}
        isOpen={open}
        onToggle={()=>setOpen(o=>!o)}
      />
      {open&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,380px),1fr))',gap:'clamp(8px,2vw,12px)',paddingTop:'clamp(8px,2vw,12px)'}}>
          {Object.entries(empGroups).map(([rep,repOccs])=>(
            <CollaboratorCard key={rep} reporter={rep} occs={repOccs} onSelectOcc={onSelectOcc}/>
          ))}
        </div>
      )}
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

/* ─── Main Component ──────────────────────────────────────── */
export default function DashboardView({ occurrences, checklistState }: DashboardViewProps) {
  const [lightbox, setLightbox]         = useState<{photos:string[];index:number}|null>(null);
  const [activeTab, setActiveTab]       = useState<'timeline'|'colaboradores'|'conformidades'>('timeline');
  const [selectedOcc, setSelectedOcc]   = useState<OccurrenceData|null>(null);
  const [selectedConform, setSelectedConform] = useState<any>(null);
  const [searchQuery, setSearchQuery]   = useState('');
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

  // Aggregate stats per normalized collaborator name (includes machines list)
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

  const conformSections = CHECKLIST_DATA.map(s=>({section:s,conformItems:s.items.filter(i=>checklistState[`${s.id}__${i}`]===true)})).filter(({conformItems})=>conformItems.length>0);

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

        .conform-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:clamp(8px,2vw,12px);}

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
                  <DateSection key={dk} dateKey={dk} occs={dayOccs} onSelectOcc={setSelectedOcc}/>
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

            {conformSections.length===0?(
              <div className="empty-state">
                <p style={{fontSize:'clamp(13px,4vw,15px)',fontWeight:800,color:'var(--text)'}}>Nenhum item verificado ainda</p>
              </div>
            ):(
              <div className="conform-grid">
                {conformSections.map(({section,conformItems},i)=>(
                  <ConformSection key={section.id} title={section.title} sectionId={section.id} items={conformItems} total={section.items.length} defaultOpen={i===0} onDetail={setSelectedConform}/>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedOcc&&<OccurrenceDetailModal occurrence={selectedOcc} onClose={()=>setSelectedOcc(null)} onOpenPhoto={(p,i)=>{setSelectedOcc(null);setLightbox({photos:p,index:i});}}/>}
      {selectedConform&&<ConformDetailModal detail={selectedConform} onClose={()=>setSelectedConform(null)}/>}

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
