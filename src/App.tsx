/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import LoginScreen from './components/LoginScreen';
import SupervisorScreen from './components/SupervisorScreen';
import ColaboradorScreen from './components/ColaboradorScreen';
import LockScreen from './components/LockScreen';
import { OccurrenceData } from './types';
import { supabase } from './supabase';
import { INITIAL_OCCURRENCES } from './constants';

interface AuthUser {
  email?: string;
}

const OCCURRENCES_TABLE = 'occurrences';
const CHECKLISTS_TABLE = 'checklists';

// ✅ FIX 1: Timeout para fetchRoleFromDB — evita colgar si la tabla profiles no responde
const fetchRoleFromDB = async (userId: string): Promise<'supervisor' | 'colaborador'> => {
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

    return result.data.role === 'supervisor' ? 'supervisor' : 'colaborador';
  } catch (err) {
    console.warn('Erro ao buscar role, usando padrão: colaborador', err);
    return 'colaborador';
  }
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<'login' | 'supervisor' | 'colaborador'>('login');
  const [authLoading, setAuthLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [useBiometrics, setUseBiometrics] = useState<boolean>(() => {
    return localStorage.getItem('useBiometrics') === 'true';
  });

  const [reporterName, setReporterName] = useState('');
  const [shift, setShift] = useState('TURNO A');
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [occurrences, setOccurrences] = useState<OccurrenceData[]>([]);

  useEffect(() => {
    const listener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive && role !== 'login' && useBiometrics) {
        setIsLocked(true);
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [role, useBiometrics]);

  // En App.tsx, reemplaza toggleBiometrics por esto:
const toggleBiometrics = () => {
  setUseBiometrics(prev => {
    const next = !prev;
    localStorage.setItem('useBiometrics', String(next));
    // Sin alert() — el Header ya muestra visualmente ON/OFF en el botón
    return next;
  });
};

  useEffect(() => {
    async function loadData() {
      const { data: checklistsData, error: clErr } = await supabase
        .from(CHECKLISTS_TABLE)
        .select('*');
      if (clErr) {
        console.error('Erro ao carregar checklists:', clErr.message);
      } else if (checklistsData) {
        const state: Record<string, boolean> = {};
        checklistsData.forEach((item: any) => {
          state[item.item_key] = item.is_checked;
        });
        setChecklistState(state);
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

    if (role !== 'login') {
      loadData();
    }
  }, [role]);

  // ✅ FIX 2: useCallback para evitar re-creación innecesaria de applySession
  const applySession = useCallback(async (session: any) => {
    const user = session?.user;
    setCurrentUser(user ? { email: user.email } : null);

    if (user) {
      const isBioEnabled = localStorage.getItem('useBiometrics') === 'true';
      if (isBioEnabled) {
        setIsLocked(true);
      }

      const dbRole = await fetchRoleFromDB(user.id);
      setRole(dbRole);

      if (user.user_metadata?.name) {
        setReporterName(user.user_metadata.name);
      }
      if (user.user_metadata?.shift) {
        setShift(user.user_metadata.shift);
      }
    } else {
      setRole('login');
      setIsLocked(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    // ✅ FIX 3: Timeout de seguridad — si Supabase no responde en 8s, muestra login
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
      // ✅ FIX 4: Captura errores de red en getSession
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
    await supabase.auth.signOut();
    setReporterName('');
    setShift('TURNO A');
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

  const handleCheck = async (key: string, checked: boolean) => {
    setChecklistState(prev => ({ ...prev, [key]: checked }));

    const { error } = await supabase
      .from(CHECKLISTS_TABLE)
      .upsert(
        { item_key: key, is_checked: checked, updated_at: new Date().toISOString() },
        { onConflict: 'item_key' }
      );

    if (error) {
      console.error('Erro ao sincronizar checklist:', error.message);
    }
  };

  // ✅ FIX 5: Mensaje de carga mejorado con indicador visual y mensaje de error si tarda mucho
  if (authLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          height: '100dvh',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
          color: 'var(--text-muted)',
          fontSize: 'var(--text-sm)',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            border: '3px solid rgba(255,255,255,0.15)',
            borderTop: '3px solid var(--accent, #6366f1)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span>Carregando conta...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (role === 'login') {
    return (
      <LoginScreen
        onSetReporterName={setReporterName}
        onSetShift={setShift}
        reporterName={reporterName}
        shift={shift}
      />
    );
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

  if (role === 'supervisor') {
    return (
      <SupervisorScreen
        onLogout={handleLogout}
        occurrences={occurrences}
        checklistState={checklistState}
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
      userEmail={currentUser?.email || ''}
      reporterName={reporterName}
      shift={shift}
      useBiometrics={useBiometrics}
      onToggleBiometrics={toggleBiometrics}
    />
  );
}