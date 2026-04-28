import React, { useState, useRef } from 'react';
import {
  AlertTriangle, Clock, Calendar, X, Hash, MessageSquare,
  Pencil, ImagePlus, Loader2, Camera, ChevronUp, ChevronDown, ChevronRight, Save
} from 'lucide-react';
import { OccurrenceData } from '../../types';
import { uploadPhoto } from '../../lib/uploadPhoto';

export function formatFullDate(dk: string): string {
  const d = new Date(dk + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function EditModal({
  occ, onClose, onSaved
}: {
  occ: OccurrenceData;
  onClose: () => void;
  onSaved: (patch: { comment: string; photos: string[] }) => Promise<void>;
}) {
  const [comment, setComment] = useState(occ.comment || '');
  const [existingPhotos, setExistingPhotos] = useState<string[]>(occ.photos || []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    setNewFiles(prev => [...prev, ...files]);
    setNewPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeExisting = (idx: number) => {
    setExistingPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const removeNew = (idx: number) => {
    URL.revokeObjectURL(newPreviews[idx]);
    setNewFiles(prev => prev.filter((_, i) => i !== idx));
    setNewPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    setUploadProgress('');
    try {
      let uploaded: string[] = [];
      if (newFiles.length > 0) {
        for (let i = 0; i < newFiles.length; i++) {
          setUploadProgress(`Enviando foto ${i + 1} de ${newFiles.length}...`);
          const url = await uploadPhoto(newFiles[i], `ocorrencias/edit`);
          uploaded.push(url);
        }
      }
      const finalPhotos = [...existingPhotos, ...uploaded];
      await onSaved({ comment, photos: finalPhotos });
      newPreviews.forEach(u => URL.revokeObjectURL(u));
      onClose();
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
      setUploadProgress('');
    }
  };

  const totalPhotos = existingPhotos.length + newPreviews.length;

  return (
    <>
      <style>{`
        .edit-overlay{position:fixed;inset:0;background:rgba(2,6,23,0.88);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:4000;padding:16px;animation:fadeInEd .15s ease;}
        .edit-box{width:100%;max-width:540px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-2xl);box-shadow:var(--sh-xl);max-height:94dvh;display:flex;flex-direction:column;overflow:hidden;animation:slideUpEd .2s ease;}
        @media(max-width:480px){.edit-overlay{align-items:flex-end;padding:0;}.edit-box{max-width:100%;border-bottom-left-radius:0;border-bottom-right-radius:0;max-height:96dvh;}}
        @keyframes fadeInEd{from{opacity:0}to{opacity:1}}
        @keyframes slideUpEd{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
      `}</style>
      <div className="edit-overlay" onClick={e => { if (e.target === e.currentTarget && !saving) onClose(); }}>
        <div className="edit-box">
          {/* Header */}
          <div style={{ padding: 'var(--s4) var(--s5)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--sidebar-bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)' }}>
              <div style={{ width: 38, height: 38, borderRadius: 'var(--r-xl)', background: 'rgba(13,148,136,0.2)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Pencil size={17} />
              </div>
              <div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 2 }}>Editar ocorrência</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#fff', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{occ.item}</div>
              </div>
            </div>
            <button onClick={() => !saving && onClose()} style={{ width: 34, height: 34, borderRadius: 'var(--r-lg)', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <X size={15} />
            </button>
          </div>

          {/* Info */}
          <div style={{ padding: 'var(--s3) var(--s5)', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'flex', gap: 'var(--s3)', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>Seção: <strong style={{ color: 'var(--text)' }}>{occ.section}</strong></span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>Hora: <strong style={{ color: 'var(--text)' }}>{occ.time}</strong></span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--warning)', background: 'var(--warning-hl)', padding: '2px 8px', borderRadius: 999 }}>
              <AlertTriangle size={11} /> Edição disponível apenas hoje
            </span>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--s5)', display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', fontWeight: 700 }}>
                <MessageSquare size={14} style={{ color: 'var(--primary)' }} />
                Comentário técnico
              </label>
              <textarea
                className="input"
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Descreva a não conformidade, impacto observado e ação necessária..."
                rows={4}
                disabled={saving}
                style={{ resize: 'vertical', minHeight: 100 }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--s2)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', fontWeight: 700 }}>
                  <Camera size={14} style={{ color: 'var(--primary)' }} />
                  Evidências fotográficas
                  {totalPhotos > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-hl)', padding: '1px 7px', borderRadius: 999 }}>{totalPhotos}</span>}
                </label>
                <div style={{ display: 'flex', gap: 'var(--s2)' }}>
                  <label className="btn-ghost" style={{ cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-xs)', padding: '6px 10px' }}>
                    <Camera size={14} /> Câmera
                    <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleAddFiles} onClick={() => localStorage.setItem('skipBiometric', 'true')} disabled={saving} style={{ display: 'none' }} />
                  </label>
                  <label className="btn-ghost" style={{ cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-xs)', padding: '6px 10px' }}>
                    <ImagePlus size={14} /> Galeria
                    <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleAddFiles} onClick={() => localStorage.setItem('skipBiometric', 'true')} disabled={saving} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              {existingPhotos.length === 0 && newPreviews.length === 0 ? (
                <div style={{ border: '1px dashed var(--border)', borderRadius: 'var(--r-xl)', padding: 'var(--s5)', textAlign: 'center', background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                  <Camera size={22} style={{ margin: '0 auto 8px', color: 'var(--text-faint)' }} />
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Sem fotos anexadas</div>
                  <div style={{ fontSize: 'var(--text-xs)', marginTop: 4, color: 'var(--text-faint)' }}>Adicione fotos usando câmera ou galeria acima</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 'var(--s2)' }}>
                  {existingPhotos.map((url, i) => (
                    <div key={`ex-${i}`} style={{ position: 'relative', borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '1' }}>
                      <img src={url} alt={`Foto ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                      <div style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(13,148,136,0.85)', color: '#fff', fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 999 }}>salva</div>
                      {!saving && (
                        <button type="button" onClick={() => removeExisting(i)} style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: '50%', background: 'rgba(220,38,38,0.85)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  ))}
                  {newPreviews.map((url, i) => (
                    <div key={`new-${i}`} style={{ position: 'relative', borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '1px solid rgba(251,191,36,0.4)', aspectRatio: '1' }}>
                      <img src={url} alt={`Nova foto ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(217,119,6,0.85)', color: '#fff', fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 999 }}>nova</div>
                      {!saving && (
                        <button type="button" onClick={() => removeNew(i)} style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: '50%', background: 'rgba(220,38,38,0.85)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: 'var(--s4) var(--s5)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--s3)', flexWrap: 'wrap', flexShrink: 0 }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--primary)', fontWeight: 600, minHeight: 18 }}>
              {saving && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Loader2 size={14} style={{ animation: 'spinEd 1s linear infinite' }} />
                  {uploadProgress || 'Salvando...'}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 'var(--s2)' }}>
              <button type="button" className="btn-ghost" onClick={onClose} disabled={saving} style={{ fontSize: 'var(--text-sm)' }}>Cancelar</button>
              <button type="button" className="btn-primary" onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)' }}>
                <Save size={15} />
                {saving ? 'Salvando...' : 'Salvar edição'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spinEd { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

export function OccDetailModal({
  occ, onClose, onPhoto, onEdit, canEdit
}: {
  occ: OccurrenceData;
  onClose: () => void;
  onPhoto: (photos: string[], i: number) => void;
  onEdit: () => void;
  canEdit: boolean;
}) {
  const dateStr = occ.created_at
    ? new Date(occ.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';

  return (
    <>
      <style>{`
        .myrec-overlay{position:fixed;inset:0;background:rgba(2,6,23,0.88);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:3000;padding:var(--s4);animation:fadeInMR 0.15s ease;}
        .myrec-box{width:100%;max-width:520px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-2xl);box-shadow:var(--sh-xl);max-height:92dvh;display:flex;flex-direction:column;overflow:hidden;animation:slideUpMR 0.2s ease;}
        @media(max-width:480px){.myrec-overlay{align-items:flex-end;padding:0;}.myrec-box{max-width:100%;border-bottom-left-radius:0;border-bottom-right-radius:0;max-height:96dvh;}}
        @keyframes fadeInMR{from{opacity:0}to{opacity:1}}
        @keyframes slideUpMR{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
      `}</style>
      <div className="myrec-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="myrec-box">
          <div style={{ padding: 'var(--s4) var(--s5)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--sidebar-bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)' }}>
              <div style={{ width: 38, height: 38, borderRadius: 'var(--r-xl)', background: 'rgba(217,119,6,0.2)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={17} />
              </div>
              <div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 2 }}>Minha Ocorrência</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#fff' }}>{occ.section}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--s2)', alignItems: 'center' }}>
              {canEdit && (
                <button onClick={onEdit} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 'var(--r-lg)', background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer' }}>
                  <Pencil size={13} /> Editar
                </button>
              )}
              <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 'var(--r-lg)', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={15} />
              </button>
            </div>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s3)', padding: 'var(--s4) var(--s5)', borderBottom: '1px solid var(--border)' }}>
              {[
                { icon: Calendar, label: 'Data', value: dateStr },
                { icon: Clock, label: 'Hora', value: occ.time },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s1)', padding: 'var(--s3)', background: 'var(--surface-2)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                    <Icon size={12} />
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text)' }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: 'var(--s4) var(--s5)', display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 'var(--s2)' }}>
                  <Hash size={13} style={{ color: 'var(--warning)' }} />
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--warning)' }}>Fator crítico</span>
                </div>
                <div style={{ padding: 'var(--s4)', background: 'var(--warning-hl)', border: '1px solid rgba(217,119,6,0.18)', borderRadius: 'var(--r-xl)' }}>
                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, lineHeight: 1.5 }}>{occ.item}</p>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 'var(--s2)' }}>
                  <MessageSquare size={13} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>Comentário</span>
                </div>
                <div style={{ padding: 'var(--s4)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)' }}>
                  <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.7, fontWeight: 500, color: occ.comment ? 'var(--text)' : 'var(--text-muted)' }}>
                    {occ.comment || 'Nenhum comentário informado.'}
                  </p>
                </div>
              </div>

              {occ.photos.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 'var(--s2)' }}>
                    <Camera size={13} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--primary)' }}>Evidências — {occ.photos.length} foto(s)</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 'var(--s3)' }}>
                    {occ.photos.map((p, i) => (
                      <button key={i} type="button" onClick={() => onPhoto(occ.photos, i)}
                        style={{ position: 'relative', borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '1', padding: 0, cursor: 'zoom-in', background: 'var(--surface-2)' }}>
                        <img src={p} alt={`Foto ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                        <div style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(15,23,42,0.75)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 999 }}>{i+1}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {canEdit && (
                <button type="button" onClick={onEdit}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 'var(--s3)', borderRadius: 'var(--r-xl)', border: '1px dashed var(--primary)', background: 'var(--primary-hl)', color: 'var(--primary)', fontWeight: 700, fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                  <Pencil size={15} /> Editar comentário / fotos
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function DayGroup({ dateKey, occs, onSelect, isToday }: { dateKey: string; occs: OccurrenceData[]; onSelect: (o: OccurrenceData) => void; isToday: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)', background: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)', padding: 'var(--s2) var(--s3)', background: isToday ? 'var(--primary-hl)' : 'var(--surface-2)', border: `1px solid ${isToday ? 'rgba(13,148,136,0.25)' : 'var(--border)'}`, borderRadius: 'var(--r-full)' }}>
          <Calendar size={12} style={{ color: isToday ? 'var(--primary)' : 'var(--text-muted)' }} />
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: isToday ? 'var(--primary)' : 'var(--text)' }}>{formatFullDate(dateKey)}</span>
          {isToday && <span style={{ fontSize: 10, fontWeight: 800, background: 'var(--primary)', color: '#fff', padding: '1px 6px', borderRadius: 999 }}>hoje</span>}
        </div>
        <div style={{ flex: 1, height: 1, background: 'var(--divider)' }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          {occs.length} item(s) {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </span>
      </button>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)', paddingLeft: 'var(--s2)' }}>
          {occs.map(occ => (
            <button key={occ.id} type="button" onClick={() => onSelect(occ)}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', padding: 'var(--s3) var(--s4)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', cursor: 'pointer', textAlign: 'left', transition: 'background 150ms ease' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}>
              <div style={{ width: 3, alignSelf: 'stretch', background: 'var(--warning)', borderRadius: 'var(--r-full)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{occ.section}</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{occ.item}</div>
                {occ.comment && (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{occ.comment}</div>
                )}
              </div>
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--s1)' }}>
                {isToday && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-hl)', padding: '1px 6px', borderRadius: 999 }}>
                    <Pencil size={9} /> editável
                  </span>
                )}
                {occ.photos.length > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>
                    <Camera size={10} /> {occ.photos.length}
                  </span>
                )}
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Clock size={10} /> {occ.time}
                </span>
                <ChevronRight size={13} style={{ color: 'var(--text-faint)' }} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
