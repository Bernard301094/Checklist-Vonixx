import { useState } from 'react';
import { Lock, LogOut, Fingerprint } from 'lucide-react';
import { NativeBiometric } from 'capacitor-native-biometric';

interface LockScreenProps {
  onUnlock: () => void;
  onLogout: () => void;
  userEmail: string;
}

export default function LockScreen({ onUnlock, onLogout, userEmail }: LockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [bioLoading, setBioLoading] = useState(false);

  const handleBiometric = async () => {
    setBioLoading(true);
    setError('');
    try {
      await NativeBiometric.verifyIdentity({
        reason: 'Confirme sua identidade para desbloquear o aplicativo',
        title: 'Autenticação Biométrica',
        subtitle: 'Use sua impressão digital ou reconhecimento facial',
        description: userEmail,
        useFallback: true,
        maxAttempts: 3,
      });
      onUnlock();
    } catch (err: any) {
      if (err?.code === 10) {
        // Usuário cancelou
        setError('');
      } else {
        setError('Biometria não reconhecida. Tente o PIN.');
      }
    } finally {
      setBioLoading(false);
    }
  };

  const handlePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length >= 4) {
      onUnlock();
    } else {
      setError('PIN deve ter pelo menos 4 dígitos.');
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: 'var(--s4)',
      fontFamily: 'var(--font-body)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `radial-gradient(circle at 50% 30%, rgba(13,148,136,0.07) 0%, transparent 60%)`,
      }} />

      <div className="animate-in" style={{
        width: '100%', maxWidth: '380px',
        display: 'flex', flexDirection: 'column', gap: 'var(--s6)',
        position: 'relative', zIndex: 1,
        alignItems: 'center', textAlign: 'center',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 'var(--r-xl)',
          background: 'var(--sidebar-surface)',
          border: '1px solid var(--sidebar-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}>
          <Lock size={30} color="var(--primary)" strokeWidth={1.5} />
        </div>

        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)',
            fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em',
          }}>Sessão bloqueada</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginTop: 'var(--s2)' }}>
            {userEmail}
          </p>
        </div>

        <button
          onClick={handleBiometric}
          disabled={bioLoading}
          className="btn-primary"
          style={{ width: '100%', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--s3)' }}
        >
          <Fingerprint size={20} />
          {bioLoading ? 'Aguardando biometria...' : 'Desbloquear com biometria'}
        </button>

        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--s3)', color: 'var(--text-faint)', fontSize: 'var(--text-xs)' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--divider)' }} />
          ou
          <div style={{ flex: 1, height: 1, background: 'var(--divider)' }} />
        </div>

        <form onSubmit={handlePin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
          {error && (
            <p style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>{error}</p>
          )}
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={e => { setPin(e.target.value); setError(''); }}
            placeholder="Digite o PIN"
            className="input"
            style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: 'var(--text-lg)' }}
          />
          <button type="submit" className="btn-secondary" style={{ width: '100%', height: 46 }}>
            Desbloquear com PIN
          </button>
        </form>

        <button
          onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'transparent', border: 'none',
            color: 'var(--text-faint)', fontSize: 'var(--text-sm)',
            cursor: 'pointer', fontWeight: 600,
          }}
        >
          <LogOut size={15} /> Sair da conta
        </button>
      </div>
    </div>
  );
}
