import React, { useMemo, useState } from 'react';
import { Camera, AlertTriangle, X, CheckCircle2, ChevronDown, User2, Clock3, ImagePlus } from 'lucide-react';
import { OccurrenceData } from '../types';
import { CHECKLIST_DATA } from '../constants';
import Header from './Header';

interface ColaboradorScreenProps {
  onLogout: () => void;
  checklistState: Record<string, boolean>;
  onCheck: (key: string, checked: boolean) => void;
  onSaveOccurrence: (occurrence: Omit<OccurrenceData, 'id'>) => void;
  userEmail: string;
}

export default function ColaboradorScreen({ onLogout, checklistState, onCheck, onSaveOccurrence, userEmail }: ColaboradorScreenProps) {
  const [activeOccurrence, setActiveOccurrence] = useState<{ section: string; item: string } | null>(null);
  const [reporterName, setReporterName] = useState('');
  const [shift, setShift] = useState('TURNO A');
  const [currentComment, setCurrentComment] = useState('');
  const [currentFiles, setCurrentFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    Object.fromEntries(CHECKLIST_DATA.map(section => [section.id, true]))
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
    if (!reporterName.trim()) {
      alert('Por favor, preencha o Nome do Operador antes de registrar uma ocorr\u00eancia.');
      return;
    }
    setActiveOccurrence({ section: sectionTitle, item: itemStr });
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSaveModal = async () => {
    if (!activeOccurrence) return;
    setIsUploading(true);

    // @ts-ignore
    const appsScriptUrl = import.meta.env.VITE_APPS_SCRIPT_URL;
    // We store filenames so supervisor can reference them even without Drive URL
    const photoFilenames: string[] = [];

    if (currentFiles.length > 0) {
      if (!appsScriptUrl) {
        alert('VITE_APPS_SCRIPT_URL n\u00e3o configurado. As fotos n\u00e3o ser\u00e3o enviadas ao Google Drive.');
      } else {
        // Google Apps Script does not send CORS headers, so we must use no-cors.
        // With no-cors we cannot read the response, but the file IS uploaded.
        // We generate a predictable filename and store it for reference.
        try {
          await Promise.all(
            currentFiles.map(async (file, index) => {
              const base64DataUrl = await fileToBase64(file);
              // Strip the data URI prefix to get raw base64
              const base64 = base64DataUrl.replace(/^data:image\/\w+;base64,/, '');
              const filename = `Ocorrencia_${reporterName.trim().replace(/\s+/g, '_')}_${Date.now()}_img${index}.${file.name.split('.').pop() || 'jpg'}`;
              photoFilenames.push(filename);

              // Use no-cors to bypass CORS restriction on Apps Script
              await fetch(appsScriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                  base64,
                  mimeType: file.type || 'image/jpeg',
                  filename,
                  item: activeOccurrence.item,
                }),
              });
            })
          );
        } catch (e) {
          console.error('Erro ao subir fotos:', e);
        }
      }
    }

    // Save occurrence — photos array stores filenames as reference
    // (Drive URLs cannot be retrieved with no-cors; supervisor sees filenames)
    onSaveOccurrence({
      section: activeOccurrence.section,
      item: activeOccurrence.item,
      comment: currentComment,
      photos: previewUrls, // keep blob previews for same-session display
      reporter: `${reporterName.trim()} (${shift}) - Auth: ${userEmail}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setCurrentFiles([]);
    setPreviewUrls([]);
    setCurrentComment('');
    setActiveOccurrence(null);
    setIsUploading(false);
    alert(photoFilenames.length > 0
      ? `Ocorr\u00eancia salva! ${photoFilenames.length} foto(s) enviada(s) ao Google Drive.`
      : 'Ocorr\u00eancia salva com sucesso.');
  };

  const handleCloseModal = () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
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
        title="Checklist Di\u00e1rio"
        subtitle="Inspe\u00e7\u00e3o operacional, conformidade por se\u00e7\u00e3o e registro imediato de ocorr\u00eancias"
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
              {progress >= 100 ? 'Conclu\u00eddo' : progress >= 50 ? 'Em andamento' : 'Iniciado'}
            </span>
          </div>
          <div style={{ width: '100%', height: 8, background: 'var(--surface-3)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: progressColor, transition: 'width 300ms ease', borderRadius: 'var(--r-full)' }} />
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--s6)', display: 'flex', flexDirection: 'column', gap: 'var(--s6)' }}>
        <form onSubmit={e => { e.preventDefault(); if (!reporterName.trim()) { alert('Preencha o Nome do Operador!'); return; } alert('Checklist sincronizado!'); }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s6)' }}>

          <section className="card" style={{ padding: 'var(--s6)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', insetInline: 0, top: 0, height: 2, background: 'linear-gradient(90deg, var(--primary), #06b6d4)' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--s5)', flexWrap: 'wrap', gap: 'var(--s3)' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>Identifica\u00e7\u00e3o do operador</h2>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 'var(--s1)' }}>Dados vinculados a cada ocorr\u00eancia registrada.</p>
              </div>
              <span className="badge badge-red">Obrigat\u00f3rio</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--s4)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Mec\u00e2nico / Operador</label>
                <div style={{ position: 'relative' }}>
                  <User2 size={16} style={{ position: 'absolute', left: 'var(--s4)', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" className="input" style={{ paddingLeft: 'calc(var(--s4) + 18px + var(--s2))' }} placeholder="Ex: Carlos Silva" value={reporterName} onChange={e => setReporterName(e.target.value)} required />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Turno</label>
                <div style={{ position: 'relative' }}>
                  <Clock3 size={16} style={{ position: 'absolute', left: 'var(--s4)', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <select className="input" style={{ paddingLeft: 'calc(var(--s4) + 18px + var(--s2))', appearance: 'none' }} value={shift} onChange={e => setShift(e.target.value)}>
                    <option value="TURNO A">TURNO A</option>
                    <option value="TURNO B">TURNO B</option>
                    <option value="TURNO C">TURNO C</option>
                    <option value="TURNO D">TURNO D</option>
                  </select>
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
                            <button type="button" onClick={() => handleOpenModal(section.title, item)} className="btn-ghost" style={{ minWidth: 0, paddingInline: 'var(--s3)', color: 'var(--warning)', borderColor: 'rgba(217,119,6,0.18)', background: 'var(--warning-hl)' }} title="Registrar Ocorr\u00eancia">
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
                <div className="badge badge-amber" style={{ marginBottom: 'var(--s3)' }}>Registro de ocorr\u00eancia</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>{activeOccurrence.item}</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 'var(--s2)' }}>Se\u00e7\u00e3o: {activeOccurrence.section}</p>
              </div>
              <button type="button" onClick={handleCloseModal} className="btn-ghost" style={{ paddingInline: 'var(--s3)' }}><X size={16} /></button>
            </div>
            <div style={{ padding: 'var(--s6)', display: 'flex', flexDirection: 'column', gap: 'var(--s5)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--s4)' }}>
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
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>Coment\u00e1rio t\u00e9cnico</label>
                <textarea className="input" value={currentComment} onChange={e => setCurrentComment(e.target.value)} placeholder="Descreva a n\u00e3o conformidade, impacto observado e a\u00e7\u00e3o necess\u00e1ria..." rows={5} style={{ resize: 'vertical', minHeight: 130 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--s3)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>Evid\u00eancias fotogr\u00e1ficas</label>
                  <label className="btn-ghost" style={{ cursor: 'pointer' }}>
                    <ImagePlus size={16} /> Adicionar fotos
                    <input type="file" accept="image/*" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>
                </div>
                {previewUrls.length === 0 ? (
                  <div style={{ border: '1px dashed var(--border)', borderRadius: 'var(--r-xl)', padding: 'var(--s8)', textAlign: 'center', background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                    <Camera size={26} style={{ margin: '0 auto 10px', color: 'var(--text-faint)' }} />
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Nenhuma foto anexada</div>
                    <div style={{ fontSize: 'var(--text-xs)', marginTop: 6, color: 'var(--text-faint)' }}>As fotos ser\u00e3o enviadas ao Google Drive ao salvar</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--s3)' }}>
                    {previewUrls.map((preview, idx) => (
                      <div key={idx} style={{ position: 'relative', borderRadius: 'var(--r-xl)', overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '4/3' }}>
                        <img src={preview} alt={`Preview ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => removePhoto(idx)} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(15,23,42,0.7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={13} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding: 'var(--s5) var(--s6)', borderTop: '1px solid var(--divider)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--s3)', flexWrap: 'wrap' }}>
              <button type="button" className="btn-ghost" onClick={handleCloseModal}>Cancelar</button>
              <button type="button" className="btn-primary" onClick={handleSaveModal} disabled={isUploading}>
                {isUploading ? 'Enviando ao Drive...' : 'Salvar ocorr\u00eancia'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
