import React, { useState, useEffect } from 'react';
import { UserPlus, Users, RefreshCcw, Shield, AlertCircle, Trash2, X, KeyRound, Clock, ShieldCheck, ShieldAlert, Eye, EyeOff, LayoutDashboard, ListTodo, CheckCircle2, FileText } from 'lucide-react';
import Header from './Header';
import CustomSelect from './CustomSelect';
import SupervisorDashboard from './SupervisorDashboard';
import ReportModal from './ReportModal';
import { supabase } from '../supabase';
import { OccurrenceData } from '../types';
import { CHECKLIST_DATA } from '../constants';

interface AdminScreenProps {
  onLogout: () => void;
  currentUserEmail: string;
  useBiometrics?: boolean;
  onToggleBiometrics?: () => void;
  occurrences?: OccurrenceData[];
  checklistState?: Record<string, boolean>;
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
  temp_password?: string | null;
  user_metadata?: any;
  app_metadata?: any;
}

interface ChecklistSection {
  id: string;
  title: string;
  items: string[];
}

function isPasswordPending(user: ManagedUser): boolean {
  if (user.user_metadata && typeof user.user_metadata.force_password_change !== 'undefined') {
    return user.user_metadata.force_password_change === true;
  }
  return user.force_password_change === true;
}

function generatePassword(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pass = '';
  for (let i = 0; i < length; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
  return pass;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminScreen({ onLogout, currentUserEmail, useBiometrics, onToggleBiometrics, occurrences = [], checklistState = {} }: AdminScreenProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'dashboard' | 'checklist'>('users');
  const [showReportModal, setShowReportModal] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'supervisor' | 'colaborador'>('colaborador');
  const [shift, setShift] = useState('TURNO A');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState(() => generatePassword());
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [confirmDelete, setConfirmDelete] = useState<ManagedUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editUser, setEditUser] = useState<ManagedUser | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'supervisor' | 'colaborador'>('colaborador');
  const [editShift, setEditShift] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // --- Checklist Management State ---
  const [checklistTemplate, setChecklistTemplate] = useState<ChecklistSection[]>(() => {
    const saved = localStorage.getItem('checklist_template');
    return saved ? JSON.parse(saved) : CHECKLIST_DATA;
  });
  const [saveChecklistSuccess, setSaveChecklistSuccess] = useState(false);

  useEffect(() => {
    async function loadTemplate() {
      const { data, error } = await supabase
        .from('checklist_templates')
        .select('data')
        .eq('key', 'padrao')
        .single();
      if (data && data.data) {
        setChecklistTemplate(data.data as ChecklistSection[]);
        localStorage.setItem('checklist_template', JSON.stringify(data.data));
      }
    }
    loadTemplate();
  }, []);

  const handleUpdateSectionTitle = (sectionIndex: number, newTitle: string) => {
    const newTemplate = [...checklistTemplate];
    newTemplate[sectionIndex].title = newTitle;
    setChecklistTemplate(newTemplate);
  };

  const handleUpdateItem = (sectionIndex: number, itemIndex: number, newValue: string) => {
    const newTemplate = [...checklistTemplate];
    newTemplate[sectionIndex].items[itemIndex] = newValue;
    setChecklistTemplate(newTemplate);
  };

  const handleAddItem = (sectionIndex: number) => {
    const newTemplate = [...checklistTemplate];
    newTemplate[sectionIndex].items.push('Novo item de inspeção');
    setChecklistTemplate(newTemplate);
  };

  const handleDeleteItem = (sectionIndex: number, itemIndex: number) => {
    const newTemplate = [...checklistTemplate];
    newTemplate[sectionIndex].items.splice(itemIndex, 1);
    setChecklistTemplate(newTemplate);
  };

  const handleAddSection = () => {
    const newTemplate = [...checklistTemplate];
    newTemplate.push({
      id: `secao_${Date.now()}`,
      title: 'Nova Seção',
      items: ['Novo item']
    });
    setChecklistTemplate(newTemplate);
  };

  const handleDeleteSection = (sectionIndex: number) => {
    const newTemplate = [...checklistTemplate];
    newTemplate.splice(sectionIndex, 1);
    setChecklistTemplate(newTemplate);
  };

  const handleSaveChecklistTemplate = async () => {
    try {
      const { error } = await supabase
        .from('checklist_templates')
        .upsert(
          { key: 'padrao', data: checklistTemplate, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );

      if (error) throw error;

      localStorage.setItem('checklist_template', JSON.stringify(checklistTemplate));
      setSaveChecklistSuccess(true);
      setTimeout(() => setSaveChecklistSuccess(false), 3000);
    } catch (err: any) {
      alert('Erro ao salvar template: ' + err.message);
    }
  };

  const functionUrl = 'https://aogzdxwruaqgiaprmvuz.supabase.co/functions/v1/create-user';
  const listUrl = 'https://aogzdxwruaqgiaprmvuz.supabase.co/functions/v1/list-users';

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error('Sessão inválida. Faça login novamente.');
    return token;
  };

  const openEditModal = (user: ManagedUser) => {
    setEditUser(user);
    setEditFullName(user.full_name || '');
    setEditRole(user.role || 'colaborador');
    setEditShift(user.shift || 'TURNO A');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setSavingEdit(true);
    setErrorMsg('');
    try {
      const token = await getToken();
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          user_id: editUser.id,
          email: editUser.email,
          full_name: editFullName.trim(),
          role: editRole,
          turno: editShift,
          update_user: true
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erro ao atualizar usuário');
      setEditUser(null);
      await loadUsers();
    } catch (err: any) {
      setErrorMsg('Erro na edição: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = await getToken();
      const res = await fetch(listUrl, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar usuários');
      setUsers(data.users as ManagedUser[]);
    } catch (err: any) {
      setErrorMsg('Erro ao carregar usuários: ' + err.message);
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
    setErrorMsg('');
  };

  const togglePasswordVisible = (userId: string) => {
    setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    const pwd = generatedPassword;
    try {
      const token = await getToken();
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: email.trim(), full_name: fullName.trim(), role, turno: shift, password: pwd }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erro ao criar usuário');
      setVisiblePasswords(prev => ({ ...prev, [result.user_id]: true }));
      resetForm();
      await loadUsers();
    } catch (err: any) {
      setErrorMsg('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (user: ManagedUser) => {
    setErrorMsg('');
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
      setVisiblePasswords(prev => ({ ...prev, [user.id]: true }));
      await loadUsers();
    } catch (err: any) {
      setErrorMsg('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    setErrorMsg('');
    try {
      const token = await getToken();
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: confirmDelete.email, full_name: confirmDelete.full_name, role: confirmDelete.role, delete_user: true }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erro ao excluir usuário');
      setConfirmDelete(null);
      await loadUsers();
    } catch (err: any) {
      setErrorMsg('Erro: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const StatusBadge = ({ user }: { user: ManagedUser }) => {
    if (!user.last_sign_in_at) return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', fontSize: 11, fontWeight: 700, color: '#fbbf24' }}>
        <Clock size={11} /> Aguardando 1º acesso
      </span>
    );
    if (isPasswordPending(user)) return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999, background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.3)', fontSize: 11, fontWeight: 700, color: '#fb923c' }}>
        <ShieldAlert size={11} /> Senha pendente
      </span>
    );
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
        subtitle="Gerencie acessos, crie usuários e modifique o checklist"
        showSyncStatus={true} role="admin" onLogout={onLogout}
        useBiometrics={useBiometrics} onToggleBiometrics={onToggleBiometrics}
      />

      {/* Tab Bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--divider)', background: 'var(--surface)' }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{ flex: 1, padding: 'var(--s3)', fontWeight: 600, color: activeTab === 'users' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'users' ? '2px solid var(--primary)' : '2px solid transparent' }}
        >
          <Users size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} /> Usuários
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          style={{ flex: 1, padding: 'var(--s3)', fontWeight: 600, color: activeTab === 'dashboard' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'dashboard' ? '2px solid var(--primary)' : '2px solid transparent' }}
        >
          <LayoutDashboard size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} /> Dashboard
        </button>
        <button
          onClick={() => setActiveTab('checklist')}
          style={{ flex: 1, padding: 'var(--s3)', fontWeight: 600, color: activeTab === 'checklist' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'checklist' ? '2px solid var(--primary)' : '2px solid transparent' }}
        >
          <ListTodo size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} /> Checklist
        </button>
      </div>

      {/* Botão de Relatório flutuante — visível em qualquer aba */}
      <div style={{
        position: 'fixed', bottom: 24, right: 20, zIndex: 100,
      }}>
        <button
          onClick={() => setShowReportModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 20px',
            borderRadius: 'var(--r-full)',
            background: 'var(--primary)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 'var(--text-sm)',
            boxShadow: '0 8px 24px rgba(1,105,111,0.45)',
            border: 'none',
            cursor: 'pointer',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 32px rgba(1,105,111,0.55)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(1,105,111,0.45)';
          }}
        >
          <FileText size={18} />
          Gerar Relatório
        </button>
      </div>

      {/* Dashboard tab — now uses SupervisorDashboard (same as supervisor role) */}
      {activeTab === 'dashboard' && (
        <SupervisorDashboard occurrences={occurrences} checklistState={checklistState} />
      )}

      {activeTab === 'users' && (
        <>
          <div className="admin-stats-grid">
            {[
              { label: 'Total de usuários', value: String(users.length), icon: Users, tone: 'var(--primary)', bg: 'var(--primary-hl)' },
              { label: 'Supervisores', value: String(users.filter(u => u.role === 'supervisor').length), icon: Shield, tone: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
              { label: 'Colaboradores', value: String(users.filter(u => u.role === 'colaborador').length), icon: Users, tone: 'var(--success)', bg: 'var(--success-hl)' },
              { label: 'Ativos', value: String(users.filter(u => u.last_sign_in_at && !isPasswordPending(u)).length), icon: ShieldCheck, tone: 'var(--success)', bg: 'var(--success-hl)' },
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

          <div className="admin-content-grid" style={{ flex: 1, overflowY: 'auto' }}>
            <section className="card" style={{ padding: 'var(--s6)', alignSelf: 'start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', marginBottom: 'var(--s5)' }}>
                <UserPlus size={20} color="var(--primary)" />
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Criar novo usuário</h2>
              </div>
              {errorMsg && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--s3)', padding: 'var(--s3) var(--s4)', borderRadius: 'var(--r-lg)', background: 'var(--danger-hl)', border: '1px solid rgba(220,38,38,0.2)', marginBottom: 'var(--s5)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--danger)' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{errorMsg}</span>
                </div>
              )}
              <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
                <div>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: 'var(--s2)' }}>Nome completo</label>
                  <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nome do colaborador" required />
                </div>
                <div>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: 'var(--s2)' }}>E-mail</label>
                  <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@empresa.com" required />
                </div>
                <div>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: 'var(--s2)' }}>Perfil</label>
                  <CustomSelect value={role} onChange={(v) => setRole(v as 'supervisor' | 'colaborador')} options={[{ value: 'colaborador', label: 'Colaborador' }, { value: 'supervisor', label: 'Supervisor' }]} />
                </div>
                <div>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: 'var(--s2)' }}>Turno</label>
                  <CustomSelect value={shift} onChange={setShift} options={[{ value: 'TURNO A', label: 'TURNO A' }, { value: 'TURNO B', label: 'TURNO B' }, { value: 'TURNO C', label: 'TURNO C' }, { value: 'TURNO D', label: 'TURNO D' }]} />
                </div>
                <div style={{ padding: 'var(--s4)', borderRadius: 'var(--r-xl)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 'var(--s2)' }}>Senha temporária</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--s3)' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 800, letterSpacing: '0.15em', color: 'var(--primary)' }}>{generatedPassword}</span>
                    <button type="button" onClick={() => setGeneratedPassword(generatePassword())} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 'var(--text-xs)' }}>
                      <RefreshCcw size={13} /> Nova
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', height: 46 }}>
                  {loading ? 'Processando...' : 'Criar acesso'}
                </button>
              </form>
            </section>

            <section className="card" style={{ padding: 'var(--s6)', minWidth: 0, alignSelf: 'start' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--s4)', marginBottom: 'var(--s5)', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Usuários cadastrados</h2>
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
                  {users.map(user => {
                    const pwd = user.temp_password;
                    const pwdVisible = visiblePasswords[user.id];
                    return (
                      <div key={user.id} style={{ padding: 'var(--s4)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--s3)', flexWrap: 'wrap' }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>{user.full_name || 'Usuário sem nome'}</div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2, wordBreak: 'break-word' }}>{user.email}</div>
                          </div>
                          {user.role !== 'admin' ? (
                            <div style={{ display: 'flex', gap: 'var(--s2)', flexShrink: 0 }}>
                              <button type="button" onClick={() => openEditModal(user)} className="btn-secondary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 11px' }}>
                                <UserPlus size={14} /> Editar
                              </button>
                              <button type="button" onClick={() => handleResetPassword(user)} className="btn-secondary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 11px' }}>
                                <KeyRound size={14} /> Redefinir
                              </button>
                              <button type="button" onClick={() => setConfirmDelete(user)} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 11px', borderRadius: 'var(--r-lg)', background: 'var(--danger-hl)', border: '1px solid rgba(220,38,38,0.25)', color: 'var(--danger)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
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
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', display: 'flex', gap: 'var(--s4)', flexWrap: 'wrap', marginTop: 'var(--s3)' }}>
                          <span>Criado: {formatDate(user.created_at)}</span>
                          <span>Último acesso: {formatDate(user.last_sign_in_at)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </>
      )}

      {activeTab === 'checklist' && (
        <div style={{ padding: 'var(--s6)', flex: 1, overflowY: 'auto' }}>
          <div className="card" style={{ padding: 'var(--s6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--s5)', flexWrap: 'wrap', gap: 'var(--s4)' }}>
              <div>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Gestão do Checklist</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginTop: 4 }}>Configure os itens que os operadores deverão inspecionar diariamente.</p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--s3)', alignItems: 'center' }}>
                {saveChecklistSuccess && (
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={16} /> Salvo com sucesso
                  </span>
                )}
                <button onClick={handleAddSection} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <UserPlus size={16} /> Nova Seção
                </button>
                <button onClick={handleSaveChecklistTemplate} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Salvar Checklist
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s6)' }}>
              {checklistTemplate.map((section, sIdx) => (
                <div key={section.id} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: 'var(--s5)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', marginBottom: 'var(--s4)' }}>
                    <input
                      value={section.title}
                      onChange={(e) => handleUpdateSectionTitle(sIdx, e.target.value)}
                      style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px dashed var(--border)', fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text)', padding: '4px 0' }}
                    />
                    <button onClick={() => handleDeleteSection(sIdx)} style={{ color: 'var(--danger)', background: 'rgba(220,38,38,0.1)', padding: 6, borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center' }} title="Excluir Seção">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
                    {section.items.map((item, iIdx) => (
                      <div key={iIdx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
                        <input
                          value={item}
                          onChange={(e) => handleUpdateItem(sIdx, iIdx, e.target.value)}
                          className="input"
                          style={{ flex: 1, height: 40 }}
                        />
                        <button onClick={() => handleDeleteItem(sIdx, iIdx)} style={{ color: 'var(--text-muted)', padding: 6, display: 'flex', alignItems: 'center' }} title="Remover item">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => handleAddItem(sIdx)} style={{ alignSelf: 'flex-start', color: 'var(--primary)', background: 'transparent', fontWeight: 600, fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 'var(--s2)' }}>
                      + Adicionar item
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal edição */}
      {editUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 'var(--s4)', animation: 'fadeIn 0.15s ease' }}>
          <div style={{ width: '100%', maxWidth: 440, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-2xl)', boxShadow: '0 25px 60px rgba(0,0,0,0.6)', overflow: 'hidden', animation: 'slideUp 0.2s ease' }}>
            <div style={{ padding: 'var(--s6) var(--s6) var(--s5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s4)' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--primary-hl)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <UserPlus size={24} />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>Editar Usuário</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>{editUser.email}</div>
                </div>
              </div>
              <button onClick={() => setEditUser(null)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', color: 'var(--text-muted)', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} style={{ padding: 'var(--s6)', display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: 'var(--s2)' }}>Nome completo</label>
                <input className="input" value={editFullName} onChange={e => setEditFullName(e.target.value)} placeholder="Nome do colaborador" required />
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: 'var(--s2)' }}>Perfil</label>
                <CustomSelect value={editRole} onChange={(v) => setEditRole(v as 'supervisor' | 'colaborador')} options={[{ value: 'colaborador', label: 'Colaborador' }, { value: 'supervisor', label: 'Supervisor' }, { value: 'admin', label: 'Administrador' }]} />
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: 'var(--s2)' }}>Turno</label>
                <CustomSelect value={editShift} onChange={setEditShift} options={[{ value: 'TURNO A', label: 'TURNO A' }, { value: 'TURNO B', label: 'TURNO B' }, { value: 'TURNO C', label: 'TURNO C' }, { value: 'TURNO D', label: 'TURNO D' }]} />
              </div>
              <div style={{ display: 'flex', gap: 'var(--s3)', marginTop: 'var(--s4)' }}>
                <button type="button" onClick={() => setEditUser(null)} disabled={savingEdit} style={{ flex: 1, height: 46, borderRadius: 'var(--r-lg)', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={savingEdit} style={{ flex: 1, height: 46, borderRadius: 'var(--r-lg)', background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                  {savingEdit ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal exclusão */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 'var(--s4)' }}>
          <div style={{ width: '100%', maxWidth: 440, background: 'var(--surface)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 'var(--r-2xl)' }}>
            <div style={{ padding: 'var(--s6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s4)', marginBottom: 'var(--s5)' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(220,38,38,0.15)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={24} /></div>
                <div>
                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--text)' }}>Excluir usuário</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', fontWeight: 600 }}>Ação irreversível</div>
                </div>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--s6)' }}>Ao confirmar, o usuário perderá acesso imediato ao sistema.</p>
              <div style={{ display: 'flex', gap: 'var(--s3)' }}>
                <button type="button" onClick={() => setConfirmDelete(null)} disabled={deleting} style={{ flex: 1, height: 46, borderRadius: 'var(--r-lg)', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', fontWeight: 600 }}>Cancelar</button>
                <button type="button" onClick={handleDeleteUser} disabled={deleting} style={{ flex: 1, height: 46, borderRadius: 'var(--r-lg)', background: '#dc2626', color: '#fff', fontWeight: 700 }}>{deleting ? 'Excluindo...' : 'Sim, excluir'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Relatório */}
      {showReportModal && (
        <ReportModal
          onClose={() => setShowReportModal(false)}
          occurrences={occurrences}
          checklistState={checklistState}
          currentUserEmail={currentUserEmail}
        />
      )}
    </div>
  );
}
