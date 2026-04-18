import { CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  userEmail: string;
  title: string;
  subtitle?: string;
  showSyncStatus?: boolean;
}

export default function Header({ userEmail, title, subtitle, showSyncStatus = false }: HeaderProps) {
  const now = new Date();
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(now);
  const formattedTime = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit', minute: '2-digit',
  }).format(now);

  const initials = userEmail
    .split('@')[0]
    .split(/[._-]/)
    .map(p => p[0]?.toUpperCase())
    .slice(0, 2)
    .join('');

  return (
    <header style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 var(--s6)', height: 60,
        gap: 'var(--s4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', minWidth: 0 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 'var(--r-full)',
            background: 'linear-gradient(135deg, var(--primary), #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, fontSize: '0.7rem', fontWeight: 700, color: '#fff',
            letterSpacing: '0.05em',
          }}>
            {initials || 'U'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1.3 }}>
              Operador
            </div>
            <div style={{
              fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px',
              lineHeight: 1.3,
            }}>
              {userEmail}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)' }}>
          {showSyncStatus && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--s2)',
              padding: 'var(--s1) var(--s3)', borderRadius: 'var(--r-full)',
              background: 'var(--success-hl)',
              border: '1px solid rgba(22,163,74,0.2)',
              fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--success)',
              letterSpacing: '0.05em',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%', background: 'var(--success)',
                animation: 'pulse-dot 2s ease-in-out infinite',
              }} />
              SYNC ATIVO
            </div>
          )}

          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--s2)',
            fontSize: 'var(--text-xs)', color: 'var(--text-muted)',
            fontWeight: 500,
          }}>
            <span style={{ display: 'none', fontWeight: 500 }} className="date-label">
              {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
            </span>
            <span style={{
              padding: 'var(--s1) var(--s3)', borderRadius: 'var(--r-full)',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text)',
              letterSpacing: '0.03em',
              fontFamily: 'var(--font-body)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {formattedTime}
            </span>
          </div>
        </div>
      </div>

      <div style={{
        padding: 'var(--s6) var(--s6) var(--s5)',
        borderTop: '1px solid var(--divider)',
        background: 'var(--surface-2)',
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
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 'var(--s2)', fontWeight: 500 }}>
            {subtitle}
          </p>
        )}
      </div>

      <style>{`
        @media (min-width: 768px) { .date-label { display: block !important; } }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </header>
  );
}
