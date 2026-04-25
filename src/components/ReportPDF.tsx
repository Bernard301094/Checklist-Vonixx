/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer';
import { OccurrenceData } from '../types';
import { CHECKLIST_DATA } from '../constants';

// ── Tipos ────────────────────────────────────────────────────────────────────
export interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  shift: string;       // '' = todos
  section: string;     // '' = todas
  reportTitle: string;
  generatedBy: string;
}

interface ReportPDFProps {
  occurrences: OccurrenceData[];
  checklistState: Record<string, boolean>;
  filters: ReportFilters;
}

// ── Estilos ──────────────────────────────────────────────────────────────────
const BRAND_COLOR = '#01696f';
const DANGER_COLOR = '#dc2626';
const WARN_COLOR = '#d97706';
const TEXT_DARK = '#1a1a2e';
const TEXT_MUTED = '#6b7280';
const SURFACE = '#f8fafc';
const BORDER = '#e2e8f0';
const WHITE = '#ffffff';
const SUCCESS_BG = '#ecfdf5';
const SUCCESS_TEXT = '#065f46';
const DANGER_BG = '#fef2f2';
const WARN_BG = '#fffbeb';
const WARN_TEXT = '#92400e';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: TEXT_DARK,
    backgroundColor: WHITE,
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
  },
  // ── Header ──
  header: {
    backgroundColor: BRAND_COLOR,
    paddingHorizontal: 32,
    paddingTop: 28,
    paddingBottom: 24,
    marginBottom: 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  headerBadgeText: {
    fontSize: 8,
    color: WHITE,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headerMeta: {
    flexDirection: 'row',
    gap: 24,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  headerMetaItem: {
    flexDirection: 'column',
    gap: 2,
  },
  headerMetaLabel: {
    fontSize: 7,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontFamily: 'Helvetica-Bold',
  },
  headerMetaValue: {
    fontSize: 9,
    color: WHITE,
    fontFamily: 'Helvetica-Bold',
  },
  // ── KPI Bar ──
  kpiBar: {
    flexDirection: 'row',
    backgroundColor: SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingHorizontal: 32,
    paddingVertical: 14,
    gap: 0,
  },
  kpiItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  kpiItemLast: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  kpiValue: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_COLOR,
    lineHeight: 1,
  },
  kpiValueDanger: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: DANGER_COLOR,
    lineHeight: 1,
  },
  kpiValueWarn: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: WARN_COLOR,
    lineHeight: 1,
  },
  kpiLabel: {
    fontSize: 7,
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 3,
    textAlign: 'center',
  },
  // ── Body ──
  body: {
    paddingHorizontal: 32,
    paddingTop: 20,
  },
  // ── Section Title ──
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: TEXT_DARK,
    marginBottom: 10,
    marginTop: 18,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: BRAND_COLOR,
  },
  // ── Checklist Table ──
  checklistSection: {
    marginBottom: 12,
  },
  checklistSectionHeader: {
    backgroundColor: BRAND_COLOR,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 4,
  },
  checklistSectionHeaderText: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  checklistRowAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fafafa',
  },
  checklistDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checklistDotOk: {
    backgroundColor: SUCCESS_BG,
    borderWidth: 1,
    borderColor: '#6ee7b7',
  },
  checklistDotNok: {
    backgroundColor: DANGER_BG,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  checklistDotPending: {
    backgroundColor: WARN_BG,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  checklistCheck: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: SUCCESS_TEXT,
  },
  checklistX: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: DANGER_COLOR,
  },
  checklistDash: {
    fontSize: 8,
    color: WARN_TEXT,
  },
  checklistItemText: {
    flex: 1,
    fontSize: 8,
    color: TEXT_DARK,
    lineHeight: 1.4,
  },
  checklistStatusPill: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 6,
    flexShrink: 0,
  },
  checklistStatusOk: {
    backgroundColor: SUCCESS_BG,
  },
  checklistStatusNok: {
    backgroundColor: DANGER_BG,
  },
  checklistStatusPending: {
    backgroundColor: WARN_BG,
  },
  checklistStatusTextOk: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: SUCCESS_TEXT,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  checklistStatusTextNok: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: DANGER_COLOR,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  checklistStatusTextPending: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: WARN_TEXT,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  // ── Summary Bars ──
  progressContainer: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: BRAND_COLOR,
  },
  progressText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_COLOR,
    width: 30,
    textAlign: 'right',
  },
  // ── Occurrences ──
  occurrenceCard: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    marginBottom: 10,
    overflow: 'hidden',
  },
  occurrenceHeader: {
    backgroundColor: '#fff7ed',
    borderBottomWidth: 1,
    borderBottomColor: '#fed7aa',
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  occurrenceHeaderLeft: {
    flex: 1,
  },
  occurrenceSection: {
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: WARN_TEXT,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  occurrenceItem: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: TEXT_DARK,
  },
  occurrenceMetaBadge: {
    backgroundColor: '#fed7aa',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  occurrenceMetaBadgeText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: WARN_TEXT,
  },
  occurrenceBody: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  occurrenceComment: {
    fontSize: 8.5,
    color: TEXT_DARK,
    lineHeight: 1.5,
    marginBottom: 8,
  },
  occurrenceMeta: {
    flexDirection: 'row',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 6,
    marginTop: 4,
  },
  occurrenceMetaItem: {
    flexDirection: 'column',
    gap: 1,
  },
  occurrenceMetaLabel: {
    fontSize: 6.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: TEXT_MUTED,
    fontFamily: 'Helvetica-Bold',
  },
  occurrenceMetaValue: {
    fontSize: 8,
    color: TEXT_DARK,
    fontFamily: 'Helvetica-Bold',
  },
  occurrencePhotosTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 6,
  },
  occurrencePhotos: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  occurrencePhoto: {
    width: 80,
    height: 80,
    borderRadius: 4,
    objectFit: 'cover',
    borderWidth: 1,
    borderColor: BORDER,
  },
  // ── Footer ──
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: WHITE,
  },
  footerText: {
    fontSize: 7,
    color: TEXT_MUTED,
  },
  footerBrand: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_COLOR,
  },
  // ── Empty ──
  emptyBox: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  emptyText: {
    fontSize: 9,
    color: TEXT_MUTED,
  },
  // ── 2-col grid ──
  grid2: {
    flexDirection: 'row',
    gap: 10,
  },
  grid2Col: {
    flex: 1,
  },
});

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDateBR(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatDateRange(from: string, to: string) {
  if (!from && !to) return 'Todo o período';
  if (from && to) return `${from} até ${to}`;
  if (from) return `A partir de ${from}`;
  return `Até ${to}`;
}

// ── Componente Principal ──────────────────────────────────────────────────────
export default function ReportPDF({ occurrences, checklistState, filters }: ReportPDFProps) {
  const now = new Date();
  const generatedAt = now.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  // ── Filtrar ocorrências ──
  const filteredOccurrences = occurrences.filter(occ => {
    const occDate = occ.created_at ? new Date(occ.created_at) : null;
    if (filters.dateFrom && occDate) {
      const from = new Date(filters.dateFrom + 'T00:00:00');
      if (occDate < from) return false;
    }
    if (filters.dateTo && occDate) {
      const to = new Date(filters.dateTo + 'T23:59:59');
      if (occDate > to) return false;
    }
    if (filters.section && occ.section !== filters.section) return false;
    return true;
  });

  // ── Calcular KPIs checklist ──
  const checklistSource = CHECKLIST_DATA;
  const filteredSections = filters.section
    ? checklistSource.filter(s => s.title === filters.section)
    : checklistSource;

  const allItems: Array<{ section: string; item: string; key: string }> = [];
  filteredSections.forEach(section => {
    section.items.forEach(item => {
      const key = `${section.id}__${item}`;
      allItems.push({ section: section.title, item, key });
    });
  });

  const checkedCount = allItems.filter(i => checklistState[i.key] === true).length;
  const notCheckedCount = allItems.filter(i => checklistState[i.key] === false).length;
  const pendingCount = allItems.filter(i => checklistState[i.key] === undefined).length;
  const totalCount = allItems.length;
  const completionPct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  // ── Agrupar itens por seção ──
  const sectionMap: Record<string, Array<{ item: string; key: string }>> = {};
  allItems.forEach(({ section, item, key }) => {
    if (!sectionMap[section]) sectionMap[section] = [];
    sectionMap[section].push({ item, key });
  });

  const reportTitle = filters.reportTitle || 'Relatório de Inspeção';
  const shiftLabel = filters.shift || 'Todos os turnos';
  const periodLabel = formatDateRange(filters.dateFrom, filters.dateTo);

  return (
    <Document
      title={reportTitle}
      author="Checklist Vonixx"
      subject="Relatório de Inspeção Industrial"
      creator="Checklist Vonixx App"
    >
      <Page size="A4" style={styles.page}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>{reportTitle}</Text>
              <Text style={styles.headerSubtitle}>Checklist Vonixx — Relatório de Inspeção Industrial</Text>
            </View>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>Gerado em {generatedAt}</Text>
            </View>
          </View>
          <View style={styles.headerMeta}>
            <View style={styles.headerMetaItem}>
              <Text style={styles.headerMetaLabel}>Período</Text>
              <Text style={styles.headerMetaValue}>{periodLabel}</Text>
            </View>
            <View style={styles.headerMetaItem}>
              <Text style={styles.headerMetaLabel}>Turno</Text>
              <Text style={styles.headerMetaValue}>{shiftLabel}</Text>
            </View>
            {filters.generatedBy && (
              <View style={styles.headerMetaItem}>
                <Text style={styles.headerMetaLabel}>Gerado por</Text>
                <Text style={styles.headerMetaValue}>{filters.generatedBy}</Text>
              </View>
            )}
            <View style={styles.headerMetaItem}>
              <Text style={styles.headerMetaLabel}>Seção</Text>
              <Text style={styles.headerMetaValue}>{filters.section || 'Todas'}</Text>
            </View>
          </View>
        </View>

        {/* ── KPI Bar ── */}
        <View style={styles.kpiBar}>
          <View style={styles.kpiItem}>
            <Text style={styles.kpiValue}>{completionPct}%</Text>
            <Text style={styles.kpiLabel}>Conclusão</Text>
          </View>
          <View style={styles.kpiItem}>
            <Text style={styles.kpiValue}>{checkedCount}</Text>
            <Text style={styles.kpiLabel}>Itens OK</Text>
          </View>
          <View style={styles.kpiItem}>
            <Text style={[styles.kpiValueDanger]}>{notCheckedCount}</Text>
            <Text style={styles.kpiLabel}>Não OK</Text>
          </View>
          <View style={styles.kpiItem}>
            <Text style={styles.kpiValueWarn}>{pendingCount}</Text>
            <Text style={styles.kpiLabel}>Pendentes</Text>
          </View>
          <View style={styles.kpiItemLast}>
            <Text style={styles.kpiValue}>{filteredOccurrences.length}</Text>
            <Text style={styles.kpiLabel}>Ocorrências</Text>
          </View>
        </View>

        {/* ── Body ── */}
        <View style={styles.body}>

          {/* ── Barra de progresso global ── */}
          <Text style={styles.sectionTitle}>Resumo do Checklist</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${completionPct}%` as any }]} />
            </View>
            <Text style={styles.progressText}>{completionPct}%</Text>
          </View>

          {/* ── Tabela do Checklist ── */}
          {Object.entries(sectionMap).map(([sectionTitle, items]) => {
            const sChecked = items.filter(i => checklistState[i.key] === true).length;
            const sTotal = items.length;
            const sPct = sTotal > 0 ? Math.round((sChecked / sTotal) * 100) : 0;
            return (
              <View key={sectionTitle} style={styles.checklistSection} wrap={false}>
                <View style={styles.checklistSectionHeader}>
                  <Text style={styles.checklistSectionHeaderText}>
                    {sectionTitle}  —  {sChecked}/{sTotal} itens OK ({sPct}%)
                  </Text>
                </View>
                {items.map((it, idx) => {
                  const status = checklistState[it.key];
                  const isOk = status === true;
                  const isNok = status === false;
                  const rowStyle = idx % 2 === 0 ? styles.checklistRow : styles.checklistRowAlt;
                  return (
                    <View key={it.key} style={rowStyle}>
                      <View style={[
                        styles.checklistDot,
                        isOk ? styles.checklistDotOk : isNok ? styles.checklistDotNok : styles.checklistDotPending,
                      ]}>
                        {isOk && <Text style={styles.checklistCheck}>✓</Text>}
                        {isNok && <Text style={styles.checklistX}>✗</Text>}
                        {!isOk && !isNok && <Text style={styles.checklistDash}>–</Text>}
                      </View>
                      <Text style={styles.checklistItemText}>{it.item}</Text>
                      <View style={[
                        styles.checklistStatusPill,
                        isOk ? styles.checklistStatusOk : isNok ? styles.checklistStatusNok : styles.checklistStatusPending,
                      ]}>
                        <Text style={isOk ? styles.checklistStatusTextOk : isNok ? styles.checklistStatusTextNok : styles.checklistStatusTextPending}>
                          {isOk ? 'Conforme' : isNok ? 'Não conforme' : 'Pendente'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })}

          {/* ── Ocorrências ── */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Ocorrências Registradas</Text>
          {filteredOccurrences.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Nenhuma ocorrência registrada para os filtros selecionados.</Text>
            </View>
          ) : (
            filteredOccurrences.map(occ => (
              <View key={occ.id} style={styles.occurrenceCard} wrap={false}>
                <View style={styles.occurrenceHeader}>
                  <View style={styles.occurrenceHeaderLeft}>
                    <Text style={styles.occurrenceSection}>{occ.section}</Text>
                    <Text style={styles.occurrenceItem}>{occ.item}</Text>
                  </View>
                  <View style={styles.occurrenceMetaBadge}>
                    <Text style={styles.occurrenceMetaBadgeText}>Ocorrência</Text>
                  </View>
                </View>
                <View style={styles.occurrenceBody}>
                  {occ.comment && (
                    <Text style={styles.occurrenceComment}>{occ.comment}</Text>
                  )}
                  <View style={styles.occurrenceMeta}>
                    <View style={styles.occurrenceMetaItem}>
                      <Text style={styles.occurrenceMetaLabel}>Operador</Text>
                      <Text style={styles.occurrenceMetaValue}>{occ.reporter || '—'}</Text>
                    </View>
                    <View style={styles.occurrenceMetaItem}>
                      <Text style={styles.occurrenceMetaLabel}>Horário</Text>
                      <Text style={styles.occurrenceMetaValue}>{occ.time || '—'}</Text>
                    </View>
                    {occ.created_at && (
                      <View style={styles.occurrenceMetaItem}>
                        <Text style={styles.occurrenceMetaLabel}>Data/Hora</Text>
                        <Text style={styles.occurrenceMetaValue}>{formatDateBR(occ.created_at)}</Text>
                      </View>
                    )}
                  </View>
                  {occ.photos && occ.photos.length > 0 && (
                    <>
                      <Text style={styles.occurrencePhotosTitle}>
                        Evidências fotográficas ({occ.photos.length})
                      </Text>
                      <View style={styles.occurrencePhotos}>
                        {occ.photos.slice(0, 4).map((photo, idx) => (
                          <Image
                            key={idx}
                            src={photo}
                            style={styles.occurrencePhoto}
                          />
                        ))}
                      </View>
                    </>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {reportTitle} — {generatedAt}
          </Text>
          <Text style={styles.footerBrand}>Checklist Vonixx</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
