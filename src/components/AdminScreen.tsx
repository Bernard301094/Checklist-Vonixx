import React, { useState } from 'react';
import { Users, LayoutDashboard, ListTodo, FileText } from 'lucide-react';
import Header from './Header';
import DashboardView from './DashboardView';
import ReportModal from './ReportModal';
import AdminChecklistTab from './admin/AdminChecklistTab';
import AdminUsersTab from './admin/AdminUsersTab';
import './admin/admin.css';
import { supabase } from '../supabase';
import { OccurrenceData, ChecklistEntry, ChecklistSession } from '../types';
import { CHECKLIST_DATA } from '../constants';

interface AdminScreenProps {
  onLogout: () => void;
  currentUserEmail: string;
  useBiometrics?: boolean;
  onToggleBiometrics?: () => void;
  occurrences?: OccurrenceData[];
  checklistState?: Record<string, boolean>;
  checklistEntries?: ChecklistEntry[];
  checklistSessions?: ChecklistSession[];
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminScreen({ onLogout, currentUserEmail, useBiometrics, onToggleBiometrics, occurrences = [], checklistState = {}, checklistEntries = [], checklistSessions = [] }: AdminScreenProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'dashboard' | 'checklist'>('users');
  const [showReportModal, setShowReportModal] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text)' }}>
      <Header
        userEmail={currentUserEmail}
        title="Painel Administrativo"
        subtitle="Gerencie acessos, crie usuários e modifique o checklist"
        showSyncStatus={true} role="admin" onLogout={onLogout}
        useBiometrics={useBiometrics} onToggleBiometrics={onToggleBiometrics}
      />

      {/* Tab Bar Premium */}
      <div style={{
        display: 'flex',
        padding: '8px',
        gap: '8px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 200,
        backdropFilter: 'blur(10px)',
      }}>
        {[
          { id: 'users', label: 'Usuários', Icon: Users },
          { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
          { id: 'checklist', label: 'Checklist', Icon: ListTodo }
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            style={{
              flex: 1,
              padding: '10px 4px',
              borderRadius: 'var(--r-lg)',
              fontWeight: 700,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === id ? 'var(--primary-hl)' : 'transparent',
              color: activeTab === id ? 'var(--primary)' : 'var(--text-muted)',
            }}
          >
            <Icon size={16} />
            <span className="hide-mobile">{label}</span>
          </button>
        ))}
      </div>

      <div style={{ position: 'fixed', bottom: 24, right: 20, zIndex: 300 }}>
        <button
          onClick={() => setShowReportModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 24px',
            borderRadius: 'var(--r-full)',
            background: 'linear-gradient(135deg, var(--primary) 0%, #06b6d4 100%)',
            color: '#fff',
            fontWeight: 800,
            fontSize: '14px',
            boxShadow: '0 12px 32px rgba(1,105,111,0.4)',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-4px) scale(1.02)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 16px 40px rgba(1,105,111,0.5)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0) scale(1)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 32px rgba(1,105,111,0.4)';
          }}
        >
          <FileText size={20} />
          Gerar Relatório
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'dashboard' && (
          <DashboardView
            occurrences={occurrences}
            checklistState={checklistState}
            checklistEntries={checklistEntries}
            checklistSessions={checklistSessions}
          />
        )}

        {activeTab === 'users' && <AdminUsersTab />}

        {activeTab === 'checklist' && <AdminChecklistTab />}
      </div>

      {/* Modal de Relatório */}
      {showReportModal && (
        <ReportModal
          onClose={() => setShowReportModal(false)}
          occurrences={occurrences}
          checklistState={checklistState}
          currentUserEmail={currentUserEmail}
        />
      )}

      <style>{`
        @media (max-width: 500px) {
          .hide-mobile { display: none; }
        }
      `}</style>
    </div>
  );
}
