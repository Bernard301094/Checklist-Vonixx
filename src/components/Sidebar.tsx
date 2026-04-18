import { LogOut, ClipboardList, BarChart } from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
  role: 'supervisor' | 'colaborador';
}

export default function Sidebar({ onLogout, role }: SidebarProps) {
  const isSupervisor = role === 'supervisor';

  return (
    <aside className="hidden md:flex flex-col w-[260px] h-full z-10 bg-slate-900 text-white border-r border-slate-800">
      <div className="px-6 py-8 border-b border-slate-800/60">
        <h1 className="font-bold text-lg tracking-tight flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-indigo-500"></div>
          Indústria 4.0 Pro
        </h1>
      </div>

      <div className="px-6 py-6 pb-2">
        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
          {isSupervisor ? 'Visualização' : 'Atividade'}
        </span>
      </div>
      
      <nav className="flex-1 flex flex-col pt-2">
        {isSupervisor ? (
          <button className="flex items-center w-full px-6 py-4 text-sm transition-all bg-indigo-500/10 text-indigo-400 font-semibold border-l-4 border-indigo-500 hover:bg-indigo-500/20">
            <div className="mr-3 opacity-90 shrink-0">
              <BarChart size={20} />
            </div>
            <span>Ocorrências Diárias</span>
          </button>
        ) : (
          <button className="flex items-center w-full px-6 py-4 text-sm transition-all bg-indigo-500/10 text-indigo-400 font-semibold border-l-4 border-indigo-500 hover:bg-indigo-500/20">
            <div className="mr-3 opacity-90 shrink-0">
              <ClipboardList size={20} />
            </div>
            <span>Checklist Diário</span>
          </button>
        )}
      </nav>

      <button 
        onClick={onLogout} 
        className="flex flex-row items-center gap-3 p-6 border-t border-slate-800/60 hover:bg-slate-800 transition-colors text-sm font-semibold text-slate-400 hover:text-white"
      >
        <LogOut size={18} /> Encerrar Sessão
      </button>
    </aside>
  );
}
