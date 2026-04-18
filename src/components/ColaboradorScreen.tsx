import React, { useMemo, useState } from 'react';
import { Camera, AlertTriangle, X, CheckCircle2, ChevronDown, User2, Clock3, ImagePlus } from 'lucide-react';
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
  const [activeOccurrence, setActiveOccurrence] = useState<{ section: string; item: string } | null>(null);
  const [reporterName, setReporterName] = useState('');
  const [shift, setShift] = useState('TURNO A');
  const [currentComment, setCurrentComment] = useState('');
  const [currentPhotos, setCurrentPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    Object.fromEntries(CHECKLIST_DATA.map(section => [section.id, true]))
  );

  const totalItems = useMemo(
    () => CHECKLIST_DATA.reduce((acc, section) => acc + section.items.length, 0),
    []
  );
  const checkedCount = Object.values(checklistState).filter(Boolean).length;
  const progress = totalItems ? Math.round((checkedCount / totalItems) * 100) : 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => {
        const imageUrl = URL.createObjectURL(file);
        setCurrentPhotos(prev => [...prev, imageUrl]);
      });
    }
  };

  const handleOpenModal = (sectionTitle: string, itemStr: string) => {
    if (!reporterName.trim()) {
      alert('Por favor, preencha o Nome do Operador antes de registrar uma ocorrência.');
      return;
    }
    setActiveOccurrence({ section: sectionTitle, item: itemStr });
  };

  const handleSaveModal = async () => {
    if (!activeOccurrence) return;

    setIsUploading(true);
    let uploadSuccess = false;

    if (currentPhotos.length > 0) {
      // @ts-ignore
      const appsScriptUrl = import.meta.env.VITE_APPS_SCRIPT_URL;

      if (!appsScriptUrl) {
        alert('Erro: O VITE_APPS_SCRIPT_URL não foi configurado nos Secrets do aplicativo.');
      } else {
        try {
          const uploadPromises = currentPhotos.map(async (photoBase64, index) => {
            const res = await fetch(appsScriptUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({
                photo: photoBase64,
                filename: `Ocorrencia_${reporterName.trim()}_${Date.now()}_img${index}.jpg`,
                item: activeOccurrence.item,
              }),
            });
            return res.json();
          });

          await Promise.all(uploadPromises);
          uploadSuccess = true;
        } catch (e) {
          console.error('Erro ao subir fotos pelo Apps Script:', e);
          alert('Houve um problema de conexão ao enviar as fotos para o Google Drive.');
        }
      }
    }

    onSaveOccurrence({
      section: activeOccurrence.section,
      item: activeOccurrence.item,
      comment: currentComment,
      photos: currentPhotos,
      reporter: `${reporterName.trim()} (${shift}) - Auth: ${userEmail}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    setCurrentComment('');
    setCurrentPhotos([]);
    setActiveOccurrence(null);
    setIsUploading(false);

    if (currentPhotos.length > 0 && uploadSuccess) {
      alert('Ocorrência salva e enviada para o Google Drive com sucesso!');
    } else {
      alert('Ocorrência salva com sucesso.');
    }
  };

  const handleCloseModal = () => {
    setCurrentComment('');
    setCurrentPhotos([]);
    setActiveOccurrence(null);
  };

  const removePhoto = (index: number) => {
    setCurrentPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const getSectionProgress = (sectionId: string, itemsLength: number) => {
    const checked = Array.from({ length: itemsLength }).filter((_, idx) => checklistState[`${sectionId}-${idx}`]).length;
    return {
      checked,
      total: itemsLength,
      percent: itemsLength ? Math.round((checked / itemsLength) * 100) : 0,
    };
  };

  const progressColor = progress >= 100 ? 'var(--success)' : progress >= 50 ? 'var(--warning)' : 'var(--primary)';

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      minHeight: '100dvh',
      background: 'var(--bg)',
      color: 'var(--text)',
      overflow: 'hidden',
    }}>
      <Sidebar role="colaborador" onLogout={onLogout} />

      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        <Header
          userEmail={userEmail}
          title="Checklist Diário"
          subtitle="Inspeção operacional, conformidade por seção e registro imediato de ocorrências"
        />

        <div style={{ padding: 'var(--s6)', borderBottom: '1px solid var(--divider)', background: 'var(--surface)' }}>
          <div className="card" style={{ padding: 'var(--s5)', display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--s4)', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 'var(--s1)' }}>
                  Progresso Global
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--s2)' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
                    {progress}%
                  </span>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {checkedCount} de {totalItems} itens conformes
                  </span>
                </div>
              </div>
              <span className={progress >= 100 ? 'badge badge-green' : progress >= 50 ? 'badge badge-amber' : 'badge badge-teal'}>
                {progress >= 100 ? 'Concluído' : progress >= 50 ? 'Em andamento' : 'Iniciado'}
              </span>
            </div>
            <div style={{ width: '100%', height: 10, background: 'var(--surface-3)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: progressColor, transition: 'width 300ms ease' }} />
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--s6)', display: 'flex', flexDirection: 'column', gap: 'var(--s6)' }}>
          <form
            onSubmit={e => {
              e.preventDefault();
              if (!reporterName.trim()) {
                alert('Por favor, preencha o Nome do Operador antes de sincronizar o checklist!');
                return;
              }
              alert('Checklist geral sincronizado com sucesso!');
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s6)' }}
          >
            <section className="card" style={{ padding: 'var(--s6)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', insetInline: 0, top: 0, height: 2, background: 'linear-gradient(90deg, var(--primary), #06b6d4)' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--s4)', marginBottom: 'var(--s5)', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text)' }}>
                    Identificação do operador
                  </h2>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 'var(--s1)' }}>
                    Esses dados acompanham cada ocorrência registrada no checklist.
                  </p>
                </div>
                <span className="badge badge-red">Obrigatório</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--s4)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)' }}>Mecânico / Operador</label>
                  <div style={{ position: 'relative' }}>
                    <User2 size={16} style={{ position: 'absolute', left: 'var(--s4)', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="input"
                      style={{ paddingLeft: 'calc(var(--s4) + 18px + var(--s2))' }}
                      placeholder="Ex: Carlos Silva"
                      value={reporterName}
                      onChange={e => setReporterName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)' }}>Turno</label>
                  <div style={{ position: 'relative' }}>
                    <Clock3 size={16} style={{ position: 'absolute', left: 'var(--s4)', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <select
                      className="input"
                      style={{ paddingLeft: 'calc(var(--s4) + 18px + var(--s2))', appearance: 'none' }}
                      value={shift}
                      onChange={e => setShift(e.target.value)}
                    >
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
                  <button
                    type="button"
                    onClick={() => setOpenSections(prev => ({ ...prev, [section.id]: !prev[section.id] }))}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 'var(--s4)',
                      padding: 'var(--s5) var(--s6)',
                      background: 'var(--surface)',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', flexWrap: 'wrap', marginBottom: 'var(--s2)' }}>
                        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text)' }}>{section.title}</h2>
                        <span className={stats.percent === 100 ? 'badge badge-green' : stats.percent > 0 ? 'badge badge-amber' : 'badge badge-teal'}>
                          {stats.checked}/{stats.total}
                        </span>
                      </div>
                      <div style={{ width: '100%', height: 6, background: 'var(--surface-3)', borderRadius: 'var(--r-full)', overflow: 'hidden', maxWidth: 320 }}>
                        <div style={{ width: `${stats.percent}%`, height: '100%', background: stats.percent === 100 ? 'var(--success)' : 'var(--primary)' }} />
                      </div>
                    </div>
                    <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 180ms ease', color: 'var(--text-muted)' }} />
                  </button>

                  {isOpen && (
                    <div style={{ padding: '0 var(--s4) var(--s4)', display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
                      {section.items.map((item, idx) => {
                        const itemKey = `${section.id}-${idx}`;
                        const checked = checklistState[itemKey] || false;
                        return (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: 'var(--s4)',
                              padding: 'var(--s4)',
                              borderRadius: 'var(--r-lg)',
                              background: checked ? 'var(--success-hl)' : 'var(--surface-2)',
                              border: `1px solid ${checked ? 'rgba(22,163,74,0.18)' : 'var(--border)'}`,
                            }}
                          >
                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--s3)', flex: 1, cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={e => onCheck(itemKey, e.target.checked)}
                                style={{ marginTop: 3, width: 18, height: 18, accentColor: 'var(--primary)', cursor: 'pointer' }}
                              />
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s1)' }}>
                                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)', lineHeight: 1.5 }}>{item}</span>
                                {checked && (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--success)', fontWeight: 700 }}>
                                    <CheckCircle2 size={14} /> Item validado
                                  </span>
                                )}
                              </div>
                            </label>

                            {!checked && (
                              <button
                                type="button"
                                onClick={() => handleOpenModal(section.title, item)}
                                className="btn-ghost"
                                style={{ minWidth: 0, paddingInline: 'var(--s3)', color: 'var(--warning)', borderColor: 'rgba(217,119,6,0.18)', background: 'var(--warning-hl)' }}
                                title="Registrar Ocorrência"
                              >
                                <AlertTriangle size={16} />
                                <span style={{ display: 'none' }} className="desktop-inline">Ocorrência</span>
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
              <button type="submit" className="btn-primary" style={{ minWidth: 220 }}>
                Sincronizar checklist
              </button>
            </div>
          </form>
        </div>
      </main>

      {activeOccurrence && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.55)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--s4)',
          zIndex: 1000,
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 760, maxHeight: '90vh', overflow: 'auto', boxShadow: 'var(--sh-xl)' }}>
            <div style={{ padding: 'var(--s6)', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--s4)' }}>
              <div>
                <div className="badge badge-amber" style={{ marginBottom: 'var(--s3)' }}>Registro de ocorrência</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text)' }}>
                  {activeOccurrence.item}
                </h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 'var(--s2)' }}>
                  Seção: {activeOccurrence.section}
                </p>
              </div>
              <button type="button" onClick={handleCloseModal} className="btn-ghost" style={{ paddingInline: 'var(--s3)' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: 'var(--s6)', display: 'flex', flexDirection: 'column', gap: 'var(--s5)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--s4)' }}>
                <div className="card" style={{ padding: 'var(--s4)', background: 'var(--surface-2)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 'var(--s1)' }}>
                    Operador
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text)' }}>{reporterName || 'Não informado'}</div>
                </div>
                <div className="card" style={{ padding: 'var(--s4)', background: 'var(--surface-2)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 'var(--s1)' }}>
                    Turno
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text)' }}>{shift}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text)' }}>Comentário técnico</label>
                <textarea
                  className="input"
                  value={currentComment}
                  onChange={e => setCurrentComment(e.target.value)}
                  placeholder="Descreva a não conformidade, impacto observado e ação necessária..."
                  rows={5}
                  style={{ resize: 'vertical', minHeight: 140 }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--s4)', flexWrap: 'wrap' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text)' }}>Evidências fotográficas</label>
                  <label className="btn-ghost" style={{ cursor: 'pointer' }}>
                    <ImagePlus size={16} />
                    Adicionar fotos
                    <input type="file" accept="image/*" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>
                </div>

                {currentPhotos.length === 0 ? (
                  <div style={{
                    border: '1px dashed var(--border)',
                    borderRadius: 'var(--r-xl)',
                    padding: 'var(--s8)',
                    textAlign: 'center',
                    background: 'var(--surface-2)',
                    color: 'var(--text-muted)',
                  }}>
                    <Camera size={28} style={{ margin: '0 auto 12px', color: 'var(--text-faint)' }} />
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Nenhuma foto anexada</div>
                    <div style={{ fontSize: 'var(--text-xs)', marginTop: '6px' }}>Adicione imagens para documentar a ocorrência.</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--s4)' }}>
                    {currentPhotos.map((photo, idx) => (
                      <div key={idx} style={{ position: 'relative', borderRadius: 'var(--r-xl)', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface-2)', aspectRatio: '4 / 3' }}>
                        <img src={photo} alt={`Evidência ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          style={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            background: 'rgba(15,23,42,0.72)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: 'var(--s5) var(--s6)', borderTop: '1px solid var(--divider)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--s3)', flexWrap: 'wrap' }}>
              <button type="button" className="btn-ghost" onClick={handleCloseModal}>Cancelar</button>
              <button type="button" className="btn-primary" onClick={handleSaveModal} disabled={isUploading}>
                {isUploading ? 'Enviando...' : 'Salvar ocorrência'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .desktop-inline { display: inline !important; }
        }
      `}</style>
    </div>
  );
}
