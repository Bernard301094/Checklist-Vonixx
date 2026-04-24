import { OccurrenceData } from '../types';
import Header from './Header';
import DashboardView from './DashboardView';

interface SupervisorScreenProps {
  onLogout: () => void;
  occurrences: OccurrenceData[];
  checklistState: Record<string, boolean>;
  useBiometrics?: boolean;
  onToggleBiometrics?: () => void;
}

export default function SupervisorScreen({ onLogout, occurrences, checklistState, useBiometrics, onToggleBiometrics }: SupervisorScreenProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text)' }}>
      <Header
        userEmail="Supervisor"
        title="Painel do Supervisor"
        subtitle="Monitoramento em tempo real do checklist, evidências e pontos críticos reportados"
        showSyncStatus={true}
        role="supervisor"
        onLogout={onLogout}
        useBiometrics={useBiometrics}
        onToggleBiometrics={onToggleBiometrics}
      />
      <DashboardView occurrences={occurrences} checklistState={checklistState} />
    </div>
  );
}
