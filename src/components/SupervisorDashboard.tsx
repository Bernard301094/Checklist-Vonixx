/**
 * SupervisorDashboard v4 — Premium Industrial Design
 * 4 tabs: Visão Geral | Ocorrências | Conformidades | Operadores
 * Improved glassmorphism, typography (Sora) and data visualization.
 */
import { useState, useMemo } from 'react';
import {
  AlertTriangle, CheckCircle2, TrendingUp, Users,
  Clock, Calendar, Camera, MessageSquare, Hash,
  ChevronRight, X, ChevronLeft, Filter, BarChart2,
  Activity, Shield, LayoutDashboard, List
} from 'lucide-react';
import { OccurrenceData } from '../types';
import { CHECKLIST_DATA } from '../constants';

interface Props {
  occurrences: OccurrenceData[];
  checklistState: Record<string, boolean>;
}

type Tab = 'overview' | 'ocorrencias' | 'conformidades' | 'operadores';

/* ─── Helpers ─────────────────────────────────────── */
function toLocalDateKey(iso: string | undefined): string {
  if (!iso) return todayKey();
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function yesterdayKey() {
  const d = new Date(); d.setDate(d.getDate()-1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function dateLabel(dk: string) {
  if (dk === todayKey()) return 'Hoje';
  if (dk === yesterdayKey()) return 'Ontem';
  const [y,m,day] = dk.split('-'); return `${day}/${m}/${y}`;
}
function initials(name: string) {
  return name.split(' - Auth:')[0].trim().split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase().slice(0,2);
}
function cleanName(raw: string) { return raw.split(' - Auth:')[0].trim(); }

const PALETTE = ['#0d9488','#7c3aed','#db2777','#d97706','#16a34a','#2563eb','#dc2626','#059669'];
function avatarColor(name: string) {
  let h=0; for(let i=0;i<name.length;i++) h=(h*31+name.charCodeAt(i))%PALETTE.length;
  return PALETTE[h];
}
function groupByDate(occs: OccurrenceData[]) {
  const sorted=[...occs].sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||''));
  const map=new Map<string,OccurrenceData[]>();
  const order:string[]=[];
  sorted.forEach(o=>{
    const dk=toLocalDateKey(o.created_at);
    if(!map.has(dk)){map.set(dk,[]);order.push(dk);}
    map.get(dk)!.push(o);
  });
  return order.map(dk=>({dateKey:dk,items:map.get(dk)!}));
}

/* ─── Lightbox ────────────────────────────────────── */
function Lightbox({photos,index,onClose}:{photos:string[];index:number;onClose:()=>void}) {
  const [cur,setCur]=useState(index);
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(2,6,23,0.98)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9000,padding:16}}>
      <button onClick={onClose} style={{position:'absolute',top:24,right:24,width:48,height:48,borderRadius:'50%',background:'rgba(255,255,255,0.1)',color:'#fff',border:'1px solid rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer', transition:'all 0.2s'}} onMouseEnter={e => e.currentTarget.style.transform='scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}><X size={24}/></button>
      {photos.length>1&&<button onClick={()=>setCur(i=>i===0?photos.length-1:i-1)} style={{position:'absolute',left:16,width:56,height:56,borderRadius:'50%',background:'rgba(255,255,255,0.08)',color:'#fff',border:'1px solid rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}><ChevronLeft size={28}/></button>}
      <div style={{maxWidth:'min(1200px,94vw)',display:'flex',flexDirection:'column',alignItems:'center',gap:16}}>
        <img src={photos[cur]} alt={`Foto ${cur+1}`} style={{maxWidth:'100%',maxHeight:'82vh',objectFit:'contain',borderRadius:16,boxShadow:'0 32px 80px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)'}}/>
        <div style={{background:'rgba(255,255,255,0.1)', padding: '6px 16px', borderRadius: 99, color:'#fff',fontSize:13,fontWeight:700, backdropFilter: 'blur(4px)'}}>Foto {cur+1} de {photos.length}</div>
      </div>
      {photos.length>1&&<button onClick={()=>setCur(i=>i===photos.length-1?0:i+1)} style={{position:'absolute',right:16,width:56,height:56,borderRadius:'50%',background:'rgba(255,255,255,0.08)',color:'#fff',border:'1px solid rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}><ChevronRight size={28}/></button>}
    </div>
  );
}

/* ─── Occurrence Detail Sheet ────────────────────────── */
function OccSheet({occ,onClose,onPhoto}:{occ:OccurrenceData;onClose:()=>void;onPhoto:(photos:string[],i:number)=>void}) {
  const dateStr=occ.created_at?new Date(occ.created_at).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'}):'--';
  return (
    <>
      <style>{`
        .occ-ov{position:fixed;inset:0;background:rgba(2,6,23,0.85);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;z-index:6000;padding:16px;animation:occFade .2s ease;}
        .occ-box{width:100%;max-width:600px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-2xl);box-shadow:var(--sh-xl);max-height:92dvh;display:flex;flex-direction:column;overflow:hidden;animation:occSlide .3s cubic-bezier(0.16, 1, 0.3, 1);}
        @media(max-width:480px){.occ-ov{align-items:flex-end;padding:0;}.occ-box{max-width:100%;border-bottom-left-radius:0;border-bottom-right-radius:0;max-height:96dvh;}}
        @keyframes occFade{from{opacity:0}to{opacity:1}}
        @keyframes occSlide{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:none}}
      `}</style>
      <div className="occ-ov" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
        <div className="occ-box">
          <div style={{padding:'18px 24px',borderBottom:'1px solid var(--sidebar-border)',display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--sidebar-bg)',flexShrink:0}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:42,height:42,borderRadius:'var(--r-xl)',background:'rgba(217,119,6,0.2)',color:'var(--warning)',display:'flex',alignItems:'center',justifyContent:'center', boxShadow:'0 4px 12px rgba(217,119,6,0.2)'}}><AlertTriangle size={20}/></div>
              <div>
                <div style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.12em',fontWeight:800,color:'rgba(255,255,255,0.4)',marginBottom:2}}>Relatório de Ocorrência</div>
                <div style={{fontSize:15,fontWeight:800,color:'#fff',maxWidth:320,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:'var(--font-display)'}}>{occ.section}</div>
              </div>
            </div>
            <button onClick={onClose} className="action-btn" style={{width:36,height:36}}><X size={16}/></button>
          </div>
          
          <div style={{display:'flex',gap:10,padding:'12px 24px',borderBottom:'1px solid var(--border)',background:'var(--surface-2)',flexShrink:0}}>
            {[{icon:Calendar,label:'Data',value:dateStr},{icon:Clock,label:'Hora',value:occ.time},{icon:Users,label:'Operador',value:cleanName(occ.reporter)}].map(({icon:Icon,label,value})=>(
              <div key={label} style={{flex:1,display:'flex',flexDirection:'column',gap:4,padding:'8px 12px',background:'var(--surface)',borderRadius:'var(--r-lg)',border:'1px solid var(--border)',minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:4,color:'var(--text-muted)'}}><Icon size={12}/><span style={{fontSize:10,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.06em'}}>{label}</span></div>
                <div style={{fontSize:13,fontWeight:700,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{overflowY:'auto',flex:1,padding:'24px',display:'flex',flexDirection:'column',gap:20}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:'var(--warning)'}}/>
                <span style={{fontSize:12,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--warning)'}}>Item não conforme</span>
              </div>
              <div style={{padding:'16px 20px',background:'var(--warning-hl)',border:'1px solid rgba(217,119,6,0.25)',borderRadius:'var(--r-xl)', boxShadow:'inset 0 1px 2px rgba(217,119,6,0.05)'}}>
                <p style={{fontSize:15,fontWeight:700,lineHeight:1.6,color:'var(--text)',fontFamily:'var(--font-display)'}}>{occ.item}</p>
              </div>
            </div>

            {occ.comment&&(
              <div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:'var(--primary)'}}/>
                  <span style={{fontSize:12,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-muted)'}}>Observação do Operador</span>
                </div>
                <div style={{padding:'16px 20px',background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:'var(--r-xl)', position:'relative'}}>
                  <MessageSquare size={14} style={{position:'absolute', top:16, right:16, opacity:0.1}} />
                  <p style={{fontSize:14,lineHeight:1.8,color:'var(--text)', fontWeight:500}}>{occ.comment}</p>
                </div>
              </div>
            )}

            {occ.photos.length>0&&(
              <div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                  <Camera size={14} style={{color:'var(--primary)'}}/>
                  <span style={{fontSize:12,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--primary)'}}>Evidências Fotográficas ({occ.photos.length})</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:12}}>
                  {occ.photos.map((p,i)=>(
                    <button key={i} type="button" onClick={()=>onPhoto(occ.photos,i)}
                      style={{position:'relative',borderRadius:'var(--r-xl)',overflow:'hidden',border:'1px solid var(--border)',aspectRatio:'1',padding:0,cursor:'zoom-in',background:'var(--surface-2)', transition:'transform 0.2s'}}
                      onMouseEnter={e=>e.currentTarget.style.transform='scale(1.03)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
                      <img src={p} alt={`Foto ${i+1}`} style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy"/>
                      <div style={{position:'absolute', bottom:8, left:8, background:'rgba(0,0,0,0.6)', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:4, backdropFilter:'blur(2px)'}}>{i+1}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── KPI Card ───────────────────────────────────────── */
function KpiCard({label,value,sub,icon:Icon,color,bg,trend}:{label:string;value:string|number;sub?:string;icon:any;color:string;bg:string;trend?:string}) {
  return (
    <div className="card card-hover" style={{padding:'20px',display:'flex',flexDirection:'column',gap:16, background:'linear-gradient(180deg, var(--surface) 0%, var(--surface-2) 100%)'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{width:40,height:40,borderRadius:'var(--r-xl)',background:bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0, boxShadow:`0 4px 12px ${bg}`}}>
          <Icon size={18} style={{color}}/>
        </div>
        {trend&&<div style={{fontSize:11,color:'var(--success)',fontWeight:800, background:'var(--success-hl)', padding:'2px 8px', borderRadius:99}}>{trend}</div>}
      </div>
      <div>
        <div style={{fontSize:11,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--text-muted)',marginBottom:4}}>{label}</div>
        <div style={{display:'flex',alignItems:'baseline',gap:4}}>
          <span style={{fontSize:36,fontWeight:800,lineHeight:1,color:'var(--text)',fontFamily:'var(--font-display)',letterSpacing:'-0.02em'}}>{value}</span>
          {sub&&<span style={{fontSize:14,fontWeight:700,color:'var(--text-muted)'}}>{sub}</span>}
        </div>
      </div>
    </div>
  );
}

/* ─── Date Separator ─────────────────────────────────── */
function DateSep({dateKey,count}:{dateKey:string;count:number}) {
  const isToday=dateKey===todayKey();
  return (
    <div style={{display:'flex',alignItems:'center',gap:12,margin:'12px 0 8px'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 14px',borderRadius:999,background:isToday?'var(--primary-hl)':'var(--surface)',border:`1px solid ${isToday?'rgba(1,105,111,0.25)':'var(--border)'}`,boxShadow:isToday?'var(--sh-sm)':'none',flexShrink:0}}>
        <Calendar size={12} style={{color:isToday?'var(--primary)':'var(--text-muted)'}}/>
        <span style={{fontSize:12,fontWeight:800,color:isToday?'var(--primary)':'var(--text)',letterSpacing:'0.02em'}}>{dateLabel(dateKey).toUpperCase()}</span>
        <div style={{width:4,height:4,borderRadius:'50%',background:isToday?'var(--primary)':'var(--divider)'}}/>
        <span style={{fontSize:11,fontWeight:800,color:isToday?'var(--primary)':'var(--text-muted)'}}>{count} {count===1?'REGISTRO':'REGISTROS'}</span>
      </div>
      <div style={{flex:1,height:1,background:'var(--divider)'}}/>
    </div>
  );
}

/* ─── Occurrence Row ─────────────────────────────────── */
function OccRow({occ,onSelect}:{occ:OccurrenceData;onSelect:()=>void}) {
  const color=avatarColor(occ.reporter);
  return (
    <button type="button" onClick={onSelect} className="card-hover"
      style={{display:'flex',alignItems:'center',gap:14,padding:'16px 20px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-2xl)',cursor:'pointer',textAlign:'left',width:'100%', transition:'all 0.2s'}}>
      <div style={{width:44,height:44,borderRadius:'50%',background:color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0, boxShadow:`0 4px 10px ${color}44`, border:'2px solid #fff'}}>
        <span style={{fontSize:13,fontWeight:800,color:'#fff'}}>{initials(occ.reporter)}</span>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
          <span style={{fontSize:14,fontWeight:800,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,fontFamily:'var(--font-display)'}}>{occ.item}</span>
          <span style={{fontSize:10,color:'var(--text-muted)',fontWeight:700,background:'var(--surface-2)',padding:'2px 8px',borderRadius:99,border:'1px solid var(--border)'}}>{occ.time}</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:12,color:'var(--text-muted)',fontWeight:600}}>{occ.section}</span>
          {occ.photos.length>0&&<span style={{display:'flex',alignItems:'center',gap:3,fontSize:11,fontWeight:800,color:'var(--primary)'}}><Camera size={11}/>{occ.photos.length}</span>}
        </div>
      </div>
      <div style={{width:32,height:32,borderRadius:'50%',background:'var(--surface-2)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-faint)'}}>
        <ChevronRight size={16}/>
      </div>
    </button>
  );
}

/* ─── Grouped OCC list ──────────────────────────────── */
function GroupedList({occs,onSelect}:{occs:OccurrenceData[];onSelect:(o:OccurrenceData)=>void}) {
  const groups=useMemo(()=>groupByDate(occs),[occs]);
  if(!occs.length) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'80px 24px',color:'var(--text-muted)',gap:16, background:'var(--surface-2)', borderRadius:'var(--r-2xl)', border:'2px dashed var(--border)'}}>
      <div style={{width:64,height:64,borderRadius:'50%',background:'var(--success-hl)',color:'var(--success)',display:'flex',alignItems:'center',justifyContent:'center'}}><Shield size={32}/></div>
      <div style={{textAlign:'center'}}>
        <p style={{fontWeight:800,fontSize:16,color:'var(--text)',fontFamily:'var(--font-display)'}}>Nenhuma ocorrência encontrada</p>
        <p style={{fontSize:14,marginTop:4, fontWeight:500}}>Toda a operação está operando dentro dos parâmetros de normalidade.</p>
      </div>
    </div>
  );
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {groups.map(({dateKey,items})=>(
        <div key={dateKey} style={{display:'flex',flexDirection:'column',gap:8}}>
          <DateSep dateKey={dateKey} count={items.length}/>
          {items.map(o=><OccRow key={o.id} occ={o} onSelect={()=>onSelect(o)}/>)}
        </div>
      ))}
    </div>
  );
}

/* ─── Section Progress ───────────────────────────────── */
function SectionBar({title,total,checked,occs}:{title:string;total:number;checked:number;occs:number}) {
  const pct=total>0?Math.round((checked/total)*100):0;
  const color=pct===100?'var(--success)':pct>60?'var(--primary)':'var(--warning)';
  return (
    <div className="card-hover" style={{padding:'16px 20px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-2xl)',display:'flex',flexDirection:'column',gap:12}}>
      <div style={{display:'flex',alignItems:'center',gap:12,justifyContent:'space-between'}}>
        <span style={{fontSize:14,fontWeight:800,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:'var(--font-display)'}}>{title.replace(/^\d+\.\s*/,'')}</span>
        <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
          {occs>0&&(
            <div style={{display:'flex',alignItems:'center',gap:4,fontSize:11,fontWeight:800,color:'var(--warning)',background:'var(--warning-hl)',padding:'3px 10px',borderRadius:999, border:'1px solid rgba(217,119,6,0.2)'}}>
              <AlertTriangle size={10}/>{occs}
            </div>
          )}
          <span style={{fontSize:16,fontWeight:800,color,fontFamily:'var(--font-display)'}}>{pct}%</span>
        </div>
      </div>
      <div style={{height:8,background:'var(--divider)',borderRadius:999,overflow:'hidden', position:'relative'}}>
        <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:999,transition:'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'}}/>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:12,color:'var(--text-muted)',fontWeight:700}}>{checked} de {total} itens conferidos</span>
        {pct===100&&<div style={{fontSize:11,fontWeight:800,color:'var(--success)',display:'flex',alignItems:'center',gap:4, background:'var(--success-hl)', padding:'2px 8px', borderRadius:99}}><CheckCircle2 size={12}/>PRONTO</div>}
      </div>
    </div>
  );
}

/* ─── Mini bar chart (CSS only) ────────────────────────── */
function WeekChart({data}:{data:{day:string;occs:number}[]}) {
  const max=Math.max(...data.map(d=>d.occs),1);
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:8,height:100,paddingBottom:24,position:'relative', marginTop:10}}>
      {data.map((d,i)=>(
        <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',height:'100%',justifyContent:'flex-end',position:'relative'}}>
          <div style={{width:'100%',maxWidth:40,height:`${Math.max((d.occs/max)*70,d.occs>0?6:3)}px`,background:d.occs>0?'var(--warning)':'var(--divider)',borderRadius:'6px 6px 2px 2px',transition:'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',minHeight:3, boxShadow:d.occs>0?'0 4px 12px rgba(217,119,6,0.2)':'none'}} title={`${d.occs} ocorr.`}/>
          {d.occs>0&&<span style={{position:'absolute',top:-20,fontSize:11,fontWeight:800,color:'var(--warning)', fontFamily:'var(--font-display)'}}>{d.occs}</span>}
          <span style={{fontSize:10,fontWeight:800,color:'var(--text-muted)',position:'absolute',bottom:0,letterSpacing:'0.05em'}}>{d.day.toUpperCase()}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Operator Card ───────────────────────────────────── */
function OperatorCard({name,occs,rank}:{name:string;occs:number;rank:number}) {
  const color=avatarColor(name);
  return (
    <div className="card-hover" style={{display:'flex',alignItems:'center',gap:16,padding:'16px 20px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-2xl)'}}>
      <div style={{width:24,textAlign:'center',flexShrink:0}}>
        <span style={{fontSize:14,fontWeight:900,color:rank<=3?'var(--primary)':'var(--text-faint)',fontFamily:'var(--font-display)'}}>{rank}</span>
      </div>
      <div style={{width:48,height:48,borderRadius:'50%',background:color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0, border:'2px solid #fff', boxShadow:`0 4px 12px ${color}33`}}>
        <span style={{fontSize:14,fontWeight:800,color:'#fff'}}>{initials(name)}</span>
      </div>
      <div style={{flex:1, minWidth:0}}>
        <div style={{fontSize:15,fontWeight:800,color:'var(--text)',fontFamily:'var(--font-display)', overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cleanName(name)}</div>
        <div style={{fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em'}}>Operador de Campo</div>
      </div>
      <div style={{flexShrink:0,textAlign:'right', background:'var(--warning-hl)', padding:'6px 12px', borderRadius:'var(--r-xl)', border:'1px solid rgba(217,119,6,0.15)'}}>
        <div style={{fontSize:20,fontWeight:900,color:'var(--warning)',lineHeight:1, fontFamily:'var(--font-display)'}}>{occs}</div>
        <div style={{fontSize:9,color:'var(--warning)',fontWeight:800, textTransform:'uppercase', letterSpacing:'0.04em'}}>Alertas</div>
      </div>
    </div>
  );
}

/* ─── MAIN ──────────────────────────────────────────── */
export default function SupervisorDashboard({occurrences,checklistState}:Props) {
  const [tab,setTab]=useState<Tab>('overview');
  const [selectedOcc,setSelectedOcc]=useState<OccurrenceData|null>(null);
  const [lightbox,setLightbox]=useState<{photos:string[];index:number}|null>(null);
  const [sectionFilter,setSectionFilter]=useState('all');

  const today=todayKey();
  const todayOccs=useMemo(()=>occurrences.filter(o=>toLocalDateKey(o.created_at)===today),[occurrences,today]);
  const totalChecked=useMemo(()=>Object.values(checklistState).filter(Boolean).length,[checklistState]);
  const totalItems=useMemo(()=>CHECKLIST_DATA.reduce((a,s)=>a+s.items.length,0),[]);
  const conformPct=totalItems>0?Math.round((totalChecked/totalItems)*100):0;
  const uniqueOps=useMemo(()=>new Set(occurrences.map(o=>o.reporter)).size,[occurrences]);

  const sectionStats=useMemo(()=>CHECKLIST_DATA.map(s=>({
    section:s,
    checked:s.items.filter(item=>checklistState[`${s.id}__${item}`]).length,
    occs:occurrences.filter(o=>o.section===s.title).length
  })),[occurrences,checklistState]);

  const operatorStats=useMemo(()=>{
    const map:Record<string,number>={};
    occurrences.forEach(o=>{map[o.reporter]=(map[o.reporter]||0)+1;});
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,8);
  },[occurrences]);

  const weekData=useMemo(()=>{
    const days=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    return Array.from({length:7},(_,i)=>{
      const d=new Date(); d.setDate(d.getDate()-(6-i));
      const dk=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      return {day:days[d.getDay()],occs:occurrences.filter(o=>toLocalDateKey(o.created_at)===dk).length};
    });
  },[occurrences]);

  const allSections=useMemo(()=>Array.from(new Set(occurrences.map(o=>o.section))),[occurrences]);
  const filteredOccs=useMemo(()=>{
    const list=sectionFilter==='all'?occurrences:occurrences.filter(o=>o.section===sectionFilter);
    return [...list].sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||''));
  },[occurrences,sectionFilter]);

  const TABS:Array<{id:Tab;label:string;icon:any;badge?:number;badgeColor?:string}>=[
    {id:'overview', label:'Dashboard', icon:LayoutDashboard},
    {id:'ocorrencias', label:'Ocorrências', icon:AlertTriangle, badge:occurrences.length, badgeColor:'var(--warning)'},
    {id:'conformidades', label:'Conformidades', icon:CheckCircle2, badge:conformPct, badgeColor:'var(--success)'},
    {id:'operadores', label:'Operadores', icon:Users, badge:uniqueOps, badgeColor:'var(--primary)'},
  ];

  return (
    <>
      <style>{`
        /* — Tab bar — */
        .sd-tabs{display:flex;background:var(--sidebar-bg);padding:4px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch; gap:4px;}
        .sd-tabs::-webkit-scrollbar{display:none;}
        .sd-tab{flex:1;display:flex;align-items:center;justify-content:center;gap:10px;padding:14px 20px;font-size:13px;font-weight:800;color:rgba(255,255,255,0.5);border-radius:var(--r-lg);cursor:pointer;background:transparent;border:none;white-space:nowrap;transition:all 0.2s;}
        .sd-tab.active{color:#fff;background:rgba(255,255,255,0.08);box-shadow:inset 0 1px 1px rgba(255,255,255,0.1);}
        .sd-tab:hover:not(.active){color:#fff;background:rgba(255,255,255,0.04);}
        .sd-tab-badge{font-size:10px;font-weight:900;padding:2px 8px;border-radius:999px;line-height:1;background:rgba(255,255,255,0.12);color:#fff;}

        /* — Panel — */
        .sd-panel{padding:24px;display:flex;flex-direction:column;gap:24px; animation:tabEnter 0.3s ease-out;}
        @keyframes tabEnter{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @media(max-width:480px){.sd-panel{padding:16px;gap:16px;}}

        /* — KPI grid — */
        .sd-kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
        @media(max-width:1024px){.sd-kpi-grid{grid-template-columns:repeat(2,1fr);gap:12px;}}
        @media(max-width:360px){.sd-kpi-grid{grid-template-columns:1fr; gap:8px;}}

        /* — Overview 2-col — */
        .sd-overview-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;}
        @media(max-width:860px){.sd-overview-grid{grid-template-columns:1fr; gap:16px;}}

        /* — Section heading — */
        .sd-section-hd{display:flex;align-items:center;gap:10px;margin-bottom:4px;}
        .sd-section-hd span{font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);font-family:var(--font-display);}
        @media(max-width:360px){ .sd-section-hd span{ font-size:11px; } }

        /* — Filter bar — */
        .sd-filter{display:flex;align-items:center;gap:10px;padding:12px 18px;background:var(--surface);border-radius:var(--r-2xl);border:1px solid var(--border);box-shadow:var(--sh-sm);}
        @media(max-width:360px){ .sd-filter{ padding:10px 12px; } }
        .sd-filter select{font:inherit;font-size:14px;font-weight:700;color:var(--text);background:transparent;border:none;outline:none;flex:1;cursor:pointer;min-width:0;}

        /* — Mobile bottom tabs — */
        @media(max-width:640px){
          .sd-tabs{position:fixed;bottom:0;left:0;right:0;z-index:100;border-top:1px solid var(--sidebar-border);padding:8px 8px calc(8px + env(safe-area-inset-bottom));background:var(--sidebar-bg);box-shadow:0 -10px 30px rgba(0,0,0,0.3);}
          .sd-tab{flex:1;flex-direction:column;gap:4px;padding:10px 4px;font-size:10px;border-radius:var(--r-md); min-width:0;}
          .sd-tab span { 
            font-size: 9px; 
            white-space: nowrap; 
            overflow: hidden; 
            text-overflow: ellipsis; 
            width: 100%;
            text-align: center;
          }
          .sd-tab-badge{position:absolute;top:4px;right:4px;}
          .sd-panel{padding-bottom:140px;}
        }
        @media(max-width:360px){
          .sd-tab{ gap: 2px; padding: 8px 2px; }
          .sd-tab svg { width: 14px; height: 14px; }
          .sd-tab span { font-size: 8px; letter-spacing: -0.02em; }
        }
        @media(max-width:320px){
          .sd-tab span { display: none; }
          .sd-tab { padding: 12px 0; }
        }
      `}</style>

      {/* ─ Navigation ─ */}
      <div className="sd-tabs">
        {TABS.map(t=>(
          <button key={t.id} type="button" className={`sd-tab${tab===t.id?' active':''}`} onClick={()=>setTab(t.id)}>
            <t.icon size={18} />
            <span className="hide-watch">{t.label}</span>
            {t.badge!==undefined&&<span className="sd-tab-badge">{t.badge}{t.id==='conformidades'?'%':''}</span>}
          </button>
        ))}
      </div>

      {/* ─ Visão Geral ───────────────────────────────── */}
      {tab==='overview'&&(
        <div className="sd-panel">
          {/* KPIs */}
          <div className="sd-kpi-grid">
            <KpiCard label="Ocorr. Hoje" value={todayOccs.length} icon={AlertTriangle} color="var(--warning)" bg="var(--warning-hl)" trend={`TOTAL: ${occurrences.length}`}/>
            <KpiCard label="Conformidade" value={`${conformPct}%`} icon={TrendingUp} color="var(--success)" bg="var(--success-hl)" trend="META: 100%"/>
            <KpiCard label="Itens Verif." value={totalChecked} sub={`/${totalItems}`} icon={CheckCircle2} color="var(--primary)" bg="var(--primary-hl)"/>
            <KpiCard label="Equipe Ativa" value={uniqueOps} icon={Users} color="#0891b2" bg="rgba(8,145,178,0.12)"/>
          </div>

          <div className="sd-overview-grid">
            {/* Weekly chart */}
            <div className="card" style={{padding:'24px', display:'flex', flexDirection:'column'}}>
              <div className="sd-section-hd"><BarChart2 size={16} style={{color:'var(--primary)'}}/><span>Histórico 7 Dias</span></div>
              <WeekChart data={weekData}/>
            </div>
            {/* Recent occurrences */}
            <div className="card" style={{padding:'24px',display:'flex',flexDirection:'column',gap:12}}>
              <div className="sd-section-hd"><AlertTriangle size={16} style={{color:'var(--warning)'}}/><span>Ocorrências Recentes</span></div>
              {todayOccs.length===0?(
                <div style={{flex:1, display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'20px 0',color:'var(--text-muted)',gap:10, background:'var(--surface-2)', borderRadius:'var(--r-xl)', border:'1px dashed var(--border)'}}>
                  <Shield size={28} style={{color:'var(--success)', opacity:0.6}}/>
                  <span style={{fontSize:13,fontWeight:800, fontFamily:'var(--font-display)'}}>Operação Estável</span>
                </div>
              ): (
                <div style={{display:'flex', flexDirection:'column', gap:8}}>
                  {todayOccs.slice(0,4).map(o=>(
                    <button key={o.id} type="button" onClick={()=>setSelectedOcc(o)} className="card-hover"
                      style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:'var(--r-xl)',cursor:'pointer',textAlign:'left',width:'100%', transition:'all 0.2s'}}>
                      <div style={{width:8, height:8, borderRadius:'50%', background:'var(--warning)', flexShrink:0}} />
                      <span style={{fontSize:13,fontWeight:700,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap', color:'var(--text)'}}>{o.item}</span>
                      <span style={{fontSize:11,color:'var(--text-faint)',fontWeight:700, fontVariantNumeric:'tabular-nums'}}>{o.time}</span>
                    </button>
                  ))}
                  {todayOccs.length>4&&(
                    <button type="button" onClick={()=>setTab('ocorrencias')} style={{fontSize:13,fontWeight:800,color:'var(--primary)',background:'none',border:'none',cursor:'pointer',padding:'8px 0',textAlign:'center', fontFamily:'var(--font-display)'}}>VER TODOS OS ALERTAS →</button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section health summary */}
          <div className="card" style={{padding:'24px'}}>
            <div className="sd-section-hd" style={{marginBottom:16}}><Activity size={16} style={{color:'var(--primary)'}}/><span>Status Operacional por Área</span></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12}}>
              {sectionStats.map(({section,checked,occs})=> (
                <SectionBar key={section.id} title={section.title} total={section.items.length} checked={checked} occs={occs}/>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─ Ocorrências ──────────────────────────────── */}
      {tab==='ocorrencias'&&(
        <div className="sd-panel">
          <div className="sd-filter">
            <Filter size={14} style={{color:'var(--primary)',flexShrink:0}}/>
            <select value={sectionFilter} onChange={e=>setSectionFilter(e.target.value)}>
              <option value="all">TODAS AS ÁREAS ({occurrences.length})</option>
              {allSections.map(s=>(
                <option key={s} value={s}>{s.toUpperCase()} ({occurrences.filter(o=>o.section===s).length})</option>
              ))}
            </select>
          </div>
          <GroupedList occs={filteredOccs} onSelect={setSelectedOcc}/>
        </div>
      )}

      {/* ─ Conformidades ───────────────────────────── */}
      {tab==='conformidades'&&(
        <div className="sd-panel">
          <div className="card" style={{padding:'24px', background:'linear-gradient(135deg, var(--success-hl) 0%, var(--surface) 100%)', borderLeft:'6px solid var(--success)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start', marginBottom:20}}>
              <div>
                <h3 style={{fontSize:14,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--success)', marginBottom:4, fontFamily:'var(--font-display)'}}>Conformidade Geral</h3>
                <p style={{fontSize:13, fontWeight:600, color:'var(--text-muted)'}}>{totalChecked} de {totalItems} itens verificados</p>
              </div>
              <div style={{fontSize:32,fontWeight:900,color:'var(--success)',fontFamily:'var(--font-display)'}}>{conformPct}%</div>
            </div>
            <div style={{height:10,background:'rgba(22,163,74,0.1)',borderRadius:999,overflow:'hidden', border:'1px solid rgba(22,163,74,0.1)'}}>
              <div style={{height:'100%',width:`${conformPct}%`,background:'var(--success)',borderRadius:999,transition:'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow:'0 0 10px rgba(22,163,74,0.4)'}}/>
            </div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:12}}>
            {sectionStats.map(({section,checked,occs})=>(
              <SectionBar key={section.id} title={section.title} total={section.items.length} checked={checked} occs={occs}/>
            ))}
          </div>
        </div>
      )}

      {/* ─ Operadores ───────────────────────────────── */}
      {tab==='operadores'&&(
        <div className="sd-panel">
          <div className="sd-section-hd"><Users size={16} style={{color:'var(--primary)'}}/><span>Performance da Equipe</span></div>
          {operatorStats.length===0?(
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'80px 24px',color:'var(--text-muted)',gap:16, background:'var(--surface-2)', borderRadius:'var(--r-2xl)', border:'2px dashed var(--border)'}}>
              <Users size={40} style={{opacity:0.3}}/>
              <p style={{fontWeight:800,fontSize:16,color:'var(--text)',fontFamily:'var(--font-display)'}}>Nenhum operador registrado</p>
            </div>
          ):(
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:12}}>
              {operatorStats.map(([name,occs],i)=>(
                <OperatorCard key={name} name={name} occs={occs} rank={i+1}/>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─ Sheets & Lightbox ─ */}
      {selectedOcc&&<OccSheet occ={selectedOcc} onClose={()=>setSelectedOcc(null)} onPhoto={(p,i)=>{setSelectedOcc(null);setLightbox({photos:p,index:i});}}/>}
      {lightbox&&<Lightbox photos={lightbox.photos} index={lightbox.index} onClose={()=>setLightbox(null)}/>}
    </>
  );
}
