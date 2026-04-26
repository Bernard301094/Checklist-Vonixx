import React, { useState, useMemo } from 'react';
import {
  AlertTriangle, CheckCircle2, X, ChevronDown, ChevronUp,
  Clock, Camera, Activity, Target, Search, XCircle, Calendar, User, Layers
} from 'lucide-react';
import { OccurrenceData, ChecklistEntry, ChecklistSession } from '../types';
import { CHECKLIST_DATA } from '../constants';

interface DashboardViewProps {
  occurrences: OccurrenceData[];
  checklistState: Record<string, boolean>;
  checklistEntries?: ChecklistEntry[];
  checklistSessions?: ChecklistSession[];
}

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

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isoDateKey(iso: string): string {
  return new Date(iso).toISOString().split('T')[0];
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
        <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={18} />
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
   CONFORMIDADES — tipos e componentes
   ====================================================== */

interface ConformSectionData {
  sectionId: string;
  sectionTitle: string;
  sectionIndex: number;
  items: {
    key: string;
    itemText: string;
    checked: boolean;
    reporter: string;
    time: string;
  }[];
  checkedCount: number;
  totalCount: number;
}

/** Grupo de secciones colapsable con pill divisor */
function ConformSectionGroup({
  groupLabel,
  sections,
  defaultOpen,
}: {
  groupLabel: string;
  sections: ConformSectionData[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  const totalItems = sections.reduce((a, s) => a + s.totalCount, 0);
  const checkedItems = sections.reduce((a, s) => a + s.checkedCount, 0);
  const pct = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
  const color = pct === 100 ? '#10b981' : pct >= 60 ? '#0d9488' : '#d97706';

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Pill divisor — mismo estilo que Alertas */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: open ? '12px' : 0 }}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '7px 14px', borderRadius: 999,
            background: '#e2e8f0', color: '#475569',
            border: '1px solid #cbd5e1',
            fontSize: '12px', fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '0.05em',
            cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
          }}
        >
          <Layers size={13} style={{ color }} />
          <span>{groupLabel}</span>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#94a3b8', display: 'inline-block' }} />
          <span style={{ color }}>{pct}%</span>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
      </div>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sections.map(sec => (
            <ConformSectionCard key={sec.sectionId} section={sec} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Card de una sección con sus ítems */
function ConformSectionCard({ section }: { section: ConformSectionData }) {
  const [open, setOpen] = useState(false);
  const pct = section.totalCount > 0 ? Math.round((section.checkedCount / section.totalCount) * 100) : 0;
  const color = pct === 100 ? '#10b981' : pct >= 60 ? '#0d9488' : '#d97706';
  const bgColor = pct === 100 ? '#ecfdf5' : pct >= 60 ? '#f0fdfa' : '#fffbeb';

  return (
    <div className="card animate-in" style={{ padding: '16px 20px', marginBottom: 0, border: '1px solid #e2e8f0' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 12 }}
        onClick={() => setOpen(o => !o)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: '10px', background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {pct === 100
              ? <CheckCircle2 size={20} style={{ color: '#10b981' }} />
              : <Target size={20} style={{ color }} />
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {section.sectionIndex}. {section.sectionTitle}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
              <div style={{ height: 6, flex: 1, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden', maxWidth: 120 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.5s ease' }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color }}>
                {section.checkedCount}/{section.totalCount}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 900, color }}>{pct}%</span>
          <div style={{ color: '#94a3b8', background: '#f8fafc', padding: '5px', borderRadius: '8px' }}>
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      {open && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {section.items.map((item) => (
            <div key={item.key} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderRadius: 10, background: item.checked ? '#f0fdf4' : '#fff7f7',
              border: `1px solid ${item.checked ? '#bbf7d0' : '#fecaca'}`,
            }}>
              <div style={{ flexShrink: 0 }}>
                {item.checked
                  ? <CheckCircle2 size={18} style={{ color: '#10b981' }} />
                  : <XCircle size={18} style={{ color: '#ef4444' }} />
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', lineHeight: 1.4 }}>{item.itemText}</div>
                {item.reporter && (
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <User size={10} /> {item.reporter}
                    {item.time && <><Clock size={10} style={{ marginLeft: 4 }} /> {item.time}</>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ======================================================
   COMPONENTE PRINCIPAL
   ====================================================== */
export default function DashboardView({ occurrences, checklistState, checklistEntries = [], checklistSessions = [] }: DashboardViewProps) {
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

  /* Grupos de ALERTAS por fecha → colaborador */
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

  /* -------------------------------------------------------
     Grupos de CONFORMIDADES — construidos desde checklistState
     + checklistEntries, sin depender de checklistSessions.
     
     Usamos la fecha de "updated_at" (o "checked_at") de cada
     entrada para agrupar por día. Si no hay fecha, cae en hoy.
     ------------------------------------------------------- */

  /** Grupos de categorías para el pill divisor */
  const SECTION_GROUPS = [
    { label: 'Equipamentos e Transporte', sectionIds: ['perifericos', 'esteiras'] },
    { label: 'Moinho e Componentes Mecânicos', sectionIds: ['moinho', 'componentes'] },
    { label: 'Operação, Molde e Lubrificação', sectionIds: ['operacao', 'molde', 'lubrificacao'] },
    { label: 'Parâmetros e Documentação', sectionIds: ['parametros', 'documentacao'] },
  ];

  /** Mapa rápido: item_key → ChecklistEntry */
  const entryMap = useMemo(() => {
    const m: Record<string, ChecklistEntry> = {};
    checklistEntries.forEach(e => { m[e.item_key] = e; });
    return m;
  }, [checklistEntries]);

  /** Fecha más reciente de actualización del checklist (para el encabezado) */
  const lastUpdateDate = useMemo(() => {
    const dates = checklistEntries
      .map(e => e.updated_at || e.checked_at)
      .filter(Boolean) as string[];
    if (!dates.length) return null;
    return dates.sort().reverse()[0];
  }, [checklistEntries]);

  /**
   * Construye los datos de conformidades agrupados por SECTION_GROUPS.
   * Cada sección muestra sus ítems con estado checked/unchecked.
   */
  const conformGroups = useMemo(() => {
    return SECTION_GROUPS.map(group => {
      const sections: ConformSectionData[] = CHECKLIST_DATA
        .map((sec, sIdx) => {
          // Incluir si el id encaja con el grupo o si no hay grupos definidos
          const inGroup = group.sectionIds.some(sid =>
            sec.id.toLowerCase().includes(sid) ||
            sec.title.toLowerCase().includes(sid)
          );
          if (!inGroup) return null;

          const items = sec.items.map((itemText, iIdx) => {
            const key = `${sec.id}-${iIdx}`;
            const entry = entryMap[key];
            const checked = checklistState[key] === true;
            const reporter = entry?.reporter ? reporterLabel(entry.reporter) : '';
            const timeStr = entry?.updated_at || entry?.checked_at
              ? formatTime(entry.updated_at || entry.checked_at || '')
              : '';
            return { key, itemText, checked, reporter, time: timeStr };
          });

          const checkedCount = items.filter(i => i.checked).length;
          return {
            sectionId: sec.id,
            sectionTitle: sec.title.replace(/^\d+\.\s*/, ''),
            sectionIndex: sIdx + 1,
            items,
            checkedCount,
            totalCount: items.length,
          } as ConformSectionData;
        })
        .filter((s): s is ConformSectionData => s !== null);

      return { groupLabel: group.label, sections };
    }).filter(g => g.sections.length > 0);
  }, [checklistState, entryMap]);

  /**
   * Si ningún sectionId del grupo encaja con los ids reales del CHECKLIST_DATA,
   * hacemos un fallback: dividimos el array equitativamente en 4 grupos.
   */
  const usesFallbackGroups = conformGroups.every(g => g.sections.length === 0);

  const fallbackGroups = useMemo(() => {
    if (!usesFallbackGroups) return [];
    const chunkSize = Math.ceil(CHECKLIST_DATA.length / 4);
    const groupLabels = [
      'Grupo 1', 'Grupo 2', 'Grupo 3', 'Grupo 4',
    ];
    return Array.from({ length: 4 }, (_, gi) => {
      const slice = CHECKLIST_DATA.slice(gi * chunkSize, (gi + 1) * chunkSize);
      const sections: ConformSectionData[] = slice.map((sec, sIdx) => {
        const realIdx = gi * chunkSize + sIdx;
        const items = sec.items.map((itemText, iIdx) => {
          const key = `${sec.id}-${iIdx}`;
          const entry = entryMap[key];
          const checked = checklistState[key] === true;
          const reporter = entry?.reporter ? reporterLabel(entry.reporter) : '';
          const timeStr = entry?.updated_at || entry?.checked_at
            ? formatTime(entry.updated_at || entry.checked_at || '')
            : '';
          return { key, itemText, checked, reporter, time: timeStr };
        });
        return {
          sectionId: sec.id,
          sectionTitle: sec.title.replace(/^\d+\.\s*/, ''),
          sectionIndex: realIdx + 1,
          items,
          checkedCount: items.filter(i => i.checked).length,
          totalCount: items.length,
        } as ConformSectionData;
      });
      return { groupLabel: groupLabels[gi], sections };
    }).filter(g => g.sections.length > 0);
  }, [usesFallbackGroups, checklistState, entryMap]);

  const finalGroups = usesFallbackGroups ? fallbackGroups : conformGroups;

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
            {/* Header de progresso geral */}
            <div className="card" style={{ padding: '24px', marginBottom: '24px', background: 'linear-gradient(135deg, #059669, #10b981)', border: 'none', color: '#fff', boxShadow: '0 10px 25px -5px rgba(16,185,129,0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#ecfdf5', display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '0.05em' }}>
                  <Target size={20} /> PROGRESSO GERAL (estado atual)
                </h3>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>{validationProgress}%</div>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${validationProgress}%`, background: '#ffffff', borderRadius: 99, transition: 'width 0.5s ease-in-out' }} />
              </div>
              <p style={{ fontSize: '13px', color: '#d1fae5', marginTop: '12px', fontWeight: 600 }}>
                {verifiedCount} de {maxChecks} pontos de inspeção validados
                {lastUpdateDate && (
                  <span style={{ marginLeft: 8, opacity: 0.8 }}>
                    · atualizado {formatTime(lastUpdateDate)}
                  </span>
                )}
              </p>
            </div>

            {/* Grupos de seções com pill divisor */}
            {finalGroups.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', background: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <User size={32} style={{ color: '#94a3b8' }} />
                <div style={{ fontWeight: 700 }}>Sem dados de checklist</div>
                <div style={{ fontSize: 13 }}>Aguardando registros do checklist.</div>
              </div>
            ) : (
              finalGroups.map((group, gi) => (
                <ConformSectionGroup
                  key={group.groupLabel}
                  groupLabel={group.groupLabel}
                  sections={group.sections}
                  defaultOpen={gi === 0}
                />
              ))
            )}
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
