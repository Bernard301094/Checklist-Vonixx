import { useState, useEffect } from 'react';
import { UserPlus, Users, RefreshCcw, Shield, AlertCircle, CheckCircle2, Trash2, X, KeyRound, Clock, ShieldCheck, ShieldAlert } from 'lucide-react';
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
  last_sign_in_at?: string | null;
  force_password_change?: boolean;
}

function generatePassword(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pass = '';
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

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
  const [generatedPassword, setGeneratedPassword] = useState(() => generatePassword());
  const [lastCreatedPassword, setLastCreatedPassword] = useState<{ email: string; password: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ManagedUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [resetInfo, setResetInfo] = useState<{ email: string; password: string } | null>(null);

  const functionUrl = 'https://aogzdxwruaqgiaprmvuz.supabase.co/functions/v1/create-user';
  const listUrl = 'https://aogzdxwruaqgiaprmvuz.supabase.co/functions/v1/list-users';

  const getToken = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error('Sess\u00e3o inv\u00e1lida. Fa\u00e7a login novamente.');
    return token;
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = await getToken();
      const res = await fetch(listUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar usu\u00e1rios');
      setUsers(data.users as ManagedUser[]);
    } catch (err: any) {
      setMessage('Erro ao carregar usu\u00e1rios: ' + err.message);
      setMessageType('error');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const resetForm = () => {
    setEmail('');
    setFullName('');
    setRole('colaborador');
    setShift('TURNO A');
    setGeneratedPassword(generatePassword());
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setLastCreatedPassword(null);
    const pwd = generatedPassword;
    try {
      const token = await getToken();
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: email.trim(), full_name: fullName.trim(), role, turno: shift, password: pwd }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erro ao criar usu\u00e1rio');
      setLastCreatedPassword({ email: email.trim(), password: pwd });
      setMessage('success');
      setMessageType('success');
      resetForm();
      await loadUsers();
    } catch (err: any) {
      setMessage('Erro: ' + err.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (user: ManagedUser) => {
    setMessage('');
    setResetInfo(null);
    setLoading(true);
    const newPassword = generatePassword();
    try {
      const token = await getToken();
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          email: user.email, full_name: user.full_name,
          role: user.role === 'admin' ? 'colaborador' : user.role,
          turno: user.shift || 'TURNO A', password: newPassword, reset_existing_user: true,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erro ao redefinir senha');
      setResetInfo({ email: user.email, password: newPassword });
      await loadUsers();
    } catch (err: any) {
      setMessage('Erro: ' + err.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    setMessage('');
    try {
      const token = await getToken();
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: confirmDelete.email, full_name: confirmDelete.full_name, role: confirmDelete.role, delete_user: true }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erro ao excluir usu\u00e1rio');
      setMessage(`Usu\u00e1rio ${confirmDelete.email} exclu\u00eddo com sucesso.`);
      setMessageType('success');
      setConfirmDelete(null);
      await loadUsers();
    } catch (err: any) {
      setMessage('Erro: ' + err.message);
      setMessageType('error');
    } finally {
      setDeleting(false);
    }
  };

  // Badge de status do usuário
  const StatusBadge = ({ user }: { user: ManagedUser }) => {
    if (!user.last_sign_in_at) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', fontSize: 11, fontWeight: 700, color: '#fbbf24' }}>
          <Clock size={11} /> Aguardando 1\u00ba acesso
        </span>
      );
    }
    if (user.force_password_change) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999, background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.3)', fontSize: 11, fontWeight: 700, color: '#fb923c' }}>
          <ShieldAlert size={11} /> Senha pendente
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999, background: 'var(--success-hl)', border: '1px solid rgba(13,148,136,0.25)', fontSize: 11, fontWeight: 700, color: 'var(--success)' }}>
        <ShieldCheck size={11} /> Ativo
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text)' }}>
      <Header
        userEmail={currentUserEmail}
        title="Painel Administrativo"
        subtitle="Gerencie acessos, crie usu\u00e1rios e redefina senhas tempor\u00e1rias"
        showSyncStatus={true} role="admin" onLogout={onLogout}
        useBiometrics={useBiometrics} onToggleBiometrics={onToggleBiometrics}
      />

      {/* Stats */}
      <div style={{ padding: 'var(--s5) var(--s6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--s4)', borderBottom: '1px solid var(--divider)', background: 'var(--surface)' }}>
        {[
          { label: 'Total de usu\u00e1rios', value: String(users.length), icon: Users, tone: 'var(--primary)', bg: 'var(--primary-hl)' },
          { label: 'Supervisores', value: String(users.filter(u => u.role === 'supervisor').length), icon: Shield, tone: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
          { label: 'Colaboradores', value: String(users.filter(u => u.role === 'colaborador').length), icon: Users, tone: 'var(--success)', bg: 'var(--success-hl)' },
          { label: 'Ativos', value: String(users.filter(u => u.last_sign_in_at && !u.force_password_change).length), icon: ShieldCheck, tone: 'var(--success)', bg: 'var(--success-hl)' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card" style={{ padding: 'var(--s5)', display: 'flex', alignItems: 'center', gap: 'var(--s4)' }}>
              <div style={{ width: 46, height: 46, borderRadius: 'var(--r-xl)', background: stat.bg, color: stat.tone, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={21} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 'var(--s1)' }}>{stat.label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>{stat.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--s6)', display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) minmax(0, 1fr)', gap: 'var(--s6)' }}>

        {/* Formul\u00e1rio criar usu\u00e1rio */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s5)' }}>
          <section className="card" style={{ padding: 'var(--s6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', marginBottom: 'var(--s5)' }}>
              <UserPlus size={20} color="var(--primary)" />
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Criar novo usu\u00e1rio</h2>
            </div>

            {message && message !== 'success' && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--s3)', padding: 'var(--s3) var(--s4)', borderRadius: 'var(--r-lg)', background: 'var(--danger-hl)', border: '1px solid rgba(220,38,38,0.2)', marginBottom: 'var(--s5)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--danger)' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
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
                <CustomSelect value={role} onChange={(v) => setRole(v as 'supervisor' | 'colaborador')} options={[{ value: 'colaborador', label: 'Colaborador' }, { value: 'supervisor', label: 'Supervisor' }]} />
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 'var(--s2)' }}>Turno</label>
                <CustomSelect value={shift} onChange={setShift} options={[{ value: 'TURNO A', label: 'TURNO A' }, { value: 'TURNO B', label: 'TURNO B' }, { value: 'TURNO C', label: 'TURNO C' }, { value: 'TURNO D', label: 'TURNO D' }]} />
              </div>
              <div style={{ padding: 'var(--s4)', borderRadius: 'var(--r-xl)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 'var(--s2)' }}>Senha tempor\u00e1ria</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--s3)' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 800, letterSpacing: '0.15em', color: 'var(--primary)' }}>{generatedPassword}</span>
                  <button type="button" onClick={() => setGeneratedPassword(generatePassword())} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 'var(--text-xs)' }}>
                    <RefreshCcw size={13} /> Nova
                  </button>
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--s2)' }}>O usu\u00e1rio dever\u00e1 trocar esta senha no primeiro acesso.</p>
              </div>
              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', height: 46 }}>
                {loading ? 'Processando...' : 'Criar acesso'}
              </button>
            </form>
          </section>

          {/* Card de sucesso com senha gerada */}
          {lastCreatedPassword && (
            <section className="card animate-in" style={{ padding: 'var(--s6)', border: '1px solid rgba(13,148,136,0.3)', background: 'rgba(13,148,136,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', marginBottom: 'var(--s4)' }}>
                <CheckCircle2 size={20} color="var(--success)" />
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--success)' }}>Acesso criado com sucesso!</h3>
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--s3)' }}>Compartilhe estas credenciais com o usu\u00e1rio:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)', padding: 'var(--s4)', background: 'var(--surface-2)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 'var(--text-sm)' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>E-mail: </span>
                  <span style={{ fontWeight: 700 }}>{lastCreatedPassword.email}</span>
                </div>
                <div style={{ fontSize: 'var(--text-sm)' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Senha tempor\u00e1ria: </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-lg)', letterSpacing: '0.15em', color: 'var(--primary)' }}>{lastCreatedPassword.password}</span>
                </div>
              </div>
              <button type="button" onClick={() => setLastCreatedPassword(null)} style={{ marginTop: 'var(--s3)', background: 'transparent', border: 'none', color: 'var(--text-faint)', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>Fechar</button>
            </section>
          )}

          {/* Card de reset de senha */}
          {resetInfo && (
            <section className="card animate-in" style={{ padding: 'var(--s6)', border: '1px solid rgba(251,146,60,0.3)', background: 'rgba(251,146,60,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', marginBottom: 'var(--s4)' }}>
                <KeyRound size={20} color="#fb923c" />
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: '#fb923c' }}>Senha redefinida!</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)', padding: 'var(--s4)', background: 'var(--surface-2)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 'var(--text-sm)' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>E-mail: </span>
                  <span style={{ fontWeight: 700 }}>{resetInfo.email}</span>
                </div>
                <div style={{ fontSize: 'var(--text-sm)' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Nova senha tempor\u00e1ria: </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-lg)', letterSpacing: '0.15em', color: '#fb923c' }}>{resetInfo.password}</span>
                </div>
              </div>
              <button type="button" onClick={() => setResetInfo(null)} style={{ marginTop: 'var(--s3)', background: 'transparent', border: 'none', color: 'var(--text-faint)', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>Fechar</button>
            </section>
          )}
        </div>

        {/* Lista de usu\u00e1rios */}
        <section className="card" style={{ padding: 'var(--s6)', minWidth: 0, alignSelf: 'start' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--s4)', marginBottom: 'var(--s5)', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Usu\u00e1rios cadastrados</h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 'var(--s1)' }}>Visualize acessos, redefina senhas ou exclua usu\u00e1rios.</p>
            </div>
            <button type="button" onClick={loadUsers} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
              <RefreshCcw size={15} /> Atualizar
            </button>
          </div>

          {loadingUsers ? (
            <div style={{ padding: 'var(--s8)', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando usu\u00e1rios...</div>
          ) : users.length === 0 ? (
            <div style={{ padding: 'var(--s8)', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum usu\u00e1rio encontrado.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
              {users.map(user => (
                <div key={user.id} style={{ padding: 'var(--s4)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--s3)', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text)' }}>{user.full_name || 'Usu\u00e1rio sem nome'}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2, wordBreak: 'break-word' }}>{user.email}</div>
                    </div>
                    {user.role !== 'admin' ? (
                      <div style={{ display: 'flex', gap: 'var(--s2)', flexShrink: 0 }}>
                        <button type="button" onClick={() => handleResetPassword(user)} className="btn-secondary" disabled={loading} title="Redefinir senha" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 11px' }}>
                          <KeyRound size={14} /> Redefinir
                        </button>
                        <button type="button" onClick={() => setConfirmDelete(user)} disabled={loading} title="Excluir usu\u00e1rio" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 11px', borderRadius: 'var(--r-lg)', background: 'var(--danger-hl)', border: '1px solid rgba(220,38,38,0.25)', color: 'var(--danger)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Admin</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--s2)', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="badge">{user.role}</span>
                    <span className="badge">{user.shift || 'Sem turno'}</span>
                    <StatusBadge user={user} />
                  </div>

                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', display: 'flex', gap: 'var(--s4)', flexWrap: 'wrap' }}>
                    <span>Criado: {formatDate(user.created_at)}</span>
                    <span>\u00daltimo acesso: {formatDate(user.last_sign_in_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modal de confirma\u00e7\u00e3o de exclus\u00e3o */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 'var(--s4)' }}>
          <div className="card animate-in" style={{ width: '100%', maxWidth: 420, padding: 'var(--s7)', position: 'relative' }}>
            <button onClick={() => setConfirmDelete(null)} style={{ position: 'absolute', top: 'var(--s4)', right: 'var(--s4)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--danger-hl)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--s5)' }}>
              <Trash2 size={24} />
            </div>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--s2)' }}>Confirmar exclus\u00e3o</h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 'var(--s6)' }}>
              Tem certeza que deseja excluir <strong style={{ color: 'var(--text)' }}>{confirmDelete.full_name || confirmDelete.email}</strong>?<br />
              Esta a\u00e7\u00e3o <strong style={{ color: 'var(--danger)' }}>n\u00e3o pode ser desfeita</strong>.
            </p>
            <div style={{ display: 'flex', gap: 'var(--s3)' }}>
              <button type="button" onClick={() => setConfirmDelete(null)} className="btn-secondary" style={{ flex: 1, height: 44 }} disabled={deleting}>Cancelar</button>
              <button type="button" onClick={handleDeleteUser} disabled={deleting} style={{ flex: 1, height: 44, borderRadius: 'var(--r-lg)', background: 'var(--danger)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 'var(--text-sm)', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}>
                {deleting ? 'Excluindo...' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
