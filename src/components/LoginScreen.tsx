import { useState, useEffect } from 'react';
import { Cloud, Lock, Mail, AlertCircle } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [driveConnected, setDriveConnected] = useState(false);

  useEffect(() => {
    // Check if the backend is authenticated for Drive
    fetch('/api/auth/status')
      .then(res => res.json())
      .then(data => setDriveConnected(data.authenticated))
      .catch(() => setDriveConnected(false));

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setDriveConnected(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnectDrive = async () => {
    try {
      const response = await fetch('/api/auth/url');
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();

      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      if (!authWindow) {
        alert('Por favor autorize o uso de popups neste site para conectar.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao tentar autenticar');
    }
  };

  const handleDisconnectDrive = async () => {
    try {
      await fetch('/api/auth/disconnect', { method: 'POST' });
      setDriveConnected(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') setErrorMsg('Este email já está cadastrado.');
      else if (error.code === 'auth/wrong-password') setErrorMsg('Senha incorreta.');
      else if (error.code === 'auth/user-not-found') setErrorMsg('Usuário não encontrado.');
      else if (error.code === 'auth/weak-password') setErrorMsg('A senha precisa ter pelo menos 6 caracteres.');
      else setErrorMsg('Erro na autenticação: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 font-sans text-slate-800 p-4">
      <div className="w-full max-w-[420px] flex flex-col gap-6">
        
        {/* Drive Integration Banner */}
        {!driveConnected && (
          <div className="p-4 rounded-2xl border shadow-sm flex items-center justify-between bg-amber-50 border-amber-200/60">
            <div className="flex items-center gap-3">
              <Cloud size={24} className="text-amber-600" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Drive Desconectado
                </p>
                <p className="text-xs text-amber-600/80 font-medium mt-0.5">
                  Requerido para salvar mídias.
                </p>
              </div>
            </div>
            <button 
              onClick={handleConnectDrive}
              className="px-4 py-2 bg-amber-500 text-white text-xs font-bold uppercase tracking-wide rounded-lg hover:bg-amber-600 transition-all shadow-sm active:scale-95 whitespace-nowrap"
            >
              Conectar
            </button>
          </div>
        )}

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
