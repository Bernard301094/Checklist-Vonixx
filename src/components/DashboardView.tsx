/**
 * DashboardView — Premium Industrial Design
 * Agrupamento inteligente por Data -> Colaborador -> Máquina -> Conformidades
 */
import React, { useState, useMemo } from 'react';
import {
  AlertTriangle, CheckCircle2, TrendingUp, Users,
  Clock, Calendar, Camera, X, ChevronDown, ChevronUp,
  BarChart2, Activity, Shield, LayoutDashboard, Search, Cpu, Layers, Target, XCircle
} from 'lucide-react';
import { OccurrenceData, ChecklistEntry, ChecklistSession } from '../types';
import { CHECKLIST_DATA } from '../constants';

interface DashboardViewProps {
  occurrences: OccurrenceData[];
  checklistState: Record<string, boolean>;
  checklistEntries?: ChecklistEntry[];
  checklistSessions?: ChecklistSession[];
}

type Tab = 'overview' | 'alertas' | 'conformidades';

/* ─── Categorias do Checklist ─── */
const SECTION_GROUPS = [
  { label: 'Periféricos e Esteiras',         sectionIds: ['perifericos', 'esteiras'] },
  { label: 'Moinho e Componentes',           sectionIds: ['moinho', 'componentes'] },
  { label: 'Operação, Molde e Lubrificação', sectionIds: ['operacao', 'molde', 'lubrificacao'] },
  { label: 'Parâmetros e Documentação',      sectionIds: ['parametros', 'documentacao'] },
];

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
function reporterLabel(raw: string): string {
  if (!raw) return 'Desconhecido';
  return raw.split(' - Auth:')[0].split(' | Máquina:')[0].split(' | maquina:')[0].trim();
}
function machineLabel(raw: string): string {
  if (!raw) return '';
  const upper = raw.toUpperCase();
  if (upper.includes('ROMI 02') || upper.includes('ROMI 2') || upper.includes('ROMI2')) return 'ROMI 02';
  if (upper.includes('ROMI 01') || upper.includes('ROMI 1') || upper.includes('ROMI1')) return 'ROMI 01';
  const m = raw.split(' - Auth:')[0].match(/\|\s*[Mm]á?quina:\s*(.+)$/);
  return m ? m[1].trim() : '';
}
function initials(name: string): string {
  if (!name) return 'U';
  return name.split(/[\s@._-]+/).filter(Boolean).map(p => p[0]?.toUpperCase()).slice(0, 2).join('');
}
const PALETTE = ['#0d9488','#7c3aed','#db2777','#d97706','#16a34a','#2563eb','#dc2626','#059669'];
function avatarColor(name: string) {
  let h=0; for(let i=0;i<name.length;i++) h=(h*31+name.charCodeAt(i))%PALETTE.length;
  return PALETTE[h];
}

/* ─── Lightbox ────────────────────────────────────── */
function Lightbox({photos,index,onClose}:{photos:string[];index:number;onClose:()=>void}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(2,6,23,0.95)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9000,padding:16}} onClick={onClose}>
      <div style={{position:'relative', maxWidth:'90vw', maxHeight:'90vh'}} onClick={e=>e.stopPropagation()}>
        <img src={photos[index]} alt={`Foto ${index+1}`} style={{maxWidth:'100%',maxHeight:'85vh',objectFit:'contain',borderRadius:16,boxShadow:'0 32px 80px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)'}}/>
        <button onClick={onClose} style={{position:'absolute',top:-16,right:-16,width:40,height:40,borderRadius:'50%',background:'#fff',color:'#0f172a',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 4px 12px rgba(0,0,0,0.3)'}}>
          <X size={20}/>
        </button>
      </div>
    </div>
  );
}

/* ─── Componente Principal ──────────────────────────── */
export default function DashboardView({
  occurrences = [],
  checklistState = {},
  checklistEntries = [],
  checklistSessions = [],
}: DashboardViewProps) {
  const [tab, setTab] = useState<Tab>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [lightbox, setLightbox] = useState<{photos:string[];index:number}|null>(null);

  /* ================== MAPAS DE EXTRACCIÓN (MÁQUINAS) ================== */
  const occurrenceMachineMap = useMemo(() => {
    const map: Record<string, string> = {};
    occurrences.forEach(o => {
      const mach = machineLabel(o.reporter);
      if (mach && o.item) map[o.item.trim()] = mach;
    });
    return map;
  }, [occurrences]);

  const sessionMachineMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (!checklistSessions || checklistSessions.length === 0) return map;
    const sorted = [...checklistSessions].sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime());
    sorted.forEach(session => {
      const mach = session.machine || machineLabel(session.reporter || '');
      if (!mach) return;
      let parsed: any = null;
      if (typeof session.items === 'string') { try { parsed = JSON.parse(session.items); } catch(e) {} } else { parsed = session.items; }
      if (parsed) {
        if (Array.isArray(parsed)) { parsed.forEach((item: any) => { const k = item.key || item.item_key || item.id; if (k) map[k] = mach; }); }
        else if (typeof parsed === 'object') { Object.keys(parsed).forEach(k => { map[k] = mach; }); }
      }
    });
    return map;
  }, [checklistSessions]);

  const globalMachineMap = useMemo(() => {
    const map: Record<string, string> = {};
    occurrences.forEach(o => { const rep = reporterLabel(o.reporter); const mach = machineLabel(o.reporter); if (rep && mach) map[rep] = mach; });
    checklistSessions?.forEach(session => { const rep = reporterLabel(session.reporter || ''); const mach = session.machine || machineLabel(session.reporter || ''); if (rep && mach) map[rep] = mach; });
    return map;
  }, [occurrences, checklistSessions]);


  /* ================== MÉTRICAS GLOBAIS ================== */
  const today = todayKey();
  const todayOccs = useMemo(() => occurrences.filter(o => toLocalDateKey(o.created_at) === today), [occurrences, today]);
  const totalItems = useMemo(() => CHECKLIST_DATA.reduce((a, s) => a + s.items.length, 0), []);
  const checkedItems = useMemo(() => Object.values(checklistState).filter(Boolean).length, [checklistState]);
  const conformPct = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
  const uniqueOps = useMemo(() => new Set(occurrences.map(o => reporterLabel(o.reporter))).size, [occurrences]);

  const weekData = useMemo(() => {
    const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    return Array.from({length:7},(_,i)=>{
      const d=new Date(); d.setDate(d.getDate()-(6-i));
      const dk=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      return {day:days[d.getDay()],occs:occurrences.filter(o=>toLocalDateKey(o.created_at)===dk).length};
    });
  }, [occurrences]);

  /* ================== DADOS DE ALERTAS ================== */
  const occurrencesByDate = useMemo(() => {
    const filtered = occurrences.filter(o =>
      !searchTerm ||
      o.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reporterLabel(o.reporter).toLowerCase().includes(searchTerm.toLowerCase())
    );
    const dateMap: Record<string, Record<string, OccurrenceData[]>> = {};
    filtered.forEach(o => {
      const dKey = toLocalDateKey(o.created_at);
      if (!dateMap[dKey]) dateMap[dKey] = {};
      const rep = reporterLabel(o.reporter);
      if (!dateMap[dKey][rep]) dateMap[dKey][rep] = [];
      dateMap[dKey][rep].push(o);
    });
    return Object.entries(dateMap).sort(([a], [b]) => b.localeCompare(a)).map(([date, reporters]) => ({
        date, reporters: Object.entries(reporters).sort((a,b)=>b[1].length - a[1].length),
    }));
  }, [occurrences, searchTerm]);


  /* ================== DADOS DE CONFORMIDADES ================== */
  const conformByDate = useMemo(() => {
    // Agrupa: Data -> Operador -> Máquina -> Set de items marcados
    const dateMap: Record<string, Record<string, Record<string, Set<string>>>> = {};
    
    checklistEntries.forEach(entry => {
      const dKey = toLocalDateKey(entry.checked_at || entry.updated_at);
      const rep = reporterLabel(entry.reporter || '');
      if (!rep) return;
      
      let mach = machineLabel(entry.reporter || '');
      if (!mach) mach = sessionMachineMap[entry.item_key] || occurrenceMachineMap[entry.item_key] || globalMachineMap[rep] || 'MÁQUINA NÃO IDENTIFICADA';
      
      if (!dateMap[dKey]) dateMap[dKey] = {};
      if (!dateMap[dKey][rep]) dateMap[dKey][rep] = {};
      if (!dateMap[dKey][rep][mach]) dateMap[dKey][rep][mach] = new Set();
      
      if (entry.is_checked) {
        dateMap[dKey][rep][mach].add(entry.item_key);
      }
    });

    if (Object.keys(dateMap).length === 0) dateMap[todayKey()] = {}; // Estado vazio

    return Object.entries(dateMap)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, reportersMap]) => {
        const reporters = Object.entries(reportersMap).map(([repName, machinesMap]) => {
          
          const machines = Object.entries(machinesMap).map(([machName, checkedKeys]) => {
            const groups = SECTION_GROUPS.map(group => {
              const sections = CHECKLIST_DATA
                .filter(sec => group.sectionIds.includes(sec.id))
                .map((sec, sIdx) => {
                  const items = sec.items.map((itemText, iIdx) => {
                    const key = `${sec.id}-${iIdx}`;
                    return { key, itemText, checked: checkedKeys.has(key) };
                  });
                  return {
                    sectionId: sec.id, sectionTitle: sec.title.replace(/^\d+\.\s*/, ''), sectionIndex: sIdx + 1,
                    items, checkedCount: items.filter(i => i.checked).length, totalCount: items.length
                  };
                });
              return { label: group.label, sections };
            });

            const checked = checkedKeys.size;
            return { name: machName, checked, total: totalItems, pct: Math.round((checked/totalItems)*100), groups };
          });

          // Multiplica o total de itens base pelo número de máquinas que o operador operou
          const totalMachineItems = totalItems * Math.max(machines.length, 1);
          const totalChecked = machines.reduce((sum, m) => sum + m.checked, 0);
          const pct = Math.round((totalChecked / totalMachineItems) * 100) || 0;

          return { name: repName, machines, checked: totalChecked, total: totalMachineItems, pct };
        }).sort((a,b) => b.pct - a.pct);

        return { date, reporters };
      });
  }, [checklistEntries, totalItems, sessionMachineMap, occurrenceMachineMap, globalMachineMap]);

  /* ─── TABS ─── */
  const TABS: Array<{id:Tab;label:string;icon:any;badge?:number;badgeColor?:string}> = [
    {id:'overview', label:'Visão Geral', icon:LayoutDashboard},
    {id:'alertas', label:'Ocorrências', icon:AlertTriangle, badge:occurrences.length, badgeColor:'var(--warning)'},
    {id:'conformidades', label:'Conformidades', icon:CheckCircle2, badge:conformPct, badgeColor:'var(--success)'},
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px' }}>
      
      {/* ─ Navigation Tabs ─ */}
      <div style={{ display:'flex', background:'var(--surface)', padding:'6px', borderRadius:'14px', border:'1px solid var(--border)', boxShadow:'var(--sh-sm)', overflowX:'auto' }}>
        {TABS.map(t=>(
          <button key={t.id} type="button" onClick={()=>setTab(t.id)}
            style={{
              flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'12px 16px',
              fontSize:'13px', fontWeight:800, borderRadius:'10px', cursor:'pointer', border:'none',
              background: tab === t.id ? 'var(--primary-hl)' : 'transparent',
              color: tab === t.id ? 'var(--primary)' : 'var(--text-muted)',
              transition:'all 0.2s', whiteSpace:'nowrap'
            }}>
            <t.icon size={18} />
            {t.label}
            {t.badge !== undefined && (
              <span style={{ background: t.badgeColor, color:'#fff', padding:'2px 6px', borderRadius:'999px', fontSize:'10px', fontWeight:900, marginLeft:'4px' }}>
                {t.badge}{t.id==='conformidades'?'%':''}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─ Visão Geral ───────────────────────────────── */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="card" style={{ padding: '20px', background: 'linear-gradient(180deg, var(--surface) 0%, var(--surface-2) 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'var(--warning-hl)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}><AlertTriangle size={20} /></div>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', background: 'var(--surface)', padding: '4px 8px', borderRadius: 99 }}>Hoje</span>
              </div>
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Alertas</div>
                <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--text)', lineHeight: 1 }}>{todayOccs.length}</div>
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
                  <span style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)' }}>({checkedItems}/{totalItems})</span>
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
      )}

      {/* ─ Ocorrências ───────────────────────── */}
      {tab === 'alertas' && (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input type="text" placeholder="Pesquisar por área, problema ou operador..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '14px', fontWeight: 600, background: 'var(--surface)', color: 'var(--text)', outline: 'none', boxShadow: 'var(--sh-sm)' }}
            />
          </div>

          {occurrencesByDate.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--surface-2)', borderRadius: '16px', border: '2px dashed var(--border)' }}>
              <Shield size={48} style={{ margin: '0 auto 16px', color: 'var(--success)', opacity: 0.8 }} />
              <p style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>Nenhuma ocorrência encontrada</p>
              <p style={{ fontSize: '14px', marginTop: 6, color: 'var(--text-muted)' }}>A operação está a decorrer dentro dos parâmetros normais.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {occurrencesByDate.map(({ date, reporters }) => (
                <div key={date}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '999px', background: date === todayKey() ? 'var(--primary-hl)' : 'var(--surface)', border: `1px solid ${date === todayKey() ? 'rgba(1,105,111,0.2)' : 'var(--border)'}`, color: date === todayKey() ? 'var(--primary)' : 'var(--text)', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}><Calendar size={14} /> {dateLabel(date)}</div>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {reporters.map(([reporter, repOccs]) => (
                      <CollaboratorAccordion key={reporter} reporter={reporter} occs={repOccs} onOpenPhoto={(p, i) => setLightbox({ photos: p, index: i })} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─ Conformidades (Agrupado com detalhe por Máquina) ─────────────────────── */}
      {tab === 'conformidades' && (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          {conformByDate.length === 0 || (conformByDate.length === 1 && conformByDate[0].reporters.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--surface-2)', borderRadius: '16px', border: '2px dashed var(--border)' }}>
              <CheckCircle2 size={48} style={{ margin: '0 auto 16px', color: 'var(--text-muted)', opacity: 0.5 }} />
              <p style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>Ainda sem registos hoje</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {conformByDate.map(({ date, reporters }) => (
                <div key={date}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '999px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}><Calendar size={14} /> {dateLabel(date)}</div>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {reporters.map(rep => (
                      <ConformityCollaboratorAccordion key={rep.name} rep={rep} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lightbox Viewer */}
      {lightbox && <Lightbox photos={lightbox.photos} index={lightbox.index} onClose={() => setLightbox(null)} />}
    </div>
  );
}

/* ======================================================
   Sub-Componentes
   ====================================================== */

// Acordeão de Alertas do Utilizador
function CollaboratorAccordion({ reporter, occs, onOpenPhoto }: { reporter: string; occs: OccurrenceData[]; onOpenPhoto: (photos: string[], index: number) => void }) {
  const [open, setOpen] = useState(false);
  const color = avatarColor(reporter);

  return (
    <div className="card animate-in" style={{ padding: '16px', background: open ? 'var(--surface-2)' : 'var(--surface)', border: open ? '1px solid var(--primary)' : '1px solid var(--border)', transition: 'all 0.2s' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, boxShadow: `0 4px 12px ${color}40` }}>{initials(reporter)}</div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{reporter}</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: 4 }}><span style={{ fontSize: '11px', fontWeight: 800, background: 'var(--warning-hl)', color: 'var(--warning)', padding: '2px 8px', borderRadius: '6px' }}>{occs.length} Alertas</span></div>
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

// Acordeão de Conformidades (Detalhe por Utilizador e por Máquina)
function ConformityCollaboratorAccordion({ rep }: { rep: any }) {
  const [open, setOpen] = useState(false);
  const color = avatarColor(rep.name);

  return (
    <div className="card animate-in" style={{ padding: '20px', border: open ? `1px solid ${color}66` : '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, boxShadow: `0 4px 12px ${color}44`, flexShrink: 0 }}>{initials(rep.name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rep.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <div style={{ flex: 1, height: 6, background: 'var(--divider)', borderRadius: 99, overflow: 'hidden', maxWidth: 180 }}>
                <div style={{ height: '100%', width: `${rep.pct}%`, background: rep.pct === 100 ? 'var(--success)' : 'var(--primary)', transition: 'width 0.5s ease' }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 900, color: rep.pct === 100 ? 'var(--success)' : 'var(--primary)' }}>{rep.pct}%</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 4 }}>{rep.checked} de {rep.total} verificados ({rep.machines.length} Máquinas)</div>
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

// Categoria Agrupada do Checklist (dentro da máquina)
function ConformCategoryGroup({ groupLabel, sections }: { groupLabel: string; sections: any[] }) {
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
          {sections.map((section: any) => (
            <ConformSectionCard key={section.sectionId} section={section} />
          ))}
        </div>
      )}
    </div>
  );
}

// Detalhe dos Itens (com as cruzes vermelhas e certos verdes)
function ConformSectionCard({ section }: { section: any }) {
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
