/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import SupervisorScreen from './components/SupervisorScreen';
import ColaboradorScreen from './components/ColaboradorScreen';
import { OccurrenceData } from './types';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './firebase';
import { INITIAL_OCCURRENCES } from './constants';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [role, setRole] = useState<'login' | 'supervisor' | 'colaborador'>('login');
  const [authLoading, setAuthLoading] = useState(true);
  
  // Base de Dados Mockada Compartilhada
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [occurrences, setOccurrences] = useState<OccurrenceData[]>(INITIAL_OCCURRENCES);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthLoading(false);
      setCurrentUser(user);
      if (user && user.email) {
         // Auto-route based on email containing 'supervisor'
         if (user.email.includes('supervisor')) {
            setRole('supervisor');
         } else {
            setRole('colaborador');
         }
      } else {
         setRole('login');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleAddOccurrence = (occurrence: Omit<OccurrenceData, 'id'>) => {
    const newOccurrence: OccurrenceData = {
      ...occurrence,
      id: Math.random().toString(36).substr(2, 9)
    };
    setOccurrences(prev => [newOccurrence, ...prev]);
  };

  const handleCheck = (key: string, checked: boolean) => {
    setChecklistState(prev => ({ ...prev, [key]: checked }));
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
