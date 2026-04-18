import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, ArrowRight, Loader2, Factory } from 'lucide-react';
import { supabase } from '../supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Conta criada! Verifique seu e-mail se necessário.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      if (error.status === 429) setErrorMsg('Muitas tentativas. Aguarde alguns segundos.');
      else if (error.message === 'Email not confirmed') setErrorMsg('E-mail não confirmado. Verifique sua caixa de entrada.');
      else if (error.status === 400 || error.code === 'invalid_credentials') setErrorMsg('Credenciais inválidas. Verifique e-mail e senha.');
      else setErrorMsg('Erro na autenticação: ' + error.message);
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
            <Factory size={28} color="#fff" strokeWidth={1.5} />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)',
            fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}>Indústria 4.0 Pro</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginTop: 'var(--s2)', fontWeight: 500 }}>
            {isRegistering ? 'Crie sua conta para começar' : 'Acesse o painel de gestão industrial'}
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s5)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)' }}>
                Endereço de E-mail
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{
                  position: 'absolute', left: 'var(--s4)', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="operador@industria.com"
                  required className="input"
                  style={{ paddingLeft: 'calc(var(--s4) + 16px + var(--s2))' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)' }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute', left: 'var(--s4)', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required minLength={6} className="input"
                  style={{ paddingLeft: 'calc(var(--s4) + 16px + var(--s2))' }}
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading} className="btn-primary"
              style={{ marginTop: 'var(--s2)', width: '100%', height: 48 }}
            >
              {loading
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Aguarde...</>
                : <>{isRegistering ? 'Criar Conta' : 'Entrar na Plataforma'} <ArrowRight size={16} /></>}
            </button>
          </form>

          <div style={{
            marginTop: 'var(--s6)', paddingTop: 'var(--s6)',
            borderTop: '1px solid var(--divider)', textAlign: 'center',
          }}>
            <button
              type="button" onClick={() => { setIsRegistering(!isRegistering); setErrorMsg(''); }}
              style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {isRegistering ? 'Já tem conta? Fazer Login' : 'Não tem conta? Cadastrar-se'}
            </button>
          </div>
        </div>

        <div style={{
          padding: 'var(--s4)', borderRadius: 'var(--r-lg)',
          background: 'var(--primary-hl)',
          border: '1px solid rgba(13,148,136,0.15)',
          fontSize: 'var(--text-xs)', color: 'var(--text-muted)',
          lineHeight: 1.6,
        }}>
          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Dica de acesso:</span>
          {' '}E-mails com <strong style={{ color: 'var(--text)' }}>supervisor</strong> no endereço acessam o painel gerencial completo. Demais usuários acessam a tela de operação e checklists.
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
