import { useState } from 'react';
import { Camera, AlertTriangle, X } from 'lucide-react';
import { OccurrenceData } from '../types';
import { CHECKLIST_DATA } from '../constants';
import Sidebar from './Sidebar';
import Header from './Header';

interface ColaboradorScreenProps {
  onLogout: () => void;
  checklistState: Record<string, boolean>;
  onCheck: (key: string, checked: boolean) => void;
  onSaveOccurrence: (occurrence: Omit<OccurrenceData, 'id'>) => void;
  userEmail: string;
}

export default function ColaboradorScreen({ onLogout, checklistState, onCheck, onSaveOccurrence, userEmail }: ColaboradorScreenProps) {
  const [activeOccurrence, setActiveOccurrence] = useState<{ section: string, item: string } | null>(null);
  
  // Identificação do Operador
  const [reporterName, setReporterName] = useState('');
  const [shift, setShift] = useState('TURNO A');

  // Local state for the modal
  const [currentComment, setCurrentComment] = useState('');
  const [currentPhotos, setCurrentPhotos] = useState<string[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setCurrentPhotos(prev => [...prev, imageUrl]);
    }
  };

  const handleOpenModal = (sectionTitle: string, itemStr: string) => {
    if (!reporterName.trim()) {
      alert("Por favor, preencha o Mome do Operador na seção de identificação (no topo) antes de registrar uma ocorrência.");
      return;
    }
    setActiveOccurrence({ section: sectionTitle, item: itemStr });
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleSaveModal = async () => {
    if (!activeOccurrence) return;

    setIsUploading(true);
    let uploadSuccess = false;

    // Send the base64 photos to our Express server if we have any
    if (currentPhotos.length > 0) {
       try {
         const res = await fetch('/api/upload', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             photos: currentPhotos,
             item: activeOccurrence.item,
             reporter: `${reporterName.trim()} (${shift}) - ${userEmail}`
           })
         });
         
         if (!res.ok) {
             const errData = await res.json();
             if (res.status === 401) {
                alert("Erro: A API do Google Drive ainda não foi conectada. Peça ao Supervisor para conectar no menu de Login.");
             } else {
                alert("Erro ao subir fotos para o Google Drive: " + errData.error);
             }
         } else {
             uploadSuccess = true;
         }
       } catch (e) {
           alert("Falha de conexão com o servidor local.");
       }
    }

    onSaveOccurrence({
      section: activeOccurrence.section,
      item: activeOccurrence.item,
      comment: currentComment,
      photos: currentPhotos, // We keep base64 version here so React can still render it instantly in supervisor panel
      reporter: `${reporterName.trim()} (${shift}) - Auth: ${userEmail}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    setCurrentComment('');
    setCurrentPhotos([]);
    setActiveOccurrence(null);
    setIsUploading(false);
    
    if(currentPhotos.length > 0 && uploadSuccess) {
      alert('Ocorrência salva e enviada PARA O GOOGLE DRIVE com sucesso!');
    } else {
      alert('Ocorrência salva localmente (sem arquivos de Drive anexados com sucesso).');
    }
  };

  const handleCloseModal = () => {
    setCurrentComment('');
    setCurrentPhotos([]);
    setActiveOccurrence(null);
  };

  return (
    <div className="flex w-full h-[768px] max-w-6xl mx-auto bg-slate-50 font-sans relative overflow-hidden text-slate-800 mt-0 lg:mt-8 shadow-2xl rounded-2xl border border-slate-200">
      <Sidebar role="colaborador" onLogout={onLogout} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden bg-slate-50/50">
         <div className="w-full h-full flex flex-col overflow-hidden relative">
            
            <Header userEmail={userEmail} title="Checklist Diário" />

            {/* Content -> Checklist Sections */}
            <div className="flex-1 overflow-y-auto px-8 pb-8 pt-2 flex flex-col gap-6">
               <form 
                  onSubmit={(e) => { 
                    e.preventDefault(); 
                    if (!reporterName.trim()) {
                      alert("Por favor, preencha o Nome do Operador antes de sincronizar o checklist!");
                      return;
                    }
                    alert('Checklist geral sincronizado com sucesso!'); 
                  }} 
                  className="flex flex-col gap-6"
               >
                 
                 {/* Seção Identificação */}
                 <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 px-4 py-1 bg-indigo-50 border-b border-l border-indigo-100 rounded-bl-xl text-indigo-700 text-xs font-bold uppercase tracking-wider">
                      Identificação Obrigatória
                    </div>
                    <div className="flex flex-col md:flex-row gap-6 mt-4">
                      <div className="flex-1 flex flex-col gap-2">
                         <label className="text-sm font-semibold text-slate-700">Mecânico / Operador</label>
                         <input 
                           type="text" 
                           className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-sm font-medium text-slate-900"
                           placeholder="Ex: Carlos Silva"
                           value={reporterName}
                           onChange={(e) => setReporterName(e.target.value)}
                           required
                         />
                      </div>
                      <div className="flex-1 flex flex-col gap-2">
                         <label className="text-sm font-semibold text-slate-700">Turno</label>
                         <select 
                           className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-sm font-medium text-slate-900"
                           value={shift}
                           onChange={(e) => setShift(e.target.value)}
                         >
                           <option value="TURNO A">TURNO A</option>
                           <option value="TURNO B">TURNO B</option>
                           <option value="TURNO C">TURNO C</option>
                           <option value="TURNO D">TURNO D</option>
                         </select>
                      </div>
                    </div>
                 </section>

                 {CHECKLIST_DATA.map((section) => (
                   <section key={section.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
                      <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4 mb-4">{section.title}</h2>
                      
                      <div className="flex flex-col gap-2">
                        {section.items.map((item, idx) => {
                          const itemKey = `${section.id}-${idx}`;
                          return (
                            <div key={idx} className="flex flex-col">
                              <div className="flex items-start justify-between gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                                <label className="flex items-start gap-3 flex-1 cursor-pointer select-none">
                                  <input 
                                    type="checkbox" 
                                    className="mt-0.5 w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600 shrink-0" 
                                    checked={checklistState[itemKey] || false}
                                    onChange={(e) => onCheck(itemKey, e.target.checked)}
                                  />
                                  <span className="text-sm font-medium leading-relaxed text-slate-700 group-hover:text-slate-900 transition-colors">
                                    {item}
                                  </span>
                                </label>
                                
                                {!checklistState[itemKey] && (
                                  <button 
                                    type="button" 
                                    onClick={() => handleOpenModal(section.title, item)}
                                    className="text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-all p-2 rounded-lg shrink-0 border border-transparent hover:border-amber-200"
                                    title="Registrar Ocorrência"
                                  >
                                    <AlertTriangle size={18} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                   </section>
                 ))}

                 {/* Submit Form */}
                 <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mt-4">
                   <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all uppercase tracking-wide text-sm shadow-sm active:scale-[0.99]">
                     Sincronizar Respostas do Checklist
                   </button>
                 </div>
               </form>
            </div>
         </div>
      </main>

      {/* Full-Screen Global Overlay Modal for Occurrences */}
      {activeOccurrence && (
        <div className="absolute inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 p-8 shadow-2xl flex flex-col gap-6 transform transition-all">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-amber-500 rounded-full inline-block"></span>
                  Registrar Ocorrência
                </h3>
                <p className="text-slate-500 text-xs mt-3 font-semibold uppercase tracking-wider">{activeOccurrence.section}</p>
                <p className="text-slate-800 text-sm font-medium mt-1 leading-snug">{activeOccurrence.item}</p>
              </div>
              <button 
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Comentário</label>
              <textarea 
                rows={3} 
                className="p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm font-medium text-slate-900 resize-none"
                placeholder="Descreva o problema observado..."
                value={currentComment}
                onChange={(e) => setCurrentComment(e.target.value)}
              ></textarea>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Evidência (Fotos)</label>
              <div className="flex flex-wrap gap-3">
                 {currentPhotos.map((photo, i) => (
                   <div key={i} className="w-20 h-20 rounded-xl border-2 border-slate-200 overflow-hidden relative shadow-sm">
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                   </div>
                 ))}
                 
                 <label className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:border-amber-500 hover:text-amber-600 hover:bg-amber-50 transition-all">
                   <Camera size={20} className="mb-1" />
                   <span className="text-[10px] font-bold uppercase tracking-wider">Foto</span>
                   <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                 </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
              <button 
                onClick={handleCloseModal}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveModal}
                disabled={isUploading}
                className="px-6 py-2.5 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-sm hover:shadow-md rounded-xl transition-all uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
              >
                {isUploading ? 'Enviando...' : 'Salvar Ocorrência'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
