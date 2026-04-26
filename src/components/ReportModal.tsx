/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { X, FileText, Download, Calendar, Filter, Loader2 } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { OccurrenceData } from '../types';
import { CHECKLIST_DATA } from '../constants';
import ReportPDF, { ReportFilters } from './ReportPDF';

interface ReportModalProps {
  onClose: () => void;
  occurrences: OccurrenceData[];
  checklistState: Record<string, boolean>;
  currentUserEmail?: string;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

const SHIFTS = ['', 'TURNO A', 'TURNO B', 'TURNO C', 'TURNO D'];

/** Detecta si el usuario está en un dispositivo móvil o WebView */
function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

export default function ReportModal({
  onClose,
  occurrences,
  checklistState,
  currentUserEmail = '',
}: ReportModalProps) {
  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: today(),
    dateTo: today(),
    shift: '',
    section: '',
    reportTitle: 'Relatório de Inspeção Vonixx',
    generatedBy: currentUserEmail,
  });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const sectionOptions = CHECKLIST_DATA.map(s => s.title);

  // Contadores preview
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

  const filteredSections = filters.section
    ? CHECKLIST_DATA.filter(s => s.title === filters.section)
    : CHECKLIST_DATA;

  const totalItems = filteredSections.reduce((sum, s) => sum + s.items.length, 0);
  const checkedItems = filteredSections.reduce((sum, s) => {
    return sum + s.items.filter(item => checklistState[`${s.id}__${item}`] === true).length;
  }, 0);
  const completionPct = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

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

      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `relatorio-vonixx-${dateStr}.pdf`;

      if (isMobileDevice()) {
        // ── Estratégia Mobile / WebView ──────────────────────────────
        // No Android/iOS, o atributo "download" de um <a> tag com blob:
        // URL é ignorado. Abrimos em nova aba para o navegador/SO
        // exibir o PDF com as opções nativas de salvar/compartilhar.
        const url = URL.createObjectURL(blob);
        const opened = window.open(url, '_blank');
        if (!opened) {
          // Popup bloqueado — fallback: forçar download via link
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.target = '_blank';
          a.rel = 'noopener';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        setTimeout(() => URL.revokeObjectURL(url), 30000);
        setSuccessMsg('PDF aberto em nova aba. Use o menu do seu navegador para salvar.');
      } else {
        // ── Estratégia Desktop ───────────────────────────────────────
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        setSuccessMsg('Download iniciado com sucesso!');
      }
    } catch (err: any) {
      console.error('Erro ao gerar PDF:', err);
      setError('Erro ao gerar o PDF. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  }, [occurrences, checklistState, filters]);

  const setFilter = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <style>{`
        .report-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(2,6,23,0.88);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3000;
          padding: var(--s4);
          animation: fadeIn 0.15s ease;
        }
        .report-modal-container {
          width: 100%;
          max-width: 520px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-2xl);
          box-shadow: 0 32px 80px rgba(0,0,0,0.6);
          overflow: hidden;
          animation: slideUp 0.2s ease;
          max-height: 92dvh;
          display: flex;
          flex-direction: column;
        }
        /* Mobile: ocupa mais da tela */
        @media (max-width: 480px) {
          .report-modal-overlay {
            padding: var(--s2);
            align-items: flex-end;
          }
          .report-modal-container {
            max-width: 100%;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
            max-height: 96dvh;
          }
        }
        .report-modal-header {
          padding: var(--s4) var(--s5);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }
        .report-modal-preview {
          padding: var(--s3) var(--s5);
          background: var(--surface-2);
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .report-preview-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--s2);
        }
        @media (max-width: 380px) {
          .report-preview-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .report-modal-body {
          padding: var(--s4) var(--s5);
          overflow-y: auto;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: var(--s4);
        }
        .report-shift-grid {
          display: flex;
          gap: var(--s2);
          flex-wrap: wrap;
        }
        .report-modal-footer {
          padding: var(--s3) var(--s5);
          border-top: 1px solid var(--border);
          display: flex;
          gap: var(--s3);
          flex-shrink: 0;
          background: var(--surface);
        }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      <div className="report-modal-overlay">
        <div className="report-modal-container">

          {/* Header */}
          <div className="report-modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)' }}>
              <div style={{
                width: 38, height: 38, borderRadius: 'var(--r-xl)',
                background: 'var(--primary-hl)', color: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <FileText size={18} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800 }}>Gerar Relatório PDF</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Configure e baixe o relatório</div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)', color: 'var(--text-muted)',
                padding: 8, display: 'flex', alignItems: 'center', cursor: 'pointer',
                minWidth: 36, minHeight: 36, justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Preview Stats */}
          <div className="report-modal-preview">
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--s2)' }}>
              Pré-visualização
            </div>
            <div className="report-preview-grid">
              {[
                { label: 'Conclusão', value: `${completionPct}%`, color: 'var(--primary)' },
                { label: 'Itens OK', value: checkedItems, color: 'var(--success)' },
                { label: 'Ocorrências', value: filteredOccurrences.length, color: '#f59e0b' },
                { label: 'Total itens', value: totalItems, color: 'var(--text-muted)' },
              ].map(stat => (
                <div key={stat.label} style={{
                  padding: 'var(--s2) var(--s3)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-lg)',
                  textAlign: 'center',
                  minWidth: 0
                }}>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                  <div className="hide-watch" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="report-modal-body">

            {/* Título */}
            <div>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: 'var(--s2)' }}>
                Título do relatório
              </label>
              <input
                className="input"
                value={filters.reportTitle}
                onChange={e => setFilter('reportTitle', e.target.value)}
                placeholder="Ex: Relatório de Inspeção - Turno A"
              />
            </div>

            {/* Período */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--s2)' }}>
                <Calendar size={14} /> Período
              </label>
              <div style={{ display: 'flex', gap: 'var(--s3)', alignItems: 'center' }}>
                <input
                  type="date"
                  className="input"
                  value={filters.dateFrom}
                  onChange={e => setFilter('dateFrom', e.target.value)}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', flexShrink: 0 }}>até</span>
                <input
                  type="date"
                  className="input"
                  value={filters.dateTo}
                  onChange={e => setFilter('dateTo', e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            {/* Turno */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--s2)' }}>
                <Filter size={14} /> Turno
              </label>
              <div className="report-shift-grid">
                {SHIFTS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFilter('shift', s)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--r-full)',
                      fontWeight: 600,
                      fontSize: 'var(--text-xs)',
                      border: '1px solid',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      borderColor: filters.shift === s ? 'var(--primary)' : 'var(--border)',
                      background: filters.shift === s ? 'var(--primary)' : 'var(--surface-2)',
                      color: filters.shift === s ? '#fff' : 'var(--text-muted)',
                      minHeight: 36,
                    }}
                  >
                    {s === '' ? 'Todos' : s}
                  </button>
                ))}
              </div>
            </div>

            {/* Seção */}
            <div>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: 'var(--s2)' }}>
                Seção do checklist
              </label>
              <select
                className="input"
                value={filters.section}
                onChange={e => setFilter('section', e.target.value)}
              >
                <option value="">Todas as seções</option>
                {sectionOptions.map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>

            {/* Gerado por */}
            <div>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: 'var(--s2)' }}>
                Gerado por
              </label>
              <input
                className="input"
                value={filters.generatedBy}
                onChange={e => setFilter('generatedBy', e.target.value)}
                placeholder="Nome ou e-mail"
              />
            </div>

            {/* Aviso Mobile */}
            {isMobileDevice() && (
              <div style={{
                padding: 'var(--s3) var(--s4)',
                borderRadius: 'var(--r-lg)',
                background: 'rgba(45,212,191,0.08)',
                border: '1px solid rgba(45,212,191,0.2)',
                fontSize: 'var(--text-xs)',
                color: 'var(--primary)',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--s2)',
              }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>📱</span>
                <span>No celular, o PDF será aberto em uma nova aba. Use o botão de compartilhar/salvar do seu navegador para baixar o arquivo.</span>
              </div>
            )}

            {error && (
              <div style={{
                padding: 'var(--s3) var(--s4)', borderRadius: 'var(--r-lg)',
                background: 'var(--danger-hl)', border: '1px solid rgba(220,38,38,0.25)',
                fontSize: 'var(--text-sm)', color: 'var(--danger)', fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            {successMsg && (
              <div style={{
                padding: 'var(--s3) var(--s4)', borderRadius: 'var(--r-lg)',
                background: 'var(--success-hl)', border: '1px solid rgba(74,222,128,0.25)',
                fontSize: 'var(--text-sm)', color: 'var(--success)', fontWeight: 500,
              }}>
                {successMsg}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="report-modal-footer">
            <button
              type="button"
              onClick={onClose}
              disabled={generating}
              style={{
                flex: 1, height: 46,
                borderRadius: 'var(--r-lg)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text)', fontWeight: 600,
                fontSize: 'var(--text-sm)', cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={generating}
              style={{
                flex: 2, height: 46,
                borderRadius: 'var(--r-lg)',
                background: generating ? 'var(--primary-h)' : 'var(--primary)',
                color: '#fff', fontWeight: 700,
                fontSize: 'var(--text-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, cursor: generating ? 'not-allowed' : 'pointer',
                opacity: generating ? 0.8 : 1,
                border: 'none',
                transition: 'all 0.15s',
              }}
            >
              {generating ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download size={18} />
                  {isMobileDevice() ? 'Abrir PDF' : 'Baixar PDF'}
                </>
              )}
            </button>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    </>
  );
}
