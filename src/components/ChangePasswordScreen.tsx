import React, { useState, useEffect } from 'react';
import { Lock, AlertCircle, CheckCircle, ArrowRight, Loader2, ShieldCheck, LogOut } from 'lucide-react';
import { supabase } from '../supabase';

interface Props {
  userEmail: string;
  onPasswordChanged: () => void;
}

export default function ChangePasswordScreen({ userEmail, onPasswordChanged }: Props) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  // Se o usuário recarregar a página (F5) ou fechar e abrir o app enquanto
  // ainda não trocou a senha, limpamos a sessão para que volte ao login.
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Não fazemos signOut aqui porque o evento não é async-friendly.
      // Ao voltar, o App.tsx já lê force_password_change do metadata e
      // mostrará esta tela novamente — comportamento correto.
      // O fix real está no botão "Sair" abaixo.
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // O onAuthStateChange no App.tsx vai detectar e redirecionar para login
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        data: { force_password_change: false },
      });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => onPasswordChanged(), 1500);
    } catch (err: any) {
      setErrorMsg('Erro ao alterar a senha: ' + err.message);
    } finally {
      setLoading(false);
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
        backgroundImage: `radial-gradient(circle at 20% 20%, rgba(13,148,136,0.06) 0%, transparent 60%),
          radial-gradient(circle at 80% 80%, rgba(45,212,191,0.05) 0%, transparent 50%)`,
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(var(--divider) 1px, transparent 1px),
          linear-gradient(90deg, var(--divider) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        opacity: 0.5,
      }} />

      {/* Botão sair — canto superior direito */}
      <button
        onClick={handleLogout}
        style={{
          position: 'absolute', top: 'var(--s4)', right: 'var(--s4)',
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px var(--s4)', borderRadius: 'var(--r-lg)',
          background: 'transparent', border: '1px solid var(--sidebar-border)',
          color: 'var(--text-muted)', fontSize: 'var(--text-sm)', fontWeight: 600,
          cursor: 'pointer', zIndex: 10,
        }}
        title="Sair e voltar ao login"
      >
        <LogOut size={15} />
        Sair
      </button>

      <div className="animate-in" style={{
        width: '100%', maxWidth: '440px',
        display: 'flex', flexDirection: 'column', gap: 'var(--s6)',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--s2)' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 'var(--r-xl)',
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--s4)',
            boxShadow: '0 8px 24px rgba(13,148,136,0.35)',
          }}>
            <ShieldCheck size={28} color="#fff" strokeWidth={1.5} />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)',
            fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}>Alterar Senha</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginTop: 'var(--s2)', fontWeight: 500 }}>
            Por segurança, crie uma nova senha antes de continuar.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginTop: 'var(--s1)' }}>
            {userEmail}
          </p>
        </div>

        <div className="card" style={{ padding: 'var(--s8)', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, var(--primary), #06b6d4, var(--primary))',
          }} />

          {errorMsg && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 'var(--s3)',
              padding: 'var(--s3) var(--s4)', borderRadius: 'var(--r-lg)',
              background: 'var(--danger-hl)',
              border: '1px solid rgba(220,38,38,0.2)',
              marginBottom: 'var(--s6)',
              fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--danger)',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {success && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--s3)',
              padding: 'var(--s3) var(--s4)', borderRadius: 'var(--r-lg)',
              background: 'rgba(13,148,136,0.1)',
              border: '1px solid rgba(13,148,136,0.3)',
              marginBottom: 'var(--s6)',
              fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--primary)',
            }}>
              <CheckCircle size={16} />
              <span>Senha atualizada! Redirecionando...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s5)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)' }}>
                Nova Senha
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute', left: 'var(--s4)', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input
                  type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required minLength={6} className="input"
                  style={{ paddingLeft: 'calc(var(--s4) + 16px + var(--s2))' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)' }}>
                Confirmar Senha
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute', left: 'var(--s4)', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input
                  type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  required minLength={6} className="input"
                  style={{ paddingLeft: 'calc(var(--s4) + 16px + var(--s2))' }}
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading || success} className="btn-primary"
              style={{ marginTop: 'var(--s2)', width: '100%', height: 48 }}
            >
              {loading
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</>
                : <>Salvar Nova Senha <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-faint)', lineHeight: 1.6 }}>
          Se preferir, clique em <strong>Sair</strong> no canto superior direito para voltar ao login sem alterar a senha agora.
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
