/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import LoginScreen from './components/LoginScreen';
import SupervisorScreen from './components/SupervisorScreen';
import ColaboradorScreen from './components/ColaboradorScreen';
import LockScreen from './components/LockScreen';
import ChangePasswordScreen from './components/ChangePasswordScreen';
import AdminScreen from './components/AdminScreen';
import { OccurrenceData, ChecklistEntry } from './types';
import { supabase } from './supabase';
import { INITIAL_OCCURRENCES } from './constants';

interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}

const OCCURRENCES_TABLE = 'occurrences';
const CHECKLISTS_TABLE = 'checklists';

const fetchRoleFromDB = async (userId: string): Promise<'admin' | 'supervisor' | 'colaborador'> => {
  try {
    const result = await Promise.race([
      supabase.from('profiles').select('role').eq('id', userId).single(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000)
      ),
    ]) as { data: any; error: any };

    if (result.error || !result.data) {
      console.warn('Perfil não encontrado ou timeout, usando role padrão: colaborador');
      return 'colaborador';
    }

    return result.data.role === 'admin'
      ? 'admin'
      : result.data.role === 'supervisor'
        ? 'supervisor'
        : 'colaborador';
  } catch (err) {
    console.warn('Erro ao buscar role, usando padrão: colaborador', err);
    return 'colaborador';
  }
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<'login' | 'admin' | 'supervisor' | 'colaborador'>('login');
  const [authLoading, setAuthLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [useBiometrics, setUseBiometrics] = useState<boolean>(() => {
    return localStorage.getItem('useBiometrics') === 'true';
  });

  const [reporterName, setReporterName] = useState('');
  const [shift, setShift] = useState('TURNO A');
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [checklistEntries, setChecklistEntries] = useState<ChecklistEntry[]>([]);
  const [occurrences, setOccurrences] = useState<OccurrenceData[]>([]);

  const resolvedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const listener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      const isMobile = window.innerWidth < 1024;
      if (!isActive && role !== 'login' && useBiometrics && isMobile) {
        const skip = localStorage.getItem('skipBiometric');
        if (skip === 'true') {
          localStorage.removeItem('skipBiometric');
          return;
        }
        setIsLocked(true);
      }
    });
    return () => { listener.then(l => l.remove()); };
  }, [role, useBiometrics]);

  const toggleBiometrics = () => {
    setUseBiometrics(prev => {
      const next = !prev;
      localStorage.setItem('useBiometrics', String(next));
      return next;
    });
  };

  useEffect(() => {
    async function loadData() {
      const { data: checklistsData, error: clErr } = await supabase
        .from(CHECKLISTS_TABLE)
        .select('item_key, is_checked, reporter, checked_at, updated_at');

      if (clErr) {
        console.error('Erro ao carregar checklists:', clErr.message);
      } else if (checklistsData) {
        const state: Record<string, boolean> = {};
        const entries: ChecklistEntry[] = [];
        checklistsData.forEach((item: any) => {
          state[item.item_key] = item.is_checked;
          entries.push({
            item_key: item.item_key,
            is_checked: item.is_checked,
            reporter: item.reporter ?? undefined,
            checked_at: item.checked_at ?? undefined,
            updated_at: item.updated_at ?? undefined,
          });
        });
        setChecklistState(state);
        setChecklistEntries(entries);
      }

      const { data: occData, error: occErr } = await supabase
        .from(OCCURRENCES_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (occErr) {
        console.error('Erro ao carregar ocorrências:', occErr.message);
        setOccurrences(INITIAL_OCCURRENCES as OccurrenceData[]);
      } else if (occData) {
        setOccurrences(occData as OccurrenceData[]);
      }
    }

    if (role === 'admin' || role === 'supervisor' || role === 'colaborador') {
      loadData();
    }
  }, [role]);

  const applySession = useCallback(async (session: any) => {
    const user = session?.user;

    if (!user) {
      resolvedUserIdRef.current = null;
      setCurrentUser(null);
      setRole('login');
      setIsLocked(false);
      setMustChangePassword(false);
      return;
    }

    setCurrentUser({ id: user.id, email: user.email, user_metadata: user.user_metadata });

    if (user.user_metadata?.force_password_change === true) {
      resolvedUserIdRef.current = user.id;
      setMustChangePassword(true);
      setRole('colaborador');
      return;
    }

    setMustChangePassword(false);

    if (resolvedUserIdRef.current === user.id) {
      return;
    }

    resolvedUserIdRef.current = user.id;

    const isBioEnabled = localStorage.getItem('useBiometrics') === 'true';
    const isMobile = window.innerWidth < 1024;
    if (isBioEnabled && isMobile) setIsLocked(true);

    const dbRole = await fetchRoleFromDB(user.id);
    setRole(dbRole);

    if (user.user_metadata?.name) setReporterName(user.user_metadata.name);
    if (user.user_metadata?.full_name) setReporterName(user.user_metadata.full_name);
    if (user.user_metadata?.shift) setShift(user.user_metadata.shift);
    if (user.user_metadata?.turno) setShift(user.user_metadata.turno);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const safetyTimeout = setTimeout(() => {
      if (!cancelled) {
        console.warn('Auth timeout: Supabase demorou demais, exibindo tela de login.');
        setAuthLoading(false);
      }
    }, 8000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      clearTimeout(safetyTimeout);
      await applySession(session);
      setAuthLoading(false);
    }).catch((err) => {
      if (cancelled) return;
      clearTimeout(safetyTimeout);
      console.error('Erro ao obter sessão:', err);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return;
      await applySession(session);
      setAuthLoading(false);
    });

    return () => {
      cancelled = true;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [applySession]);

  const handleLogout = async () => {
    resolvedUserIdRef.current = null;
    await supabase.auth.signOut();
    setReporterName('');
    setShift('TURNO A');
    setMustChangePassword(false);
  };

  const handleAddOccurrence = async (occurrence: Omit<OccurrenceData, 'id'>) => {
    const { data, error } = await supabase
      .from(OCCURRENCES_TABLE)
      .insert([occurrence])
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar ocorrência no banco:', error.message);
      const localOcc: OccurrenceData = {
        ...occurrence,
        id: `local-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      setOccurrences(prev => [localOcc, ...prev]);
      alert('Ocorrência salva localmente. Erro ao persistir no banco — verifique o console.');
      return;
    }

    if (data) {
      setOccurrences(prev => [data as OccurrenceData, ...prev]);
    }
  };

  const handleUpdateOccurrence = async (id: string, patch: { comment?: string; photos?: string[] }) => {
    const { data, error } = await supabase
      .from(OCCURRENCES_TABLE)
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar ocorrência:', error.message);
      throw error;
    }

    if (data) {
      setOccurrences(prev => prev.map(o => o.id === id ? (data as OccurrenceData) : o));
    }
  };

  const handleCheck = async (key: string, checked: boolean) => {
    const now = new Date().toISOString();
    setChecklistState(prev => ({ ...prev, [key]: checked }));
    setChecklistEntries(prev => {
      const existing = prev.find(e => e.item_key === key);
      if (existing) {
        return prev.map(e => e.item_key === key
          ? { ...e, is_checked: checked, reporter: reporterName || undefined, checked_at: now, updated_at: now }
          : e
        );
      }
      return [...prev, { item_key: key, is_checked: checked, reporter: reporterName || undefined, checked_at: now, updated_at: now }];
    });

    const { error } = await supabase
      .from(CHECKLISTS_TABLE)
      .upsert(
        {
          item_key: key,
          is_checked: checked,
          reporter: reporterName || null,
          checked_at: now,
          updated_at: now,
        },
        { onConflict: 'item_key' }
      );

    if (error) {
      console.error('Erro ao sincronizar checklist:', error.message);
    }
  };

  if (authLoading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '12px',
        height: '100dvh', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', color: 'var(--text-muted)', fontSize: 'var(--text-sm)',
      }}>
        <div style={{
          width: '32px', height: '32px',
          border: '3px solid rgba(255,255,255,0.15)',
          borderTop: '3px solid var(--accent, #6366f1)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span>Carregando conta...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (mustChangePassword && currentUser) {
    return (
      <ChangePasswordScreen
        userEmail={currentUser.email || ''}
        onPasswordChanged={async () => {
          resolvedUserIdRef.current = null;
          const { data: { session } } = await supabase.auth.getSession();
          await applySession(session);
        }}
      />
    );
  }

  if (role === 'login') {
    return <LoginScreen />;
  }

  if (isLocked) {
    return (
      <LockScreen
        onUnlock={() => setIsLocked(false)}
        onLogout={handleLogout}
        userEmail={currentUser?.email || ''}
      />
    );
  }

  if (role === 'admin') {
    return (
      <AdminScreen
        onLogout={handleLogout}
        currentUserEmail={currentUser?.email || ''}
        useBiometrics={useBiometrics}
        onToggleBiometrics={toggleBiometrics}
        occurrences={occurrences}
        checklistState={checklistState}
        checklistEntries={checklistEntries}
      />
    );
  }

  if (role === 'supervisor') {
    return (
      <SupervisorScreen
        onLogout={handleLogout}
        occurrences={occurrences}
        checklistState={checklistState}
        checklistEntries={checklistEntries}
        useBiometrics={useBiometrics}
        onToggleBiometrics={toggleBiometrics}
      />
    );
  }

  return (
    <ColaboradorScreen
      onLogout={handleLogout}
      checklistState={checklistState}
      onCheck={handleCheck}
      onSaveOccurrence={handleAddOccurrence}
      onUpdateOccurrence={handleUpdateOccurrence}
      occurrences={occurrences}
      userEmail={currentUser?.email || ''}
      reporterName={reporterName}
      shift={shift}
      useBiometrics={useBiometrics}
      onToggleBiometrics={toggleBiometrics}
    />
  );
}
