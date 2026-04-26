/**
 * SupervisorDashboard v3 — Clean tab-based layout
 * 4 tabs: Visão Geral | Ocorrências | Conformidades | Operadores
 * Mobile A55 (412px): bottom tab bar, full-width panels
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
    <div style={{position:'fixed',inset:0,background:'rgba(2,6,23,0.97)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9000,padding:16}}>
      <button onClick={onClose} style={{position:'absolute',top:20,right:20,width:44,height:44,borderRadius:'50%',background:'rgba(255,255,255,0.1)',color:'#fff',border:'1px solid rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}><X size={20}/></button>
      {photos.length>1&&<button onClick={()=>setCur(i=>i===0?photos.length-1:i-1)} style={{position:'absolute',left:12,width:48,height:48,borderRadius:'50%',background:'rgba(255,255,255,0.1)',color:'#fff',border:'1px solid rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}><ChevronLeft size={22}/></button>}
      <div style={{maxWidth:'min(1100px,90vw)',display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
        <img src={photos[cur]} alt={`Foto ${cur+1}`} style={{maxWidth:'100%',maxHeight:'80vh',objectFit:'contain',borderRadius:12,boxShadow:'0 24px 64px rgba(0,0,0,0.6)'}}/>
        <div style={{color:'rgba(255,255,255,0.7)',fontSize:13,fontWeight:600}}>Foto {cur+1} de {photos.length}</div>
      </div>
      {photos.length>1&&<button onClick={()=>setCur(i=>i===photos.length-1?0:i+1)} style={{position:'absolute',right:12,width:48,height:48,borderRadius:'50%',background:'rgba(255,255,255,0.1)',color:'#fff',border:'1px solid rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}><ChevronRight size={22}/></button>}
    </div>
  );
}

/* ─── Occurrence Detail Sheet ────────────────────────── */
function OccSheet({occ,onClose,onPhoto}:{occ:OccurrenceData;onClose:()=>void;onPhoto:(photos:string[],i:number)=>void}) {
  const dateStr=occ.created_at?new Date(occ.created_at).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'}):'--';
  return (
    <>
      <style>{`
        .occ-ov{position:fixed;inset:0;background:rgba(2,6,23,0.88);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:6000;padding:16px;animation:occFade .15s ease;}
        .occ-box{width:100%;max-width:560px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-2xl);box-shadow:var(--sh-xl);max-height:92dvh;display:flex;flex-direction:column;overflow:hidden;animation:occSlide .2s ease;}
        @media(max-width:480px){.occ-ov{align-items:flex-end;padding:0;}.occ-box{max-width:100%;border-bottom-left-radius:0;border-bottom-right-radius:0;max-height:94dvh;}}
        @keyframes occFade{from{opacity:0}to{opacity:1}}
        @keyframes occSlide{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
      `}</style>
      <div className="occ-ov" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
        <div className="occ-box">
          <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--sidebar-bg)',flexShrink:0}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:36,height:36,borderRadius:'var(--r-lg)',background:'rgba(217,119,6,0.15)',color:'var(--warning)',display:'flex',alignItems:'center',justifyContent:'center'}}><AlertTriangle size={16}/></div>
              <div>
                <div style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.08em',fontWeight:700,color:'rgba(255,255,255,0.4)',marginBottom:1}}>Ocorrência</div>
                <div style={{fontSize:14,fontWeight:800,color:'#fff',maxWidth:280,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{occ.section}</div>
              </div>
            </div>
            <button onClick={onClose} style={{width:32,height:32,borderRadius:'var(--r-lg)',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.6)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}><X size={14}/></button>
          </div>
          <div style={{display:'flex',gap:8,padding:'10px 18px',borderBottom:'1px solid var(--border)',background:'var(--surface-2)',flexShrink:0}}>
            {[{icon:Calendar,label:'Data',value:dateStr},{icon:Clock,label:'Hora',value:occ.time},{icon:Users,label:'Operador',value:cleanName(occ.reporter)}].map(({icon:Icon,label,value})=>(
              <div key={label} style={{flex:1,display:'flex',flexDirection:'column',gap:2,padding:'7px 10px',background:'var(--surface)',borderRadius:'var(--r-lg)',border:'1px solid var(--border)',minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:3,color:'var(--text-muted)'}}><Icon size={10}/><span style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em'}}>{label}</span></div>
                <div style={{fontSize:12,fontWeight:700,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{overflowY:'auto',flex:1,padding:'16px 18px',display:'flex',flexDirection:'column',gap:14}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                <Hash size={12} style={{color:'var(--warning)'}}/>
                <span style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',color:'var(--warning)'}}>Item não conforme</span>
              </div>
              <div style={{padding:'12px 14px',background:'var(--warning-hl)',border:'1px solid rgba(217,119,6,0.2)',borderRadius:'var(--r-xl)'}}>
                <p style={{fontSize:14,fontWeight:700,lineHeight:1.5,color:'var(--text)'}}>{occ.item}</p>
              </div>
            </div>
            {occ.comment&&(
              <div>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                  <MessageSquare size={12} style={{color:'var(--text-muted)'}}/>
                  <span style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',color:'var(--text-muted)'}}>Observação</span>
                </div>
                <div style={{padding:'12px 14px',background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:'var(--r-xl)'}}>
                  <p style={{fontSize:13,lineHeight:1.7,color:'var(--text)'}}>{occ.comment}</p>
                </div>
              </div>
            )}
            {occ.photos.length>0&&(
              <div>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                  <Camera size={12} style={{color:'var(--primary)'}}/>
                  <span style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',color:'var(--primary)'}}>Fotos ({occ.photos.length})</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))',gap:8}}>
                  {occ.photos.map((p,i)=>(
                    <button key={i} type="button" onClick={()=>onPhoto(occ.photos,i)}
                      style={{position:'relative',borderRadius:'var(--r-lg)',overflow:'hidden',border:'1px solid var(--border)',aspectRatio:'1',padding:0,cursor:'zoom-in',background:'var(--surface-2)'}}>
                      <img src={p} alt={`Foto ${i+1}`} style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy"/>
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
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-xl)',padding:'16px',display:'flex',flexDirection:'column',gap:12}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',color:'var(--text-muted)',lineHeight:1.3}}>{label}</span>
        <div style={{width:34,height:34,borderRadius:'var(--r-lg)',background:bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <Icon size={16} style={{color}}/>
        </div>
      </div>
      <div style={{display:'flex',alignItems:'flex-end',gap:4}}>
        <span style={{fontSize:32,fontWeight:800,lineHeight:1,color:'var(--text)',fontVariantNumeric:'tabular-nums'}}>{value}</span>
        {sub&&<span style={{fontSize:13,fontWeight:600,color:'var(--text-muted)',marginBottom:3,lineHeight:1}}>{sub}</span>}
      </div>
      {trend&&<span style={{fontSize:11,color:'var(--text-muted)',fontWeight:600}}>{trend}</span>}
    </div>
  );
}

/* ─── Date Separator ─────────────────────────────────── */
function DateSep({dateKey,count}:{dateKey:string;count:number}) {
  const isToday=dateKey===todayKey();
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,margin:'4px 0'}}>
      <div style={{flex:1,height:1,background:'var(--divider)'}}/>
      <div style={{display:'flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:999,background:isToday?'var(--primary-hl)':'var(--surface-2)',border:`1px solid ${isToday?'rgba(1,105,111,0.3)':'var(--border)'}`,flexShrink:0}}>
        <Calendar size={10} style={{color:isToday?'var(--primary)':'var(--text-muted)'}}/>
        <span style={{fontSize:11,fontWeight:800,color:isToday?'var(--primary)':'var(--text-muted)',whiteSpace:'nowrap'}}>{dateLabel(dateKey)}</span>
        <span style={{fontSize:10,fontWeight:700,color:isToday?'var(--primary)':'var(--text-faint)',background:isToday?'transparent':'var(--surface)',padding:'0 3px',borderRadius:4}}>{count}</span>
      </div>
      <div style={{flex:1,height:1,background:'var(--divider)'}}/>
    </div>
  );
}

/* ─── Occurrence Row ─────────────────────────────────── */
function OccRow({occ,onSelect}:{occ:OccurrenceData;onSelect:()=>void}) {
  const color=avatarColor(occ.reporter);
  return (
    <button type="button" onClick={onSelect}
      style={{display:'flex',alignItems:'flex-start',gap:10,padding:'12px 14px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-xl)',cursor:'pointer',textAlign:'left',width:'100%',transition:'background 150ms,border-color 150ms'}}
      onMouseEnter={e=>{e.currentTarget.style.background='var(--surface-2)';e.currentTarget.style.borderColor='var(--primary)'; }}
      onMouseLeave={e=>{e.currentTarget.style.background='var(--surface)';e.currentTarget.style.borderColor='var(--border)';}}>
      <div style={{width:36,height:36,borderRadius:'50%',background:color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <span style={{fontSize:11,fontWeight:800,color:'#fff'}}>{initials(occ.reporter)}</span>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
          <span style={{fontSize:12,fontWeight:800,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{occ.item}</span>
          {occ.photos.length>0&&<span style={{display:'flex',alignItems:'center',gap:2,fontSize:10,color:'var(--primary)',flexShrink:0}}><Camera size={10}/>{occ.photos.length}</span>}
        </div>
        <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{occ.section}</div>
        {occ.comment&&<div style={{fontSize:11,color:'var(--text-faint)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontStyle:'italic'}}>"{occ.comment}"</div>}
        <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4}}>
          <span style={{fontSize:10,color:'var(--text-faint)',display:'flex',alignItems:'center',gap:2}}><Clock size={9}/>{occ.time}</span>
          <span style={{fontSize:10,color:'var(--text-faint)',fontWeight:600}}>{cleanName(occ.reporter)}</span>
        </div>
      </div>
      <ChevronRight size={14} style={{color:'var(--text-faint)',flexShrink:0,marginTop:4}}/>
    </button>
  );
}

/* ─── Grouped OCC list ──────────────────────────────── */
function GroupedList({occs,onSelect}:{occs:OccurrenceData[];onSelect:(o:OccurrenceData)=>void}) {
  const groups=useMemo(()=>groupByDate(occs),[occs]);
  if(!occs.length) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'48px 24px',color:'var(--text-muted)',gap:12}}>
      <Shield size={36} style={{color:'var(--success)',opacity:0.7}}/>
      <p style={{fontWeight:700,fontSize:14,color:'var(--text)'}}>Nenhuma ocorrência</p>
      <p style={{fontSize:13,textAlign:'center',maxWidth:240}}>Operação dentro da normalidade</p>
    </div>
  );
  return (
    <div style={{display:'flex',flexDirection:'column',gap:6}}>
      {groups.map(({dateKey,items})=>(
        <div key={dateKey}>
          <DateSep dateKey={dateKey} count={items.length}/>
          <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:6}}>
            {items.map(o=><OccRow key={o.id} occ={o} onSelect={()=>onSelect(o)}/>)}
          </div>
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
    <div style={{padding:'12px 14px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-xl)',display:'flex',flexDirection:'column',gap:8}}>
      <div style={{display:'flex',alignItems:'center',gap:8,justifyContent:'space-between'}}>
        <span style={{fontSize:13,fontWeight:700,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{title.replace(/^\d+\.\s*/,'')}</span>
        <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
          {occs>0&&(
            <span style={{display:'flex',alignItems:'center',gap:3,fontSize:10,fontWeight:700,color:'var(--warning)',background:'var(--warning-hl)',padding:'2px 7px',borderRadius:999}}>
              <AlertTriangle size={9}/>{occs}
            </span>
          )}
          <span style={{fontSize:13,fontWeight:800,color,minWidth:36,textAlign:'right'}}>{pct}%</span>
        </div>
      </div>
      <div style={{height:6,background:'var(--divider)',borderRadius:999,overflow:'hidden'}}>
        <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:999,transition:'width 0.6s ease'}}/>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:11,color:'var(--text-muted)',fontWeight:600}}>{checked} de {total} itens verificados</span>
        {pct===100&&<span style={{fontSize:10,fontWeight:700,color:'var(--success)',display:'flex',alignItems:'center',gap:3}}><CheckCircle2 size={11}/>Completo</span>}
      </div>
    </div>
  );
}

/* ─── Mini bar chart (CSS only) ────────────────────────── */
function WeekChart({data}:{data:{day:string;occs:number}[]}) {
  const max=Math.max(...data.map(d=>d.occs),1);
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:4,height:64,paddingBottom:18,position:'relative'}}>
      {data.map((d,i)=>(
        <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',height:'100%',justifyContent:'flex-end',position:'relative'}}>
          <div style={{width:'100%',height:`${Math.max((d.occs/max)*46,d.occs>0?4:2)}px`,background:d.occs>0?'var(--warning)':'var(--divider)',borderRadius:'3px 3px 0 0',transition:'height 0.5s ease',minHeight:2}} title={`${d.occs} ocorr.`}/>
          {d.occs>0&&<span style={{position:'absolute',top:-16,fontSize:9,fontWeight:700,color:'var(--warning)'}}>{d.occs}</span>}
          <span style={{fontSize:9,fontWeight:700,color:'var(--text-muted)',position:'absolute',bottom:0,letterSpacing:'0.03em'}}>{d.day}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Operator Card ───────────────────────────────────── */
function OperatorCard({name,occs,rank}:{name:string;occs:number;rank:number}) {
  const color=avatarColor(name);
  return (
    <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-xl)'}}>
      <span style={{fontSize:11,fontWeight:800,color:'var(--text-faint)',width:18,textAlign:'center',flexShrink:0}}>#{rank}</span>
      <div style={{width:38,height:38,borderRadius:'50%',background:color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <span style={{fontSize:12,fontWeight:800,color:'#fff'}}>{initials(name)}</span>
      </div>
      <span style={{flex:1,fontSize:13,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cleanName(name)}</span>
      <div style={{flexShrink:0,textAlign:'right'}}>
        <div style={{fontSize:18,fontWeight:800,color:'var(--warning)',lineHeight:1}}>{occs}</div>
        <div style={{fontSize:10,color:'var(--text-muted)',fontWeight:600}}>ocorrências</div>
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
    {id:'overview', label:'Visão Geral', icon:LayoutDashboard},
    {id:'ocorrencias', label:'Ocorrências', icon:AlertTriangle, badge:occurrences.length, badgeColor:'var(--warning)'},
    {id:'conformidades', label:'Conformidades', icon:CheckCircle2, badge:conformPct, badgeColor:'var(--success)'},
    {id:'operadores', label:'Operadores', icon:Users, badge:uniqueOps, badgeColor:'var(--primary)'},
  ];

  return (
    <>
      <style>{`
        /* — Tab bar — */
        .sd-tabs{display:flex;background:var(--surface);border-bottom:2px solid var(--divider);overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;}
        .sd-tabs::-webkit-scrollbar{display:none;}
        .sd-tab{flex:0 0 auto;display:flex;align-items:center;gap:6px;padding:12px 18px;font-size:13px;font-weight:700;color:var(--text-muted);border-bottom:2px solid transparent;margin-bottom:-2px;cursor:pointer;background:none;border-top:none;border-left:none;border-right:none;white-space:nowrap;transition:color 150ms;}
        .sd-tab.active{color:var(--primary);border-bottom-color:var(--primary);}
        .sd-tab:hover:not(.active){color:var(--text);}
        .sd-badge{font-size:10px;font-weight:800;padding:1px 6px;border-radius:999px;line-height:1.4;}

        /* — Panel — */
        .sd-panel{padding:18px 20px;display:flex;flex-direction:column;gap:16px;}
        @media(max-width:480px){.sd-panel{padding:14px 14px;gap:14px;}}

        /* — KPI grid — */
        .sd-kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
        @media(max-width:900px){.sd-kpi-grid{grid-template-columns:repeat(2,1fr);}}
        @media(max-width:480px){.sd-kpi-grid{grid-template-columns:repeat(2,1fr);gap:10px;}}

        /* — Overview 2-col — */
        .sd-overview-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
        @media(max-width:768px){.sd-overview-grid{grid-template-columns:1fr;}}

        /* — Section heading — */
        .sd-section-hd{display:flex;align-items:center;gap:8px;margin-bottom:2px;}
        .sd-section-hd span{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);}

        /* — Filter bar — */
        .sd-filter{display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--surface-2);border-radius:var(--r-xl);border:1px solid var(--border);}
        .sd-filter select{font:inherit;font-size:13px;font-weight:600;color:var(--text);background:transparent;border:none;outline:none;flex:1;cursor:pointer;min-width:0;}

        /* — Mobile bottom tabs — */
        @media(max-width:640px){
          .sd-tabs{position:sticky;bottom:0;z-index:100;border-top:1px solid var(--divider);border-bottom:none;padding-bottom:env(safe-area-inset-bottom);background:var(--surface);box-shadow:0 -4px 16px rgba(0,0,0,0.12);}
          .sd-tab{flex:1;flex-direction:column;gap:3px;padding:10px 4px 8px;font-size:10px;justify-content:center;align-items:center;border-bottom:none;border-top:2px solid transparent;margin-bottom:0;margin-top:-2px;}
          .sd-tab.active{border-top-color:var(--primary);border-bottom-color:transparent;}
        }
      `}</style>

      {/* ─ Top tabs (desktop) / Bottom tabs (mobile) ─ */}
      <div className="sd-tabs">
        {TABS.map(t=>(
          <button key={t.id} type="button" className={`sd-tab${tab===t.id?' active':''}`} onClick={()=>setTab(t.id)}>
            <t.icon size={15}/>
            <span>{t.label}</span>
            {t.badge!==undefined&&<span className="sd-badge" style={{background:tab===t.id?t.badgeColor:'var(--surface-2)',color:tab===t.id?'#fff':t.badgeColor}}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* ─ Visão Geral ───────────────────────────────── */}
      {tab==='overview'&&(
        <div className="sd-panel">
          {/* KPIs */}
          <div className="sd-kpi-grid">
            <KpiCard label="Ocorr. Hoje" value={todayOccs.length} icon={AlertTriangle} color="var(--warning)" bg="var(--warning-hl)" trend={`${occurrences.length} total`}/>
            <KpiCard label="Conformidade" value={`${conformPct}%`} icon={TrendingUp} color="var(--success)" bg="var(--success-hl)" trend={`${totalChecked}/${totalItems} itens`}/>
            <KpiCard label="Itens OK" value={totalChecked} sub={`/${totalItems}`} icon={CheckCircle2} color="var(--primary)" bg="var(--primary-hl)"/>
            <KpiCard label="Operadores" value={uniqueOps} icon={Users} color="var(--blue)" bg="rgba(0,100,148,0.12)"/>
          </div>

          {/* 2-col: chart + recent occs */}
          <div className="sd-overview-grid">
            {/* Weekly chart */}
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-xl)',padding:'16px'}}>
              <div className="sd-section-hd"><BarChart2 size={13} style={{color:'var(--primary)'}}/><span>Ocorrências — 7 dias</span></div>
              <WeekChart data={weekData}/>
            </div>
            {/* Recent occurrences */}
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-xl)',padding:'16px',display:'flex',flexDirection:'column',gap:8}}>
              <div className="sd-section-hd"><AlertTriangle size={13} style={{color:'var(--warning)'}}/><span>Recentes</span></div>
              {todayOccs.length===0?(
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'16px 0',color:'var(--text-muted)',gap:6}}>
                  <Shield size={24} style={{color:'var(--success)'}}/>
                  <span style={{fontSize:12,fontWeight:700}}>Nenhuma ocorrência hoje</span>
                </div>
              ):todayOccs.slice(0,4).map(o=>(
                <button key={o.id} type="button" onClick={()=>setSelectedOcc(o)}
                  style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',cursor:'pointer',textAlign:'left',width:'100%',transition:'background 150ms'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--surface-offset, #e8e6e2)'}
                  onMouseLeave={e=>e.currentTarget.style.background='var(--surface-2)'}>
                  <AlertTriangle size={13} style={{color:'var(--warning)',flexShrink:0}}/>
                  <span style={{fontSize:12,fontWeight:700,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{o.item}</span>
                  <span style={{fontSize:10,color:'var(--text-faint)',flexShrink:0}}>{o.time}</span>
                </button>
              ))}
              {todayOccs.length>4&&(
                <button type="button" onClick={()=>setTab('ocorrencias')} style={{fontSize:12,fontWeight:700,color:'var(--primary)',background:'none',border:'none',cursor:'pointer',padding:'4px 0',textAlign:'center'}}>Ver todas ({todayOccs.length}) →</button>
              )}
            </div>
          </div>

          {/* Section health summary */}
          <div>
            <div className="sd-section-hd" style={{marginBottom:10}}><Activity size={13} style={{color:'var(--primary)'}}/><span>Saúde por seção</span></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:8}}>
              {sectionStats.map(({section,checked,occs})=>{
                const pct=section.items.length>0?Math.round((checked/section.items.length)*100):0;
                const color=pct===100?'var(--success)':pct>60?'var(--primary)':'var(--warning)';
                return (
                  <div key={section.id} style={{padding:'10px 12px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',display:'flex',flexDirection:'column',gap:6}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:4}}>
                      <span style={{fontSize:12,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{section.title.replace(/^\d+\.\s*/,'')}</span>
                      <span style={{fontSize:13,fontWeight:800,color,flexShrink:0}}>{pct}%</span>
                    </div>
                    <div style={{height:4,background:'var(--divider)',borderRadius:999}}>
                      <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:999,transition:'width 0.6s'}}/>
                    </div>
                    {occs>0&&<span style={{fontSize:10,color:'var(--warning)',fontWeight:700,display:'flex',alignItems:'center',gap:3}}><AlertTriangle size={9}/>{occs} ocorrência(s)</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─ Ocorrências ──────────────────────────────── */}
      {tab==='ocorrencias'&&(
        <div className="sd-panel">
          {/* Filter */}
          <div className="sd-filter">
            <Filter size={13} style={{color:'var(--text-muted)',flexShrink:0}}/>
            <select value={sectionFilter} onChange={e=>setSectionFilter(e.target.value)}>
              <option value="all">Todas as seções ({occurrences.length})</option>
              {allSections.map(s=>(
                <option key={s} value={s}>{s.replace(/^\d+\.\s*/,'')} ({occurrences.filter(o=>o.section===s).length})</option>
              ))}
            </select>
          </div>
          {/* List */}
          <GroupedList occs={filteredOccs} onSelect={setSelectedOcc}/>
        </div>
      )}

      {/* ─ Conformidades ───────────────────────────── */}
      {tab==='conformidades'&&(
        <div className="sd-panel">
          {/* Summary bar */}
          <div style={{padding:'14px 16px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-xl)',display:'flex',alignItems:'center',gap:16}}>
            <div style={{flex:1}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <span style={{fontSize:13,fontWeight:700}}>Conformidade geral</span>
                <span style={{fontSize:20,fontWeight:800,color:conformPct>=80?'var(--success)':conformPct>=50?'var(--primary)':'var(--warning)'}}>{conformPct}%</span>
              </div>
              <div style={{height:8,background:'var(--divider)',borderRadius:999,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${conformPct}%`,background:conformPct>=80?'var(--success)':conformPct>=50?'var(--primary)':'var(--warning)',borderRadius:999,transition:'width 0.8s ease'}}/>
              </div>
              <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4,fontWeight:600}}>{totalChecked} de {totalItems} itens verificados</div>
            </div>
          </div>
          {/* Sections */}
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {sectionStats.map(({section,checked,occs})=>(
              <SectionBar key={section.id} title={section.title} total={section.items.length} checked={checked} occs={occs}/>
            ))}
          </div>
        </div>
      )}

      {/* ─ Operadores ───────────────────────────────── */}
      {tab==='operadores'&&(
        <div className="sd-panel">
          {operatorStats.length===0?(
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'48px 24px',color:'var(--text-muted)',gap:12}}>
              <Users size={36} style={{opacity:0.4}}/>
              <p style={{fontWeight:700,fontSize:14,color:'var(--text)'}}>Nenhum operador ainda</p>
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
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
