import React, { useState, useMemo } from 'react';
import {
  AlertTriangle, CheckCircle2, X, ChevronDown, ChevronUp,
  Clock, Camera, Activity, Target, Search, XCircle, Calendar, User, Layers, Cpu
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
  return m ? m[1].trim() : '';
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

interface ConformItem {
  key: string;
  itemText: string;
  checked: boolean;
  reporter: string;
  machine: string;
  time: string;
}

interface ConformSectionData {
  sectionId: string;
  sectionTitle: string;
  sectionIndex: number;
  items: ConformItem[];
  checkedCount: number;
  totalCount: number;
}

/** Badge de máquina — ROMI 01 / ROMI 02 */
function MachineBadge({ machine }: { machine: string }) {
  if (!machine) return null;
  const isRomi1 = machine.includes('01') || machine.toLowerCase().includes('romi 1') || machine.toLowerCase() === 'romi1';
  const bg = isRomi1 ? '#eff6ff' : '#f5f3ff';
  const color = isRomi1 ? '#2563eb' : '#7c3aed';
  const border = isRomi1 ? '#bfdbfe' : '#ddd6fe';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: 10, fontWeight: 800, padding: '2px 7px',
      borderRadius: 999, background: bg, color, border: `1px solid ${border}`,
      textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>
      <Cpu size={9} />
      {machine}
    </span>
  );
}

/** Tarjeta individual por sección */
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
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
              borderRadius: 10, background: item.checked ? '#f0fdf4' : '#fff7f7',
              border: `1px solid ${item.checked ? '#bbf7d0' : '#fecaca'}`,
            }}>
              <div style={{ flexShrink: 0, marginTop: 1 }}>
                {item.checked
                  ? <CheckCircle2 size={18} style={{ color: '#10b981' }} />
                  : <XCircle size={18} style={{ color: '#ef4444' }} />
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', lineHeight: 1.4 }}>{item.itemText}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  {item.machine && <MachineBadge machine={item.machine} />}
                  {(item.reporter || item.time) && (
                    <span style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <User size={10} /> {item.reporter || 'Colaborador não identificado'}
                      {item.time && <><Clock size={10} style={{ marginLeft: 4 }} /> {item.time}</>}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ======================================================
   CONFORMIDADES — grupos por categoría
   ====================================================== */

// Agrupación de secciones del checklist en categorías
const SECTION_GROUPS: { label: string; sectionIds: string[] }[] = [
  { label: 'Periféricos e Esteiras',         sectionIds: ['perifericos', 'esteiras'] },
  { label: 'Moinho e Componentes',           sectionIds: ['moinho', 'componentes'] },
  { label: 'Operação, Molde e Lubrificação', sectionIds: ['operacao', 'molde', 'lubrificacao'] },
  { label: 'Parâmetros e Documentação',      sectionIds: ['parametros', 'documentacao'] },
];

/** Grupo colapsable con pill divisor — igual estilo que el divisor de fecha en Alertas */
function ConformCategoryGroup({
  groupLabel,
  sections,
}: {
  groupLabel: string;
  sections: ConformSectionData[];
}) {
  const [open, setOpen] = useState(true);
  const totalItems  = sections.reduce((a, s) => a + s.totalCount,   0);
  const checkedItms = sections.reduce((a, s) => a + s.checkedCount, 0);
  const pct   = totalItems > 0 ? Math.round((checkedItms / totalItems) * 100) : 0;
  const color = pct === 100 ? '#10b981' : pct >= 60 ? '#0d9488' : '#d97706';

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Pill divisor — idéntico al de Alertas pero con ícono Layers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: open ? '12px' : 0 }}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '6px 14px', borderRadius: 999,
            background: '#e2e8f0', color: '#475569',
            border: 'none',
            fontSize: '12px', fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '0.05em',
            cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
          }}
        >
          <Layers size={13} style={{ color }} />
          {groupLabel}
          <span style={{ fontSize: 11, fontWeight: 900, color, marginLeft: 2 }}>{pct}%</span>
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
      </div>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sections.map(section => (
            <ConformSectionCard key={section.sectionId} section={section} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ======================================================
   COMPONENTE PRINCIPAL
   ====================================================== */

export default function DashboardView({
  occurrences,
  checklistState,
  checklistEntries = [],
  checklistSessions = [],
}: DashboardViewProps) {
  const [activeTab,   setActiveTab]   = useState<'alertas' | 'conformidades'>('alertas');
  const [photoModal,  setPhotoModal]  = useState<{ photos: string[]; index: number } | null>(null);
  const [searchTerm,  setSearchTerm]  = useState('');

  /* ---- entryMap: item_key → ChecklistEntry ---- */
  const entryMap = useMemo(() => {
    const map: Record<string, ChecklistEntry> = {};
    checklistEntries.forEach(e => { if (e.item_key) map[e.item_key] = e; });
    return map;
  }, [checklistEntries]);

  /* ---- Alertas agrupadas por fecha → colaborador ---- */
  const occurrencesByDate = useMemo(() => {
    const filtered = occurrences.filter(o =>
      !searchTerm ||
      o.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.reporter.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const dateMap: Record<string, Record<string, OccurrenceData[]>> = {};
    filtered.forEach(o => {
      const dateKey = todayISO();
      if (!dateMap[dateKey]) dateMap[dateKey] = {};
      const rep = reporterLabel(o.reporter);
      if (!dateMap[dateKey][rep]) dateMap[dateKey][rep] = [];
      dateMap[dateKey][rep].push(o);
    });

    return Object.entries(dateMap)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, reporters]) => ({
        date,
        reporters: Object.entries(reporters),
      }));
  }, [occurrences, searchTerm]);

  /* ---- Conformidades: construye secciones por día y las agrupa por categoría ---- */
  const conformByDay = useMemo(() => {
    const daySet = new Set<string>();
    checklistEntries.forEach(e => {
      const iso = e.updated_at || e.checked_at;
      if (iso) daySet.add(isoDateKey(iso));
    });
    if (daySet.size === 0) daySet.add(todayISO());

    const days = Array.from(daySet).sort((a, b) => b.localeCompare(a));

    return days.map(day => {
      // Para este día, construir todas las secciones del checklist
      const allSections: ConformSectionData[] = CHECKLIST_DATA.map((sec, sIdx) => {
        const items: ConformItem[] = sec.items.map((itemText, iIdx) => {
          const key = `${sec.id}-${iIdx}`;
          const entry = entryMap[key];
          const entryDateKey = (entry?.updated_at || entry?.checked_at)
            ? isoDateKey(entry.updated_at || entry.checked_at || '')
            : '';
          const belongsToDay = entryDateKey === day || (!entryDateKey && day === todayISO());
          const checked      = belongsToDay ? (checklistState[key] === true) : false;
          const rawReporter  = belongsToDay && entry?.reporter ? entry.reporter : '';
          const reporter     = rawReporter ? reporterLabel(rawReporter) : '';
          const machine      = rawReporter ? machineLabel(rawReporter) : '';
          const timeStr      = belongsToDay && (entry?.updated_at || entry?.checked_at)
            ? formatTime(entry.updated_at || entry.checked_at || '')
            : '';
          return { key, itemText, checked, reporter, machine, time: timeStr };
        });
        return {
          sectionId:     sec.id,
          sectionTitle:  sec.title.replace(/^\d+\.\s*/, ''),
          sectionIndex:  sIdx + 1,
          items,
          checkedCount:  items.filter(i => i.checked).length,
          totalCount:    items.length,
        };
      });

      // Agrupar secciones según SECTION_GROUPS
      const groups = SECTION_GROUPS.map(group => {
        const sections = allSections.filter(s =>
          group.sectionIds.includes(s.sectionId)
        );
        return { label: group.label, sections };
      }).filter(g => g.sections.length > 0);

      return { date: day, groups };
    });
  }, [checklistEntries, checklistState, entryMap]);

  /* ---- Estadísticas generales ---- */
  const totalItems  = useMemo(() => CHECKLIST_DATA.reduce((a, s) => a + s.items.length, 0), []);
  const checkedItems = useMemo(() => Object.values(checklistState).filter(Boolean).length, [checklistState]);
  const overallPct  = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  const openPhotoModal  = (photos: string[], index: number) => setPhotoModal({ photos, index });
  const closePhotoModal = () => setPhotoModal(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#ef4444' }}>{occurrences.length}</div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4 }}>Alertas</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#0d9488' }}>{overallPct}%</div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4 }}>Conformidade</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#6366f1' }}>{checklistSessions.length}</div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4 }}>Sessões</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', background: 'var(--surface)', borderRadius: '12px', padding: '4px' }}>
        {(['alertas', 'conformidades'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              background: activeTab === tab ? '#ffffff' : 'transparent',
              color: activeTab === tab ? 'var(--text)' : 'var(--text-muted)',
              boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {tab === 'alertas' ? `⚠️ Alertas (${occurrences.length})` : `✅ Conformidades (${checkedItems}/${totalItems})`}
          </button>
        ))}
      </div>

      {/* ---- ALERTAS ---- */}
      {activeTab === 'alertas' && (
        <div>
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Buscar alertas..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px',
                border: '1px solid #e2e8f0', fontSize: '14px', color: 'var(--text)',
                background: 'var(--surface)', outline: 'none',
              }}
            />
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                <X size={14} />
              </button>
            )}
          </div>

          {occurrencesByDate.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
              <Activity size={40} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
              <p style={{ fontSize: '15px', fontWeight: 700 }}>Nenhuma ocorrência encontrada</p>
              <p style={{ fontSize: '13px', marginTop: 4 }}>
                {searchTerm ? 'Tente outro termo de busca' : 'As ocorrências registradas aparecerão aqui'}
              </p>
            </div>
          ) : (
            occurrencesByDate.map(({ date, reporters }) => (
              <div key={date} style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '999px', background: '#e2e8f0', color: '#475569', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
                    <Calendar size={13} /> {formatDateLabel(date)}
                  </div>
                  <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                </div>
                {reporters.map(([reporter, repOccs]) => (
                  <CollaboratorCard key={reporter} reporter={reporter} occs={repOccs} onOpenPhoto={openPhotoModal} />
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {/* ---- CONFORMIDADES ---- */}
      {activeTab === 'conformidades' && (
        <div>
          {conformByDay.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={40} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
              <p style={{ fontSize: '15px', fontWeight: 700 }}>Nenhuma conformidade registrada</p>
            </div>
          ) : (
            conformByDay.map(({ date, groups }) => (
              <div key={date} style={{ marginBottom: '28px' }}>
                {/* Divisor de fecha igual que en Alertas */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '999px', background: '#e2e8f0', color: '#475569', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
                    <Calendar size={13} /> {formatDateLabel(date)}
                  </div>
                  <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                </div>

                {/* Categorías */}
                {groups.map(group => (
                  <ConformCategoryGroup
                    key={group.label}
                    groupLabel={group.label}
                    sections={group.sections}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal foto */}
      {photoModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={closePhotoModal}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <img
              src={photoModal.photos[photoModal.index]}
              alt="Foto"
              style={{ maxWidth: '80vw', maxHeight: '80vh', borderRadius: '12px', objectFit: 'contain' }}
            />
            <button type="button" onClick={closePhotoModal} style={{ position: 'absolute', top: -12, right: -12, width: 32, height: 32, borderRadius: '50%', background: '#ffffff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
