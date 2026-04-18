import { BarChart3, CheckCircle2, AlertTriangle, Images, ClipboardList } from 'lucide-react';
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
  const maxChecks = 47;
  const validationProgress = Math.round((verifiedCount / maxChecks) * 100);
  const totalPhotos = occurrences.reduce((acc, occ) => acc + occ.photos.length, 0);
  const totalSections = new Set(occurrences.map(occ => occ.section)).size;

  const stats = [
    {
      label: 'Progresso',
      value: `${validationProgress}%`,
      detail: `${verifiedCount}/${maxChecks} itens conformes`,
      icon: BarChart3,
      tone: validationProgress >= 100 ? 'var(--success)' : validationProgress >= 50 ? 'var(--warning)' : 'var(--primary)',
      bg: validationProgress >= 100 ? 'var(--success-hl)' : validationProgress >= 50 ? 'var(--warning-hl)' : 'var(--primary-hl)',
    },
    {
      label: 'Ocorrências',
      value: String(occurrences.length),
      detail: 'Registros críticos do turno',
      icon: AlertTriangle,
      tone: occurrences.length > 0 ? 'var(--warning)' : 'var(--success)',
      bg: occurrences.length > 0 ? 'var(--warning-hl)' : 'var(--success-hl)',
    },
    {
      label: 'Evidências',
      value: String(totalPhotos),
      detail: 'Fotos anexadas',
      icon: Images,
      tone: 'var(--primary)',
      bg: 'var(--primary-hl)',
    },
    {
      label: 'Seções',
      value: String(totalSections || 0),
      detail: 'Áreas com ocorrência',
      icon: ClipboardList,
      tone: 'var(--text)',
      bg: 'var(--surface-2)',
    },
  ];

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text)', overflow: 'hidden' }}>
      <Sidebar role="supervisor" onLogout={onLogout} />

      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        <Header
          userEmail="Supervisor"
          title="Painel do Supervisor"
          subtitle="Monitoramento em tempo real do checklist, evidências e pontos críticos reportados"
          showSyncStatus={true}
        />

        <div style={{ padding: 'var(--s6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--s4)', borderBottom: '1px solid var(--divider)', background: 'var(--surface)' }}>
          {stats.map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="card animate-in" style={{ padding: 'var(--s5)', display: 'flex', alignItems: 'center', gap: 'var(--s4)' }}>
                <div style={{ width: 48, height: 48, borderRadius: 'var(--r-xl)', background: stat.bg, color: stat.tone, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 'var(--s1)' }}>
                    {stat.label}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text)', lineHeight: 1.1 }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>
                    {stat.detail}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--s6)', display: 'flex', flexDirection: 'column', gap: 'var(--s6)' }}>
          {occurrences.length === 0 ? (
            <div className="card" style={{ flex: 1, minHeight: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 'var(--s8)', background: 'var(--surface)' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--success-hl)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--s5)' }}>
                <CheckCircle2 size={34} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text)' }}>
                Nenhuma ocorrência relatada hoje
              </h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 'var(--s2)', maxWidth: 520 }}>
                O checklist está seguindo sem desvios registrados neste turno. Continue monitorando a sincronização e a evolução do progresso global.
              </p>
            </div>
          ) : (
            occurrences.map((occ, idx) => (
              <section key={occ.id} className="card animate-in" style={{ overflow: 'hidden', animationDelay: `${idx * 40}ms` }}>
                <div style={{ padding: 'var(--s5) var(--s6)', background: 'var(--sidebar-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--s4)', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 'var(--s1)' }}>
                      Seção monitorada
                    </div>
                    <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: '#fff' }}>{occ.section}</h2>
                  </div>
                  <span className="badge badge-amber">Ocorrência crítica</span>
                </div>

                <div style={{ padding: 'var(--s6)', display: 'flex', flexDirection: 'column', gap: 'var(--s6)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 'var(--s5)' }} className="supervisor-top-grid">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
                      <div>
                        <div style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--warning)', marginBottom: 'var(--s2)' }}>
                          Fator crítico
                        </div>
                        <div style={{ padding: 'var(--s4)', background: 'var(--warning-hl)', border: '1px solid rgba(217,119,6,0.16)', borderRadius: 'var(--r-xl)' }}>
                          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text)', lineHeight: 1.4 }}>{occ.item}</h3>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 'var(--s2)' }}>
                          Comentário do operador
                        </div>
                        <div style={{ padding: 'var(--s4)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)' }}>
                          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text)', lineHeight: 1.7, fontWeight: 500 }}>
                            {occ.comment || 'Sem comentário informado.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
                      <div className="card" style={{ padding: 'var(--s4)', background: 'var(--surface-2)' }}>
                        <div style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 'var(--s1)' }}>
                          Relatado por
                        </div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text)' }}>{occ.reporter}</div>
                      </div>

                      <div className="card" style={{ padding: 'var(--s4)', background: 'var(--surface-2)' }}>
                        <div style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 'var(--s1)' }}>
                          Hora do registro
                        </div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{occ.time}</div>
                      </div>

                      <div className="card" style={{ padding: 'var(--s4)', background: 'var(--primary-hl)' }}>
                        <div style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--primary)', marginBottom: 'var(--s1)' }}>
                          Evidências
                        </div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text)' }}>{occ.photos.length} foto(s)</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 'var(--s3)' }}>
                      Evidências fotográficas
                    </div>

                    {occ.photos.length === 0 ? (
                      <div style={{ padding: 'var(--s6)', border: '1px dashed var(--border)', borderRadius: 'var(--r-xl)', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface-2)' }}>
                        Nenhuma foto enviada para esta ocorrência.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--s4)' }}>
                        {occ.photos.map((photo, pIdx) => (
                          <div key={pIdx} style={{ position: 'relative', borderRadius: 'var(--r-xl)', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface-2)', aspectRatio: '16 / 10' }}>
                            <img src={photo} alt={`Evidência ${pIdx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 300ms ease' }} />
                            <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(15,23,42,0.75)', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '6px 8px', borderRadius: '999px' }}>
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
      </main>

      <style>{`
        @media (max-width: 980px) {
          .supervisor-top-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
