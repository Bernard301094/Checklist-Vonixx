import { Factory, LogOut } from 'lucide-react';

interface HeaderProps {
  userEmail: string;
  displayName?: string;
  title: string;
  subtitle?: string;
  showSyncStatus?: boolean;
  role?: 'supervisor' | 'colaborador';
  onLogout?: () => void;
}

export default function Header({ userEmail, displayName, title, subtitle, showSyncStatus = false, role, onLogout }: HeaderProps) {
  const now = new Date();
  const formattedTime = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit', minute: '2-digit',
  }).format(now);

  const label = displayName || userEmail;

  const initials = label
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .map(p => p[0]?.toUpperCase())
    .slice(0, 2)
    .join('');

  const isSupervisor = role === 'supervisor';

  return (
    <header style={{
      background: 'var(--sidebar-bg)',
      borderBottom: '1px solid var(--sidebar-border)',
      flexShrink: 0,
    }}>
      {/* ── Top bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--s6)',
        height: 60,
        gap: 'var(--s4)',
      }}>
        {/* Logo + brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', flexShrink: 0 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 'var(--r-lg)',
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(13,148,136,0.4)',
          }}>
            <Factory size={18} color="#fff" strokeWidth={1.5} />
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              color: '#f1f5f9',
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
            }}>Indústria 4.0</div>
            <div style={{ fontSize: 10, color: 'var(--sidebar-muted)', fontWeight: 600, letterSpacing: '0.04em', lineHeight: 1 }}>Pro Platform</div>
          </div>
        </div>

        {/* Right side: sync + role badge + user + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', minWidth: 0 }}>
          {showSyncStatus && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--s2)',
              padding: '4px var(--s3)', borderRadius: 'var(--r-full)',
              background: 'rgba(74,222,128,0.12)',
              border: '1px solid rgba(74,222,128,0.2)',
              fontSize: 10, fontWeight: 700, color: '#4ade80',
              letterSpacing: '0.06em',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%', background: '#4ade80',
                animation: 'pulse-dot 2s ease-in-out infinite',
              }} />
              SYNC ATIVO
            </div>
          )}

          {role && (
            <div style={{
              padding: '4px var(--s3)', borderRadius: 'var(--r-full)',
              background: isSupervisor ? 'rgba(251,191,36,0.12)' : 'rgba(13,148,136,0.15)',
              border: `1px solid ${isSupervisor ? 'rgba(251,191,36,0.2)' : 'rgba(13,148,136,0.25)'}`,
              fontSize: 10, fontWeight: 700,
              color: isSupervisor ? '#fbbf24' : 'var(--primary)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              display: 'none',
            }} className="role-badge">
              {isSupervisor ? 'Supervisor' : 'Colaborador'}
            </div>
          )}

          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--s2)',
            padding: '4px var(--s3)', borderRadius: 'var(--r-full)',
            background: 'var(--sidebar-surface)',
            border: '1px solid var(--sidebar-border)',
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.04em', flexShrink: 0,
            }}>
              {initials || 'U'}
            </div>
            <span style={{
              fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--sidebar-text)',
              maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }} className="email-label">
              {label}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, color: 'var(--sidebar-muted)',
              fontVariantNumeric: 'tabular-nums', letterSpacing: '0.03em',
            }}>
              {formattedTime}
            </span>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: 'var(--r-lg)',
                background: 'transparent',
                border: '1px solid var(--sidebar-border)',
                color: 'var(--sidebar-muted)',
                cursor: 'pointer',
                transition: 'all var(--t)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,113,113,0.1)';
                (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(248,113,113,0.25)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--sidebar-muted)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sidebar-border)';
              }}
              aria-label="Sair da plataforma"
              title="Sair da plataforma"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── Page title bar ── */}
      <div style={{
        padding: 'var(--s4) var(--s6)',
        borderTop: '1px solid var(--sidebar-border)',
        background: 'var(--surface)',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-xl)',
          fontWeight: 700,
          color: 'var(--text)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 'var(--s1)', fontWeight: 500 }}>
            {subtitle}
          </p>
        )}
      </div>

      <style>{`
        @keyframes pulse-dot { 0%,100%{opacity:1}50%{opacity:0.4} }
        @media (min-width: 600px) {
          .role-badge { display: flex !important; }
        }
        @media (max-width: 480px) {
          .email-label { display: none !important; }
        }
      `}</style>
    </header>
  );
}
