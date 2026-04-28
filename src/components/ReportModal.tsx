/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  X, FileText, Download, Calendar, Filter, Loader2, Share2,
  CheckCircle2, AlertTriangle, Clock, BarChart3, Factory,
} from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { OccurrenceData } from '../types';
import { CHECKLIST_DATA } from '../constants';
import ReportPDF, { ReportFilters } from './ReportPDF';

interface ReportModalProps {
  onClose: () => void;
  occurrences: OccurrenceData[];
  checklistState: Record<string, boolean>;
  currentUserEmail?: string;
  defaultMachine?: string;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

const SHIFTS   = ['', 'TURNO A', 'TURNO B', 'TURNO C', 'TURNO D'];
const MACHINES = ['', 'ROMI 01', 'ROMI 02'];
const ALL_MACHINES_LIST = ['ROMI 01', 'ROMI 02'];

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Resolve state for a specific machine using the correct key format */
function resolveStateForMachine(
  checklistState: Record<string, boolean>,
  secId: string,
  idx: number,
  machine: string
): boolean | undefined {
  return checklistState[`${machine}#${secId}-${idx}`];
}

export default function ReportModal({
  onClose,
  occurrences,
  checklistState,
  defaultMachine = '',
}: ReportModalProps) {
  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: today(),
    dateTo:   today(),
    shift:    '',
    machine:  defaultMachine,
    section:  '',
    reportTitle: 'Relatório de Inspeção Vonixx',
    generatedBy: '',
  });
  const [generating, setGenerating] = useState(false);
  const [error,      setError]      = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const sectionOptions = CHECKLIST_DATA.map(s => s.title);

  /* ── Live preview stats (react to filter changes) ── */
  const preview = useMemo(() => {
    const machinesToCount = filters.machine ? [filters.machine] : ALL_MACHINES_LIST;
    const filteredSections = filters.section
      ? CHECKLIST_DATA.filter(s => s.title === filters.section)
      : CHECKLIST_DATA;

    let ok = 0, nok = 0, total = 0;
    filteredSections.forEach(sec => {
      sec.items.forEach((_, idx) => {
        machinesToCount.forEach(mach => {
          total++;
          const st = resolveStateForMachine(checklistState, sec.id, idx, mach);
          if (st === true)  ok++;
          if (st === false) nok++;
        });
      });
    });
    const pending = total - ok - nok;
    const pct = total > 0 ? Math.round((ok / total) * 100) : 0;

    const filteredOccs = occurrences.filter(occ => {
      const d = occ.created_at ? new Date(occ.created_at) : null;
      if (filters.dateFrom && d && d < new Date(filters.dateFrom + 'T00:00:00')) return false;
      if (filters.dateTo   && d && d > new Date(filters.dateTo   + 'T23:59:59')) return false;
      if (filters.section  && occ.section !== filters.section) return false;
      return true;
    });

    return { ok, nok, pending, total, pct, occCount: filteredOccs.length };
  }, [filters, checklistState, occurrences]);

  const handleDownload = useCallback(async () => {
    setGenerating(true);
    setError('');
    setSuccessMsg('');
    try {
      const blob = await pdf(
        <ReportPDF
          occurrences={occurrences}
          checklistState={checklistState}
          filters={filters}
        />
      ).toBlob();

      const dateStr  = new Date().toISOString().slice(0, 10);
      const fileName = `relatorio-vonixx-${dateStr}.pdf`;

      if (Capacitor.isNativePlatform()) {
        const base64Data  = await blobToBase64(blob);
        const writeResult = await Filesystem.writeFile({
          path: fileName, data: base64Data, directory: Directory.Cache,
        });
        await Share.share({
          title: filters.reportTitle || 'Relatório Vonixx',
          text:  'Relatório de inspeção gerado pelo Checklist Vonixx.',
          url:   writeResult.uri,
          dialogTitle: 'Salvar ou compartilhar PDF',
        });
        setSuccessMsg('PDF gerado! Use o menu do sistema para salvar ou compartilhar.');
      } else {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href = url; a.download = fileName;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        setSuccessMsg('Download iniciado com sucesso!');
      }
    } catch (err: any) {
      setError('Erro ao gerar o PDF: ' + (err?.message || 'Tente novamente.'));
    } finally {
      setGenerating(false);
    }
  }, [occurrences, checklistState, filters]);

  const setFilter = (key: keyof ReportFilters, value: string) =>
    setFilters(prev => ({ ...prev, [key]: value }));

  const pctColor = preview.pct >= 80 ? 'var(--success)' : preview.pct >= 50 ? 'var(--primary)' : 'var(--warning)';

  /* ── Chip button helper ── */
  const Chip = ({ label, value, active, onClick }: {
    label: string; value: string; active: boolean; onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '7px 13px',
        borderRadius: 'var(--r-full)',
        fontWeight: 600,
        fontSize: 'var(--text-xs)',
        border: '1px solid',
        cursor: 'pointer',
        transition: 'all 0.15s',
        borderColor: active ? 'var(--primary)' : 'var(--border)',
        background:  active ? 'var(--primary)' : 'var(--surface-2)',
        color:       active ? '#fff' : 'var(--text-muted)',
        minHeight: 34,
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      <style>{`
        .rm-overlay {
          position: fixed; inset: 0;
          background: rgba(2,6,23,0.90);
          backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center;
          z-index: 3000; padding: var(--s4);
          animation: rmFadeIn 0.15s ease;
        }
        .rm-container {
          width: 100%; max-width: 540px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-2xl);
          box-shadow: 0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset;
          overflow: hidden;
          animation: rmSlideUp 0.22s cubic-bezier(.22,.68,0,1.2);
          max-height: 94dvh;
          display: flex; flex-direction: column;
        }
        @media (max-width: 480px) {
          .rm-overlay { padding: 0; align-items: flex-end; }
          .rm-container {
            max-width: 100%;
            border-bottom-left-radius: 0; border-bottom-right-radius: 0;
            max-height: 96dvh;
          }
        }
        .rm-header {
          padding: 18px 22px 14px;
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
          background: linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%);
        }
        .rm-stats-bar {
          padding: 14px 22px;
          background: var(--surface-2);
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .rm-stats-grid {
          display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;
        }
        @media (max-width: 400px) {
          .rm-stats-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .rm-stat-card {
          padding: 10px 6px; text-align: center;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          transition: transform 0.15s;
        }
        .rm-stat-card:hover { transform: translateY(-1px); }
        .rm-progress-bar {
          height: 4px; border-radius: 4px;
          background: var(--surface-3);
          margin-top: 10px; overflow: hidden;
        }
        .rm-body {
          padding: 18px 22px;
          overflow-y: auto; flex: 1;
          display: flex; flex-direction: column; gap: 18px;
        }
        .rm-label {
          display: flex; align-items: center; gap: 6px;
          font-size: var(--text-sm); font-weight: 700;
          color: var(--text); margin-bottom: 8px;
        }
        .rm-chip-row { display: flex; gap: 6px; flex-wrap: wrap; }
        .rm-footer {
          padding: 14px 22px;
          border-top: 1px solid var(--border);
          display: flex; gap: 10px; flex-shrink: 0;
          background: var(--surface);
        }
        .rm-section-divider {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.08em; color: var(--text-muted);
          display: flex; align-items: center; gap: 8px;
        }
        .rm-section-divider::before, .rm-section-divider::after {
          content: ''; flex: 1; height: 1px; background: var(--border);
        }
        @keyframes rmFadeIn  { from{opacity:0}              to{opacity:1} }
        @keyframes rmSlideUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes rmSpin    { to{transform:rotate(360deg)} }
      `}</style>

      <div className="rm-overlay">
        <div className="rm-container">

          {/* ── Header ── */}
          <div className="rm-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-h) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(1,105,111,0.35)',
                flexShrink: 0,
              }}>
                <FileText size={20} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.2 }}>Gerar Relatório PDF</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
                  {filters.machine || 'Todas as máquinas'} •&nbsp;
                  {filters.shift   || 'Todos os turnos'}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 10, color: 'var(--text-muted)',
                padding: 8, display: 'flex', alignItems: 'center',
                cursor: 'pointer', minWidth: 36, minHeight: 36, justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* ── Live Stats ── */}
          <div className="rm-stats-bar">
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              Prévia dos dados
            </div>
            <div className="rm-stats-grid">
              {[
                { icon: <BarChart3 size={14} />, label: 'Conformidade', value: `${preview.pct}%`, color: pctColor },
                { icon: <CheckCircle2 size={14} />, label: 'Conformes', value: preview.ok, color: 'var(--success)' },
                { icon: <X size={14} />, label: 'Não conf.', value: preview.nok, color: 'var(--danger)' },
                { icon: <Clock size={14} />, label: 'Pendentes', value: preview.pending, color: 'var(--text-muted)' },
                { icon: <AlertTriangle size={14} />, label: 'Ocorrências', value: preview.occCount, color: '#f59e0b' },
              ].map(st => (
                <div key={st.label} className="rm-stat-card">
                  <div style={{ color: st.color, marginBottom: 4 }}>{st.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: st.color, lineHeight: 1 }}>{st.value}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.2 }}>{st.label}</div>
                </div>
              ))}
            </div>
            {/* Progress bar */}
            <div className="rm-progress-bar">
              <div style={{
                height: '100%', borderRadius: 4,
                background: pctColor,
                width: `${preview.pct}%`,
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>

          {/* ── Filters Body ── */}
          <div className="rm-body">

            {/* Título */}
            <div>
              <div className="rm-label"><FileText size={14} /> Título do relatório</div>
              <input
                className="input"
                value={filters.reportTitle}
                onChange={e => setFilter('reportTitle', e.target.value)}
                placeholder="Ex: Relatório de Inspeção - Turno A"
              />
            </div>

            {/* Período */}
            <div>
              <div className="rm-label"><Calendar size={14} /> Período</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="date" className="input" value={filters.dateFrom}
                  onChange={e => setFilter('dateFrom', e.target.value)} style={{ flex: 1 }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', flexShrink: 0 }}>até</span>
                <input type="date" className="input" value={filters.dateTo}
                  onChange={e => setFilter('dateTo', e.target.value)} style={{ flex: 1 }} />
              </div>
            </div>

            <div className="rm-section-divider">Filtros</div>

            {/* Máquina */}
            <div>
              <div className="rm-label"><Factory size={14} /> Máquina</div>
              <div className="rm-chip-row">
                {MACHINES.map(m => (
                  <Chip key={m} label={m || 'Todas'} value={m}
                    active={filters.machine === m}
                    onClick={() => setFilter('machine', m)} />
                ))}
              </div>
            </div>

            {/* Turno */}
            <div>
              <div className="rm-label"><Filter size={14} /> Turno</div>
              <div className="rm-chip-row">
                {SHIFTS.map(sh => (
                  <Chip key={sh} label={sh || 'Todos'} value={sh}
                    active={filters.shift === sh}
                    onClick={() => setFilter('shift', sh)} />
                ))}
              </div>
            </div>

            {/* Seção */}
            <div>
              <div className="rm-label">Seção do checklist</div>
              <select className="input" value={filters.section}
                onChange={e => setFilter('section', e.target.value)}>
                <option value="">Todas as seções</option>
                {sectionOptions.map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>

            {/* Gerado por */}
            <div>
              <div className="rm-label">Supervisor responsável</div>
              <input
                className="input"
                value={filters.generatedBy}
                onChange={e => setFilter('generatedBy', e.target.value)}
                placeholder="Nome do supervisor (opcional)"
              />
            </div>

            {/* Aviso nativo */}
            {Capacitor.isNativePlatform() && (
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(1,105,111,0.08)',
                border: '1px solid rgba(1,105,111,0.2)',
                fontSize: 'var(--text-xs)', color: 'var(--primary)',
                fontWeight: 500, display: 'flex', alignItems: 'flex-start', gap: 8,
              }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>📤</span>
                <span>O PDF será gerado e o menu nativo do sistema (compartilhar/salvar) será aberto automaticamente.</span>
              </div>
            )}

            {/* Feedback */}
            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'var(--danger-hl)', border: '1px solid rgba(220,38,38,0.25)',
                fontSize: 'var(--text-sm)', color: 'var(--danger)', fontWeight: 500,
              }}>{error}</div>
            )}
            {successMsg && (
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'var(--success-hl)', border: '1px solid rgba(74,222,128,0.25)',
                fontSize: 'var(--text-sm)', color: 'var(--success)', fontWeight: 500,
              }}>{successMsg}</div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="rm-footer">
            <button type="button" onClick={onClose} disabled={generating}
              style={{
                flex: 1, height: 46, borderRadius: 10,
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                color: 'var(--text)', fontWeight: 600, fontSize: 'var(--text-sm)',
                cursor: 'pointer',
              }}>
              Cancelar
            </button>
            <button type="button" onClick={handleDownload} disabled={generating}
              style={{
                flex: 2, height: 46, borderRadius: 10,
                background: generating
                  ? 'var(--primary-h)'
                  : `linear-gradient(135deg, var(--primary) 0%, var(--primary-h) 100%)`,
                color: '#fff', fontWeight: 700, fontSize: 'var(--text-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, cursor: generating ? 'not-allowed' : 'pointer',
                opacity: generating ? 0.75 : 1,
                border: 'none', transition: 'all 0.15s',
                boxShadow: generating ? 'none' : '0 4px 16px rgba(1,105,111,0.3)',
              }}>
              {generating ? (
                <>
                  <Loader2 size={18} style={{ animation: 'rmSpin 0.8s linear infinite' }} />
                  Gerando PDF...
                </>
              ) : (
                <>
                  {Capacitor.isNativePlatform() ? <Share2 size={18} /> : <Download size={18} />}
                  {Capacitor.isNativePlatform() ? 'Gerar e Compartilhar' : 'Baixar PDF'}
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
