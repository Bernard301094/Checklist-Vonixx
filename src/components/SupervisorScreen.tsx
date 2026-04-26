import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { OccurrenceData } from '../types';
import Header from './Header';
import DashboardView from './DashboardView';
import ReportModal from './ReportModal';

interface SupervisorScreenProps {
  onLogout: () => void;
  occurrences: OccurrenceData[];
  checklistState: Record<string, boolean>;
  useBiometrics?: boolean;
  onToggleBiometrics?: () => void;
  userEmail?: string;
}

export default function SupervisorScreen({
  onLogout,
  occurrences,
  checklistState,
  useBiometrics,
  onToggleBiometrics,
  userEmail = 'Supervisor',
}: SupervisorScreenProps) {
  const [showReportModal, setShowReportModal] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text)' }}>
      <Header
        userEmail={userEmail}
        title="Painel do Supervisor"
        subtitle="Monitoramento em tempo real do checklist, evidências e pontos críticos reportados"
        showSyncStatus={true}
        role="supervisor"
        onLogout={onLogout}
        useBiometrics={useBiometrics}
        onToggleBiometrics={onToggleBiometrics}
      />

      {/* Dashboard com hierarquia data → colaborador */}
      <DashboardView occurrences={occurrences} checklistState={checklistState} />

      {/* Botão flutuante de relatório */}
      <div className="report-btn-fixed">
        <button
          onClick={() => setShowReportModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 20px',
            borderRadius: 'var(--r-full)',
            background: 'var(--primary)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 'var(--text-sm)',
            boxShadow: '0 8px 24px rgba(1,105,111,0.45)',
            border: 'none',
            cursor: 'pointer',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 32px rgba(1,105,111,0.55)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(1,105,111,0.45)';
          }}
        >
          <FileText size={18} />
          Gerar Relatório
        </button>
      </div>

      {showReportModal && (
        <ReportModal
          onClose={() => setShowReportModal(false)}
          occurrences={occurrences}
          checklistState={checklistState}
          currentUserEmail={userEmail}
        />
      )}

      <style>{`
        .report-btn-fixed {
          position: fixed;
          bottom: 24px;
          right: 20px;
          z-index: 100;
        }
        @media (max-width: 640px) {
          .report-btn-fixed {
            bottom: 100px;
          }
        }
      `}</style>
    </div>
  );
}
