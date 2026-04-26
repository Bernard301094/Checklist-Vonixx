import React, { useState, useMemo } from 'react';
import {
  AlertTriangle, CheckCircle2, X, ChevronDown, ChevronUp,
  Clock, Camera, Cpu, Activity, Target, Search, XCircle, Calendar, Layers, User
} from 'lucide-react';
import { OccurrenceData, ChecklistEntry } from '../types';
import { CHECKLIST_DATA } from '../constants';

interface DashboardViewProps {
  occurrences: OccurrenceData[];
  checklistState: Record<string, boolean>;
  checklistEntries?: ChecklistEntry[];
}

/* --- Agrupación de secciones por categoría --- */
const CONFORMITY_GROUPS = [
  {
    id: 'equipamentos',
    label: 'Equipamentos e Transporte',
    sectionIds: ['perifericos', 'esteiras'],
  },
  {
    id: 'moinho_mecanicos',
    label: 'Moinho e Componentes Mecânicos',
    sectionIds: ['moinho', 'componentes'],
  },
  {
    id: 'operacao_molde',
    label: 'Operação, Molde e Lubrificação',
    sectionIds: ['operacao', 'molde', 'lubrificacao'],
  },
  {
    id: 'parametros_docs',
    label: 'Parâmetros e Documentação',
    sectionIds: ['parametros', 'documentacao'],
  },
];

/* --- Helpers --- */
function reporterLabel(raw: string): string {
  return raw.split(' - Auth:')[0].split(' | Máquina:')[0].split(' | maquina:')[0].trim();
}

function machineLabel(raw: string): string {
  const m = raw.split(' - Auth:')[0].match(/\|\s*[Mm]á?quina:\s*(.+)$/);
  return m ? m[1].trim() : 'MÁQUINA NÃO IDENTIFICADA';
}

function initials(name: string): string {
  return name.split(/[\s@._-]+/).filter(Boolean).map(p => p[0]?.toUpperCase()).slice(0, 2).join('');
}

function formatDateLabel(isoDate: string): string {
  const [y, mo, d] = isoDate.split('-');
  const dObj = new Date(parseInt(y), parseInt(mo) - 1, parseInt(d));
  return dObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

/* ======================================================
   ALERTAS — componentes
   ====================================================== */

function OccurrenceCard({ occ, onOpenPhoto }: { occ: OccurrenceData; onOpenPhoto: (photos: string[], index: number) => void }) {
  return (
    <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={16} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#d97706', letterSpacing: '0.05em' }}>{occ.section}</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginTop: 2 }}>{occ.item}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
          <Clock size={12} /> {occ.time}
        </div>
      </div>
      {occ.comment && (
        <div style={{ padding: '10px 12px', background: '#ffffff', borderRadius: '8px', border: '1px dashed #cbd5e1', marginTop: '12px' }}>
          <p style={{ fontSize: '13px', color: '#475569', fontStyle: 'italic', margin: 0 }}>"{occ.comment}"</p>
        </div>
      )}
      {occ.photos.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', overflowX: 'auto', paddingBottom: 4 }}>
          {occ.photos.map((p, i) => (
            <button key={i} type="button" onClick={() => onOpenPhoto(occ.photos, i)} style={{ width: 64, height: 64, borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', flexShrink: 0, padding: 0, cursor: 'zoom-in' }}>
              <img src={p} alt={`Foto ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MachineGroup({ machine, occs, onOpenPhoto }: { machine: string; occs: OccurrenceData[]; onOpenPhoto: (photos: string[], index: number) => void }) {
  const [open, setOpen] = useState(false);
  const photoCount = occs.reduce((a, o) => a + o.photos.length, 0);
  return (
    <div style={{ marginBottom: '8px' }}>
      <button type="button" onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: open ? '#f1f5f9' : '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
        <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Cpu size={18} />
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>{machine}</div>
          <div style={{ display: 'flex', gap: '12px', marginTop: 2 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#d97706', display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={10} /> {occs.length} Ocorrências</span>
            {photoCount > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: 4 }}><Camera size={10} /> {photoCount} Fotos</span>}
          </div>
        </div>
        <div style={{ color: '#94a3b8' }}>{open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
      </button>
      {open && (
        <div style={{ padding: '12px 0 8px 16px', borderLeft: '2px solid #cbd5e1', marginLeft: 18, marginTop: '8px' }}>
          {occs.map(occ => <OccurrenceCard key={occ.id} occ={occ} onOpenPhoto={onOpenPhoto} />)}
        </div>
      )}
    </div>
  );
}

function CollaboratorCard({ reporter, occs, onOpenPhoto }: { reporter: string; occs: OccurrenceData[]; onOpenPhoto: (photos: string[], index: number) => void }) {
  const [open, setOpen] = useState(false);
  const machineGroups = useMemo(() => {
    const map: Record<string, OccurrenceData[]> = {};
    occs.forEach(o => { const m = machineLabel(o.reporter); if (!map[m]) map[m] = []; map[m].push(o); });
    return Object.entries(map);
  }, [occs]);
  return (
    <div className="card animate-in" style={{ padding: '20px', marginBottom: '16px', border: open ? '1px solid #cbd5e1' : '1px solid transparent' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'linear-gradient(135deg, #0d9488, #14b8a6)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, boxShadow: '0 4px 10px rgba(13,148,136,0.3)' }}>
            {initials(reporter)}
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)' }}>{reporter}</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: 4 }}>
              <span style={{ fontSize: '11px', fontWeight: 700, background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: '6px' }}>{occs.length} Ocorrências</span>
              <span style={{ fontSize: '11px', fontWeight: 700, background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>{machineGroups.length} Máquinas</span>
            </div>
          </div>
        </div>
        <div style={{ color: '#94a3b8', background: '#f8fafc', padding: '6px', borderRadius: '8px' }}>
          {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>
      {open && (
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
          {machineGroups.map(([machine, machineOccs]) => (
            <MachineGroup key={machine} machine={machine} occs={machineOccs} onOpenPhoto={onOpenPhoto} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ======================================================
   CONFORMIDADES — componentes
   ====================================================== */

/** Ítem individual con estado */
function ConformItemRow({ item, ok }: { item: string; ok: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 16px', borderBottom: '1px solid #f1f5f9', background: ok ? '#f8fafc' : '#ffffff' }}>
      {ok
        ? <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
        : <XCircle size={15} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
      }
      <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: ok ? '#334155' : '#94a3b8' }}>{item}</span>
    </div>
  );
}

/** Sección individual colapsable */
function ConformSectionCard({ section, checklistState }: { section: typeof CHECKLIST_DATA[number]; checklistState: Record<string, boolean> }) {
  const [open, setOpen] = useState(false);
  const itemStates = section.items.map((item, idx) => ({ item, ok: checklistState[`${section.id}-${idx}`] === true }));
  const checkedCount = itemStates.filter(x => x.ok).length;
  const pct = section.items.length > 0 ? Math.round((checkedCount / section.items.length) * 100) : 0;
  const isComplete = pct === 100;
  return (
    <div style={{ marginBottom: '8px', borderRadius: '10px', overflow: 'hidden', border: isComplete ? '1px solid #a7f3d0' : '1px solid #e2e8f0' }}>
      <button type="button" onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: isComplete ? '#f0fdf4' : '#ffffff', border: 'none', cursor: 'pointer' }}>
        <div style={{ width: 30, height: 30, borderRadius: '7px', background: isComplete ? '#d1fae5' : '#f1f5f9', border: `1px solid ${isComplete ? '#10b981' : '#e2e8f0'}`, color: isComplete ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CheckCircle2 size={15} />
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: isComplete ? '#065f46' : '#334155' }}>{section.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 4 }}>
            <div style={{ flex: 1, height: 5, background: isComplete ? '#a7f3d0' : '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: isComplete ? '#10b981' : 'var(--primary)', transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: isComplete ? '#10b981' : '#64748b', whiteSpace: 'nowrap' }}>{checkedCount}/{section.items.length}</span>
          </div>
        </div>
        <div style={{ color: isComplete ? '#10b981' : '#94a3b8' }}>{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
      </button>
      {open && (
        <div style={{ borderTop: isComplete ? '1px solid #a7f3d0' : '1px solid #e2e8f0' }}>
          {itemStates.map((s, i) => <ConformItemRow key={i} item={s.item} ok={s.ok} />)}
        </div>
      )}
    </div>
  );
}

/** Colaborador dentro de un grupo de conformidad */
function CollaboratorConformCard({
  reporter,
  sectionIds,
  checklistState,
  entries,
}: {
  reporter: string;
  sectionIds: string[];
  checklistState: Record<string, boolean>;
  entries: ChecklistEntry[];
}) {
  const [open, setOpen] = useState(false);

  // Construye un checklistState filtrado a solo los ítems marcados por este colaborador
  const reporterState = useMemo(() => {
    const state: Record<string, boolean> = {};
    entries.forEach(e => {
      if ((e.reporter || 'Sem identificação') === reporter) {
        state[e.item_key] = e.is_checked;
      }
    });
    return state;
  }, [entries, reporter]);

  const sections = CHECKLIST_DATA.filter(s => sectionIds.includes(s.id));

  const { checkedCount, totalCount } = useMemo(() => {
    let checked = 0;
    let total = 0;
    sections.forEach(section => {
      section.items.forEach((_, idx) => {
        total++;
        const key = `${section.id}-${idx}`;
        if (reporterState[key] === true) checked++;
      });
    });
    return { checkedCount: checked, totalCount: total };
  }, [sections, reporterState]);

  const pct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return (
    <div style={{ marginBottom: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: open ? '#f1f5f9' : '#ffffff', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
      >
        <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'linear-gradient(135deg, #0d9488, #14b8a6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0, boxShadow: '0 3px 8px rgba(13,148,136,0.25)' }}>
          {initials(reporter)}
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>{reporter}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 4 }}>
            <div style={{ flex: 1, height: 4, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden', maxWidth: 100 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#10b981' : 'var(--primary)', transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: pct === 100 ? '#10b981' : '#64748b' }}>
              {checkedCount}/{totalCount}
            </span>
          </div>
        </div>
        <div style={{ color: '#94a3b8' }}>{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
      </button>
      {open && (
        <div style={{ padding: '12px 14px 14px', borderTop: '1px solid #e2e8f0', background: '#fafafa' }}>
          {sections.map(section => (
            <ConformSectionCard key={section.id} section={section} checklistState={reporterState} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Fecha dentro de un grupo de conformidad */
function ConformDateGroup({
  dateLabel,
  reporters,
  sectionIds,
  checklistState,
  entries,
}: {
  dateLabel: string;
  reporters: string[];
  sectionIds: string[];
  checklistState: Record<string, boolean>;
  entries: ChecklistEntry[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginBottom: '12px' }}>
      {/* Sub-divisor de fecha */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '6px 14px',
            background: '#f1f5f9',
            color: '#475569',
            borderRadius: '99px',
            fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
            border: '1px solid #e2e8f0', cursor: 'pointer',
          }}
        >
          <Calendar size={12} />
          {dateLabel}
          <span style={{ background: '#e2e8f0', color: '#64748b', borderRadius: '99px', padding: '1px 6px', fontSize: 10, fontWeight: 900 }}>
            {reporters.length}
          </span>
          {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
        <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
      </div>

      {open && (
        <div style={{ paddingLeft: '12px', borderLeft: '2px solid #e2e8f0', marginLeft: 4 }}>
          {reporters.map(reporter => (
            <CollaboratorConformCard
              key={reporter}
              reporter={reporter}
              sectionIds={sectionIds}
              checklistState={checklistState}
              entries={entries}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Grupo de categoría principal */
function ConformGroupCard({
  group,
  checklistState,
  checklistEntries,
}: {
  group: typeof CONFORMITY_GROUPS[number];
  checklistState: Record<string, boolean>;
  checklistEntries: ChecklistEntry[];
}) {
  const [open, setOpen] = useState(false);

  const sections = CHECKLIST_DATA.filter(s => group.sectionIds.includes(s.id));

  // Porcentaje global del grupo (todos los ítems)
  const { checkedCount, totalCount } = useMemo(() => {
    let checked = 0;
    let total = 0;
    sections.forEach(section => {
      section.items.forEach((_, idx) => {
        total++;
        if (checklistState[`${section.id}-${idx}`] === true) checked++;
      });
    });
    return { checkedCount: checked, totalCount: total };
  }, [sections, checklistState]);

  const pct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
  const isComplete = pct === 100;

  // Construir jerarquía Fecha → Colaboradores
  const dateGroups = useMemo(() => {
    // Filtrar solo entradas que pertenezcan a las secciones del grupo y estén marcadas
    const relevantKeys = new Set<string>();
    sections.forEach(section => {
      section.items.forEach((_, idx) => relevantKeys.add(`${section.id}-${idx}`));
    });

    const dateMap: Record<string, Set<string>> = {};
    const noDateReporters = new Set<string>();

    checklistEntries.forEach(e => {
      if (!relevantKeys.has(e.item_key)) return;
      const rep = e.reporter || 'Sem identificação';
      const dateStr = e.checked_at
        ? new Date(e.checked_at).toISOString().split('T')[0]
        : null;
      if (dateStr) {
        if (!dateMap[dateStr]) dateMap[dateStr] = new Set();
        dateMap[dateStr].add(rep);
      } else {
        noDateReporters.add(rep);
      }
    });

    const sorted = Object.entries(dateMap)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateStr, reporterSet]) => ({
        dateStr,
        dateLabel: formatDateLabel(dateStr),
        reporters: Array.from(reporterSet),
      }));

    if (noDateReporters.size > 0) {
      sorted.push({ dateStr: 'sem-data', dateLabel: 'Sem data registrada', reporters: Array.from(noDateReporters) });
    }

    return sorted;
  }, [sections, checklistEntries]);

  // Si no hay entradas con metadata, mostrar fallback sin jerarquía
  const hasMeta = checklistEntries.some(e => e.reporter || e.checked_at);

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Divisor de grupo — mismo estilo que el divisor de fecha en Alertas */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 16px',
            background: isComplete ? '#d1fae5' : '#e2e8f0',
            color: isComplete ? '#065f46' : '#475569',
            borderRadius: '99px',
            fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
            border: 'none', cursor: 'pointer', transition: 'background 0.2s',
          }}
        >
          <Layers size={14} />
          {group.label}
          <span style={{ marginLeft: 4, padding: '1px 7px', borderRadius: '99px', background: isComplete ? '#10b981' : '#94a3b8', color: '#fff', fontSize: '11px', fontWeight: 900 }}>
            {pct}%
          </span>
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
      </div>

      {open && (
        <div style={{ paddingLeft: '16px', borderLeft: '2px solid #cbd5e1', marginLeft: 4 }}>
          {hasMeta && dateGroups.length > 0 ? (
            /* Jerarquía: Fecha → Colaborador → Sección */
            dateGroups.map(dg => (
              <ConformDateGroup
                key={dg.dateStr}
                dateLabel={dg.dateLabel}
                reporters={dg.reporters}
                sectionIds={group.sectionIds}
                checklistState={checklistState}
                entries={checklistEntries}
              />
            ))
          ) : (
            /* Fallback: solo secciones (datos sin metadata de colaborador/fecha) */
            sections.map(section => (
              <ConformSectionCard key={section.id} section={section} checklistState={checklistState} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ======================================================
   COMPONENTE PRINCIPAL
   ====================================================== */
export default function DashboardView({ occurrences, checklistState, checklistEntries = [] }: DashboardViewProps) {
  const [lightbox, setLightbox] = useState<{ photos: string[]; index: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'conformidades'>('timeline');
  const [searchQuery, setSearchQuery] = useState('');

  const verifiedCount = useMemo(() => {
    let count = 0;
    CHECKLIST_DATA.forEach(section => {
      section.items.forEach((_, idx) => {
        if (checklistState[`${section.id}-${idx}`] === true) count++;
      });
    });
    return count;
  }, [checklistState]);

  const maxChecks = CHECKLIST_DATA.reduce((acc, s) => acc + s.items.length, 0);
  const validationProgress = maxChecks > 0 ? Math.round((verifiedCount / maxChecks) * 100) : 0;
  const totalPhotos = occurrences.reduce((acc, o) => acc + o.photos.length, 0);

  const filteredOccs = useMemo(() => {
    let list = occurrences;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(o =>
        o.section.toLowerCase().includes(q) ||
        o.item.toLowerCase().includes(q) ||
        reporterLabel(o.reporter).toLowerCase().includes(q) ||
        machineLabel(o.reporter).toLowerCase().includes(q)
      );
    }
    return list;
  }, [occurrences, searchQuery]);

  const dateGroups = useMemo(() => {
    const map: Record<string, OccurrenceData[]> = {};
    filteredOccs.forEach(o => {
      const dateStr = o.created_at ? new Date(o.created_at).toISOString().split('T')[0] : '1970-01-01';
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(o);
    });
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateStr, dayOccs]) => {
        const dateLabel = dateStr !== '1970-01-01' ? formatDateLabel(dateStr) : 'Data não registrada';
        const collabMap: Record<string, OccurrenceData[]> = {};
        dayOccs.forEach(o => { const r = reporterLabel(o.reporter); if (!collabMap[r]) collabMap[r] = []; collabMap[r].push(o); });
        const collabs = Object.entries(collabMap).sort(([, a], [, b]) => b.length - a.length);
        return { dateStr, dateLabel, collabs };
      });
  }, [filteredOccs]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

      {/* Pestañas */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--divider)', background: 'var(--surface)' }}>
        <button onClick={() => setActiveTab('timeline')} style={{ flex: 1, padding: '16px', fontWeight: 700, color: activeTab === 'timeline' ? 'var(--primary)' : '#64748b', borderBottom: activeTab === 'timeline' ? '2px solid var(--primary)' : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
          <Activity size={18} /> Alertas ({occurrences.length})
        </button>
        <button onClick={() => setActiveTab('conformidades')} style={{ flex: 1, padding: '16px', fontWeight: 700, color: activeTab === 'conformidades' ? 'var(--primary)' : '#64748b', borderBottom: activeTab === 'conformidades' ? '2px solid var(--primary)' : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
          <Target size={18} /> Conformidade ({validationProgress}%)
        </button>
      </div>

      <div style={{ padding: '20px', flex: 1, overflowY: 'auto', background: '#f8fafc' }}>

        {/* ── Alertas ── */}
        {activeTab === 'timeline' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={24} /></div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, letterSpacing: '0.05em' }}>OCORRÊNCIAS</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#1e293b', lineHeight: 1 }}>{occurrences.length}</div>
                </div>
              </div>
              <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Camera size={24} /></div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, letterSpacing: '0.05em' }}>EVIDÊNCIAS</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#1e293b', lineHeight: 1 }}>{totalPhotos}</div>
                </div>
              </div>
            </div>
            <div style={{ position: 'relative', marginBottom: '24px' }}>
              <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input className="input" placeholder="Buscar máquina, colaborador ou item..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: 44, width: '100%', height: '48px', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} />
            </div>
            {dateGroups.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', background: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>Nenhum registro encontrado.</div>
            ) : (
              dateGroups.map(group => (
                <div key={group.dateStr} style={{ marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ padding: '8px 16px', background: '#e2e8f0', color: '#475569', borderRadius: '99px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={14} /> {group.dateLabel}
                    </div>
                    <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
                  </div>
                  {group.collabs.map(([reporter, repOccs]) => (
                    <CollaboratorCard key={reporter} reporter={reporter} occs={repOccs} onOpenPhoto={(p, idx) => setLightbox({ photos: p, index: idx })} />
                  ))}
                </div>
              ))
            )}
          </>
        )}

        {/* ── Conformidades ── */}
        {activeTab === 'conformidades' && (
          <>
            <div className="card" style={{ padding: '24px', marginBottom: '24px', background: 'linear-gradient(135deg, #059669, #10b981)', border: 'none', color: '#fff', boxShadow: '0 10px 25px -5px rgba(16,185,129,0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#ecfdf5', display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '0.05em' }}>
                  <Target size={20} /> PROGRESSO GERAL
                </h3>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>{validationProgress}%</div>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${validationProgress}%`, background: '#ffffff', borderRadius: 99, transition: 'width 0.5s ease-in-out' }} />
              </div>
              <p style={{ fontSize: '13px', color: '#d1fae5', marginTop: '12px', fontWeight: 600 }}>
                {verifiedCount} de {maxChecks} pontos de inspeção validados
              </p>
            </div>

            <div>
              {CONFORMITY_GROUPS.map(group => (
                <ConformGroupCard
                  key={group.id}
                  group={group}
                  checklistState={checklistState}
                  checklistEntries={checklistEntries}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal de Fotos */}
      {lightbox && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', flexDirection: 'column', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <button onClick={() => setLightbox(null)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: 10, borderRadius: '12px', cursor: 'pointer' }}>
              <X size={24} />
            </button>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src={lightbox.photos[lightbox.index]} alt="Evidência" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }} />
          </div>
        </div>
      )}
    </div>
  );
}
