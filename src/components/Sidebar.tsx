import { LogOut, ClipboardList, BarChart2, Factory, ChevronRight } from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
  role: 'supervisor' | 'colaborador';
}

export default function Sidebar({ onLogout, role }: SidebarProps) {
  const isSupervisor = role === 'supervisor';

  return (
    <aside style={{
      display: 'none',
      flexDirection: 'column',
      width: 260,
      height: '100%',
      background: 'var(--sidebar-bg)',
      borderRight: '1px solid var(--sidebar-border)',
      flexShrink: 0,
      zIndex: 10,
    }} className="sidebar-desktop">

      <div style={{
        padding: 'var(--s6) var(--s5)',
        borderBottom: '1px solid var(--sidebar-border)',
        display: 'flex', alignItems: 'center', gap: 'var(--s3)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 'var(--r-lg)',
          background: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(13,148,136,0.4)',
        }}>
          <Factory size={18} color="#fff" strokeWidth={1.5} />
        </div>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)',
            fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.01em',
          }}>
            Indústria 4.0
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--sidebar-muted)', fontWeight: 500, lineHeight: 1 }}>
            Pro Platform
          </div>
        </div>
      </div>

      <div style={{ padding: 'var(--s6) var(--s5) var(--s3)' }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
          color: 'var(--sidebar-muted)', textTransform: 'uppercase',
        }}>
          {isSupervisor ? 'Gerencial' : 'Operação'}
        </span>
      </div>

      <nav style={{ flex: 1, padding: '0 var(--s3)' }}>
        <button style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--s3)',
          padding: 'var(--s3) var(--s4)', borderRadius: 'var(--r-lg)',
          background: 'rgba(13,148,136,0.15)',
          border: '1px solid rgba(13,148,136,0.2)',
          color: 'var(--primary)', fontWeight: 600, fontSize: 'var(--text-sm)',
          textAlign: 'left', marginBottom: 'var(--s2)',
        }}>
          {isSupervisor
            ? <BarChart2 size={18} strokeWidth={1.75} />
            : <ClipboardList size={18} strokeWidth={1.75} />}
          <span style={{ flex: 1 }}>{isSupervisor ? 'Painel Gerencial' : 'Checklist Diário'}</span>
          <ChevronRight size={14} />
        </button>
      </nav>

      <div style={{
        margin: '0 var(--s4) var(--s4)',
        padding: 'var(--s3) var(--s4)',
        borderRadius: 'var(--r-lg)',
        background: 'var(--sidebar-surface)',
        border: '1px solid var(--sidebar-border)',
      }}>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--sidebar-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 'var(--s1)' }}>
          Perfil de Acesso
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--s2)',
          fontSize: 'var(--text-sm)', fontWeight: 700, color: '#f1f5f9',
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isSupervisor ? '#fbbf24' : 'var(--primary)',
            animation: 'pulse-dot 2s ease-in-out infinite',
          }} />
          {isSupervisor ? 'Supervisor' : 'Colaborador'}
        </div>
      </div>

      <div style={{ padding: 'var(--s4)', borderTop: '1px solid var(--sidebar-border)' }}>
        <button
          onClick={onLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--s3)',
            padding: 'var(--s3) var(--s4)', borderRadius: 'var(--r-lg)',
            background: 'transparent', border: '1px solid var(--sidebar-border)',
            color: 'var(--sidebar-muted)', fontSize: 'var(--text-sm)', fontWeight: 500,
            cursor: 'pointer', transition: 'all var(--t)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,113,113,0.1)';
            (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(248,113,113,0.2)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--sidebar-muted)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sidebar-border)';
          }}
        >
          <LogOut size={16} />
          Sair da Plataforma
        </button>
      </div>

      <style>{`
        .sidebar-desktop { display: flex !important; }
        @media (max-width: 767px) { .sidebar-desktop { display: none !important; } }
        @keyframes pulse-dot { 0%,100%{opacity:1}50%{opacity:0.4} }
      `}</style>
    </aside>
  );
}
