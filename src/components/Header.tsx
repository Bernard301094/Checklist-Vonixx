import { Factory, LogOut, Fingerprint, Activity } from 'lucide-react';

interface HeaderProps {
  userEmail: string;
  displayName?: string;
  title: string;
  subtitle?: string;
  showSyncStatus?: boolean;
  role?: 'admin' | 'supervisor' | 'colaborador';
  onLogout?: () => void;
  useBiometrics?: boolean;
  onToggleBiometrics?: () => void;
}

export default function Header({
  userEmail,
  displayName,
  title,
  subtitle,
  showSyncStatus = false,
  role,
  onLogout,
  useBiometrics,
  onToggleBiometrics,
}: HeaderProps) {
  const now = new Date();
  const formattedTime = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(now);

  const label = displayName || userEmail;

  const initials = label
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .map(p => p[0]?.toUpperCase())
    .slice(0, 2)
    .join('');

  const isAdmin      = role === 'admin';
  const isSupervisor = role === 'supervisor';

  const roleLabel  = isAdmin ? 'ADMIN' : isSupervisor ? 'SUPERVISOR' : 'COLABORADOR';
  const roleColorVar  = isAdmin ? '#a78bfa'  : isSupervisor ? '#fbbf24'  : 'var(--primary)';
  const roleBgVar     = isAdmin ? 'rgba(167,139,250,0.1)' : isSupervisor ? 'rgba(251,191,36,0.1)' : 'rgba(13,148,136,0.1)';

  return (
    <header className="main-header">
      <div className="header-container">
        
        {/* Lado Izquierdo: Logo y Nombre */}
        <div className="header-left">
          <div className="app-logo-box">
            <Factory size={18} color="#fff" strokeWidth={2} />
          </div>
          <div className="app-brand-info">
            <span className="app-name">CHECKLIST VONIXX</span>
            <span className="app-tagline hide-watch">SISTEMA OPERACIONAL</span>
          </div>
        </div>

        {/* Centro: Título de página (Solo en desktop/tablet) */}
        <div className="header-center hide-mobile">
          <h1 className="page-title">{title}</h1>
        </div>

        {/* Lado Derecho: Usuario y Acciones */}
        <div className="header-right">
          
          {/* Sync Badge */}
          {showSyncStatus && (
            <div className="header-status-badge hide-watch">
              <Activity size={12} className="pulse-icon" />
              <span className="hide-mobile">ONLINE</span>
            </div>
          )}

          {/* Role Badge */}
          {role && (
            <div className="header-role-badge hide-mobile" style={{ color: roleColorVar, background: roleBgVar }}>
              {roleLabel}
            </div>
          )}

          {/* User Pill */}
          <div className="user-profile-pill">
            <div className="user-avatar">{initials || 'U'}</div>
            <div className="user-details hide-mobile">
              <span className="user-name-text">{label}</span>
              <span className="user-time-text">{formattedTime}</span>
            </div>
          </div>

          {/* Acciones */}
          <div className="header-actions">
            {onToggleBiometrics && typeof useBiometrics === 'boolean' && (
              <button 
                onClick={onToggleBiometrics} 
                className={`action-btn bio-btn ${useBiometrics ? 'active' : ''}`}
                title={useBiometrics ? 'Biometria Ativa' : 'Ativar Biometria'}
              >
                <Fingerprint size={18} />
              </button>
            )}

            {onLogout && (
              <button onClick={onLogout} className="action-btn logout-btn" title="Sair">
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Barra de Título en Mobile (donde no cabe en el centro) */}
      <div className="mobile-page-header show-mobile">
        <h1 className="mobile-title">{title}</h1>
        {subtitle && <p className="mobile-subtitle">{subtitle}</p>}
      </div>

      <style>{`
        .main-header {
          background: var(--sidebar-bg);
          border-bottom: 1px solid var(--sidebar-border);
          width: 100%;
          z-index: 100;
          flex-shrink: 0;
        }

        .header-container {
          height: 64px;
          padding: 0 var(--s4);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--s4);
        }

        /* --- Left Side --- */
        .header-left {
          display: flex;
          align-items: center;
          gap: var(--s3);
          flex-shrink: 0;
        }

        .app-logo-box {
          width: 36px;
          height: 36px;
          background: var(--primary);
          border-radius: var(--r-md);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(13,148,136,0.3);
        }

        .app-brand-info {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
        }

        .app-name {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 14px;
          color: #fff;
          letter-spacing: 0.05em;
        }

        .app-tagline {
          font-size: 9px;
          font-weight: 700;
          color: var(--sidebar-muted);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        /* --- Center Side --- */
        .header-center {
          flex: 1;
          display: flex;
          justify-content: center;
          min-width: 0;
        }

        .page-title {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 700;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* --- Right Side --- */
        .header-right {
          display: flex;
          align-items: center;
          gap: var(--s3);
          flex-shrink: 0;
        }

        .header-status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: rgba(13,148,136,0.15);
          border: 1px solid rgba(13,148,136,0.3);
          border-radius: var(--r-full);
          font-size: 10px;
          font-weight: 800;
          color: var(--primary);
          letter-spacing: 0.05em;
        }

        .pulse-icon {
          animation: pulse-op 2s infinite;
        }

        .header-role-badge {
          padding: 4px 10px;
          border-radius: var(--r-md);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.05em;
          border: 1px solid currentColor;
        }

        .user-profile-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 4px;
          padding-right: 12px;
          background: var(--sidebar-surface);
          border: 1px solid var(--sidebar-border);
          border-radius: var(--r-full);
        }

        .user-avatar {
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, var(--primary), #06b6d4);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 11px;
          font-weight: 800;
        }

        .user-details {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
        }

        .user-name-text {
          font-size: 11px;
          font-weight: 700;
          color: var(--sidebar-text);
          max-width: 120px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-time-text {
          font-size: 9px;
          color: var(--sidebar-muted);
          font-weight: 600;
        }

        /* --- Actions --- */
        .header-actions {
          display: flex;
          align-items: center;
          gap: var(--s2);
        }

        .action-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--sidebar-surface);
          border: 1px solid var(--sidebar-border);
          border-radius: var(--r-md);
          color: var(--sidebar-muted);
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          color: #fff;
          border-color: var(--text-faint);
          background: rgba(255,255,255,0.05);
        }

        .bio-btn.active {
          color: var(--primary);
          border-color: var(--primary);
          background: rgba(13,148,136,0.1);
        }

        @media (min-width: 1024px) {
          .bio-btn { display: none !important; }
        }

        .logout-btn:hover {
          color: #f87171;
          border-color: rgba(248,113,113,0.4);
          background: rgba(248,113,113,0.1);
        }

        /* --- Mobile Page Header --- */
        .mobile-page-header {
          padding: var(--s4) var(--s5);
          background: var(--surface);
          border-top: 1px solid var(--sidebar-border);
        }

        .mobile-title {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.02em;
        }

        .mobile-subtitle {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin-top: 2px;
          font-weight: 500;
        }

        /* --- Responsive Tweaks --- */
        @media (max-width: 768px) {
          .header-container { padding: 0 var(--s3); height: 56px; }
          .app-logo-box { width: 32px; height: 32px; }
          .app-name { font-size: 12px; }
        }

        @media (max-width: 480px) {
          .header-right { gap: var(--s2); }
          .user-profile-pill { padding-right: 4px; }
          .user-avatar { width: 24px; height: 24px; font-size: 10px; }
        }

        @keyframes pulse-op {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.9); }
        }

        .hide-mobile { display: flex; }
        @media (max-width: 1024px) { .hide-mobile { display: none !important; } }

        .show-mobile { display: none; }
        @media (max-width: 1024px) { .mobile-page-header { display: block; } }
      `}</style>
    </header>
  );
}
