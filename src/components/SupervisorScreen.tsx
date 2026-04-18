import { BarChart } from 'lucide-react';
import { OccurrenceData } from '../types';
import Sidebar from './Sidebar';
import Header from './Header';

interface SupervisorScreenProps {
  onLogout: () => void;
  occurrences: OccurrenceData[];
  checklistState: Record<string, boolean>;
}

export default function SupervisorScreen({ onLogout, occurrences, checklistState }: SupervisorScreenProps) {
  const verifiedCount = Object.values(checklistState).filter(v => v).length;
  // Approximating max checks as ~47 based on Colaborador screen
  const maxChecks = 47; 
  const validationProgress = Math.round((verifiedCount / maxChecks) * 100);

  return (
    <div className="flex w-full h-[768px] max-w-6xl mx-auto bg-slate-50 font-sans relative overflow-hidden text-slate-800 mt-0 lg:mt-8 shadow-2xl rounded-2xl border border-slate-200">
      <Sidebar role="supervisor" onLogout={onLogout} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden bg-slate-50/50">
         <div className="w-full h-full flex flex-col overflow-hidden relative">
            
            <Header userEmail="Supervisor" title="Painel do Supervisor" showSyncStatus={true} />
            
            <div className="bg-slate-50/50 px-8 pb-6">
                <div className="bg-white px-5 py-4 rounded-xl border border-slate-200 shadow-sm flex flex-col w-56 ml-auto -mt-10 relative z-20">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Progresso Checklist</span>
                        <span className="text-sm font-black text-indigo-600">{validationProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                           className="h-full bg-indigo-500 transition-all duration-500 ease-out" 
                           style={{ width: `${validationProgress}%` }}
                        />
                    </div>
                    <span className="text-xs font-medium text-slate-500 mt-2">
                        {verifiedCount} de {maxChecks} itens conformes
                    </span>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-8 pb-8 pt-4 flex flex-col gap-6">
               
               {occurrences.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-dashed border-2 border-slate-200 rounded-2xl m-4 h-full bg-slate-50/[0.3]">
                    <div className="flex flex-col items-center opacity-50">
                        <BarChart size={48} className="mb-4 text-slate-300" />
                        <p className="text-base font-semibold">Nenhuma ocorrência relatada hoje.</p>
                    </div>
                 </div>
               ) : (
                 occurrences.map((occ) => (
                   <section key={occ.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transform transition-all hover:shadow-md">
                      <div className="px-6 py-4 bg-slate-900 flex justify-between items-center">
                         <h2 className="text-white text-sm font-bold flex items-center gap-3 uppercase tracking-wider">
                            {occ.section}
                         </h2>
                      </div>

                      <div className="p-6 flex flex-col gap-6">
                         <div className="flex flex-col gap-4 pb-6 border-b border-slate-100">
                            <div>
                               <span className="inline-block bg-amber-50 text-amber-700 border border-amber-200/60 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest mb-3">
                                 Fator Crítico / Ocorrência
                               </span>
                               <h3 className="text-lg font-bold text-slate-900 border-l-4 border-amber-500 pl-3">
                                 {occ.item}
                               </h3>
                            </div>
                            
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                               <p className="text-sm text-slate-700 leading-relaxed">
                                 <strong className="text-slate-900 block mb-1 text-xs uppercase tracking-wider">Comentário do Operador:</strong>
                                 <span className="font-medium">{occ.comment}</span>
                               </p>
                            </div>

                            <div className="flex flex-wrap gap-6 text-xs text-slate-500 font-mono">
                               <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                  <span className="font-semibold font-sans">Relatado por:</span> {occ.reporter}
                               </div>
                               <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                  <span className="font-semibold font-sans">Hora do Registro:</span> {occ.time}
                               </div>
                            </div>
                         </div>

                         <div className="flex flex-col gap-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Evidências Fotográficas ({occ.photos.length})</h4>
                            
                            {occ.photos.length === 0 ? (
                               <p className="text-sm text-slate-400 italic font-medium">Nenhuma foto enviada.</p>
                            ) : (
                               <div className="grid grid-cols-3 gap-4">
                                  {occ.photos.map((photo, pIdx) => (
                                    <div key={pIdx} className="aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative group shadow-sm">
                                       <img 
                                          src={photo} 
                                          alt="Evidência" 
                                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                       />
                                       <div className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-wider backdrop-blur-md">
                                          Foto {pIdx + 1}
                                       </div>
                                    </div>
                                  ))}
                               </div>
                            )}
                         </div>
                      </div>
                   </section>
                 ))
               )}
            </div>
         </div>
      </main>
    </div>
  );
}
