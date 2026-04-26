import React, { useMemo, useState } from 'react';
import { Camera, AlertTriangle, X, CheckCircle2, ChevronDown, User2, Clock3, ImagePlus, Loader2, Factory, FileText } from 'lucide-react';
import { OccurrenceData } from '../types';
import { CHECKLIST_DATA } from '../constants';
import Header from './Header';
import { uploadPhoto } from '../lib/uploadPhoto';
import { ToastContainer, useToast } from './Toast';
import CustomSelect from './CustomSelect';
import MyRecordsView from './MyRecordsView';

interface ColaboradorScreenProps {
  onLogout: () => void;
  checklistState: Record<string, boolean>;
  onCheck: (key: string, checked: boolean) => void;
  onSaveOccurrence: (occurrence: Omit<OccurrenceData, 'id'>) => void;
  onUpdateOccurrence: (id: string, patch: { comment?: string; photos?: string[] }) => Promise<void>;
  occurrences: OccurrenceData[];
  userEmail: string;
  reporterName: string;
  shift: string;
  useBiometrics?: boolean;
  onToggleBiometrics?: () => void;
}

export default function ColaboradorScreen({
  onLogout, checklistState, onCheck, onSaveOccurrence, onUpdateOccurrence,
  occurrences, userEmail, reporterName, shift, useBiometrics, onToggleBiometrics
}: ColaboradorScreenProps) {
  const { toasts, removeToast, toast } = useToast();

  // ── Tab principal ─────────────────────────────────────────
  const [mainTab, setMainTab] = useState<'checklist' | 'registros'>('checklist');

  const [machine, setMachine] = useState<string>(() => localStorage.getItem('selectedMachine') || '');
  const [activeOccurrence, setActiveOccurrence] = useState<{ section: string; item: string } | null>(null);
  const [currentComment, setCurrentComment] = useState('');
  const [currentFiles, setCurrentFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    Object.fromEntries(CHECKLIST_DATA.map(s => [s.id, true]))
  );

  const totalItems = useMemo(() => CHECKLIST_DATA.reduce((acc, s) => acc + s.items.length, 0), []);
  const checkedCount = Object.values(checklistState).filter(Boolean).length;
  const progress = totalItems ? Math.round((checkedCount / totalItems) * 100) : 0;
  const progressColor = progress >= 100 ? 'var(--success)' : progress >= 50 ? 'var(--warning)' : 'var(--primary)';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    setCurrentFiles(prev => [...prev, ...files]);
    setPreviewUrls(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removePhoto = (idx: number) => {
    URL.revokeObjectURL(previewUrls[idx]);
    setCurrentFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviewUrls(prev => prev.filter((_, i) => i !== idx));
  };

  const handleOpenModal = (sectionTitle: string, itemStr: string) => {
    setActiveOccurrence({ section: sectionTitle, item: itemStr });
  };

  const handleSaveModal = async () => {
    if (!activeOccurrence) return;
    setIsUploading(true);
    setUploadProgress('');

    let driveUrls: string[] = [];

    if (currentFiles.length > 0) {
      try {
        const results: string[] = [];
        for (let i = 0; i < currentFiles.length; i++) {
          setUploadProgress(`Enviando foto ${i + 1} de ${currentFiles.length}...`);
          const url = await uploadPhoto(currentFiles[i], `ocorrencias/${reporterName.trim().replace(/\s+/g, '_')}`);
          results.push(url);
        }
        driveUrls = results;
        setUploadProgress('');
      } catch (err: any) {
        console.error('Erro ao subir fotos para Supabase:', err);
        toast.error('Erro ao enviar fotos', err.message);
        setIsUploading(false);
        setUploadProgress('');
        return;
      }
    }

    onSaveOccurrence({
      section: activeOccurrence.section,
      item: activeOccurrence.item,
      comment: currentComment,
      photos: driveUrls.length > 0 ? driveUrls : [...previewUrls],
      reporter: `${reporterName.trim()} (${shift}) | Máquina: ${machine} - Auth: ${userEmail}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    previewUrls.forEach(u => URL.revokeObjectURL(u));
    setCurrentFiles([]);
    setPreviewUrls([]);
    setCurrentComment('');
    setActiveOccurrence(null);
    setIsUploading(false);

    if (driveUrls.length > 0) {
      toast.success('Ocorrência salva!', `${driveUrls.length} foto(s) enviadas ao Supabase Storage com sucesso.`);
    } else {
      toast.success('Ocorrência salva com sucesso.');
    }
  };

  const handleCloseModal = () => {
    if (isUploading) return;
    previewUrls.forEach(u => URL.revokeObjectURL(u));
    setCurrentFiles([]);
    setPreviewUrls([]);
    setCurrentComment('');
    setActiveOccurrence(null);
  };

  const getSectionProgress = (sectionId: string, len: number) => {
    const checked = Array.from({ length: len }).filter((_, i) => checklistState[`${sectionId}-${i}`]).length;
    return { checked, total: len, percent: len ? Math.round((checked / len) * 100) : 0 };
  };

  // ── Contagem de registros próprios para badge na tab ──────
  const myOccCount = useMemo(() => {
    return occurrences.filter(o => {
      const rep = o.reporter.split(' - Auth:')[0].trim().toLowerCase();
      const me = reporterName.trim().toLowerCase();
      return rep.includes(me) || me.includes(rep);
    }).length;
  }, [occurrences, reporterName]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text)' }}>
      <Header
        userEmail={userEmail}
        displayName={reporterName || userEmail}
        title="Checklist Diário"
        subtitle="Inspeção operacional, conformidade por seção e registro imediato de ocorrências"
        role="colaborador"
        onLogout={onLogout}
        useBiometrics={useBiometrics}
        onToggleBiometrics={onToggleBiometrics}
      />

      {/* ── Tab bar principal ─────────────────────────────── */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--divider)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 50, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[
          { id: 'checklist' as const, label: 'Checklist', icon: CheckCircle2 },
          { id: 'registros' as const, label: 'Meus Registros', icon: FileText, count: myOccCount },
        ].map(tab => {
          const Icon = tab.icon;
          const active = mainTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setMainTab(tab.id)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 'var(--s3) var(--s4)', fontWeight: 700, fontSize: 'var(--text-sm)', color: active ? 'var(--primary)' : 'var(--text-muted)', borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent', background: 'none', cursor: 'pointer', transition: 'color 150ms', minWidth: 0, whiteSpace: 'nowrap' }}>
              <Icon size={16} className="hide-watch" />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{tab.label}</span>
              {'count' in tab && tab.count > 0 && (
                <span className="hide-watch" style={{ minWidth: 18, height: 18, borderRadius: 999, background: active ? 'var(--primary-hl)' : 'var(--surface-2)', color: active ? 'var(--primary)' : 'var(--text-muted)', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB: CHECKLIST ───────────────────────────────── */}
      {mainTab === 'checklist' && (
        <>
          <div style={{ padding: 'var(--s4) var(--s5)', borderBottom: '1px solid var(--divider)', background: 'var(--surface)' }}>
            <div className="card" style={{ padding: 'var(--s4) var(--s5)', display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--s3)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--s2)' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{progress}%</span>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontWeight: 600 }}>{checkedCount} de {totalItems} itens conformes</span>
                </div>
                <span className={progress >= 100 ? 'badge badge-green' : progress >= 50 ? 'badge badge-amber' : 'badge badge-teal'}>
                  {progress >= 100 ? 'Concluído' : progress >= 50 ? 'Em andamento' : 'Iniciado'}
                </span>
              </div>
              <div style={{ width: '100%', height: 8, background: 'var(--surface-3)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: progressColor, transition: 'width 300ms ease', borderRadius: 'var(--r-full)' }} />
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--s5)', display: 'flex', flexDirection: 'column', gap: 'var(--s5)' }}>
            <form
              onSubmit={e => {
                e.preventDefault();
                toast.success('Checklist sincronizado!', 'Todos os dados foram salvos com sucesso.');
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s5)' }}
            >
              {/* Identificação */}
              <section className="card" style={{ padding: 'var(--s5)', position: 'relative', overflow: 'visible' }}>
                <div style={{ position: 'absolute', insetInline: 0, top: 0, height: 2, background: 'linear-gradient(90deg, var(--primary), #06b6d4)' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--s4)', flexWrap: 'wrap', gap: 'var(--s3)' }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>Identificação do operador</h2>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 'var(--s1)' }}>Dados vinculados à sua conta e a cada ocorrência registrada.</p>
                  </div>
                  <span className="badge badge-teal">Perfil ativo</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--s3)' }}>
                  <div className="card animate-in" style={{ padding: 'var(--s4)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 'var(--s3)', minWidth: 0, transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--sh-md)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--sh-sm)'; }}>
                    <div className="hide-watch" style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-hl)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User2 size={17} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Operador</div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>{reporterName}</div>
                    </div>
                  </div>
                  <div className="card animate-in" style={{ padding: 'var(--s4)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 'var(--s3)', minWidth: 0, transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--sh-md)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--sh-sm)'; }}>
                    <div className="hide-watch" style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--warning-hl)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Clock3 size={17} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Turno</div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>{shift}</div>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)', marginTop: 'var(--s3)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)' }}>Máquina Selecionada</label>
                  <CustomSelect
                    value={machine}
                    onChange={val => { setMachine(val); localStorage.setItem('selectedMachine', val); }}
                    options={[{ value: 'ROMI 01', label: 'ROMI 01' }, { value: 'ROMI 02', label: 'ROMI 02' }]}
                    placeholder="Selecione a Máquina"
                    icon={<Factory size={16} style={{ color: 'var(--text-muted)' }} />}
                  />
                </div>
              </section>

              {!machine ? (
                <div className="card" style={{ padding: 'var(--s6)', textAlign: 'center', background: 'var(--surface-2)', border: '1px dashed var(--border)' }}>
                  <div style={{ display: 'inline-flex', width: 48, height: 48, borderRadius: '50%', background: 'var(--warning-hl)', color: 'var(--warning)', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--s4)' }}>
                    <AlertTriangle size={24} />
                  </div>
                  <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--s2)' }}>Selecione a Máquina</h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Por favor, selecione qual máquina (ROMI 01 ou ROMI 02) você irá operar antes de iniciar o preenchimento do checklist.</p>
                </div>
              ) : (
                CHECKLIST_DATA.map(section => {
                  const stats = getSectionProgress(section.id, section.items.length);
                  const isOpen = openSections[section.id];
                  return (
                    <section key={section.id} className="card" style={{ overflow: 'hidden' }}>
                      <button type="button" onClick={() => setOpenSections(prev => ({ ...prev, [section.id]: !prev[section.id] }))} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--s4)', padding: 'var(--s4) var(--s5)', background: 'var(--surface)', textAlign: 'left' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', flexWrap: 'wrap', marginBottom: 'var(--s2)' }}>
                            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>{section.title}</h2>
                            <span className={stats.percent === 100 ? 'badge badge-green' : stats.percent > 0 ? 'badge badge-amber' : 'badge badge-teal'}>{stats.checked}/{stats.total}</span>
                          </div>
                          <div style={{ width: '100%', height: 5, background: 'var(--surface-3)', borderRadius: 'var(--r-full)', overflow: 'hidden', maxWidth: 240 }}>
                            <div style={{ width: `${stats.percent}%`, height: '100%', background: stats.percent === 100 ? 'var(--success)' : 'var(--primary)', borderRadius: 'var(--r-full)' }} />
                          </div>
                        </div>
                        <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 180ms ease', color: 'var(--text-muted)', flexShrink: 0 }} />
                      </button>
                      {isOpen && (
                        <div style={{ padding: '0 var(--s3) var(--s3)', display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
                          {section.items.map((item, idx) => {
                            const itemKey = `${section.id}-${idx}`;
                            const checked = checklistState[itemKey] || false;
                            return (
                              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--s3)', padding: 'var(--s3)', borderRadius: 'var(--r-lg)', background: checked ? 'var(--success-hl)' : 'var(--surface-2)', border: `1px solid ${checked ? 'rgba(22,163,74,0.18)' : 'var(--border)'}` }}>
                                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--s3)', flex: 1, cursor: 'pointer' }}>
                                  <input type="checkbox" checked={checked} onChange={e => onCheck(itemKey, e.target.checked)} style={{ marginTop: 3, width: 18, height: 18, accentColor: 'var(--primary)', cursor: 'pointer' }} />
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s1)' }}>
                                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, lineHeight: 1.5 }}>{item}</span>
                                    {checked && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--success)', fontWeight: 700 }}><CheckCircle2 size={13} /> Item validado</span>}
                                  </div>
                                </label>
                                {!checked && (
                                  <button type="button" onClick={() => handleOpenModal(section.title, item)} className="btn-ghost" style={{ minWidth: 0, paddingInline: 'var(--s3)', color: 'var(--warning)', borderColor: 'rgba(217,119,6,0.18)', background: 'var(--warning-hl)', flexShrink: 0 }}>
                                    <AlertTriangle size={15} />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  );
                })
              )}

              {machine && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 'var(--s6)' }}>
                  <button type="submit" className="btn-primary" style={{ minWidth: 200 }}>Sincronizar checklist</button>
                </div>
              )}
            </form>
          </div>
        </>
      )}

      {/* ── TAB: MEUS REGISTROS ──────────────────────────── */}
      {mainTab === 'registros' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--s4) var(--s4) var(--s8)' }}>
          <MyRecordsView
            occurrences={occurrences}
            checklistState={checklistState}
            reporterName={reporterName}
            onUpdateOccurrence={onUpdateOccurrence}
            reporterEmail={userEmail}
          />
        </div>
      )}

      {/* ── Modal de ocorrência ───────────────────────────── */}
      {activeOccurrence && (
        <div className="occurrence-modal" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--s4)', zIndex: 1000 }}>
          <div className="occurrence-modal-inner card" style={{ width: '100%', maxWidth: 720, maxHeight: '90vh', overflow: 'auto', boxShadow: 'var(--sh-xl)' }}>
            <div style={{ padding: 'var(--s5)', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--s4)' }}>
              <div>
                <div className="badge badge-amber" style={{ marginBottom: 'var(--s3)' }}>Registro de ocorrência</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700 }}>{activeOccurrence.item}</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 'var(--s2)' }}>Seção: {activeOccurrence.section}</p>
              </div>
              <button type="button" onClick={handleCloseModal} disabled={isUploading} className="btn-ghost" style={{ paddingInline: 'var(--s3)', flexShrink: 0 }}><X size={16} /></button>
            </div>
            <div style={{ padding: 'var(--s5)', display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--s3)' }}>
                <div className="card" style={{ padding: 'var(--s3)', background: 'var(--surface-2)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 'var(--s1)' }}>Operador</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>{reporterName}</div>
                </div>
                <div className="card" style={{ padding: 'var(--s3)', background: 'var(--surface-2)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 'var(--s1)' }}>Turno</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>{shift}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>Comentário técnico</label>
                <textarea className="input" value={currentComment} onChange={e => setCurrentComment(e.target.value)} placeholder="Descreva a não conformidade, impacto observado e ação necessária..." rows={4} style={{ resize: 'vertical', minHeight: 110 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--s3)' }}>
                  <div>
                    <label style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>Evidências fotográficas</label>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>Comprimidas automaticamente antes do envio (máx. 1280px, JPEG 72%)</p>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--s2)' }}>
                    <label className="btn-ghost" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Camera size={16} /> Tirar Foto
                      <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} onClick={() => localStorage.setItem('skipBiometric', 'true')} disabled={isUploading} style={{ display: 'none' }} />
                    </label>
                    <label className="btn-ghost" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ImagePlus size={16} /> Galeria
                      <input type="file" accept="image/*" multiple onChange={handleFileUpload} onClick={() => localStorage.setItem('skipBiometric', 'true')} disabled={isUploading} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>

                {previewUrls.length === 0 ? (
                  <div style={{ border: '1px dashed var(--border)', borderRadius: 'var(--r-xl)', padding: 'var(--s6)', textAlign: 'center', background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                    <Camera size={26} style={{ margin: '0 auto 10px', color: 'var(--text-faint)' }} />
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Nenhuma foto anexada</div>
                    <div style={{ fontSize: 'var(--text-xs)', marginTop: 6, color: 'var(--text-faint)' }}>Fotos são comprimidas e salvas no Supabase Storage</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--s3)' }}>
                    {previewUrls.map((preview, idx) => (
                      <div key={idx} style={{ position: 'relative', borderRadius: 'var(--r-xl)', overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '4/3' }}>
                        <img src={preview} alt={`Preview ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {!isUploading && (
                          <button type="button" onClick={() => removePhoto(idx)} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(15,23,42,0.7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}><X size={13} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding: 'var(--s4) var(--s5)', borderTop: '1px solid var(--divider)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--s3)', flexWrap: 'wrap' }}>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--primary)', fontWeight: 600, minHeight: 20 }}>
                {isUploading && <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />{uploadProgress || 'Processando...'}</span>}
              </div>
              <div style={{ display: 'flex', gap: 'var(--s3)' }}>
                <button type="button" className="btn-ghost" onClick={handleCloseModal} disabled={isUploading}>Cancelar</button>
                <button type="button" className="btn-primary" onClick={handleSaveModal} disabled={isUploading}>
                  {isUploading ? 'Enviando...' : 'Salvar ocorrência'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onClose={removeToast} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
