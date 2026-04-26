import { Factory, LogOut, Fingerprint } from 'lucide-react';

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

  const roleLabel  = isAdmin ? 'Administrador' : isSupervisor ? 'Supervisor' : 'Colaborador';
  /* Colores via CSS custom-props o clases semánticas */
  const roleColorVar  = isAdmin ? 'var(--admin-color,#a78bfa)'  : isSupervisor ? 'var(--supervisor-color,#fbbf24)'  : 'var(--primary)';
  const roleBgVar     = isAdmin ? 'var(--admin-bg,rgba(167,139,250,.12))' : isSupervisor ? 'var(--supervisor-bg,rgba(251,191,36,.12))' : 'var(--primary-hl)';
  const roleBorderVar = isAdmin ? 'var(--admin-border,rgba(167,139,250,.25))' : isSupervisor ? 'var(--supervisor-border,rgba(251,191,36,.2))' : 'rgba(13,148,136,.25)';

  return (
    <header
      style={{ background: 'var(--sidebar-bg)', borderBottom: '1px solid var(--sidebar-border)' }}
      className="flex-shrink-0"
    >
      {/* ═══ Topbar ═══ */}
      <div className="header-topbar">

        {/* Logo + marca */}
        <div className="flex items-center gap-[var(--s2)] flex-shrink-0">
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 32, height: 32,
              borderRadius: 'var(--r-lg)',
              background: 'var(--primary)',
              boxShadow: '0 4px 12px rgba(13,148,136,0.4)',
            }}
          >
            <Factory size={16} color="#fff" strokeWidth={1.5} />
          </div>

          {/* Brand text: oculto en <360px, visible desde 360px */}
          <div className="header-brand-text">
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-sm)',
                fontWeight: 700,
                color: '#f1f5f9',
                letterSpacing: '-0.01em',
                lineHeight: 1.1,
              }}
            >
              Indústria 4.0
            </div>
            <div
              style={{
                fontSize: 10,
                color: 'var(--sidebar-muted)',
                fontWeight: 600,
                letterSpacing: '0.04em',
                lineHeight: 1,
              }}
            >
              Plataforma Pro
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="header-right">

          {/* Sync status */}
          {showSyncStatus && (
            <div className="sync-badge">
              <span
                style={{
                  width: 6, height: 6,
                  borderRadius: '50%',
                  background: '#4ade80',
                  animation: 'pulse-dot 2s ease-in-out infinite',
                  flexShrink: 0,
                  display: 'inline-block',
                }}
              />
              SINCRONIZAÇÃO ATIVA
            </div>
          )}

          {/* Role badge */}
          {role && (
            <div
              className="role-badge"
              style={{
                background: roleBgVar,
                border: `1px solid ${roleBorderVar}`,
                color: roleColorVar,
              }}
            >
              {roleLabel}
            </div>
          )}

          {/* ── User pill ──
            flex-shrink-0 en el avatar y la hora;
            el email (flex-1 min-w-0 truncate) crece con el espacio disponible
            y se trunca si no hay suficiente. En tablets (≥768px) el pill crece
            hasta 280px para no cortar el email innecesariamente. */}
          <div className="header-user-pill">
            {/* Avatar */}
            <span
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 26, height: 26,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), #06b6d4)',
                fontSize: 10, fontWeight: 700,
                color: '#fff',
                letterSpacing: '0.04em',
              }}
            >
              {initials || 'U'}
            </span>

            {/* Email: flex-1 min-w-0 para crecer y truncar limpiamente */}
            <span
              className="email-label"
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: 'var(--sidebar-text)',
                flex: '1 1 0%',
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>

            {/* Hora */}
            <span
              className="time-label flex-shrink-0"
              style={{
                fontSize: 10, fontWeight: 700,
                color: 'var(--sidebar-muted)',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '0.03em',
              }}
            >
              {formattedTime}
            </span>
          </div>

          {/* Biometrics toggle */}
          {onToggleBiometrics && typeof useBiometrics === 'boolean' && (
            <button
              onClick={onToggleBiometrics}
              className="bio-toggle-btn"
              style={{
                background: useBiometrics
                  ? 'rgba(13,148,136,0.18)'
                  : 'rgba(255,255,255,0.05)',
                border: `1px solid ${
                  useBiometrics ? 'rgba(13,148,136,0.35)' : 'var(--sidebar-border)'
                }`,
                color: useBiometrics ? 'var(--primary)' : 'var(--sidebar-muted)',
              }}
              aria-label={useBiometrics ? 'Desativar biometria' : 'Ativar biometria'}
              title={useBiometrics
                ? 'Biometria ativada — clique para desativar'
                : 'Biometria desativada — clique para ativar'}
            >
              <Fingerprint size={15} style={{ flexShrink: 0 }} />
              <span className="bio-label">
                {useBiometrics ? 'Bio ON' : 'Bio OFF'}
              </span>
            </button>
          )}

          {/* Logout */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="logout-btn"
              aria-label="Sair da plataforma"
              title="Sair da plataforma"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ═══ Page title bar ═══ */}
      <div
        className="header-page-section"
        style={{
          padding: 'var(--s4) var(--s6)',
          borderTop: '1px solid var(--sidebar-border)',
          background: 'var(--surface)',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xl)',
            fontWeight: 700,
            color: 'var(--text)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
              marginTop: 'var(--s1)',
              fontWeight: 500,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      <style>{`
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }

        /* ── Topbar ── */
        .header-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--s4);
          height: 60px;
          gap: var(--s3);
          overflow: hidden;
        }
        @media (min-width: 768px) {
          .header-topbar { padding: 0 var(--s6); }
        }

        /* ── Right group ── */
        .header-right {
          display: flex;
          align-items: center;
          gap: var(--s2);
          min-width: 0;
          overflow: hidden;
          flex: 1 1 auto;
          justify-content: flex-end;
        }

        /* ── Brand text ── */
        .header-brand-text { display: none; }
        @media (min-width: 360px) { .header-brand-text { display: block; } }

        /* ── Sync badge ── */
        .sync-badge {
          display: none;
          align-items: center;
          gap: var(--s2);
          padding: 4px var(--s3);
          border-radius: var(--r-full);
          background: rgba(74,222,128,0.12);
          border: 1px solid rgba(74,222,128,0.2);
          font-size: 10px;
          font-weight: 700;
          color: #4ade80;
          letter-spacing: 0.06em;
          white-space: nowrap;
          flex-shrink: 0;
        }
        @media (min-width: 560px) { .sync-badge { display: flex; } }

        /* ── Role badge ── */
        .role-badge {
          display: none;
          padding: 4px var(--s3);
          border-radius: var(--r-full);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          white-space: nowrap;
          flex-shrink: 0;
        }
        @media (min-width: 600px) { .role-badge { display: flex; } }

        /* ── User pill ──
           min-width:0 en el contenedor + flex:1 en el email = truncado limpio.
           max-width crece en tablets para no cortar emails largos. */
        .header-user-pill {
          display: flex;
          align-items: center;
          gap: var(--s2);
          padding: 4px var(--s3);
          border-radius: var(--r-full);
          background: var(--sidebar-surface);
          border: 1px solid var(--sidebar-border);
          min-width: 0;
          overflow: hidden;
          /* En mobile: ancho justo para el avatar + hora */
          max-width: 52px;
        }
        /* 480px+: aparece el email, pill crece */
        @media (min-width: 480px) {
          .header-user-pill { max-width: 200px; }
        }
        /* 768px+: más espacio para emails largos */
        @media (min-width: 768px) {
          .header-user-pill { max-width: 280px; flex: 0 1 280px; }
        }
        /* 1024px+: expandido */
        @media (min-width: 1024px) {
          .header-user-pill { max-width: 320px; flex: 0 1 320px; }
        }

        /* ── Email label ── */
        .email-label { display: none; }
        @media (min-width: 480px) { .email-label { display: block; } }

        /* ── Time label ── */
        .time-label { display: none; }
        @media (min-width: 380px) { .time-label { display: block; } }

        /* ── Bio toggle ── */
        .bio-toggle-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 var(--s3);
          height: 36px;
          border-radius: var(--r-lg);
          cursor: pointer;
          transition: all var(--t);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.03em;
          white-space: nowrap;
          flex-shrink: 0;
        }
        @media (min-width: 1024px) { .bio-toggle-btn { display: none; } }
        .bio-label { display: none; }
        @media (min-width: 420px) { .bio-label { display: inline; } }

        /* ── Logout btn ── */
        .logout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: var(--r-lg);
          background: transparent;
          border: 1px solid var(--sidebar-border);
          color: var(--sidebar-muted);
          cursor: pointer;
          transition: all var(--t);
          flex-shrink: 0;
          padding: 4px; /* tap target virtual */
        }
        .logout-btn:hover {
          background: rgba(248,113,113,0.1);
          color: #f87171;
          border-color: rgba(248,113,113,0.25);
        }
        .logout-btn:active {
          background: rgba(248,113,113,0.2);
        }

        /* ── Page section: compacto en mobile ── */
        @media (max-width: 480px) {
          .header-page-section {
            padding: var(--s3) var(--s4) !important;
          }
          .header-page-section h1 {
            font-size: clamp(1.1rem, 5vw, 1.35rem) !important;
          }
          .header-topbar {
            height: 52px !important;
            padding: 0 var(--s3) !important;
          }
        }
      `}</style>
    </header>
  );
}
