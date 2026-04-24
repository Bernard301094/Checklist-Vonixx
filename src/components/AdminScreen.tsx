import { useState, useEffect } from 'react';
import { UserPlus, Users, RefreshCcw, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import Header from './Header';
import CustomSelect from './CustomSelect';
import { supabase } from '../supabase';

interface AdminScreenProps {
  onLogout: () => void;
  currentUserEmail: string;
  useBiometrics?: boolean;
  onToggleBiometrics?: () => void;
}

interface ManagedUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'supervisor' | 'colaborador';
  shift: string;
  created_at?: string;
}

const DEFAULT_PASSWORD = '123456';

export default function AdminScreen({ onLogout, currentUserEmail, useBiometrics, onToggleBiometrics }: AdminScreenProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'supervisor' | 'colaborador'>('colaborador');
  const [shift, setShift] = useState('TURNO A');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const functionUrl = 'https://aogzdxwruaqgiaprmvuz.supabase.co/functions/v1/create-user';

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, shift, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers((profiles || []) as ManagedUser[]);
    } catch (err: any) {
      setMessage('Erro ao carregar usuários: ' + err.message);
      setMessageType('error');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const resetForm = () => {
    setEmail('');
    setFullName('');
    setRole('colaborador');
    setShift('TURNO A');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Sessão inválida. Faça login novamente.');

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: email.trim(),
          full_name: fullName.trim(),
          role,
          turno: shift,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erro ao criar usuário');

      setMessage(`Usuário criado com sucesso. Senha temporária: ${DEFAULT_PASSWORD}`);
      setMessageType('success');
      resetForm();
      await loadUsers();
    } catch (err: any) {
      setMessage('Erro ao criar usuário: ' + err.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (user: ManagedUser) => {
    setMessage('');
    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Sessão inválida. Faça login novamente.');

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: user.email,
          full_name: user.full_name,
          role: user.role === 'admin' ? 'colaborador' : user.role,
          turno: user.shift || 'TURNO A',
          reset_existing_user: true,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erro ao redefinir senha');

      setMessage(`Senha redefinida para ${user.email}. Nova senha temporária: ${DEFAULT_PASSWORD}`);
      setMessageType('success');
      await loadUsers();
    } catch (err: any) {
      setMessage('Erro ao redefinir senha: ' + err.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text)' }}>
      <Header
        userEmail={currentUserEmail}
        title="Painel Administrativo"
        subtitle="Gerencie acessos, crie usuários e redefina senhas temporárias"
        showSyncStatus={true}
        role="admin"
        onLogout={onLogout}
        useBiometrics={useBiometrics}
        onToggleBiometrics={onToggleBiometrics}
      />

      <div style={{ padding: 'var(--s5) var(--s6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--s4)', borderBottom: '1px solid var(--divider)', background: 'var(--surface)' }}>
        {[
          { label: 'Total de usuários', value: String(users.length), icon: Users, tone: 'var(--primary)', bg: 'var(--primary-hl)' },
          { label: 'Supervisores', value: String(users.filter(u => u.role === 'supervisor').length), icon: Shield, tone: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
          { label: 'Colaboradores', value: String(users.filter(u => u.role === 'colaborador').length), icon: Users, tone: 'var(--success)', bg: 'var(--success-hl)' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card" style={{ padding: 'var(--s5)', display: 'flex', alignItems: 'center', gap: 'var(--s4)' }}>
              <div style={{ width: 46, height: 46, borderRadius: 'var(--r-xl)', background: stat.bg, color: stat.tone, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={21} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 'var(--s1)' }}>{stat.label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700, lineHeight: 1.1 }}>{stat.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--s6)', display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) minmax(0, 1fr)', gap: 'var(--s6)' }}>
        <section className="card" style={{ padding: 'var(--s6)', alignSelf: 'start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', marginBottom: 'var(--s5)' }}>
            <UserPlus size={20} color="var(--primary)" />
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Criar novo usuário</h2>
          </div>

          {message && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 'var(--s3)',
              padding: 'var(--s3) var(--s4)', borderRadius: 'var(--r-lg)',
              background: messageType === 'success' ? 'rgba(13,148,136,0.1)' : 'var(--danger-hl)',
              border: `1px solid ${messageType === 'success' ? 'rgba(13,148,136,0.25)' : 'rgba(220,38,38,0.2)'}`,
              marginBottom: 'var(--s5)',
              fontSize: 'var(--text-sm)', fontWeight: 500,
              color: messageType === 'success' ? 'var(--primary)' : 'var(--danger)',
            }}>
              {messageType === 'success' ? <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1 }} /> : <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />}
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
            <div>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 'var(--s2)' }}>Nome completo</label>
              <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nome do colaborador" required />
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 'var(--s2)' }}>E-mail</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@empresa.com" required />
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 'var(--s2)' }}>Perfil</label>
              <CustomSelect
                value={role}
                onChange={(v) => setRole(v as 'supervisor' | 'colaborador')}
                options={[
                  { value: 'colaborador', label: 'Colaborador' },
                  { value: 'supervisor', label: 'Supervisor' },
                ]}
              />
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 'var(--s2)' }}>Turno</label>
              <CustomSelect
                value={shift}
                onChange={setShift}
                options={[
                  { value: 'TURNO A', label: 'TURNO A' },
                  { value: 'TURNO B', label: 'TURNO B' },
                  { value: 'TURNO C', label: 'TURNO C' },
                  { value: 'TURNO D', label: 'TURNO D' },
                ]}
              />
            </div>

            <div style={{ padding: 'var(--s4)', borderRadius: 'var(--r-xl)', background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Senha temporária padrão: <strong style={{ color: 'var(--text)' }}>{DEFAULT_PASSWORD}</strong>. O usuário será obrigado a alterá-la no primeiro acesso.
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', height: 46 }}>
              {loading ? 'Processando...' : 'Criar acesso'}
            </button>
          </form>
        </section>

        <section className="card" style={{ padding: 'var(--s6)', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--s4)', marginBottom: 'var(--s5)', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Usuários cadastrados</h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 'var(--s1)' }}>Visualize acessos existentes e redefina senhas temporárias quando necessário.</p>
            </div>
            <button type="button" onClick={loadUsers} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
              <RefreshCcw size={15} /> Atualizar
            </button>
          </div>

          {loadingUsers ? (
            <div style={{ padding: 'var(--s8)', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando usuários...</div>
          ) : users.length === 0 ? (
            <div style={{ padding: 'var(--s8)', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum usuário encontrado.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
              {users.map(user => (
                <div key={user.id} style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) auto',
                  gap: 'var(--s4)',
                  alignItems: 'center',
                  padding: 'var(--s4)',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-xl)',
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text)' }}>{user.full_name || 'Usuário sem nome'}</div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 2, wordBreak: 'break-word' }}>{user.email}</div>
                    <div style={{ display: 'flex', gap: 'var(--s2)', flexWrap: 'wrap', marginTop: 'var(--s3)' }}>
                      <span className="badge">{user.role}</span>
                      <span className="badge">{user.shift || 'Sem turno'}</span>
                    </div>
                  </div>

                  {user.role !== 'admin' ? (
                    <button
                      type="button"
                      onClick={() => handleResetPassword(user)}
                      className="btn-secondary"
                      disabled={loading}
                      style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)', whiteSpace: 'nowrap' }}
                    >
                      <RefreshCcw size={15} /> Redefinir senha
                    </button>
                  ) : (
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Conta admin</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
