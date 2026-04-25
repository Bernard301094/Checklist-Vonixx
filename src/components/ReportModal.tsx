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
    try {
      const blob = await pdf(
        <ReportPDF
          occurrences={occurrences}
          checklistState={checklistState}
          filters={filters}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `relatorio-vonixx-${dateStr}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
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
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(2,6,23,0.88)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 3000, padding: 'var(--s4)',
      animation: 'fadeIn 0.15s ease',
    }}>
      <div style={{
        width: '100%', maxWidth: 520,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-2xl)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        overflow: 'hidden',
        animation: 'slideUp 0.2s ease',
        maxHeight: '90dvh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: 'var(--s5) var(--s6)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--r-xl)',
              background: 'var(--primary-hl)', color: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <FileText size={20} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-md)', fontWeight: 800 }}>Gerar Relatório PDF</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Configure os filtros e baixe o relatório</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)', color: 'var(--text-muted)',
              padding: 6, display: 'flex', alignItems: 'center', cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Preview Stats */}
        <div style={{
          padding: 'var(--s4) var(--s6)',
          background: 'var(--surface-2)',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--s3)' }}>
            Pré-visualização dos dados
          </div>
          <div style={{ display: 'flex', gap: 'var(--s3)', flexWrap: 'wrap' }}>
            {[
              { label: 'Conclusão', value: `${completionPct}%`, color: 'var(--primary)' },
              { label: 'Itens OK', value: checkedItems, color: 'var(--success)' },
              { label: 'Ocorrências', value: filteredOccurrences.length, color: '#f59e0b' },
              { label: 'Total itens', value: totalItems, color: 'var(--text-muted)' },
            ].map(stat => (
              <div key={stat.label} style={{
                flex: 1, minWidth: 80,
                padding: 'var(--s3) var(--s4)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div style={{ padding: 'var(--s5) var(--s6)', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>

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
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>até</span>
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
            <div style={{ display: 'flex', gap: 'var(--s2)', flexWrap: 'wrap' }}>
              {SHIFTS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilter('shift', s)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--r-full)',
                    fontWeight: 600,
                    fontSize: 'var(--text-xs)',
                    border: '1px solid',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    borderColor: filters.shift === s ? 'var(--primary)' : 'var(--border)',
                    background: filters.shift === s ? 'var(--primary)' : 'var(--surface-2)',
                    color: filters.shift === s ? '#fff' : 'var(--text-muted)',
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
              style={{ appearance: 'none', cursor: 'pointer' }}
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

          {error && (
            <div style={{
              padding: 'var(--s3) var(--s4)', borderRadius: 'var(--r-lg)',
              background: 'var(--danger-hl)', border: '1px solid rgba(220,38,38,0.25)',
              fontSize: 'var(--text-sm)', color: 'var(--danger)', fontWeight: 500,
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: 'var(--s4) var(--s6)',
          borderTop: '1px solid var(--border)',
          display: 'flex', gap: 'var(--s3)',
          flexShrink: 0,
          background: 'var(--surface)',
        }}>
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
              background: generating ? 'var(--primary-hover, #0c4e54)' : 'var(--primary)',
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
                Baixar PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
