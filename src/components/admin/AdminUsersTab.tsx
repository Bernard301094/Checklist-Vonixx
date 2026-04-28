import React, { useState, useEffect } from 'react';
import {
  UserPlus, Users, RefreshCcw, Shield, AlertCircle, Trash2, X,
  KeyRound, Clock, ShieldCheck, ShieldAlert, CheckCircle2, Loader2, Edit3,
} from 'lucide-react';
import { supabase } from '../../supabase';
import CustomSelect from '../CustomSelect';

interface ManagedUser {
  id: string; email: string; full_name: string;
  role: 'admin' | 'supervisor' | 'colaborador';
  shift: string; created_at?: string; last_sign_in_at?: string | null;
  force_password_change?: boolean; temp_password?: string | null;
  user_metadata?: any; app_metadata?: any;
}

function isPasswordPending(u: ManagedUser) {
  if (u.user_metadata?.force_password_change !== undefined) return u.user_metadata.force_password_change === true;
  return u.force_password_change === true;
}
function generatePassword(len = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const ROLE_OPTIONS = [{ value: 'colaborador', label: 'Colaborador' }, { value: 'supervisor', label: 'Supervisor' }];
const ROLE_OPTIONS_EDIT = [...ROLE_OPTIONS, { value: 'admin', label: 'Administrador' }];
const SHIFT_OPTIONS = ['TURNO A','TURNO B','TURNO C','TURNO D'].map(v => ({ value: v, label: v }));

const functionUrl = 'https://aogzdxwruaqgiaprmvuz.supabase.co/functions/v1/create-user';
const listUrl     = 'https://aogzdxwruaqgiaprmvuz.supabase.co/functions/v1/list-users';

export default function AdminUsersTab() {
  const [email, setEmail]   = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole]     = useState<'supervisor' | 'colaborador'>('colaborador');
  const [shift, setShift]   = useState('TURNO A');
  const [loading, setLoading]     = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [users, setUsers]   = useState<ManagedUser[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState(() => generatePassword());
  const [pwdAnim, setPwdAnim] = useState(false);
  const [newPasswords, setNewPasswords] = useState<Record<string,string>>(() => {
    const s = sessionStorage.getItem('vonixx_temp_passwords');
    return s ? JSON.parse(s) : {};
  });
  const [resettingId, setResettingId] = useState<string|null>(null);
  const [copiedUserId, setCopiedUserId] = useState<string|null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ManagedUser|null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editUser, setEditUser] = useState<ManagedUser|null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState<'admin'|'supervisor'|'colaborador'>('colaborador');
  const [editShift, setEditShift] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => { sessionStorage.setItem('vonixx_temp_passwords', JSON.stringify(newPasswords)); }, [newPasswords]);

  const getToken = async () => {
    let { data } = await supabase.auth.getSession();
    if (!data.session) {
      const { data: r, error } = await supabase.auth.refreshSession();
      if (error || !r.session) throw new Error('Sessão inválida. Faça login novamente.');
      return r.session.access_token;
    }
    return data.session.access_token;
  };

  const loadUsers = async (silent = false) => {
    if (!silent) { setLoadingUsers(true); setErrorMsg(''); }
    try {
      const token = await getToken();
      const res  = await fetch(listUrl, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar usuários');
      setUsers(data.users as ManagedUser[]);
    } catch (err: any) {
      if (!silent) setErrorMsg('Erro ao carregar usuários: ' + err.message);
    } finally {
      if (!silent) setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
    const id = setInterval(() => loadUsers(true), 15000);
    return () => clearInterval(id);
  }, []);

  const openEdit = (u: ManagedUser) => {
    setEditUser(u); setEditFullName(u.full_name || '');
    setEditRole(u.role || 'colaborador'); setEditShift(u.shift || 'TURNO A');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editUser) return;
    setSavingEdit(true); setErrorMsg('');
    try {
      const token = await getToken();
      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: editUser.id, email: editUser.email, full_name: editFullName.trim(), role: editRole, turno: editShift, update_user: true }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erro ao atualizar');
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, full_name: editFullName.trim(), role: editRole, shift: editShift } : u));
      setEditUser(null); loadUsers(true);
    } catch (err: any) { setErrorMsg('Erro na edição: ' + err.message); }
    finally { setSavingEdit(false); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setErrorMsg('');
    const pwd = generatedPassword;
    try {
      const token = await getToken();
      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: email.trim(), full_name: fullName.trim(), role, turno: shift, password: pwd }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erro ao criar usuário');
      setNewPasswords(prev => ({ ...prev, [result.user_id]: pwd }));
      setUsers(prev => [{ id: result.user_id, email: email.trim(), full_name: fullName.trim(), role, shift, created_at: new Date().toISOString(), last_sign_in_at: null, force_password_change: true, user_metadata: { force_password_change: true } }, ...prev]);
      setEmail(''); setFullName(''); setRole('colaborador'); setShift('TURNO A');
      setGeneratedPassword(generatePassword()); setErrorMsg('');
      loadUsers(true);
    } catch (err: any) { setErrorMsg('Erro: ' + err.message); }
    finally { setLoading(false); }
  };

  const handleResetPassword = async (u: ManagedUser) => {
    setResettingId(u.id); setErrorMsg('');
    const newPwd = generatePassword();
    try {
      const token = await getToken();
      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: u.email, full_name: u.full_name, role: u.role === 'admin' ? 'colaborador' : u.role, turno: u.shift || 'TURNO A', password: newPwd, reset_existing_user: true, force_password_change: true, user_metadata: { force_password_change: true } }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erro ao redefinir senha');
      setNewPasswords(prev => ({ ...prev, [u.id]: newPwd }));
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, force_password_change: true, user_metadata: { ...(x.user_metadata||{}), force_password_change: true } } : x));
      loadUsers(true);
    } catch (err: any) { setErrorMsg('Erro: ' + err.message); }
    finally { setResettingId(null); }
  };

  const handleDeleteUser = async () => {
    if (!confirmDelete) return;
    setDeleting(true); setErrorMsg('');
    try {
      const token = await getToken();
      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: confirmDelete.email, full_name: confirmDelete.full_name, role: confirmDelete.role, delete_user: true }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erro ao excluir');
      setUsers(prev => prev.filter(u => u.id !== confirmDelete.id));
      setNewPasswords(prev => { const c = {...prev}; delete c[confirmDelete.id]; return c; });
      setConfirmDelete(null);
    } catch (err: any) { setErrorMsg('Erro: ' + err.message); }
    finally { setDeleting(false); }
  };

  const copyPassword = (userId: string, pwd: string) => {
    navigator.clipboard.writeText(pwd);
    setCopiedUserId(userId);
    setTimeout(() => setCopiedUserId(null), 2000);
  };

  const StatusTag = ({ user }: { user: ManagedUser }) => {
    if (!user.last_sign_in_at)
      return <span className="user-tag user-tag-waiting"><Clock size={10} style={{display:'inline',verticalAlign:'middle',marginRight:3}}/>Aguardando 1º acesso</span>;
    if (isPasswordPending(user))
      return <span className="user-tag user-tag-pending"><ShieldAlert size={10} style={{display:'inline',verticalAlign:'middle',marginRight:3}}/>Senha pendente</span>;
    return <span className="user-tag user-tag-active"><ShieldCheck size={10} style={{display:'inline',verticalAlign:'middle',marginRight:3}}/>Ativo</span>;
  };

  const roleTagClass = (r: string) =>
    r === 'admin' ? 'user-tag-role-admin' : r === 'supervisor' ? 'user-tag-role-supervisor' : 'user-tag-role-colaborador';
  const roleGlowColor = (r: string) =>
    r === 'admin' ? '#fbbf24' : r === 'supervisor' ? 'var(--primary)' : 'var(--success)';

  const stats = [
    { label: 'Total', value: users.length, Icon: Users, color: 'var(--primary)', bg: 'var(--primary-hl)' },
    { label: 'Supervisores', value: users.filter(u => u.role === 'supervisor').length, Icon: Shield, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
    { label: 'Colaboradores', value: users.filter(u => u.role === 'colaborador').length, Icon: Users, color: 'var(--success)', bg: 'var(--success-hl)' },
    { label: 'Ativos', value: users.filter(u => u.last_sign_in_at && !isPasswordPending(u)).length, Icon: ShieldCheck, color: 'var(--success)', bg: 'var(--success-hl)' },
  ];

  return (
    <>
      {/* ── Stats bar ── */}
      <div className="admin-stats-grid">
        {stats.map(({ label, value, Icon, color, bg }, i) => (
          <div key={label} className="admin-stat-card" style={{ animationDelay: `${i * 0.04}s` }}>
            <div className="admin-stat-icon" style={{ background: bg, color }}>
              <Icon size={20} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="admin-stat-label">{label}</div>
              <div className="admin-stat-value" style={{ color }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {errorMsg && (
        <div style={{ margin: '0 var(--s6)', display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', borderRadius: 'var(--r-lg)', background: 'var(--danger-hl)', border: '1px solid rgba(220,38,38,0.2)', fontSize: 'var(--text-sm)', color: 'var(--danger)', fontWeight: 500 }}>
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Main grid ── */}
      <div className="admin-content-grid">

        {/* ── Create user ── */}
        <section className="create-user-card">
          <div className="create-user-header">
            <div className="create-user-icon"><UserPlus size={20} color="#fff" /></div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Criar novo usuário</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Acesso temporário automático</div>
            </div>
          </div>
          <form className="create-user-form" onSubmit={handleCreateUser}>
            <div>
              <label className="form-field-label">Nome completo</label>
              <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nome do colaborador" required />
            </div>
            <div>
              <label className="form-field-label">E-mail</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@empresa.com" required />
            </div>
            <div>
              <label className="form-field-label">Perfil</label>
              <CustomSelect value={role} onChange={v => setRole(v as any)} options={ROLE_OPTIONS} />
            </div>
            <div>
              <label className="form-field-label">Turno</label>
              <CustomSelect value={shift} onChange={setShift} options={SHIFT_OPTIONS} />
            </div>
            <div className="password-box">
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Senha temporária</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span
                key={generatedPassword}
                className={`password-value${pwdAnim ? ' pwd-flip' : ''}`}
              >{generatedPassword}</span>
                <button
                  type="button"
                  onClick={() => {
                    setPwdAnim(false);
                    requestAnimationFrame(() => {
                      setGeneratedPassword(generatePassword());
                      setPwdAnim(true);
                      setTimeout(() => setPwdAnim(false), 400);
                    });
                  }}
                  style={{ padding: '6px 12px', borderRadius: 'var(--r-full)', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s' }}
                  className="pwd-nova-btn"
                >
                  <RefreshCcw size={12} className={pwdAnim ? 'spin-anim' : ''} style={{ transition: 'transform 0.3s' }} /> Nova
                </button>
              </div>
            </div>
            <button type="submit" className="btn-create" disabled={loading}>
              {loading ? <><Loader2 size={17} className="spin-anim" /> Criando...</> : <><UserPlus size={17} /> Criar acesso</>}
            </button>
          </form>
        </section>

        {/* ── Users list ── */}
        <section className="users-list-card">
          <div className="users-list-header">
            <div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Usuários cadastrados</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{users.length} {users.length === 1 ? 'usuário' : 'usuários'}</div>
            </div>
            <button onClick={() => loadUsers(false)} style={{ padding: '7px 14px', borderRadius: 'var(--r-full)', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}>
              <RefreshCcw size={13} className={loadingUsers ? 'spin-anim' : ''} /> Atualizar
            </button>
          </div>

          {loadingUsers ? (
            <div className="users-loading">
              <Loader2 size={28} className="spin-anim" style={{ color: 'var(--primary)' }} />
              <span>Carregando usuários...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="users-empty">Nenhum usuário encontrado.</div>
          ) : (
            <div className="users-list-body">
              {users.map((user, i) => {
                const ini = user.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
                const isResetting = resettingId === user.id;
                return (
                  <div key={user.id} className="user-card" style={{ animationDelay: `${i * 0.03}s` }}>
                    <div className="user-card-glow" style={{ background: roleGlowColor(user.role) }} />

                    {/* Top row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div className="user-avatar">{ini}</div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.full_name || 'Usuário sem nome'}</div>
                        <div className="user-email" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button className="user-action-btn" onClick={() => openEdit(user)} title="Editar"><Edit3 size={14} /></button>
                        <button className="user-action-btn danger" onClick={() => setConfirmDelete(user)} title="Excluir"><Trash2 size={14} /></button>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="user-tags">
                      <span className={`user-tag ${roleTagClass(user.role)}`} style={{ textTransform: 'capitalize' }}>{user.role}</span>
                      <span className="user-tag user-tag-shift">{user.shift || 'Sem turno'}</span>
                      <StatusTag user={user} />
                    </div>

                    {/* Password reveal */}
                    {newPasswords[user.id] && (
                      <div className="pwd-reveal">
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Código de acesso:</div>
                          <div className="pwd-reveal-code">{newPasswords[user.id]}</div>
                        </div>
                        <button className="btn-copy" onClick={() => copyPassword(user.id, newPasswords[user.id])}
                          style={{ background: copiedUserId === user.id ? 'var(--success)' : 'var(--primary)', boxShadow: `0 4px 12px ${copiedUserId === user.id ? 'rgba(16,185,129,0.3)' : 'rgba(1,105,111,0.3)'}` }}>
                          {copiedUserId === user.id
                            ? <><CheckCircle2 size={12} /> Copiado</>
                            : 'Copiar'}
                        </button>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="user-footer">
                      <div className="user-last-access">
                        <Clock size={11} style={{ opacity: 0.7 }} />
                        {formatDate(user.last_sign_in_at)}
                      </div>
                      <button className="btn-reset-pwd" onClick={() => handleResetPassword(user)} disabled={isResetting}>
                        {isResetting ? <Loader2 size={12} className="spin-anim" /> : <KeyRound size={12} />}
                        {isResetting ? 'Processando...' : 'Reset senha'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ── Edit modal ── */}
      {editUser && (
        <div className="au-modal-overlay">
          <div className="au-modal">
            <div className="au-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, var(--primary), #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(1,105,111,0.3)' }}>
                  <Edit3 size={20} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>Editar Usuário</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{editUser.email}</div>
                </div>
              </div>
              <button onClick={() => setEditUser(null)} style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="au-modal-body">
                <div>
                  <label className="form-field-label">Nome completo</label>
                  <input className="input" value={editFullName} onChange={e => setEditFullName(e.target.value)} required />
                </div>
                <div>
                  <label className="form-field-label">Perfil</label>
                  <CustomSelect value={editRole} onChange={v => setEditRole(v as any)} options={ROLE_OPTIONS_EDIT} />
                </div>
                <div>
                  <label className="form-field-label">Turno</label>
                  <CustomSelect value={editShift} onChange={setEditShift} options={SHIFT_OPTIONS} />
                </div>
              </div>
              <div className="au-modal-footer">
                <button type="button" className="au-modal-btn cancel" onClick={() => setEditUser(null)} disabled={savingEdit}>Cancelar</button>
                <button type="submit" className="au-modal-btn confirm" disabled={savingEdit}>
                  {savingEdit ? <><Loader2 size={15} className="spin-anim" /> Salvando...</> : 'Salvar alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete modal ── */}
      {confirmDelete && (
        <div className="au-modal-overlay">
          <div className="au-modal" style={{ borderColor: 'rgba(220,38,38,0.3)' }}>
            <div className="au-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(220,38,38,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={20} color="var(--danger)" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>Excluir usuário</div>
                  <div style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600, marginTop: 2 }}>Ação irreversível</div>
                </div>
              </div>
            </div>
            <div className="au-modal-body">
              <div style={{ padding: '12px 14px', borderRadius: 'var(--r-lg)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700 }}>{confirmDelete.full_name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{confirmDelete.email}</div>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', margin: 0 }}>
                O usuário perderá acesso imediato ao sistema. Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="au-modal-footer">
              <button type="button" className="au-modal-btn cancel" onClick={() => setConfirmDelete(null)} disabled={deleting}>Cancelar</button>
              <button type="button" className="au-modal-btn danger-btn" onClick={handleDeleteUser} disabled={deleting}>
                {deleting ? <><Loader2 size={15} className="spin-anim" /> Excluindo...</> : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
