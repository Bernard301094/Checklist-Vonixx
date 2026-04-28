/**
 * DashboardView — Premium Industrial Design
 * Agrupamento inteligente por Data -> Colaborador -> Máquina -> Conformidades
 */
import React, { useState, useMemo } from 'react';
import {
  AlertTriangle, CheckCircle2,
  Calendar, Search, Shield, LayoutDashboard
} from 'lucide-react';
import './dashboard/dashboard.css';
import { Lightbox, CollaboratorAccordion, ConformityCollaboratorAccordion, dateLabel, machineLabel, reporterLabel, toLocalDateKey } from './dashboard/DashboardComponents';
import KpiCards from './dashboard/KpiCards';
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

  /* ================== MAPAS DE EXTRACCIÓN (MÁQUINAS E TURNOS) ================== */
  const globalShiftMap = useMemo(() => {
    const map: Record<string, string> = {};
    occurrences.forEach(o => {
      const rep = reporterLabel(o.reporter);
      let shift = '';
      const match = o.reporter.match(/\(([^)]+)\)/);
      if (match) shift = match[1].trim();
      if (rep && shift) map[rep] = shift;
    });
    checklistSessions?.forEach(session => {
      const rep = reporterLabel(session.reporter || '');
      if (rep && session.shift) map[rep] = session.shift;
    });
    return map;
  }, [occurrences, checklistSessions]);
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


  const totalItems = useMemo(() => CHECKLIST_DATA.reduce((a, s) => a + s.items.length, 0), []);
  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  })();
  const todayOccs = useMemo(() => occurrences.filter(o => {
    if (!o.created_at) return true;
    const d = new Date(o.created_at);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` === today;
  }), [occurrences, today]);
  const uniqueOps = useMemo(() => new Set(occurrences.map(o => reporterLabel(o.reporter))).size, [occurrences]);

  const weekData = useMemo(() => {
    const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    return Array.from({length:7},(_,i)=>{
      const d=new Date(); d.setDate(d.getDate()-(6-i));
      const dk=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      return {day:days[d.getDay()],occs:occurrences.filter(o=>{
        if(!o.created_at) return false;
        const oD = new Date(o.created_at);
        return `${oD.getFullYear()}-${String(oD.getMonth()+1).padStart(2,'0')}-${String(oD.getDate()).padStart(2,'0')}` === dk;
      }).length};
    });
  }, [occurrences]);

  /* ================== DADOS DE CONFORMIDADES ================== */
  const conformByDate = useMemo(() => {
    const dateMap: Record<string, Record<string, Record<string, Set<string>>>> = {};
    
    checklistEntries.forEach(entry => {
      const dKey = toLocalDateKey(entry.checked_at || entry.updated_at);
      const rep = reporterLabel(entry.reporter || '');
      if (!rep) return;
      
      let mach = machineLabel(entry.reporter || '');
      let actualKey = entry.item_key;
      
      if (entry.item_key && entry.item_key.includes('#')) {
         const parts = entry.item_key.split('#');
         mach = parts[0];
         actualKey = parts[1];
      }
      
      if (!mach) mach = sessionMachineMap[actualKey] || occurrenceMachineMap[actualKey] || globalMachineMap[rep] || 'MÁQUINA NÃO IDENTIFICADA';
      
      if (!dateMap[dKey]) dateMap[dKey] = {};
      if (!dateMap[dKey][rep]) dateMap[dKey][rep] = {};
      if (!dateMap[dKey][rep][mach]) dateMap[dKey][rep][mach] = new Set();
      
      if (entry.is_checked) {
        dateMap[dKey][rep][mach].add(actualKey);
      }
    });

    const todayKeyStr = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    })();
    
    if (Object.keys(dateMap).length === 0) dateMap[todayKeyStr] = {}; 

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

          const totalMachineItems = totalItems * Math.max(machines.length, 1);
          const totalChecked = machines.reduce((sum, m) => sum + m.checked, 0);
          const pct = Math.round((totalChecked / totalMachineItems) * 100) || 0;

          return { name: repName, shift: globalShiftMap[repName] || 'Turno N/A', machines, checked: totalChecked, total: totalMachineItems, pct };
        }).sort((a,b) => b.pct - a.pct);

        return { date, reporters };
      });
  }, [checklistEntries, totalItems, sessionMachineMap, occurrenceMachineMap, globalMachineMap, globalShiftMap]);


  /* ================== CÁLCULOS KPI SEGUROS ================== */
  const { checkedItems, totalExpected, conformPct } = useMemo(() => {
     if (!conformByDate || conformByDate.length === 0) return { checkedItems: 0, totalExpected: totalItems, conformPct: 0 };
     const todayData = conformByDate.find(d => d.date === today);
     if (!todayData || todayData.reporters.length === 0) return { checkedItems: 0, totalExpected: totalItems, conformPct: 0 };
     
     let totalChecked = 0;
     let totalMax = 0;
     todayData.reporters.forEach(rep => {
        totalChecked += rep.checked;
        totalMax += rep.total;
     });
     return {
        checkedItems: totalChecked,
        totalExpected: totalMax || totalItems,
        conformPct: totalMax > 0 ? Math.round((totalChecked / totalMax) * 100) : 0
     };
  }, [conformByDate, totalItems]);


  /* ================== DADOS DE ALERTAS ================== */
  const occurrencesByDate = useMemo(() => {
    const filtered = occurrences.filter(o =>
      !searchTerm || o.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.item.toLowerCase().includes(searchTerm.toLowerCase()) || reporterLabel(o.reporter).toLowerCase().includes(searchTerm.toLowerCase())
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
            <t.icon size={18} /> {t.label}
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
        <KpiCards
          todayOccsLength={todayOccs.length}
          conformPct={conformPct}
          checkedItems={checkedItems}
          totalExpected={totalExpected}
          uniqueOps={uniqueOps}
          weekData={weekData}
        />
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '999px', background: date === today ? 'var(--primary-hl)' : 'var(--surface)', border: `1px solid ${date === today ? 'rgba(1,105,111,0.2)' : 'var(--border)'}`, color: date === today ? 'var(--primary)' : 'var(--text)', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}><Calendar size={14} /> {dateLabel(date)}</div>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {reporters.map(([reporter, repOccs]) => (
                      <CollaboratorAccordion key={reporter} reporter={reporter} shift={globalShiftMap[reporter] || 'Turno N/A'} occs={repOccs} onOpenPhoto={(p, i) => setLightbox({ photos: p, index: i })} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─ Conformidades ─────────────────────── */}
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


