import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, X, CheckCircle2, Save, ListTodo, Plus } from 'lucide-react';
import { supabase } from '../../supabase';
import { CHECKLIST_DATA } from '../../constants';

interface ChecklistSection {
  id: string;
  title: string;
  items: string[];
}

export default function AdminChecklistTab() {
  const [checklistTemplate, setChecklistTemplate] = useState<ChecklistSection[]>(() => {
    const saved = localStorage.getItem('checklist_template');
    return saved ? JSON.parse(saved) : CHECKLIST_DATA;
  });
  const [saveChecklistSuccess, setSaveChecklistSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadTemplate() {
      const { data } = await supabase
        .from('checklist_templates')
        .select('data')
        .eq('key', 'padrao')
        .single();
      if (data?.data) {
        setChecklistTemplate(data.data as ChecklistSection[]);
        localStorage.setItem('checklist_template', JSON.stringify(data.data));
      }
    }
    loadTemplate();
  }, []);

  const handleUpdateSectionTitle = (sIdx: number, val: string) => {
    const next = [...checklistTemplate];
    next[sIdx].title = val;
    setChecklistTemplate(next);
  };

  const handleUpdateItem = (sIdx: number, iIdx: number, val: string) => {
    const next = [...checklistTemplate];
    next[sIdx].items[iIdx] = val;
    setChecklistTemplate(next);
  };

  const handleAddItem = (sIdx: number) => {
    const next = [...checklistTemplate];
    next[sIdx].items.push('Novo item de inspeção');
    setChecklistTemplate(next);
  };

  const handleDeleteItem = (sIdx: number, iIdx: number) => {
    const next = [...checklistTemplate];
    next[sIdx].items.splice(iIdx, 1);
    setChecklistTemplate(next);
  };

  const handleAddSection = () => {
    setChecklistTemplate(prev => [
      ...prev,
      { id: `secao_${Date.now()}`, title: 'Nova Seção', items: ['Novo item'] }
    ]);
  };

  const handleDeleteSection = (sIdx: number) => {
    const next = [...checklistTemplate];
    next.splice(sIdx, 1);
    setChecklistTemplate(next);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('checklist_templates')
        .upsert(
          { key: 'padrao', data: checklistTemplate, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );
      if (error) throw error;
      localStorage.setItem('checklist_template', JSON.stringify(checklistTemplate));
      setSaveChecklistSuccess(true);
      setTimeout(() => setSaveChecklistSuccess(false), 3000);
    } catch (err: any) {
      alert('Erro ao salvar template: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 'var(--s5) var(--s6)', flex: 1, overflowY: 'auto' }}>
      <div className="checklist-card">
        {/* Header Section */}
        <div style={{ 
          padding: '24px', 
          background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: '20px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              width: 46, height: 46, borderRadius: 14, 
              background: 'linear-gradient(135deg, var(--primary) 0%, #06b6d4 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(1,105,111,0.35)',
              color: '#fff'
            }}>
              <ListTodo size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Gestão do Checklist</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: 2 }}>Configure os itens de inspeção diária</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {saveChecklistSuccess && (
              <div style={{ 
                background: 'var(--success-hl)', 
                color: 'var(--success)', 
                padding: '8px 16px', 
                borderRadius: 'var(--r-full)',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                animation: 'auSlideDown 0.3s ease'
              }}>
                <CheckCircle2 size={16} /> Salvo com sucesso
              </div>
            )}
            
            <button onClick={handleAddSection} className="btn-secondary" style={{ 
              display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: '12px' 
            }}>
              <PlusCircle size={18} /> Nova Seção
            </button>
            
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="btn-primary" 
              style={{ 
                display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 24px', borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--primary) 0%, #06b6d4 100%)',
                boxShadow: '0 4px 14px rgba(1,105,111,0.3)',
                border: 'none', color: '#fff', fontWeight: 800, fontSize: '14px', cursor: 'pointer'
              }}
            >
              {saving ? <Plus size={18} className="spin-anim" /> : <Save size={18} />}
              Salvar Checklist
            </button>
          </div>
        </div>

        {/* Sections List */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {checklistTemplate.map((section, sIdx) => (
            <div key={section.id} className="checklist-section-card">
              {/* Section Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                <input
                  value={section.title}
                  onChange={(e) => handleUpdateSectionTitle(sIdx, e.target.value)}
                  className="checklist-input-underline"
                  placeholder="Título da Seção"
                />
                <button 
                  onClick={() => handleDeleteSection(sIdx)} 
                  style={{ 
                    color: 'var(--danger)', 
                    background: 'var(--danger-hl)', 
                    width: 36, height: 36,
                    borderRadius: '10px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(220,38,38,0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }} 
                  title="Excluir Seção"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '12px' }}>
                {section.items.map((item, iIdx) => (
                  <div key={iIdx} className="checklist-item-row">
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, opacity: 0.6 }} />
                    <input
                      value={item}
                      onChange={(e) => handleUpdateItem(sIdx, iIdx, e.target.value)}
                      className="input"
                      style={{ flex: 1, height: 42, background: 'var(--surface)', border: '1px solid var(--border)' }}
                      placeholder="Item de inspeção..."
                    />
                    <button 
                      onClick={() => handleDeleteItem(sIdx, iIdx)} 
                      style={{ color: 'var(--text-muted)', padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }} 
                      title="Remover item"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                
                <button 
                  onClick={() => handleAddItem(sIdx)} 
                  style={{ 
                    alignSelf: 'flex-start', 
                    color: 'var(--primary)', 
                    background: 'var(--primary-hl)', 
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontWeight: 700, 
                    fontSize: '13px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    marginTop: '8px',
                    border: '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                >
                  <PlusCircle size={16} /> Adicionar item
                </button>
              </div>
            </div>
          ))}

          {checklistTemplate.length === 0 && (
            <div style={{ 
              padding: '60px', textAlign: 'center', 
              background: 'var(--surface-2)', borderRadius: 'var(--r-xl)', 
              border: '1px dashed var(--border)', color: 'var(--text-muted)' 
            }}>
              <ListTodo size={40} style={{ opacity: 0.2, marginBottom: 16 }} />
              <div style={{ fontWeight: 600 }}>Nenhuma seção configurada.</div>
              <button onClick={handleAddSection} style={{ marginTop: 12, color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', background: 'none', border: 'none' }}>
                Clique aqui para começar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
