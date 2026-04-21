import { useState } from 'react';
import { BarChart3, CheckCircle2, AlertTriangle, Images, ClipboardList, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { OccurrenceData } from '../types';
import Header from './Header';

interface SupervisorScreenProps {
  onLogout: () => void;
  occurrences: OccurrenceData[];
  checklistState: Record<string, boolean>;
}

export default function SupervisorScreen({ onLogout, occurrences, checklistState }: SupervisorScreenProps) {
  const [lightbox, setLightbox] = useState<{ photos: string[]; index: number } | null>(null);

  const verifiedCount = Object.values(checklistState).filter(v => v).length;
  const maxChecks = 47;
  const validationProgress = Math.round((verifiedCount / maxChecks) * 100);
  const totalPhotos = occurrences.reduce((acc, occ) => acc + occ.photos.length, 0);
  const totalSections = new Set(occurrences.map(occ => occ.section)).size;

  const stats = [
    { label: 'Progresso', value: `${validationProgress}%`, detail: `${verifiedCount}/${maxChecks} itens conformes`, icon: BarChart3, tone: validationProgress >= 100 ? 'var(--success)' : validationProgress >= 50 ? 'var(--warning)' : 'var(--primary)', bg: validationProgress >= 100 ? 'var(--success-hl)' : validationProgress >= 50 ? 'var(--warning-hl)' : 'var(--primary-hl)' },
    { label: 'Ocorrências', value: String(occurrences.length), detail: 'Registros críticos do turno', icon: AlertTriangle, tone: occurrences.length > 0 ? 'var(--warning)' : 'var(--success)', bg: occurrences.length > 0 ? 'var(--warning-hl)' : 'var(--success-hl)' },
    { label: 'Evidências', value: String(totalPhotos), detail: 'Fotos anexadas', icon: Images, tone: 'var(--primary)', bg: 'var(--primary-hl)' },
    { label: 'Seções', value: String(totalSections), detail: 'Áreas com ocorrência', icon: ClipboardList, tone: 'var(--text)', bg: 'var(--surface-2)' },
  ];

  const openLightbox = (photos: string[], index: number) => setLightbox({ photos, index });
  const closeLightbox = () => setLightbox(null);
  const prevPhoto = () => setLightbox(prev => prev ? { ...prev, index: prev.index === 0 ? prev.photos.length - 1 : prev.index - 1 } : null);
  const nextPhoto = () => setLightbox(prev => prev ? { ...prev, index: prev.index === prev.photos.length - 1 ? 0 : prev.index + 1 } : null);

  const groupedOccurrences = occurrences.reduce((acc, occ) => {
    const dateObj = occ.created_at ? new Date(occ.created_at) : new Date();
    // Default to PT-BR format (DD/MM/YYYY)
    const dateStr = dateObj.toLocaleDateString('pt-BR');
    const reporter = occ.reporter.split(' - Auth:')[0]; // Extract just the reporter name + shift

    if (!acc[dateStr]) acc[dateStr] = {};
    if (!acc[dateStr][reporter]) acc[dateStr][reporter] = [];
    
    acc[dateStr][reporter].push(occ);
    return acc;
  }, {} as Record<string, Record<string, OccurrenceData[]>>);

  const sortedDates = Object.keys(groupedOccurrences).sort((a, b) => {
    const parseDate = (d: string) => d.split('/').reverse().join('-');
    return parseDate(b).localeCompare(parseDate(a)); // sort descending
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text)' }}>
      <Header
        userEmail="Supervisor"
        title="Painel do Supervisor"
        subtitle="Monitoramento em tempo real do checklist, evidências e pontos críticos reportados"
        showSyncStatus={true}
        role="supervisor"
        onLogout={onLogout}
      />

      <div style={{ padding: 'var(--s5) var(--s6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--s4)', borderBottom: '1px solid var(--divider)', background: 'var(--surface)' }}>
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card animate-in" style={{ padding: 'var(--s5)', display: 'flex', alignItems: 'center', gap: 'var(--s4)' }}>
              <div style={{ width: 46, height: 46, borderRadius: 'var(--r-xl)', background: stat.bg, color: stat.tone, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={21} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 'var(--s1)' }}>{stat.label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700, lineHeight: 1.1 }}>{stat.value}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>{stat.detail}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--s6)', display: 'flex', flexDirection: 'column', gap: 'var(--s6)' }}>
        {occurrences.length === 0 ? (
          <div className="card" style={{ flex: 1, minHeight: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 'var(--s8)' }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'var(--success-hl)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--s5)' }}>
              <CheckCircle2 size={32} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>Nenhuma ocorrência relatada hoje</h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 'var(--s2)', maxWidth: 480 }}>O checklist está seguindo sem desvios registrados neste turno. Continue monitorando a evolução do progresso global.</p>
          </div>
        ) : (
          sortedDates.map((dateStr) => (
            <div key={dateStr} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s5)' }}>
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--s2)' }}>
                Data: {dateStr}
              </h2>
              
              {Object.keys(groupedOccurrences[dateStr]).map((reporter) => (
                <div key={reporter} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)', marginLeft: 'var(--s4)' }}>
                  <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--primary)' }}>
                    Colaborador: {reporter}
                  </h3>
                  
                  {groupedOccurrences[dateStr][reporter].map((occ, idx) => (
                    <section key={occ.id} className="card animate-in" style={{ overflow: 'hidden', animationDelay: `${idx * 40}ms`, marginLeft: 'var(--s4)' }}>
                      <div style={{ padding: 'var(--s5) var(--s6)', background: 'var(--sidebar-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--s4)', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 'var(--s1)' }}>Seção monitorada</div>
                          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: '#fff' }}>{occ.section}</h2>
                        </div>
                        <span className="badge badge-amber">Ocorrência crítica</span>
                      </div>

                      <div style={{ padding: 'var(--s6)', display: 'flex', flexDirection: 'column', gap: 'var(--s5)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--s4)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
                            <div>
                              <div style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--warning)', marginBottom: 'var(--s2)' }}>Fator crítico</div>
                              <div style={{ padding: 'var(--s4)', background: 'var(--warning-hl)', border: '1px solid rgba(217,119,6,0.16)', borderRadius: 'var(--r-xl)' }}>
                                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, lineHeight: 1.4 }}>{occ.item}</h3>
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 'var(--s2)' }}>Comentário do operador</div>
                              <div style={{ padding: 'var(--s4)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)' }}>
                                <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.7, fontWeight: 500 }}>{occ.comment || 'Sem comentário informado.'}</p>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
                            {[{ label: 'Hora do registro', value: occ.time }, { label: 'Evidências', value: `${occ.photos.length} foto(s)` }].map(item => (
                              <div key={item.label} className="card" style={{ padding: 'var(--s4)', background: 'var(--surface-2)' }}>
                                <div style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 'var(--s1)' }}>{item.label}</div>
                                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{item.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {occ.photos.length > 0 && (
                          <div>
                            <div style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 'var(--s3)' }}>Evidências fotográficas</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--s4)' }}>
                              {occ.photos.map((photo, pIdx) => (
                                <button key={pIdx} type="button" onClick={() => openLightbox(occ.photos, pIdx)} style={{ position: 'relative', borderRadius: 'var(--r-xl)', overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '16/10', padding: 0, cursor: 'zoom-in', background: 'var(--surface-2)' }}>
                                  <img src={photo} alt={`Evidência ${pIdx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(15,23,42,0.75)', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '5px 8px', borderRadius: 999 }}>Foto {pIdx + 1}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </section>
                  ))}
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {lightbox && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 'var(--s4)' }}>
          <button type="button" onClick={closeLightbox} style={{ position: 'absolute', top: 20, right: 20, width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} />
          </button>

          {lightbox.photos.length > 1 && (
            <button type="button" onClick={prevPhoto} style={{ position: 'absolute', left: 20, width: 46, height: 46, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={22} />
            </button>
          )}

          <div style={{ maxWidth: 'min(1200px, 92vw)', maxHeight: '88vh', display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
            <img src={lightbox.photos[lightbox.index]} alt={`Foto ampliada ${lightbox.index + 1}`} style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 'var(--r-xl)', boxShadow: 'var(--sh-xl)' }} />
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.85)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
              Foto {lightbox.index + 1} de {lightbox.photos.length}
            </div>
          </div>

          {lightbox.photos.length > 1 && (
            <button type="button" onClick={nextPhoto} style={{ position: 'absolute', right: 20, width: 46, height: 46, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={22} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
