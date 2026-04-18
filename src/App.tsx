/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import SupervisorScreen from './components/SupervisorScreen';
import ColaboradorScreen from './components/ColaboradorScreen';
import { OccurrenceData } from './types';
import { supabase } from './supabase';
import { INITIAL_OCCURRENCES } from './constants';

interface AuthUser {
  email?: string;
}

const OCCURRENCES_TABLE = 'occurrences';
const CHECKLISTS_TABLE = 'checklists';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<'login' | 'supervisor' | 'colaborador'>('login');
  const [authLoading, setAuthLoading] = useState(true);

  // ✅ NUEVO: estado para nombre y turno capturados en LoginScreen
  const [reporterName, setReporterName] = useState('');
  const [shift, setShift] = useState('TURNO A');

  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [occurrences, setOccurrences] = useState<OccurrenceData[]>([]);

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user;
      setCurrentUser(user ? { email: user.email } : null);
      updateRole(user?.email);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setCurrentUser(user ? { email: user.email } : null);
      updateRole(user?.email);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateRole = (email?: string) => {
    if (email) {
      setRole(email.includes('supervisor') ? 'supervisor' : 'colaborador');
    } else {
      setRole('login');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // ✅ Limpia nombre y turno al cerrar sesión
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
      const localOcc: OccurrenceData = { ...occurrence, id: `local-${Date.now()}` };
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
      .upsert({
        item_key: key,
        is_checked: checked,
        updated_at: new Date().toISOString()
      }, { onConflict: 'item_key' });

    if (error) {
      console.error('Erro ao sincronizar checklist:', error.message);
    }
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
        Carregando conta...
      </div>
    );
  }

  if (role === 'login') {
    return (
      // ✅ LoginScreen recibe callbacks para guardar nombre y turno antes de hacer login
      <LoginScreen
        onSetReporterName={setReporterName}
        onSetShift={setShift}
        reporterName={reporterName}
        shift={shift}
      />
    );
  }

  if (role === 'supervisor') {
    return (
      <SupervisorScreen
        onLogout={handleLogout}
        occurrences={occurrences}
        checklistState={checklistState}
      />
    );
  }

  return (
    // ✅ Pasa reporterName y shift al ColaboradorScreen
    <ColaboradorScreen
      onLogout={handleLogout}
      checklistState={checklistState}
      onCheck={handleCheck}
      onSaveOccurrence={handleAddOccurrence}
      userEmail={currentUser?.email || ''}
      reporterName={reporterName}
      shift={shift}
    />
  );
}