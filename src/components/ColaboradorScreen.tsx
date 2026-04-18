import React, { useMemo, useState } from 'react';
import { Camera, AlertTriangle, X, CheckCircle2, ChevronDown, User2, Clock3, ImagePlus, Loader2 } from 'lucide-react';
import { OccurrenceData } from '../types';
import { CHECKLIST_DATA } from '../constants';
import Header from './Header';
import { uploadPhoto } from '../lib/uploadPhoto';

interface ColaboradorScreenProps {
  onLogout: () => void;
  checklistState: Record<string, boolean>;
  onCheck: (key: string, checked: boolean) => void;
  onSaveOccurrence: (occurrence: Omit<OccurrenceData, 'id'>) => void;
  userEmail: string;
  reporterName: string;
  shift: string;
}

export default function ColaboradorScreen({ onLogout, checklistState, onCheck, onSaveOccurrence, userEmail, reporterName, shift }: ColaboradorScreenProps) {
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
    const files = Array.from(e.target.files);
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
        alert(`Erro ao enviar fotos: ${err.message}`);
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
      reporter: `${reporterName.trim()} (${shift}) - Auth: ${userEmail}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    previewUrls.forEach(u => URL.revokeObjectURL(u));
    setCurrentFiles([]);
    setPreviewUrls([]);
    setCurrentComment('');
    setActiveOccurrence(null);
    setIsUploading(false);

    if (driveUrls.length > 0) {
      alert(`Ocorrência salva! ${driveUrls.length} foto(s) enviadas ao Supabase Storage (comprimidas).`);
    } else {
      alert('Ocorrência salva com sucesso.');
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text)' }}>
      <Header
        userEmail={userEmail}
        title="Checklist Diário"
        subtitle="Inspeção operacional, conformidade por seção e registro imediato de ocorrências"
        role="colaborador"
        onLogout={onLogout}
      />

      <div style={{ padding: 'var(--s5) var(--s6)', borderBottom: '1px solid var(--divider)', background: 'var(--surface)' }}>
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

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--s6)', display: 'flex', flexDirection: 'column', gap: 'var(--s6)' }}>
        <form onSubmit={e => { e.preventDefault(); alert('Checklist sincronizado!'); }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s6)' }}>

          <section className="card" style={{ padding: 'var(--s6)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', insetInline: 0, top: 0, height: 2, background: 'linear-gradient(90deg, var(--primary), #06b6d4)' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--s5)', flexWrap: 'wrap', gap: 'var(--s3)' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>Identificação do operador</h2>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 'var(--s1)' }}>Dados vinculados à sua conta e a cada ocorrência registrada.</p>
              </div>
              <span className="badge badge-teal">Perfil ativo</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--s4)' }}>
              {/* ✅ Muestra exactamente el nombre ingresado junto al turno */}
              <div className="card" style={{ padding: 'var(--s4)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 'var(--s3)' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--primary-hl)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User2 size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 2 }}>Operador</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text)' }}>{reporterName}</div>
                </div>
              </div>
              <div className="card" style={{ padding: 'var(--s4)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 'var(--s3)' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--warning-hl)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock3 size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 2 }}>Turno</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text)' }}>{shift}</div>
                </div>
              </div>
            </div>
          </section>

          {CHECKLIST_DATA.map(section => {
            const stats = getSectionProgress(section.id, section.items.length);
            const isOpen = openSections[section.id];
            return (
              <section key={section.id} className="card" style={{ overflow: 'hidden' }}>
                <button type="button" onClick={() => setOpenSections(prev => ({ ...prev, [section.id]: !prev[section.id] }))} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--s4)', padding: 'var(--s5) var(--s6)', background: 'var(--surface)', textAlign: 'left' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', flexWrap: 'wrap', marginBottom: 'var(--s2)' }}>
                      <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{section.title}</h2>
                      <span className={stats.percent === 100 ? 'badge badge-green' : stats.percent > 0 ? 'badge badge-amber' : 'badge badge-teal'}>{stats.checked}/{stats.total}</span>
                    </div>
                    <div style={{ width: '100%', height: 5, background: 'var(--surface-3)', borderRadius: 'var(--r-full)', overflow: 'hidden', maxWidth: 280 }}>
                      <div style={{ width: `${stats.percent}%`, height: '100%', background: stats.percent === 100 ? 'var(--success)' : 'var(--primary)', borderRadius: 'var(--r-full)' }} />
                    </div>
                  </div>
                  <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 180ms ease', color: 'var(--text-muted)', flexShrink: 0 }} />
                </button>
                {isOpen && (
                  <div style={{ padding: '0 var(--s4) var(--s4)', display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
                    {section.items.map((item, idx) => {
                      const itemKey = `${section.id}-${idx}`;
                      const checked = checklistState[itemKey] || false;
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--s4)', padding: 'var(--s4)', borderRadius: 'var(--r-lg)', background: checked ? 'var(--success-hl)' : 'var(--surface-2)', border: `1px solid ${checked ? 'rgba(22,163,74,0.18)' : 'var(--border)'}` }}>
                          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--s3)', flex: 1, cursor: 'pointer' }}>
                            <input type="checkbox" checked={checked} onChange={e => onCheck(itemKey, e.target.checked)} style={{ marginTop: 3, width: 18, height: 18, accentColor: 'var(--primary)', cursor: 'pointer' }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s1)' }}>
                              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, lineHeight: 1.5 }}>{item}</span>
                              {checked && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--success)', fontWeight: 700 }}><CheckCircle2 size={13} /> Item validado</span>}
                            </div>
                          </label>
                          {!checked && (
                            <button type="button" onClick={() => handleOpenModal(section.title, item)} className="btn-ghost" style={{ minWidth: 0, paddingInline: 'var(--s3)', color: 'var(--warning)', borderColor: 'rgba(217,119,6,0.18)', background: 'var(--warning-hl)' }}>
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
          })}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" style={{ minWidth: 220 }}>Sincronizar checklist</button>
          </div>
        </form>
      </div>

      {activeOccurrence && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--s4)', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: 720, maxHeight: '90vh', overflow: 'auto', boxShadow: 'var(--sh-xl)' }}>
            <div style={{ padding: 'var(--s6)', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--s4)' }}>
              <div>
                <div className="badge badge-amber" style={{ marginBottom: 'var(--s3)' }}>Registro de ocorrência</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>{activeOccurrence.item}</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 'var(--s2)' }}>Seção: {activeOccurrence.section}</p>
              </div>
              <button type="button" onClick={handleCloseModal} disabled={isUploading} className="btn-ghost" style={{ paddingInline: 'var(--s3)' }}><X size={16} /></button>
            </div>
            <div style={{ padding: 'var(--s6)', display: 'flex', flexDirection: 'column', gap: 'var(--s5)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--s4)' }}>
                {/* ✅ Nombre exacto del operador, sin fallback al email */}
                <div className="card" style={{ padding: 'var(--s4)', background: 'var(--surface-2)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 'var(--s1)' }}>Operador</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>{reporterName}</div>
                </div>
                <div className="card" style={{ padding: 'var(--s4)', background: 'var(--surface-2)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 'var(--s1)' }}>Turno</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>{shift}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>Comentário técnico</label>
                <textarea className="input" value={currentComment} onChange={e => setCurrentComment(e.target.value)} placeholder="Descreva a não conformidade, impacto observado e ação necessária..." rows={5} style={{ resize: 'vertical', minHeight: 130 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--s3)' }}>
                  <div>
                    <label style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>Evidências fotográficas</label>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>Comprimidas automaticamente antes do envio (máx. 1280px, JPEG 72%)</p>
                  </div>
                  <label className="btn-ghost" style={{ cursor: 'pointer' }}>
                    <ImagePlus size={16} /> Adicionar fotos
                    <input type="file" accept="image/*" multiple onChange={handleFileUpload} disabled={isUploading} style={{ display: 'none' }} />
                  </label>
                </div>
                {previewUrls.length === 0 ? (
                  <div style={{ border: '1px dashed var(--border)', borderRadius: 'var(--r-xl)', padding: 'var(--s8)', textAlign: 'center', background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                    <Camera size={26} style={{ margin: '0 auto 10px', color: 'var(--text-faint)' }} />
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Nenhuma foto anexada</div>
                    <div style={{ fontSize: 'var(--text-xs)', marginTop: 6, color: 'var(--text-faint)' }}>Fotos são comprimidas e salvas no Supabase Storage</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--s3)' }}>
                    {previewUrls.map((preview, idx) => (
                      <div key={idx} style={{ position: 'relative', borderRadius: 'var(--r-xl)', overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '4/3' }}>
                        <img src={preview} alt={`Preview ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {!isUploading && (
                          <button type="button" onClick={() => removePhoto(idx)} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(15,23,42,0.7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={13} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding: 'var(--s5) var(--s6)', borderTop: '1px solid var(--divider)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--s3)', flexWrap: 'wrap' }}>
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}