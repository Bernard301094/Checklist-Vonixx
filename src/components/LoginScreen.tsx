import React, { useState, useEffect } from 'react';
import { Cloud, Lock, Mail, AlertCircle } from 'lucide-react';
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
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert("Conta criada! Por favor, verifique seu e-mail (se o Supabase estiver configurado com confirmação).");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      console.error(error);
      if (error.status === 429) {
        setErrorMsg('Muitas tentativas! Aguarde alguns segundos (proteção do Supabase).');
      } else if (error.message === 'Email not confirmed') {
        setErrorMsg('E-mail ainda não confirmado! Verifique sua caixa de entrada ou desabilite "Confirm Email" no painel do Supabase.');
      } else if (error.status === 400 || error.code === 'invalid_credentials') {
        setErrorMsg('Credenciais inválidas. Verifique seu e-mail e senha.');
      } else {
        setErrorMsg('Erro na autenticação: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 font-sans text-slate-800 p-4">
      <div className="w-full max-w-[420px] flex flex-col gap-6">
        
        <div className="bg-white p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden">
          {/* Subtle accent gradient at the top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500" />
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Industria 4.0</h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">
               {isRegistering ? 'Crie sua conta para começar' : 'Faça login para acessar o painel'}
            </p>
          </div>

          {errorMsg && (
             <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-start gap-2.5">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span className="font-medium">{errorMsg}</span>
             </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Email</label>
              <div className="relative">
                 <div className="absolute left-3 top-3.5 text-slate-400">
                    <Mail size={18} strokeWidth={2.5} />
                 </div>
                 <input 
                   type="email" 
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   placeholder="ex: colaborador@industria.com"
                   className="w-full pl-10 p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400"
                   required 
                 />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Senha</label>
              <div className="relative">
                 <div className="absolute left-3 top-3.5 text-slate-400">
                    <Lock size={18} strokeWidth={2.5} />
                 </div>
                 <input 
                   type="password" 
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   placeholder="••••••••"
                   className="w-full pl-10 p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400"
                   required
                   minLength={6}
                 />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 text-white font-semibold py-3 rounded-xl mt-2 hover:bg-slate-800 transition-all uppercase tracking-wide text-xs focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.99] shadow-sm"
            >
              {loading ? 'Aguarde...' : (isRegistering ? 'Criar Conta' : 'Entrar na Plataforma')}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-slate-100 pt-6">
             <button 
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
             >
                {isRegistering ? 'Já tem uma conta? Fazer Login' : 'Não tem conta? Cadastrar-se'}
             </button>
          </div>

          <div className="mt-6 text-xs text-slate-500 text-center bg-slate-50 border border-slate-100 p-4 rounded-xl leading-relaxed">
            Dica: E-mails contendo <b className="text-slate-700">supervisor</b> acessam o painel de gerenciamento automaticamente.
          </div>
        </div>
      </div>
    </div>
  );
}
