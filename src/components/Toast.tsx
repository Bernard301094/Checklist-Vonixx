/**
 * Toast — sistema de notificaciones personalizadas
 * Reemplaza todos los alert() del proyecto
 */
import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, default 4000
}

interface ToastItemProps {
  toast: ToastData;
  onClose: (id: string) => void;
}

const ICONS = {
  success: <CheckCircle2 size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
};

const COLORS = {
  success: {
    bg: 'rgba(22,163,74,0.12)',
    border: 'rgba(22,163,74,0.25)',
    icon: '#4ade80',
    bar: '#16a34a',
  },
  error: {
    bg: 'rgba(220,38,38,0.12)',
    border: 'rgba(220,38,38,0.25)',
    icon: '#f87171',
    bar: '#dc2626',
  },
  warning: {
    bg: 'rgba(217,119,6,0.12)',
    border: 'rgba(217,119,6,0.25)',
    icon: '#fbbf24',
    bar: '#d97706',
  },
  info: {
    bg: 'rgba(13,148,136,0.12)',
    border: 'rgba(13,148,136,0.25)',
    icon: 'var(--primary)',
    bar: 'var(--primary)',
  },
};

function ToastItem({ toast, onClose }: ToastItemProps) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const duration = toast.duration ?? 4000;
  const colors = COLORS[toast.type];

  useEffect(() => {
    // Entrada
    const enterTimer = setTimeout(() => setVisible(true), 10);

    // Auto-close
    const closeTimer = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => onClose(toast.id), 350);
    }, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(closeTimer);
    };
  }, [toast.id, duration, onClose]);

  const handleClose = () => {
    setLeaving(true);
    setTimeout(() => onClose(toast.id), 350);
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 16px',
        borderRadius: 'var(--r-xl)',
        background: 'var(--sidebar-bg)',
        border: `1px solid ${colors.border}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        minWidth: 280,
        maxWidth: 380,
        width: '100%',
        overflow: 'hidden',
        transition: 'opacity 350ms ease, transform 350ms cubic-bezier(0.34,1.56,0.64,1)',
        opacity: visible && !leaving ? 1 : 0,
        transform: visible && !leaving ? 'translateX(0)' : 'translateX(24px)',
        pointerEvents: 'all',
      }}
    >
      {/* Barra lateral de color */}
      <div style={{
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: 3,
        background: colors.bar,
        borderRadius: 'var(--r-xl) 0 0 var(--r-xl)',
      }} />

      {/* Barra de progreso animada */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: 2,
        background: `${colors.bar}33`,
        borderRadius: '0 0 var(--r-xl) var(--r-xl)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: colors.bar,
          animation: `toast-progress ${duration}ms linear forwards`,
        }} />
      </div>

      {/* Icono */}
      <div style={{ color: colors.icon, flexShrink: 0, marginTop: 1 }}>
        {ICONS[toast.type]}
      </div>

      {/* Texto */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 'var(--text-sm)',
          fontWeight: 700,
          color: 'var(--text)',
          lineHeight: 1.3,
        }}>
          {toast.title}
        </div>
        {toast.message && (
          <div style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            marginTop: 4,
            lineHeight: 1.5,
          }}>
            {toast.message}
          </div>
        )}
      </div>

      {/* Botón cerrar */}
      <button
        onClick={handleClose}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 22, height: 22, borderRadius: 'var(--r-md)',
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          flexShrink: 0,
          padding: 0,
          transition: 'color 150ms',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        <X size={13} />
      </button>

      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

/* ── Contenedor global de toasts ── */
interface ToastContainerProps {
  toasts: ToastData[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 20,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      alignItems: 'flex-end',
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onClose={onClose} />
      ))}
    </div>
  );
}

/* ── Hook para usar toasts fácilmente ── */
export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = (type: ToastType, title: string, message?: string, duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, title, message, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const toast = {
    success: (title: string, message?: string) => addToast('success', title, message),
    error: (title: string, message?: string) => addToast('error', title, message, 6000),
    warning: (title: string, message?: string) => addToast('warning', title, message, 5000),
    info: (title: string, message?: string) => addToast('info', title, message),
  };

  return { toasts, removeToast, toast };
}