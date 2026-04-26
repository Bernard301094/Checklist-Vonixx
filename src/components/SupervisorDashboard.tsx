/**
 * SupervisorDashboard — Command Center Layout
 * Layout: KPI Strip → Split Panel (Ocorrências | Conformidades) → Timeline Feed
 * Mobile A55 (412px): KPIs 2x2, tabs em vez de colunas, bottom sheets
 */
import { useState, useMemo } from 'react';
import {
  AlertTriangle, CheckCircle2, TrendingUp, Users,
  Clock, Calendar, Camera, MessageSquare, Hash,
  ChevronRight, X, ChevronLeft, Filter, BarChart2,
  Activity, Shield, Eye, Layers
} from 'lucide-react';
import { OccurrenceData } from '../types';
import { CHECKLIST_DATA } from '../constants';

interface Props {
  occurrences: OccurrenceData[];
  checklistState: Record<string, boolean>;
}

/* ─── helpers ─────────────────────────────────────────── */
function toLocalDateKey(iso: string | undefined): string {
  if (!iso) return new Date().toISOString().slice(0, 10);
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function dateLabel(dk: string): string {
  if (dk === todayKey()) return 'Hoje';
  if (dk === yesterdayKey()) return 'Ontem';
  const [y, m, day] = dk.split('-');
  return `${day}/${m}/${y}`;
}
function initials(name: string) {
  return name.split(' - Auth:')[0].trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
function reporterLabel(raw: string) { return raw.split(' - Auth:')[0].trim(); }

const AVATAR_COLORS = [
  '#0d9488','#7c3aed','#db2777','#d97706','#16a34a','#2563eb','#dc2626','#059669',
];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

/* ─── Group occurrences by date ───────────────────────── */
function groupByDate(occs: OccurrenceData[]): { dateKey: string; items: OccurrenceData[] }[] {
  const sorted = [...occs].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  const groups: { dateKey: string; items: OccurrenceData[] }[] = [];
  const seen = new Map<string, OccurrenceData[]>();
  sorted.forEach(o => {
    const dk = toLocalDateKey(o.created_at);
    if (!seen.has(dk)) { seen.set(dk, []); groups.push({ dateKey: dk, items: seen.get(dk)! }); }
    seen.get(dk)!.push(o);
  });
  return groups;
}

/* ─── Date Separator ─────────────────────────────────── */
function DateSeparator({ dateKey, count }: { dateKey: string; count: number }) {
  const isToday = dateKey === todayKey();
  const isYesterday = dateKey === yesterdayKey();
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0',
    }}>
      <div style={{ flex: 1, height: 1, background: 'var(--divider)' }} />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '3px 10px',
        borderRadius: 999,
        background: isToday ? 'var(--primary-hl)' : isYesterday ? 'var(--surface-offset, var(--surface-2))' : 'var(--surface-2)',
        border: `1px solid ${isToday ? 'rgba(1,105,111,0.25)' : 'var(--border)'}`,
        flexShrink: 0,
      }}>
        <Calendar size={10} style={{ color: isToday ? 'var(--primary)' : 'var(--text-muted)' }} />
        <span style={{
          fontSize: 11, fontWeight: 800, letterSpacing: '0.04em',
          color: isToday ? 'var(--primary)' : 'var(--text-muted)',
          whiteSpace: 'nowrap',
        }}>{dateLabel(dateKey)}</span>
        <span style={{
          fontSize: 10, fontWeight: 700,
          color: isToday ? 'var(--primary)' : 'var(--text-faint)',
        }}>{count}</span>
      </div>
      <div style={{ flex: 1, height: 1, background: 'var(--divider)' }} />
    </div>
  );
}

/* ─── Timeline with date groups ───────────────────────── */
function GroupedTimeline({ occs, onSelect, limit }: { occs: OccurrenceData[]; onSelect: (o: OccurrenceData) => void; limit?: number }) {
  const groups = useMemo(() => groupByDate(occs), [occs]);
  let rendered = 0;
  const limited = limit != null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {groups.map(({ dateKey, items }) => {
        if (limited && rendered >= limit!) return null;
        const toShow = limited ? items.slice(0, limit! - rendered) : items;
        rendered += toShow.length;
        return (
          <div key={dateKey} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <DateSeparator dateKey={dateKey} count={items.length} />
            {toShow.map(o => <FeedItem key={o.id} occ={o} onSelect={() => onSelect(o)} />)}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Lightbox ────────────────────────────────────────── */
function Lightbox({ photos, index, onClose }: { photos: string[]; index: number; onClose: () => void }) {
  const [cur, setCur] = useState(index);
  const prev = () => setCur(i => (i === 0 ? photos.length - 1 : i - 1));
  const next = () => setCur(i => (i === photos.length - 1 ? 0 : i + 1));
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000, padding: 16 }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={20} /></button>
      {photos.length > 1 && <button onClick={prev} style={{ position: 'absolute', left: 12, width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ChevronLeft size={22} /></button>}
      <div style={{ maxWidth: 'min(1100px, 90vw)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <img src={photos[cur]} alt={`Foto ${cur + 1}`} style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 12, boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }} />
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>Foto {cur + 1} de {photos.length}</div>
      </div>
      {photos.length > 1 && <button onClick={next} style={{ position: 'absolute', right: 12, width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ChevronRight size={22} /></button>}
    </div>
  );
}

/* ─── Occurrence Detail Sheet ─────────────────────────── */
function OccDetailSheet({ occ, onClose, onPhoto }: { occ: OccurrenceData; onClose: () => void; onPhoto: (photos: string[], i: number) => void }) {
  const isToday = toLocalDateKey(occ.created_at) === todayKey();
  const dateStr = occ.created_at
    ? new Date(occ.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';
  return (
    <>
      <style>{`
        .svd-overlay{position:fixed;inset:0;background:rgba(2,6,23,0.88);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:6000;padding:16px;animation:svdFadeIn .15s ease;}
        .svd-box{width:100%;max-width:560px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-2xl);box-shadow:var(--sh-xl);max-height:92dvh;display:flex;flex-direction:column;overflow:hidden;animation:svdSlideUp .2s ease;}
        @media(max-width:480px){.svd-overlay{align-items:flex-end;padding:0;}.svd-box{max-width:100%;border-bottom-left-radius:0;border-bottom-right-radius:0;max-height:96dvh;}}
        @keyframes svdFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes svdSlideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
      `}</style>
      <div className="svd-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="svd-box">
          {/* header */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--sidebar-bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 'var(--r-xl)', background: 'rgba(217,119,6,0.2)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><AlertTriangle size={17} /></div>
              <div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>Ocorrência</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#fff', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{occ.section}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 'var(--r-lg)', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={15} /></button>
          </div>
          {/* meta */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
            {[{ icon: Calendar, label: 'Data', value: dateStr }, { icon: Clock, label: 'Hora', value: occ.time }, { icon: Users, label: 'Operador', value: reporterLabel(occ.reporter) }].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '8px 10px', background: 'var(--surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}><Icon size={11} /><span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span></div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
              </div>
            ))}
          </div>
          {/* body */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Hash size={13} style={{ color: 'var(--warning)' }} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--warning)' }}>Fator crítico</span>
              </div>
              <div style={{ padding: '12px 14px', background: 'var(--warning-hl)', border: '1px solid rgba(217,119,6,0.18)', borderRadius: 'var(--r-xl)' }}>
                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, lineHeight: 1.5 }}>{occ.item}</p>
              </div>
            </div>
            {occ.comment && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <MessageSquare size={13} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>Comentário</span>
                </div>
                <div style={{ padding: '12px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)' }}>
                  <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.7 }}>{occ.comment}</p>
                </div>
              </div>
            )}
            {occ.photos.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Camera size={13} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--primary)' }}>Evidências — {occ.photos.length} foto(s)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                  {occ.photos.map((p, i) => (
                    <button key={i} type="button" onClick={() => onPhoto(occ.photos, i)}
                      style={{ position: 'relative', borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '1', padding: 0, cursor: 'zoom-in', background: 'var(--surface-2)' }}>
                      <img src={p} alt={`Foto ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                      <div style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(15,23,42,0.75)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 5px', borderRadius: 999 }}>{i + 1}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {isToday && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'var(--primary-hl)', borderRadius: 'var(--r-lg)', border: '1px solid rgba(13,148,136,0.2)' }}>
                <Clock size={12} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>Ocorrência registrada hoje</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── KPI Card ─────────────────────────────────────────── */
function KpiCard({ label, value, sub, icon: Icon, color, bg }: { label: string; value: string | number; sub?: string; icon: any; color: string; bg: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, boxShadow: 'var(--sh-sm)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 'var(--r-lg)', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={15} style={{ color }} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
        <span style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
        {sub && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 3 }}>{sub}</span>}
      </div>
    </div>
  );
}

/* ─── Bar Chart (CSS-only, no lib needed) ─────────────── */
function WeekBarChart({ data }: { data: { day: string; occs: number; confs: number }[] }) {
  const maxVal = Math.max(...data.flatMap(d => [d.occs, d.confs]), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 72, paddingBottom: 20, position: 'relative' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', display: 'flex', gap: 2, alignItems: 'flex-end', justifyContent: 'center', flex: 1 }}>
            <div style={{ width: '42%', height: `${Math.max((d.occs / maxVal) * 52, d.occs > 0 ? 6 : 2)}px`, background: 'var(--warning)', borderRadius: '3px 3px 0 0', minHeight: 2, transition: 'height 0.5s ease' }} title={`Ocorr: ${d.occs}`} />
            <div style={{ width: '42%', height: `${Math.max((d.confs / maxVal) * 52, d.confs > 0 ? 6 : 2)}px`, background: 'var(--success)', borderRadius: '3px 3px 0 0', minHeight: 2, transition: 'height 0.5s ease' }} title={`Conf: ${d.confs}`} />
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em', position: 'absolute', bottom: 0 }}>{d.day}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Section Progress Bar ────────────────────────────── */
function SectionProgress({ title, total, checked, occs }: { title: string; total: number; checked: number; occs: number }) {
  const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
  const shortTitle = title.replace(/^\d+\.\s*/, '');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{shortTitle}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {occs > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: 'var(--warning)', background: 'var(--warning-hl)', padding: '1px 6px', borderRadius: 999 }}>
              <AlertTriangle size={9} />{occs}
            </span>
          )}
          <span style={{ fontSize: 11, fontWeight: 700, color: pct === 100 ? 'var(--success)' : pct > 50 ? 'var(--primary)' : 'var(--text-muted)' }}>{pct}%</span>
        </div>
      </div>
      <div style={{ height: 5, background: 'var(--divider)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--success)' : 'var(--primary)', borderRadius: 999, transition: 'width 0.6s ease' }} />
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{checked}/{total} itens</div>
    </div>
  );
}

/* ─── Operator Row ────────────────────────────────────── */
function OperatorRow({ name, occs, confs, rank }: { name: string; occs: number; confs: number; rank: number }) {
  const color = avatarColor(name);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-faint)', width: 16, textAlign: 'center', flexShrink: 0 }}>#{rank}</span>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>{initials(name)}</span>
      </div>
      <span style={{ flex: 1, fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reporterLabel(name)}</span>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {confs > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--success)', background: 'var(--success-hl)', padding: '2px 7px', borderRadius: 999 }}>✓{confs}</span>}
        {occs > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--warning)', background: 'var(--warning-hl)', padding: '2px 7px', borderRadius: 999 }}>⚠{occs}</span>}
      </div>
    </div>
  );
}

/* ─── Timeline Feed Item ───────────────────────────────── */
function FeedItem({ occ, onSelect }: { occ: OccurrenceData; onSelect: () => void }) {
  const color = avatarColor(occ.reporter);
  return (
    <button type="button" onClick={onSelect}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background 150ms' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}>
      <div style={{ width: 3, alignSelf: 'stretch', background: 'var(--warning)', borderRadius: 99, flexShrink: 0 }} />
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>{initials(occ.reporter)}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 2 }}>{occ.section}</div>
        <div style={{ fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{occ.item}</div>
        {occ.comment && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{occ.comment}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--text-muted)' }}><Clock size={10} />{occ.time}</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{reporterLabel(occ.reporter)}</span>
          {occ.photos.length > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--primary)' }}><Camera size={10} />{occ.photos.length} foto(s)</span>}
        </div>
      </div>
      <ChevronRight size={14} style={{ color: 'var(--text-faint)', flexShrink: 0, marginTop: 6 }} />
    </button>
  );
}

/* ─── Main Component ───────────────────────────────────── */
export default function SupervisorDashboard({ occurrences, checklistState }: Props) {
  const [selectedOcc, setSelectedOcc] = useState<OccurrenceData | null>(null);
  const [lightbox, setLightbox] = useState<{ photos: string[]; index: number } | null>(null);
  const [mobileTab, setMobileTab] = useState<'ocorrencias' | 'conformidades' | 'timeline'>('ocorrencias');
  const [sectionFilter, setSectionFilter] = useState<string>('all');

  const today = todayKey();

  /* ── derived stats ── */
  const todayOccs = useMemo(() => occurrences.filter(o => toLocalDateKey(o.created_at) === today), [occurrences, today]);
  const totalChecked = useMemo(() => Object.values(checklistState).filter(Boolean).length, [checklistState]);
  const totalItems = useMemo(() => CHECKLIST_DATA.reduce((a, s) => a + s.items.length, 0), []);
  const conformPct = totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : 0;

  const uniqueOperators = useMemo(() => {
    const s = new Set(occurrences.map(o => o.reporter));
    return s.size;
  }, [occurrences]);

  /* ── week data for chart ── */
  const weekData = useMemo(() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayOccs = occurrences.filter(o => toLocalDateKey(o.created_at) === dk);
      return {
        day: days[d.getDay()],
        occs: dayOccs.length,
        confs: 0,
      };
    });
  }, [occurrences]);

  /* ── section stats ── */
  const sectionStats = useMemo(() => {
    return CHECKLIST_DATA.map(section => {
      const checked = section.items.filter(item => checklistState[`${section.id}__${item}`]).length;
      const occsInSection = occurrences.filter(o => o.section === section.title).length;
      return { section, checked, occs: occsInSection };
    });
  }, [occurrences, checklistState]);

  /* ── operator stats ── */
  const operatorStats = useMemo(() => {
    const map: Record<string, { occs: number; confs: number }> = {};
    occurrences.forEach(o => {
      if (!map[o.reporter]) map[o.reporter] = { occs: 0, confs: 0 };
      map[o.reporter].occs++;
    });
    return Object.entries(map).sort((a, b) => b[1].occs - a[1].occs).slice(0, 5);
  }, [occurrences]);

  /* ── filtered occurrences ── */
  const filteredOccs = useMemo(() => {
    if (sectionFilter === 'all') return [...occurrences].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    return occurrences.filter(o => o.section === sectionFilter).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  }, [occurrences, sectionFilter]);

  const allSections = useMemo(() => Array.from(new Set(occurrences.map(o => o.section))), [occurrences]);

  const kpis = [
    { label: 'Ocorrências Hoje', value: todayOccs.length, icon: AlertTriangle, color: 'var(--warning)', bg: 'var(--warning-hl)' },
    { label: 'Conformidades', value: totalChecked, sub: `/${totalItems}`, icon: CheckCircle2, color: 'var(--success)', bg: 'var(--success-hl)' },
    { label: '% Conformidade', value: `${conformPct}%`, icon: TrendingUp, color: 'var(--primary)', bg: 'var(--primary-hl)' },
    { label: 'Operadores', value: uniqueOperators, icon: Users, color: 'var(--blue)', bg: 'var(--blue-hl, rgba(0,100,148,0.12))' },
  ];

  /* ── section names for filter select ── */
  const sectionOptions = [{ id: 'all', label: 'Todas as seções' }, ...allSections.map(s => ({ id: s, label: s.replace(/^\d+\.\s*/, '') }))];

  return (
    <>
      <style>{`
        /* ── Dashboard base ── */
        .svdb-root { display:flex; flex-direction:column; gap:0; }

        /* ── KPI grid ── */
        .svdb-kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; padding:16px 20px; background:var(--surface-2); border-bottom:1px solid var(--divider); }
        @media(max-width:640px){ .svdb-kpi-grid { grid-template-columns:repeat(2,1fr); gap:10px; padding:12px 14px; } }

        /* ── Split panel ── */
        .svdb-split { display:grid; grid-template-columns:1fr 1fr; gap:0; border-bottom:1px solid var(--divider); }
        @media(max-width:768px){ .svdb-split { display:none; } }

        /* ── Mobile tabs ── */
        .svdb-mobile-tabs { display:none; }
        @media(max-width:768px){ .svdb-mobile-tabs { display:flex; background:var(--surface); border-bottom:1px solid var(--divider); overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; } }
        .svdb-mobile-tabs::-webkit-scrollbar { display:none; }

        /* ── Mobile panel ── */
        .svdb-mobile-panel { display:none; }
        @media(max-width:768px){ .svdb-mobile-panel { display:block; } }

        /* ── Panel col ── */
        .svdb-col { display:flex; flex-direction:column; overflow:hidden; }
        .svdb-col:first-child { border-right:1px solid var(--divider); }

        /* ── Col header ── */
        .svdb-col-hdr { padding:12px 16px; background:var(--surface); border-bottom:1px solid var(--divider); display:flex; align-items:center; justify-content:space-between; gap:8px; flex-shrink:0; position:sticky; top:0; z-index:2; }

        /* ── Col body ── */
        .svdb-col-body { flex:1; overflow-y:auto; padding:12px 14px; display:flex; flex-direction:column; gap:8px; max-height:420px; }
        @media(max-width:768px){ .svdb-col-body { max-height:none; } }

        /* ── Timeline ── */
        .svdb-timeline { display:flex; flex-direction:column; gap:8px; padding:14px 18px; }
        @media(max-width:480px){ .svdb-timeline { padding:10px 12px; } }

        /* ── Select filter ── */
        .svdb-select { font:inherit; font-size:12px; font-weight:700; color:var(--text); background:var(--surface-2); border:1px solid var(--border); border-radius:var(--r-lg); padding:5px 8px; cursor:pointer; max-width:200px; }
        @media(max-width:480px){ .svdb-select { max-width:160px; font-size:11px; } }

        /* ── Chart legend ── */
        .svdb-legend { display:flex; gap:12px; align-items:center; padding:0 4px; }
        .svdb-legend-dot { width:8px; height:8px; border-radius:2px; }
      `}</style>

      <div className="svdb-root">

        {/* ── KPI Strip ─────────────────────────────── */}
        <div className="svdb-kpi-grid">
          {kpis.map((k, i) => (
            <KpiCard key={i} label={k.label} value={k.value} sub={(k as any).sub} icon={k.icon} color={k.color} bg={k.bg} />
          ))}
        </div>

        {/* ── Mobile Tabs ───────────────────────────── */}
        <div className="svdb-mobile-tabs">
          {([
            { id: 'ocorrencias', label: 'Ocorrências', count: occurrences.length, color: 'var(--warning)' },
            { id: 'conformidades', label: 'Conformidades', count: totalChecked, color: 'var(--success)' },
            { id: 'timeline', label: 'Timeline', count: occurrences.length, color: 'var(--primary)' },
          ] as const).map(tab => (
            <button key={tab.id} type="button" onClick={() => setMobileTab(tab.id)}
              style={{ flex: '0 0 auto', padding: '10px 16px', fontSize: 13, fontWeight: 700, color: mobileTab === tab.id ? tab.color : 'var(--text-muted)', borderBottom: mobileTab === tab.id ? `2px solid ${tab.color}` : '2px solid transparent', background: 'transparent', whiteSpace: 'nowrap', cursor: 'pointer' }}>
              {tab.label}
              <span style={{ marginLeft: 5, fontSize: 10, fontWeight: 700, background: mobileTab === tab.id ? tab.color : 'var(--surface-2)', color: mobileTab === tab.id ? '#fff' : 'var(--text-muted)', padding: '1px 5px', borderRadius: 999 }}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* ── Mobile Panel ─────────────────────────── */}
        <div className="svdb-mobile-panel">
          {mobileTab === 'ocorrencias' && (
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Filter size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <select className="svdb-select" value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}>
                  {sectionOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </div>
              {filteredOccs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={32} style={{ margin: '0 auto 10px', color: 'var(--success)' }} />
                  <p style={{ fontWeight: 700, fontSize: 13 }}>Nenhuma ocorrência encontrada</p>
                </div>
              ) : <GroupedTimeline occs={filteredOccs} onSelect={setSelectedOcc} />}
            </div>
          )}
          {mobileTab === 'conformidades' && (
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sectionStats.map(({ section, checked, occs }) => (
                <SectionProgress key={section.id} title={section.title} total={section.items.length} checked={checked} occs={occs} />
              ))}
            </div>
          )}
          {mobileTab === 'timeline' && (
            <div style={{ padding: '12px 14px' }}>
              {occurrences.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                  <Activity size={32} style={{ margin: '0 auto 10px', color: 'var(--text-faint)' }} />
                  <p style={{ fontWeight: 700, fontSize: 13 }}>Nenhuma atividade registrada</p>
                </div>
              ) : <GroupedTimeline occs={occurrences} onSelect={setSelectedOcc} />}
            </div>
          )}
        </div>

        {/* ── Desktop Split Panel ───────────────────── */}
        <div className="svdb-split">

          {/* Left — Occurrences */}
          <div className="svdb-col">
            <div className="svdb-col-hdr">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={15} style={{ color: 'var(--warning)' }} />
                <span style={{ fontSize: 13, fontWeight: 800 }}>Ocorrências</span>
                <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--warning-hl)', color: 'var(--warning)', padding: '1px 7px', borderRadius: 999 }}>{filteredOccs.length}</span>
              </div>
              <select className="svdb-select" value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}>
                {sectionOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </div>
            <div className="svdb-col-body">
              {filteredOccs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={32} style={{ margin: '0 auto 10px', color: 'var(--success)' }} />
                  <p style={{ fontWeight: 700, fontSize: 13 }}>Nenhuma ocorrência</p>
                  <p style={{ fontSize: 11, marginTop: 4 }}>Operação dentro da normalidade</p>
                </div>
              ) : <GroupedTimeline occs={filteredOccs} onSelect={setSelectedOcc} />}
            </div>
          </div>

          {/* Right — Conformidades */}
          <div className="svdb-col">
            <div className="svdb-col-hdr">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={15} style={{ color: 'var(--success)' }} />
                <span style={{ fontSize: 13, fontWeight: 800 }}>Conformidades por Seção</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-hl)', padding: '2px 8px', borderRadius: 999 }}>{conformPct}% geral</span>
            </div>
            <div className="svdb-col-body">
              {sectionStats.map(({ section, checked, occs }) => (
                <SectionProgress key={section.id} title={section.title} total={section.items.length} checked={checked} occs={occs} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Analytics Row (desktop) ────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderBottom: '1px solid var(--divider)' }}>

          {/* Week chart */}
          <div style={{ padding: '14px 18px', borderRight: '1px solid var(--divider)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart2 size={14} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: 12, fontWeight: 800 }}>Ocorrências — Últimos 7 dias</span>
              </div>
              <div className="svdb-legend">
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div className="svdb-legend-dot" style={{ background: 'var(--warning)' }} /><span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>Ocorr.</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div className="svdb-legend-dot" style={{ background: 'var(--success)' }} /><span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>Conf.</span></div>
              </div>
            </div>
            <WeekBarChart data={weekData} />
          </div>

          {/* Operators ranking */}
          <div style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Users size={14} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: 12, fontWeight: 800 }}>Top Operadores</span>
            </div>
            {operatorStats.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-muted)' }}>
                <Users size={22} style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: 12 }}>Nenhum operador ainda</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {operatorStats.map(([name, stats], i) => (
                  <OperatorRow key={name} name={name} occs={stats.occs} confs={stats.confs} rank={i + 1} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Timeline Feed (all occurrences, desktop + mobile) ─ */}
        <div style={{ borderBottom: '1px solid var(--divider)' }}>
          <div style={{ padding: '12px 18px', background: 'var(--surface)', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={14} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: 12, fontWeight: 800 }}>Timeline — Todas as ocorrências</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '1px 7px', borderRadius: 999 }}>{occurrences.length} total</span>
          </div>
          <div className="svdb-timeline">
            {occurrences.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--text-muted)' }}>
                <Shield size={28} style={{ margin: '0 auto 10px', color: 'var(--success)' }} />
                <p style={{ fontWeight: 700, fontSize: 13 }}>Operação limpa</p>
                <p style={{ fontSize: 11, marginTop: 4 }}>Nenhuma ocorrência registrada ainda</p>
              </div>
            ) : (
              <>
                <GroupedTimeline occs={occurrences.slice(0, 20)} onSelect={setSelectedOcc} limit={20} />
                {occurrences.length > 20 && (
                  <div style={{ textAlign: 'center', padding: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Mostrando os 20 mais recentes de {occurrences.length} no total</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>

      {/* ── Detail Sheet ──────────────────────────────── */}
      {selectedOcc && (
        <OccDetailSheet
          occ={selectedOcc}
          onClose={() => setSelectedOcc(null)}
          onPhoto={(photos, i) => { setSelectedOcc(null); setLightbox({ photos, index: i }); }}
        />
      )}

      {/* ── Lightbox ──────────────────────────────────── */}
      {lightbox && <Lightbox photos={lightbox.photos} index={lightbox.index} onClose={() => setLightbox(null)} />}
    </>
  );
}
