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

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<'login' | 'supervisor' | 'colaborador'>('login');
  const [authLoading, setAuthLoading] = useState(true);
  
  // Base de Dados Real do Supabase
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [occurrences, setOccurrences] = useState<OccurrenceData[]>([]);

  // Carregar dados iniciais do Banco de Dados
  useEffect(() => {
    async function loadData() {
      // 1. Carregar Checklists
      const { data: checklistsData } = await supabase.from('checklists').select('*');
      if (checklistsData) {
        const state: Record<string, boolean> = {};
        checklistsData.forEach(item => {
          state[item.item_key] = item.is_checked;
        });
        setChecklistState(state);
      }

      // 2. Carregar Ocorrências
      const { data: occData } = await supabase
        .from('occurrences')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (occData) {
        setOccurrences(occData as OccurrenceData[]);
      }
    }

    if (role !== 'login') {
      loadData();
    }
  }, [role]);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user;
      setCurrentUser(user ? { email: user.email } : null);
      updateRole(user?.email);
      setAuthLoading(false);
    });

    // Listen for auth changes
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
      if (email.includes('supervisor')) {
        setRole('supervisor');
      } else {
        setRole('colaborador');
      }
    } else {
      setRole('login');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleAddOccurrence = async (occurrence: Omit<OccurrenceData, 'id'>) => {
    const { data, error } = await supabase
      .from('occurrences')
      .insert([occurrence])
      .select()
      .single();

    if (error) {
       console.error("Erro ao salvar ocorrência no banco:", error);
       alert("Erro ao salvar no banco de dados.");
       return;
    }

    if (data) {
      setOccurrences(prev => [data as OccurrenceData, ...prev]);
    }
  };

  const handleCheck = async (key: string, checked: boolean) => {
    // 1. Atualizar UI instantaneamente (Optimistic Update)
    setChecklistState(prev => ({ ...prev, [key]: checked }));

    // 2. Salvar no Supabase (Upsert)
    const { error } = await supabase
      .from('checklists')
      .upsert({ 
        item_key: key, 
        is_checked: checked,
        updated_at: new Date().toISOString()
      }, { onConflict: 'item_key' });

    if (error) {
      console.error("Erro ao sincronizar checklist:", error);
    }
  };

  if (authLoading) {
     return <div className="flex h-screen items-center justify-center bg-[#F4F7F6]">Carregando Conta...</div>;
  }

  if (role === 'login') {
    return <LoginScreen />;
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

  if (role === 'colaborador') {
    return (
      <ColaboradorScreen 
        onLogout={handleLogout} 
        checklistState={checklistState}
        onCheck={handleCheck}
        onSaveOccurrence={handleAddOccurrence}
        userEmail={currentUser?.email || ''}
      />
    );
  }

  return null;
}
