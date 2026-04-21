import { useEffect, useState, useRef } from 'react';
import { Fingerprint, Lock, LogOut } from 'lucide-react';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { App as CapacitorApp } from '@capacitor/app';

interface LockScreenProps {
  onUnlock: () => void;
  onLogout: () => void;
  userEmail: string;
}

export default function LockScreen({ onUnlock, onLogout, userEmail }: LockScreenProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  
  // Usamos una referencia para evitar llamar al diálogo múltiple veces y que se sature
  const isPrompting = useRef(false);

  useEffect(() => {
    let listener: any;

    const checkBiometricSupport = async () => {
      try {
        const result = await NativeBiometric.isAvailable();
        if (!result.isAvailable) {
          console.warn('Biometrics not available on this device');
          setIsSupported(false);
          onUnlock(); 
          return;
        }
        
        // 1. Verificamos si la app está ACTIVA antes de pedir la huella por primera vez
        const appState = await CapacitorApp.getState();
        if (appState.isActive) {
          triggerAuth();
        }

        // 2. Escuchamos el evento de cuando el usuario REGRESA a la app
        listener = await CapacitorApp.addListener('appStateChange', (state) => {
          if (state.isActive && !isPrompting.current) {
            // Un pequeño delay (300ms) es CRUCIAL para evitar la pantalla blanca.
            // Permite que el WebView se redibuje antes de ser bloqueado por el diálogo nativo.
            setTimeout(() => {
              triggerAuth();
            }, 300);
          }
        });

      } catch (err: any) {
        console.error('Error checking biometric support', err);
        setIsSupported(false);
        onUnlock(); 
      }
    };

    checkBiometricSupport();

    // Limpiamos el listener al desmontar
    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, []);

  const triggerAuth = async () => {
    if (isPrompting.current) return;

    setError(null);
    isPrompting.current = true; // Bloqueamos para que no se ejecute dos veces

    try {
      await NativeBiometric.verifyIdentity({
        reason: 'Verifique sua identidade para acessar o aplicativo',
        title: 'Desbloquear Checklist',
        subtitle: 'Use sua impressão digital ou Face ID',
        description: 'Segurança exigida para acesso ao painel.',
      });
      
      isPrompting.current = false;
      onUnlock();
    } catch (err: any) {
      isPrompting.current = false;
      console.error('Biometric authentication failed', err);
      setError('Autenticação falhou ou foi cancelada.');
    }
  };

  if (!isSupported) {
    return (
      <div style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Verificando segurança...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text)', alignItems: 'center', justifyContent: 'center', padding: 'var(--s6)' }}>
      <div className="card animate-in" style={{ width: '100%', maxWidth: 400, padding: 'var(--s8)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 'var(--s5)' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--primary-hl)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--s2)' }}>
          <Lock size={36} />
        </div>
        
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--s2)' }}>
            Aplicativo Bloqueado
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            Sessão ativa para <strong style={{ color: 'var(--text)' }}>{userEmail}</strong>
          </p>
        </div>

        {error && (
          <div style={{ padding: 'var(--s3)', background: 'var(--warning-hl)', color: 'var(--warning)', borderRadius: 'var(--r-md)', fontSize: 'var(--text-sm)', fontWeight: 600, width: '100%' }}>
            {error}
          </div>
        )}

        <button 
          onClick={triggerAuth} 
          className="btn-primary" 
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: 'var(--s4)' }}
        >
          <Fingerprint size={20} />
          Desbloquear com Digital
        </button>

        <button 
          onClick={onLogout} 
          className="btn-ghost" 
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: 'var(--s2)' }}
        >
          <LogOut size={16} />
          Sair e trocar de conta
        </button>
      </div>
    </div>
  );
}