import { CheckCircle } from 'lucide-react';

interface HeaderProps {
  userEmail: string;
  title: string;
  showSyncStatus?: boolean;
}

export default function Header({ userEmail, title, showSyncStatus = false }: HeaderProps) {
  const currentDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  // Capitalize first letter of date
  const formattedDate = currentDate.charAt(0).toUpperCase() + currentDate.slice(1);

  return (
    <header className="flex flex-col shrink-0 w-full relative bg-white border-b border-slate-200">
      <div className="flex justify-between items-center h-16 px-6">
        <div className="flex items-center font-semibold text-sm text-slate-900 gap-3">
          <span>Olá, User ({userEmail})</span>
          {showSyncStatus && (
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
              <CheckCircle size={14} className="text-emerald-600" />
              <span className="text-emerald-700 text-xs font-bold uppercase tracking-wider">Sincronização Ativa</span>
            </div>
          )}
        </div>
        <span className="text-xs font-medium text-slate-500 hidden sm:block">
          {formattedDate}
        </span>
      </div>
      <div className="bg-slate-50/50 px-8 pt-8 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
          {title}
        </h1>
      </div>
    </header>
  );
}
