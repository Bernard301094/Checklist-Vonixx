/**
 * ReportPDF v3 — Professional industrial inspection report
 * Layout: Cover Page → Executive Summary → Checklist by Section → Occurrences → Signature
 */
import React from 'react';
import {
  Document, Page, Text, View, StyleSheet, Image,
} from '@react-pdf/renderer';
import { OccurrenceData } from '../types';
import { CHECKLIST_DATA } from '../constants';

export interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  shift: string;
  section: string;
  machine: string;
  reportTitle: string;
  generatedBy: string;
}

interface Props {
  occurrences: OccurrenceData[];
  checklistState: Record<string, boolean>;
  filters: ReportFilters;
}

/* ─── Design tokens ────────────────────────────────────── */
const C = {
  brand:       '#01696f',
  brandDark:   '#013f45',
  brandGrad1:  '#01696f',
  brandGrad2:  '#014f55',
  brandLight:  '#e4f4f4',
  brandMid:    '#b8e0e1',
  accent:      '#c2560c',  // burnt orange — mais profissional
  accentLight: '#fdf0e8',
  accentMid:   '#f7c9a3',
  success:     '#15803d',
  successBg:   '#f0fdf4',
  successBorder:'#86efac',
  danger:      '#b91c1c',
  dangerBg:    '#fef2f2',
  dangerBorder:'#fca5a5',
  pending:     '#6b7280',
  pendingBg:   '#f9fafb',
  pendingBorder:'#d1d5db',
  white:       '#ffffff',
  bg:          '#f8fafc',
  bgAlt:       '#f1f5f9',
  surface:     '#ffffff',
  border:      '#e2e8f0',
  borderLight: '#f1f5f9',
  text:        '#0f172a',
  textMid:     '#1e293b',
  textMuted:   '#475569',
  textFaint:   '#94a3b8',
  // signature
  signBg:      '#f8fafc',
};

/* ─── Styles ─────────────────────────────────────────── */
const s = StyleSheet.create({
  /* — Page — */
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.text,
    backgroundColor: C.white,
    paddingTop: 36,
    paddingBottom: 44,
    paddingHorizontal: 0,
  },

  /* — Cover page — */
  coverPage: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.white,
    backgroundColor: C.brandDark,
    paddingBottom: 0,
  },
  coverTop: {
    backgroundColor: C.brandDark,
    paddingHorizontal: 44,
    paddingTop: 60,
    paddingBottom: 44,
    flexDirection: 'column',
  },
  coverStripe: {
    height: 4,
    backgroundColor: C.accent,
    marginBottom: 0,
  },
  coverEyebrow: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  coverTitle: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    lineHeight: 1.25,
    marginBottom: 8,
  },
  coverSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 36,
  },
  coverDivider: {
    height: 3,
    width: 48,
    backgroundColor: C.accent,
    borderRadius: 2,
    marginBottom: 32,
  },
  coverMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
    marginBottom: 0,
  },
  coverMetaItem: {
    width: '50%',
    paddingVertical: 10,
    paddingRight: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  coverMetaLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 3,
  },
  coverMetaValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
  },
  coverBottom: {
    backgroundColor: C.brand,
    paddingHorizontal: 40,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coverBottomBrand: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
  },
  coverBottomMeta: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.6)',
  },

  /* — Page header (páginas 2+) — */
  pageHeader: {
    backgroundColor: C.brandDark,
    paddingHorizontal: 32,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
    borderBottomWidth: 3,
    borderBottomColor: C.accent,
  },
  pageHeaderTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  pageHeaderRight: {
    fontSize: 7.5,
    color: 'rgba(255,255,255,0.6)',
  },

  /* — Section heading — */
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 10,
    paddingBottom: 7,
    borderBottomWidth: 2,
    borderBottomColor: C.brand,
  },
  sectionHeadNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  sectionHeadNumText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
  },
  sectionHeadText: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: C.text,
    flex: 1,
  },
  sectionHeadBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: C.brandLight,
  },
  sectionHeadBadgeText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: C.brandDark,
  },

  /* — Executive summary card — */
  summaryCard: {
    backgroundColor: C.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  summaryCardHeader: {
    backgroundColor: C.brand,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  summaryCardHeaderText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  kpiRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  kpiCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: C.border,
  },
  kpiCellLast: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  kpiNum: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1,
    marginBottom: 3,
  },
  kpiLbl: {
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: C.textMuted,
    textAlign: 'center',
  },

  /* — Progress bar — */
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.textMid,
    width: 100,
  },
  progressBg: {
    flex: 1,
    height: 7,
    backgroundColor: C.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 7,
    borderRadius: 4,
  },
  progressPct: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    width: 30,
    textAlign: 'right',
  },

  /* — Section summary table — */
  summaryTable: {
    marginBottom: 0,
  },
  summaryTableHeader: {
    flexDirection: 'row',
    backgroundColor: C.brandLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.brandMid,
  },
  summaryTableHeaderCell: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: C.brandDark,
  },
  summaryTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  summaryTableRowAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
    backgroundColor: '#fafbfc',
  },
  summaryColSection: { flex: 3, fontSize: 8, color: C.textMid },
  summaryColSection_b: { flex: 3, fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.textMid },
  summaryColNum: { flex: 1, fontSize: 8, textAlign: 'center', color: C.text },
  summaryColNum_b: { flex: 1, fontSize: 8, textAlign: 'center', fontFamily: 'Helvetica-Bold', color: C.text },
  summaryColPct: { flex: 1, fontSize: 8, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  summaryColOcc: { flex: 1, fontSize: 8, textAlign: 'center', fontFamily: 'Helvetica-Bold' },

  /* — Checklist blocks — */
  checkBlock: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    // NOTE: overflow:'hidden' intentionally removed — causes react-pdf to clip
    // content across page breaks instead of flowing to the next page.
  },
  checkBlockHeader: {
    backgroundColor: C.brandDark,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkBlockHeaderTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    flex: 1,
  },
  checkBlockHeaderBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    flexShrink: 0,
  },
  checkBlockHeaderBadgeText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
  },
  checkBlockProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: C.brandLight,
    borderBottomWidth: 1,
    borderBottomColor: C.brandMid,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  checkRowAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
    backgroundColor: '#fbfcfd',
  },
  checkIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  checkIconOk:   { backgroundColor: C.successBg, borderWidth: 1, borderColor: '#86efac' },
  checkIconNok:  { backgroundColor: C.dangerBg,  borderWidth: 1, borderColor: '#fca5a5' },
  checkIconPend: { backgroundColor: C.pendingBg, borderWidth: 1, borderColor: '#d1d5db' },
  checkIconText: { fontSize: 8, fontFamily: 'Helvetica-Bold' },
  checkItemText: { flex: 1, fontSize: 8, color: C.textMid, lineHeight: 1.4 },
  checkPill: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 8,
    flexShrink: 0,
  },
  checkPillOk:   { backgroundColor: C.successBg },
  checkPillNok:  { backgroundColor: C.dangerBg  },
  checkPillPend: { backgroundColor: C.pendingBg },
  checkPillText: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.4 },

  /* — Occurrence card — */
  occCard: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.accentMid,
    borderRadius: 8,
    overflow: 'hidden',
  },
  occStripe: {
    width: 5,
    backgroundColor: C.accent,
  },
  occCardTop: {
    flexDirection: 'row',
    backgroundColor: C.accentLight,
    borderBottomWidth: 1,
    borderBottomColor: C.accentMid,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignItems: 'center',
  },
  occNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
    flexShrink: 0,
  },
  occNumberText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
  },
  occSection: {
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    color: '#7c3309',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  occItem: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: C.text,
    flex: 1,
  },
  occBadge: {
    backgroundColor: C.accent,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 0,
  },
  occBadgeText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  occBody: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: C.surface,
  },
  occComment: {
    fontSize: 9,
    color: C.textMid,
    lineHeight: 1.6,
    marginBottom: 10,
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: C.accent,
    backgroundColor: C.accentLight,
    paddingVertical: 6,
    paddingRight: 8,
    borderRadius: 3,
  },
  occMetaRow: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
  },
  occMetaItem: { flexDirection: 'column', gap: 2 },
  occMetaLabel: {
    fontSize: 6.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: C.textFaint,
    fontFamily: 'Helvetica-Bold',
  },
  occMetaValue: {
    fontSize: 8.5,
    color: C.text,
    fontFamily: 'Helvetica-Bold',
  },
  occPhotosTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 6,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
  },
  occPhotos: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  occPhoto: { width: 88, height: 88, borderRadius: 5, objectFit: 'cover', borderWidth: 1, borderColor: C.border },

  /* — Signature block — */
  signatureArea: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 36,
  },
  signatureBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    padding: 12,
    backgroundColor: C.signBg,
    minHeight: 70,
    justifyContent: 'space-between',
  },
  signatureLabel: {
    fontSize: 7,
    color: C.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  signatureValue: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: C.textMid,
    marginBottom: 24,
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: C.textMuted,
    marginTop: 'auto' as any,
    paddingTop: 4,
  },
  signatureLineLbl: {
    fontSize: 6.5,
    color: C.textFaint,
  },

  /* — Empty state — */
  empty: {
    padding: 20, alignItems: 'center',
    backgroundColor: C.bg, borderRadius: 6,
    borderWidth: 1, borderColor: C.border, marginBottom: 12,
  },
  emptyText: { fontSize: 9, color: C.textMuted },

  /* — Body padding — */
  body: { paddingHorizontal: 32 },

  /* — Footer — */
  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.white,
  },
  footerText: { fontSize: 7, color: C.textFaint },
  footerBrand: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.brand },
});

/* ─── Helpers ─────────────────────────────────────────── */
function fmt(iso?: string | null) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}); }
  catch { return iso; }
}
function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'}); }
  catch { return iso; }
}
function periodLabel(from: string, to: string) {
  if (!from && !to) return 'Todo o período';
  if (from === to) return `${from}`;
  if (from && to) return `${from} a ${to}`;
  if (from) return `A partir de ${from}`;
  return `Até ${to}`;
}

/* ─── Shared footer ────────────────────────────────────── */
function Footer({title,generatedAt}:{title:string;generatedAt:string}) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerBrand}>Checklist Vonixx</Text>
      <Text style={s.footerText}>{title}</Text>
      <Text style={s.footerText} render={({pageNumber,totalPages})=>`Pág. ${pageNumber} / ${totalPages}`}/>
    </View>
  );
}

/* ─── MAIN ───────────────────────────────────────────── */
export default function ReportPDF({occurrences,checklistState,filters}:Props) {
  const now=new Date();
  const generatedAt=now.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  const title=filters.reportTitle||'Relatório de Inspeção';
  const period=periodLabel(filters.dateFrom,filters.dateTo);
  const shift=filters.shift||'Todos os turnos';

  /* — Filter occurrences — */
  const filteredOccs=occurrences.filter(occ=>{
    const d=occ.created_at?new Date(occ.created_at):null;
    if(filters.dateFrom&&d&&d<new Date(filters.dateFrom+'T00:00:00')) return false;
    if(filters.dateTo&&d&&d>new Date(filters.dateTo+'T23:59:59')) return false;
    if(filters.section&&occ.section!==filters.section) return false;
    return true;
  });

  /* — All known machines (hardcoded to match the app) — */
  const ALL_MACHINES = ['ROMI 01', 'ROMI 02'];

  /* — Determine which machines to render — */
  const machinesToRender = filters.machine ? [filters.machine] : ALL_MACHINES;

  /* — Helper: resolve state for a SPECIFIC machine (ignores filters.machine) — */
  function resolveStateForMachine(secId: string, idx: number, machine: string): boolean | undefined {
    const machineKey = `${machine}#${secId}-${idx}`;
    return checklistState[machineKey];
  }

  /* — Checklist data — */
  const sections = filters.section
    ? CHECKLIST_DATA.filter(s => s.title === filters.section)
    : CHECKLIST_DATA;

  // For KPIs, aggregate across selected machines
  const allItems = sections.flatMap(sec => sec.items.map((item, idx) => ({ sectionId: sec.id, idx })));
  const total   = allItems.length * machinesToRender.length;
  const ok      = machinesToRender.reduce((acc, mach) =>
    acc + allItems.filter(i => resolveStateForMachine(i.sectionId, i.idx, mach) === true).length, 0);
  const nok     = machinesToRender.reduce((acc, mach) =>
    acc + allItems.filter(i => resolveStateForMachine(i.sectionId, i.idx, mach) === false).length, 0);
  const pending = total - ok - nok;
  const pct     = total > 0 ? Math.round((ok / total) * 100) : 0;

  /* — Per-machine, per-section stats for rendering — */
  const machineGroups = machinesToRender.map(mach => {
    const stats = sections.map(sec => {
      const items = sec.items.map((item, idx) => ({ item, idx }));
      const secOk   = items.filter(i => resolveStateForMachine(sec.id, i.idx, mach) === true).length;
      const secNok  = items.filter(i => resolveStateForMachine(sec.id, i.idx, mach) === false).length;
      const secPend = items.filter(i => resolveStateForMachine(sec.id, i.idx, mach) === undefined).length;
      const secTotal = items.length;
      const secPct  = secTotal > 0 ? Math.round((secOk / secTotal) * 100) : 0;
      const secOccs = filteredOccs.filter(o => o.section === sec.title).length;
      return { sec, items, secOk, secNok, secPend, secTotal, secPct, secOccs };
    });
    const machOk  = stats.reduce((a, s) => a + s.secOk, 0);
    const machPct = allItems.length > 0 ? Math.round((machOk / allItems.length) * 100) : 0;
    return { mach, stats, machOk, machPct };
  });

  /* — Per-section stats for summary table (aggregated or single machine) — */
  const sectionStats = sections.map(sec => {
    const items = sec.items.map((item, idx) => ({ item, idx }));
    const secOk   = machinesToRender.reduce((a, m) => a + items.filter(i => resolveStateForMachine(sec.id, i.idx, m) === true).length, 0);
    const secNok  = machinesToRender.reduce((a, m) => a + items.filter(i => resolveStateForMachine(sec.id, i.idx, m) === false).length, 0);
    const secTotal = items.length * machinesToRender.length;
    const secPct  = secTotal > 0 ? Math.round((secOk / secTotal) * 100) : 0;
    const secOccs = filteredOccs.filter(o => o.section === sec.title).length;
    return { sec, secOk, secNok, secTotal, secPct, secOccs };
  });

  const statusColor=(pct:number)=>pct>=80?C.success:pct>=50?C.brand:C.accent;

  return (
    <Document title={title} author="Checklist Vonixx" subject="Relatório de Inspeção Industrial" creator="Checklist Vonixx">

      {/* =============================== COVER PAGE ============================== */}
      <Page size="A4" style={s.coverPage}>
        <View style={s.coverTop}>
          {/* Brand mark */}
          <View>
            <Text style={s.coverEyebrow}>Checklist Vonixx • Relatório Oficial</Text>
            <View style={s.coverDivider}/>
            <Text style={s.coverTitle}>{title}</Text>
            <Text style={s.coverSubtitle}>Documento de inspeção industrial gerado automaticamente pelo sistema Checklist Vonixx.</Text>
          </View>

          {/* Meta grid */}
          <View style={s.coverMetaGrid}>
            {[
              {label:'Período',value:period},
              {label:'Turno',value:shift},
              {label:'Máquina',value:filters.machine||'Todas as máquinas'},
              {label:'Seção',value:filters.section||'Todas as seções'},
              {label:'Gerado por',value:filters.generatedBy||'Sistema'},
              {label:'Data de geração',value:generatedAt},
              {label:'Ocorrências',value:`${filteredOccs.length} registradas`},
            ].map(m=>(
              <View key={m.label} style={s.coverMetaItem}>
                <Text style={s.coverMetaLabel}>{m.label}</Text>
                <Text style={s.coverMetaValue}>{m.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Colored bottom bar */}
        <View style={{ backgroundColor: C.brand }}>
          <View style={s.coverStripe} />
          <View style={s.coverBottom}>
            <Text style={s.coverBottomBrand}>CHECKLIST VONIXX</Text>
            <Text style={s.coverBottomMeta}>Documento confidencial • Uso interno</Text>
          </View>
        </View>
      </Page>

      {/* ============================== MAIN PAGES ============================== */}
      <Page size="A4" style={s.page}>
        {/* Running header */}
        <View style={s.pageHeader} fixed>
          <Text style={s.pageHeaderTitle}>{title}</Text>
          <Text style={s.pageHeaderRight}>{period} • {shift}</Text>
        </View>

        <View style={s.body}>

          {/* ===== 1. Executive Summary ===== */}
          <View style={s.sectionHead}>
            <View style={s.sectionHeadNum}><Text style={s.sectionHeadNumText}>1</Text></View>
            <Text style={s.sectionHeadText}>Resumo Executivo</Text>
          </View>

          {/* KPI row */}
          <View style={s.summaryCard}>
            <View style={s.summaryCardHeader}>
              <Text style={s.summaryCardHeaderText}>Indicadores-chave do período</Text>
            </View>
            <View style={s.kpiRow}>
              {[
                {value:`${pct}%`,label:'Conformidade geral',color:statusColor(pct)},
                {value:String(ok),label:'Itens conformes',color:C.success},
                {value:String(nok),label:'Não conformes',color:C.danger},
                {value:String(pending),label:'Pendentes',color:C.pending},
                {value:String(filteredOccs.length),label:'Ocorrências',color:C.accent,last:true},
              ].map((k,i)=>(
                <View key={i} style={k.last?s.kpiCellLast:s.kpiCell}>
                  <Text style={{...s.kpiNum,color:k.color}}>{k.value}</Text>
                  <Text style={s.kpiLbl}>{k.label}</Text>
                </View>
              ))}
            </View>
            {/* Global progress bar */}
            <View style={s.progressRow}>
              <Text style={s.progressLabel}>Progresso geral</Text>
              <View style={s.progressBg}>
                <View style={{...s.progressFill,backgroundColor:statusColor(pct),width:`${pct}%` as any}}/>
              </View>
              <Text style={{...s.progressPct,color:statusColor(pct)}}>{pct}%</Text>
            </View>
          </View>

          {/* ===== 2. Section Summary Table ===== */}
          <View style={s.sectionHead}>
            <View style={s.sectionHeadNum}><Text style={s.sectionHeadNumText}>2</Text></View>
            <Text style={s.sectionHeadText}>Sumário por Seção</Text>
            <View style={s.sectionHeadBadge}>
              <Text style={s.sectionHeadBadgeText}>{sections.length} seções</Text>
            </View>
          </View>

          <View style={{...s.summaryCard,...s.summaryTable}}>
            <View style={s.summaryTableHeader}>
              <Text style={{...s.summaryTableHeaderCell,flex:3}}>Seção</Text>
              <Text style={{...s.summaryTableHeaderCell,flex:1,textAlign:'center'}}>OK</Text>
              <Text style={{...s.summaryTableHeaderCell,flex:1,textAlign:'center'}}>Não OK</Text>
              <Text style={{...s.summaryTableHeaderCell,flex:1,textAlign:'right'}}>%</Text>
              <Text style={{...s.summaryTableHeaderCell,flex:1,textAlign:'center'}}>Ocorr.</Text>
            </View>
            {sectionStats.map(({sec,secOk,secNok,secTotal,secPct,secOccs},idx)=>(
              <View key={sec.id} style={idx%2===0?s.summaryTableRow:s.summaryTableRowAlt}>
                <Text style={s.summaryColSection}>{sec.title.replace(/^\d+\.\s*/,'')}</Text>
                <Text style={{...s.summaryColNum,color:C.success}}>{secOk}</Text>
                <Text style={{...s.summaryColNum,color:secNok>0?C.danger:C.textFaint}}>{secNok}</Text>
                <Text style={{...s.summaryColPct,color:statusColor(secPct)}}>{secPct}%</Text>
                <Text style={{...s.summaryColOcc,color:secOccs>0?C.accent:C.textFaint}}>{secOccs>0?secOccs:'—'}</Text>
              </View>
            ))}
            {/* Totals row */}
            <View style={{...s.summaryTableRow,backgroundColor:C.brandLight,borderTopWidth:2,borderTopColor:C.brandMid}}>
              <Text style={{...s.summaryColSection_b,color:C.brandDark}}>TOTAL</Text>
              <Text style={{...s.summaryColNum_b,color:C.success}}>{ok}</Text>
              <Text style={{...s.summaryColNum_b,color:nok>0?C.danger:C.textFaint}}>{nok}</Text>
              <Text style={{...s.summaryColPct,color:statusColor(pct)}}>{pct}%</Text>
              <Text style={{...s.summaryColOcc,color:filteredOccs.length>0?C.accent:C.textFaint}}>{filteredOccs.length>0?filteredOccs.length:'—'}</Text>
            </View>
          </View>

          {/* ===== 3. Checklist Detail ===== */}
          <View style={s.sectionHead}>
            <View style={s.sectionHeadNum}><Text style={s.sectionHeadNumText}>3</Text></View>
            <Text style={s.sectionHeadText}>Detalhamento do Checklist</Text>
            <View style={s.sectionHeadBadge}>
              <Text style={s.sectionHeadBadgeText}>{total} itens</Text>
            </View>
            {filters.machine && (
              <View style={{...s.sectionHeadBadge, backgroundColor: C.brandDark, marginLeft: 6}}>
                <Text style={{...s.sectionHeadBadgeText, color: C.white}}>{filters.machine}</Text>
              </View>
            )}
          </View>

          {machineGroups.map(({ mach, stats, machOk, machPct }) => (
            <View key={mach}>
              {/* Machine group header */}
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: C.brandDark, borderRadius: 6,
                paddingHorizontal: 12, paddingVertical: 8,
                marginTop: 10, marginBottom: 6,
              }} wrap={false}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.white }}>
                    {mach}
                  </Text>
                </View>
                <View style={{ backgroundColor: statusColor(machPct), borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.white }}>
                    {machOk}/{allItems.length} itens • {machPct}%
                  </Text>
                </View>
              </View>

              {stats.map(({ sec, items, secOk, secTotal, secPct }) => (
                <View key={`${mach}-${sec.id}`} style={s.checkBlock}>
                  {/* Header + progress bar — keep together, never orphan */}
                  <View wrap={false}>
                    <View style={s.checkBlockHeader}>
                      <Text style={s.checkBlockHeaderTitle}>{sec.title}</Text>
                      <View style={s.checkBlockHeaderBadge}>
                        <Text style={s.checkBlockHeaderBadgeText}>{secOk}/{secTotal} • {secPct}%</Text>
                      </View>
                    </View>
                    {/* mini progress */}
                    <View style={s.checkBlockProgressRow}>
                      <View style={{ ...s.progressBg, flex: 1 }}>
                        <View style={{ ...s.progressFill, backgroundColor: statusColor(secPct), width: `${secPct}%` as any }} />
                      </View>
                      <Text style={{ ...s.progressPct, color: statusColor(secPct) }}>{secPct}%</Text>
                    </View>
                  </View>
                  {/* Rows — each row stays intact, page breaks happen between rows */}
                  {items.map(({ item, idx }, rowIdx) => {
                    const st = resolveStateForMachine(sec.id, idx, mach);
                    const isOk = st === true; const isNok = st === false;
                    return (
                      <View key={`${mach}-${sec.id}-${idx}`} style={rowIdx % 2 === 0 ? s.checkRow : s.checkRowAlt} wrap={false}>
                        <View style={{ ...s.checkIcon, ...(isOk ? s.checkIconOk : isNok ? s.checkIconNok : s.checkIconPend) }}>
                          <Text style={{ ...s.checkIconText, color: isOk ? C.success : isNok ? C.danger : C.pending }}>
                            {isOk ? '✓' : isNok ? '✗' : '–'}
                          </Text>
                        </View>
                        <Text style={s.checkItemText}>{item}</Text>
                        <View style={{ ...s.checkPill, ...(isOk ? s.checkPillOk : isNok ? s.checkPillNok : s.checkPillPend) }}>
                          <Text style={{ ...s.checkPillText, color: isOk ? C.success : isNok ? C.danger : C.pending }}>
                            {isOk ? 'Conforme' : isNok ? 'Não conforme' : 'Pendente'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          ))}

          {/* ===== 4. Occurrences ===== */}
          <View style={s.sectionHead}>
            <View style={s.sectionHeadNum}><Text style={s.sectionHeadNumText}>4</Text></View>
            <Text style={s.sectionHeadText}>Ocorrências Registradas</Text>
            <View style={{...s.sectionHeadBadge,backgroundColor:filteredOccs.length>0?C.accentLight:C.bg}}>
              <Text style={{...s.sectionHeadBadgeText,color:filteredOccs.length>0?'#92400e':C.textMuted}}>
                {filteredOccs.length} registro(s)
              </Text>
            </View>
          </View>

          {filteredOccs.length===0?(
            <View style={s.empty}>
              <Text style={{...s.emptyText,fontFamily:'Helvetica-Bold',marginBottom:2}}>Nenhuma ocorrência</Text>
              <Text style={s.emptyText}>Operação dentro dos parâmetros normais para o período selecionado.</Text>
            </View>
          ):(
            filteredOccs.map((occ,i)=>(
              <View key={occ.id} style={s.occCard} wrap={false}>
                <View style={s.occCardTop}>
                  <View style={s.occNumber}><Text style={s.occNumberText}>{i+1}</Text></View>
                  <View style={{flex:1}}>
                    <Text style={s.occSection}>{occ.section}</Text>
                    <Text style={s.occItem}>{occ.item}</Text>
                  </View>
                  <View style={s.occBadge}>
                    <Text style={s.occBadgeText}>Ocorrência</Text>
                  </View>
                </View>
                <View style={s.occBody}>
                  {occ.comment&&(
                    <Text style={s.occComment}>{occ.comment}</Text>
                  )}
                  <View style={s.occMetaRow}>
                    <View style={s.occMetaItem}>
                      <Text style={s.occMetaLabel}>Operador</Text>
                      <Text style={s.occMetaValue}>{(()=>{
                        // Format: "Nome (TURNO) | Máquina: ROMI 01 - Auth: email"
                        const raw = occ.reporter || '';
                        const withoutAuth = raw.split(' - Auth:')[0].trim();
                        return withoutAuth || '—';
                      })()}</Text>
                    </View>
                    <View style={s.occMetaItem}>
                      <Text style={s.occMetaLabel}>Máquina</Text>
                      <Text style={s.occMetaValue}>{(()=>{
                        const m = occ.reporter?.match(/Máquina:\s*([^|\-]+)/);
                        return m ? m[1].trim() : '—';
                      })()}</Text>
                    </View>
                    <View style={s.occMetaItem}>
                      <Text style={s.occMetaLabel}>Horário</Text>
                      <Text style={s.occMetaValue}>{occ.time||'—'}</Text>
                    </View>
                    {occ.created_at&&(
                      <View style={s.occMetaItem}>
                        <Text style={s.occMetaLabel}>Data</Text>
                        <Text style={s.occMetaValue}>{fmtDate(occ.created_at)}</Text>
                      </View>
                    )}
                    {occ.photos.length>0&&(
                      <View style={s.occMetaItem}>
                        <Text style={s.occMetaLabel}>Fotos</Text>
                        <Text style={s.occMetaValue}>{occ.photos.length} foto(s)</Text>
                      </View>
                    )}
                  </View>
                  {occ.photos.length>0&&(
                    <>
                      <Text style={s.occPhotosTitle}>Evidências fotográficas</Text>
                      <View style={s.occPhotos}>
                        {occ.photos.slice(0,4).map((p,j)=>(
                          <Image key={j} src={p} style={s.occPhoto}/>
                        ))}
                      </View>
                    </>
                  )}
                </View>
              </View>
            ))
          )}

          {/* ===== 5. Signature ===== */}
          <View style={{...s.sectionHead,marginTop:28}}>
            <View style={s.sectionHeadNum}><Text style={s.sectionHeadNumText}>5</Text></View>
            <Text style={s.sectionHeadText}>Assinatura e Validação</Text>
          </View>
          <View style={s.signatureArea}>
            <View style={s.signatureBox}>
              <View>
                <Text style={s.signatureLabel}>Supervisor Responsável</Text>
                <Text style={s.signatureValue}>{filters.generatedBy && !filters.generatedBy.includes('@') ? filters.generatedBy : ' '}</Text>
              </View>
              <View style={s.signatureLine}>
                <Text style={s.signatureLineLbl}>Assinatura</Text>
              </View>
            </View>
            <View style={s.signatureBox}>
              <View>
                <Text style={s.signatureLabel}>Data de Geração</Text>
                <Text style={s.signatureValue}>{generatedAt}</Text>
              </View>
              <View style={s.signatureLine}>
                <Text style={s.signatureLineLbl}>Data e Hora</Text>
              </View>
            </View>
            <View style={s.signatureBox}>
              <View>
                <Text style={s.signatureLabel}>Visto / Carimbo</Text>
                <Text style={s.signatureValue}> </Text>
              </View>
              <View style={s.signatureLine}>
                <Text style={s.signatureLineLbl}>Validação</Text>
              </View>
            </View>
          </View>

        </View>{/* /body */}

        <Footer title={title} generatedAt={generatedAt}/>
      </Page>
    </Document>
  );
}
