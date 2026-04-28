/**
 * MyRecordsView — Vista de registros del colaborador con edición
 *
 * FIXES v2:
 * 1. myOccs filter: strict email match via "Auth:" field (primary),
 *    exact name match (fallback). No more fuzzy .includes() leaking data.
 * 2. myConforms: now uses `${section.id}-${idx}` key to match
 *    ColaboradorScreen's checklistState format (was `${section.id}__${item}`).
 */
import { useState, useMemo, useRef } from 'react';
import {
  AlertTriangle, CheckCircle2,
  ChevronLeft, ChevronRight, X, FileText, ShieldCheck
} from 'lucide-react';
import { OccurrenceData } from '../types';
import { CHECKLIST_DATA } from '../constants';
import { EditModal, OccDetailModal, DayGroup } from './dashboard/MyRecordsComponents';

interface MyRecordsViewProps {
  occurrences: OccurrenceData[];
  checklistState: Record<string, boolean>;
  reporterName: string;
  reporterEmail: string;
  onUpdateOccurrence: (id: string, patch: { comment?: string; photos?: string[] }) => Promise<void>;
}

function toLocalDateKey(iso: string | undefined): string {
  if (!iso) return new Date().toISOString().slice(0, 10);
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}



/* ─── Main Export ────────────────────────────────────────────── */
export default function MyRecordsView({ occurrences, checklistState, reporterName, reporterEmail: myEmail, onUpdateOccurrence }: MyRecordsViewProps) {
  const [selectedOcc, setSelectedOcc] = useState<OccurrenceData | null>(null);
  const [editingOcc, setEditingOcc] = useState<OccurrenceData | null>(null);
  const [lightbox, setLightbox] = useState<{ photos: string[]; index: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'ocorrencias' | 'conformidades'>('ocorrencias');

  const today = (() => {
    return new Date().toISOString().slice(0, 10);
  })();

  /**
   * Strips everything from " - Auth:" onward AND the machine segment,
   * returning just the human-readable reporter name + shift, e.g.:
   *   "João Silva (Manhã) | Máquina: ROMI 01 - Auth: joao@ex.com"
   *   → "João Silva (Manhã)"
   */
  const reporterLabel = (raw: string): string => {
    return raw.split(' - Auth:')[0].split(' | Máquina:')[0].split(' | maquina:')[0].trim();
  };

  /** Extracts the auth email embedded by ColaboradorScreen */
  const reporterEmailExt = (raw: string): string | null => {
    const m = raw.match(/ - Auth:\s*(.+)$/);
    return m ? m[1].trim() : null;
  };

  /** Strips the (shift) parenthetical to get the bare name */
  const stripShift = (label: string): string => {
    return label.replace(/\s*\(.*?\)\s*$/, '').trim();
  };

  /**
   * FIX: Strict filtering — primary match by Auth email, fallback by exact name.
   * The reporter string format is:
   *   "${reporterName} (${shift}) | Máquina: ${machine} - Auth: ${userEmail}"
   * We extract the email after "- Auth:" and compare it strictly.
   * This prevents "Op. Silva" from seeing "Op. Silvano"'s records.
   */
  const myOccs = useMemo(() => {
    const normalEmail = myEmail?.trim().toLowerCase() ?? '';
    const normalName  = reporterName.trim().toLowerCase();

    return occurrences.filter(o => {
      // Primary: match by email (Auth field) — most reliable
      const embeddedEmail = reporterEmailExt(o.reporter);
      if (embeddedEmail && normalEmail) {
        return embeddedEmail.toLowerCase() === normalEmail;
      }
      // Fallback: exact name match after stripping shift parenthetical
      const labelName = stripShift(reporterLabel(o.reporter)).toLowerCase();
      return labelName === normalName;
    });
  }, [occurrences, reporterName, myEmail]);

  const byDay = useMemo(() => {
    const map: Record<string, OccurrenceData[]> = {};
    myOccs.forEach(o => {
      const dk = toLocalDateKey(o.created_at);
      if (!map[dk]) map[dk] = [];
      map[dk].push(o);
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [myOccs]);

  /**
   * FIX: use "${section.id}-${idx}" to match ColaboradorScreen's key format.
   * Previously used `${section.id}__${item}` which never matched anything.
   */
  const myConforms = useMemo(() => {
    return CHECKLIST_DATA.map(section => {
      const items = section.items.filter(
        (_, idx) => checklistState[`${section.id}-${idx}`] === true
      );
      return { section, items };
    }).filter(({ items }) => items.length > 0);
  }, [checklistState]);

  const totalConforms = myConforms.reduce((a, c) => a + c.items.length, 0);
  const maxChecks = CHECKLIST_DATA.reduce((acc, s) => acc + s.items.length, 0);

  const closeLightbox = () => setLightbox(null);
  const prevPhoto = () => setLightbox(p => p ? { ...p, index: p.index === 0 ? p.photos.length - 1 : p.index - 1 } : null);
  const nextPhoto = () => setLightbox(p => p ? { ...p, index: p.index === p.photos.length - 1 ? 0 : p.index + 1 } : null);

  const handleOpenEdit = (occ: OccurrenceData) => {
    setSelectedOcc(null);
    setEditingOcc(occ);
  };

  const handleSaveEdit = async (patch: { comment: string; photos: string[] }) => {
    if (!editingOcc) return;
    await onUpdateOccurrence(editingOcc.id, patch);
    setEditingOcc(null);
  };

  const isEditable = (occ: OccurrenceData) => toLocalDateKey(occ.created_at) === today;

  return (
    <section className="card" style={{ overflow: 'hidden', marginBottom: 'var(--s4)' }}>
      {/* Header */}
      <div style={{ padding: 'var(--s4) var(--s5)', borderBottom: '1px solid var(--divider)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--s3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)' }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--r-xl)', background: 'var(--primary-hl)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={17} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700 }}>Meus Registros</h2>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>Histórico pessoal — apenas você pode ver estes dados</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)', padding: 'var(--s1) var(--s3)', background: 'var(--primary-hl)', borderRadius: 'var(--r-full)', border: '1px solid rgba(0,0,0,0.06)' }}>
          <ShieldCheck size={12} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--primary)' }}>Privado</span>
        </div>
      </div>

      {/* Privacy notice */}
      <div style={{ padding: 'var(--s2) var(--s5)', background: 'var(--surface-2)', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
        <ShieldCheck size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Outros colaboradores <strong>não têm acesso</strong> aos seus registros. Você pode <strong>editar</strong> ocorrências do dia atual.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--divider)', background: 'var(--surface)', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[
          { id: 'ocorrencias'   as const, label: 'Ocorrências',  count: myOccs.length,   icon: AlertTriangle, active: 'var(--warning)', hl: 'var(--warning-hl)' },
          { id: 'conformidades' as const, label: 'Conformidades', count: totalConforms,   icon: CheckCircle2,  active: 'var(--success)', hl: 'var(--success-hl)' },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              style={{ flex: 1, padding: 'var(--s3) var(--s4)', fontSize: 'var(--text-sm)', fontWeight: 700, color: isActive ? tab.active : 'var(--text-muted)', borderBottom: isActive ? `2px solid ${tab.active}` : '2px solid transparent', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--s2)', cursor: 'pointer', transition: 'color 150ms ease', minWidth: 0 }}>
              <Icon size={14} className="hide-watch" />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tab.label}</span>
              <span className="hide-watch" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 18, borderRadius: 999, fontSize: 11, fontWeight: 700, background: isActive ? tab.hl : 'var(--surface-2)', color: isActive ? tab.active : 'var(--text-muted)', padding: '0 5px' }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ padding: 'var(--s4) var(--s5)', display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>

        {activeTab === 'ocorrencias' && (
          myOccs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--s8)' }}>
              <CheckCircle2 size={36} style={{ color: 'var(--success)', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-muted)' }}>Você ainda não registrou ocorrências.</p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', marginTop: 4 }}>Use o botão ⚠ ao lado de cada item do checklist para registrar.</p>
            </div>
          ) : (
            byDay.map(([dk, occs]) => (
              <DayGroup key={dk} dateKey={dk} occs={occs} onSelect={setSelectedOcc} isToday={dk === today} />
            ))
          )
        )}

        {activeTab === 'conformidades' && (
          myConforms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--s8)' }}>
              <CheckCircle2 size={36} style={{ color: 'var(--text-faint)', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-muted)' }}>Nenhum item marcado como conforme ainda.</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', padding: 'var(--s3) var(--s4)', background: 'var(--success-hl)', border: '1px solid rgba(22,163,74,0.18)', borderRadius: 'var(--r-xl)' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--success)' }}>{totalConforms} de {maxChecks} itens verificados por você</div>
                  <div style={{ marginTop: 5, height: 5, background: 'rgba(22,163,74,0.15)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.round((totalConforms / maxChecks) * 100)}%`, background: 'var(--success)', borderRadius: 999, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              </div>
              {myConforms.map(({ section, items }) => {
                const pct = Math.round((items.length / section.items.length) * 100);
                return (
                  <div key={section.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
                    <div style={{ padding: 'var(--s3) var(--s4)', background: 'var(--success-hl)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--s3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', minWidth: 0 }}>
                        <CheckCircle2 size={15} style={{ color: 'var(--success)', flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{section.title}</div>
                          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--success)' }}>{items.length}/{section.items.length} · {pct}%</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', padding: 'var(--s3) var(--s4) var(--s3) var(--s5)', borderBottom: i < items.length - 1 ? '1px solid rgba(22,163,74,0.1)' : 'none' }}>
                          <CheckCircle2 size={12} style={{ color: 'var(--success)', flexShrink: 0 }} />
                          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, lineHeight: 1.5 }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )
        )}
      </div>

      {/* Detail Modal */}
      {selectedOcc && (
        <OccDetailModal
          occ={selectedOcc}
          canEdit={isEditable(selectedOcc)}
          onClose={() => setSelectedOcc(null)}
          onPhoto={(photos, i) => { setSelectedOcc(null); setLightbox({ photos, index: i }); }}
          onEdit={() => handleOpenEdit(selectedOcc)}
        />
      )}

      {/* Edit Modal */}
      {editingOcc && (
        <EditModal
          occ={editingOcc}
          onClose={() => setEditingOcc(null)}
          onSaved={handleSaveEdit}
        />
      )}

      {/* Lightbox */}
      {lightbox && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000, padding: 'var(--s4)' }}>
          <button type="button" onClick={closeLightbox} style={{ position: 'absolute', top: 20, right: 20, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' }}><X size={20} /></button>
          {lightbox.photos.length > 1 && (
            <button type="button" onClick={prevPhoto} style={{ position: 'absolute', left: 16, width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' }}><ChevronLeft size={22} /></button>
          )}
          <div style={{ maxWidth: 'min(1100px,92vw)', maxHeight: '88vh', display: 'flex', flexDirection: 'column', gap: 'var(--s3)', alignItems: 'center' }}>
            <img src={lightbox.photos[lightbox.index]} alt={`Foto ampliada ${lightbox.index + 1}`} style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 'var(--r-xl)', boxShadow: 'var(--sh-xl)' }} />
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>Foto {lightbox.index + 1} de {lightbox.photos.length}</div>
          </div>
          {lightbox.photos.length > 1 && (
            <button type="button" onClick={nextPhoto} style={{ position: 'absolute', right: 16, width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' }}><ChevronRight size={22} /></button>
          )}
        </div>
      )}
    </section>
  );
}