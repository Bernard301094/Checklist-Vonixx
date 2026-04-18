import { OccurrenceData } from './types';

export const INITIAL_OCCURRENCES: OccurrenceData[] = [
  {
    id: '1',
    section: '3. Moinho Triturador',
    item: 'Facas afiadas e em bom estado',
    comment: 'Facas desgastadas na borda e sinais de oxidação no eixo central.',
    photos: [
      'https://images.unsplash.com/photo-1590502160462-3c7d6bfaeb07?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1504913659239-6abc87875a63?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1504913659239-6abc87875a63?w=500&h=500&fit=crop'
    ],
    reporter: 'Op. Silva',
    time: '10:30 AM'
  },
  {
    id: '2',
    section: '6. Componentes Mecânicos',
    item: 'Faca de corte (limpa)',
    comment: 'Resíduo excessivo acumulado; requer intervenção de limpeza profunda.',
    photos: [
      'https://images.unsplash.com/photo-1621905252472-7817ebbed58e?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1555626906-fcf10d6851b4?w=500&h=500&fit=crop'
    ],
    reporter: 'Op. Santos',
    time: '11:15 AM'
  }
];

export const CHECKLIST_DATA = [
  {
    id: 'perifericos',
    title: '1. Periféricos (Sugadores a vácuo)',
    items: [
      'Equipamento ligado e operando normalmente',
      'Filtros limpos (sem acúmulo de pó/material)',
      'Mangueiras íntegras (sem rachaduras ou furos)',
      'Nível de material adequado no funil',
      'Sensor de nível funcionando corretamente',
      'Ruídos anormais durante operação'
    ]
  },
  {
    id: 'esteiras',
    title: '2. Esteiras de Transporte de Rebarbas',
    items: [
      'Esteira limpa (sem acúmulo excessivo de material)',
      'Tensionamento adequado',
      'Motor funcionando normalmente (sem aquecimento/ruído)',
      'Sensores funcionando corretamente',
      'Estrutura firme (sem folgas ou vibrações anormais)',
      'Fluxo contínuo de rebarba (sem travamentos)'
    ]
  },
  {
    id: 'moinho',
    title: '3. Moinho Triturador',
    items: [
      'Facas afiadas e em bom estado',
      'Fixação das facas adequada',
      'Alimentação uniforme (sem sobrecarga)',
      'Motor operando sem ruídos ou vibrações anormais',
      'Sistema de segurança funcionando (chaves/intertravamentos)',
      'Ausência de aquecimento excessivo',
      'Saída do material sem obstruções'
    ]
  },
  {
    id: 'operacao',
    title: '4. Operação e Condição do Equipamento',
    items: [
      'Ruídos anormais durante operação',
      'Condição geral do equipamento'
    ]
  },
  {
    id: 'molde',
    title: '5. Molde',
    items: [
      'Condição geral (limpeza, desgaste, danos)',
      'Alinhamento correto',
      'Fixação adequada'
    ]
  },
  {
    id: 'componentes',
    title: '6. Componentes Mecânicos',
    items: [
      'Bocal (integridade, limpeza e encaixe)',
      'Casquilho e bucha (estado e fixação)',
      'Bucha de corte (afiada)',
      'Faca de corte (limpa)',
      'Trefilas (limpas)',
      'Pino de sopro (alinhado e limpo)',
      'Fixação de componentes (parafusos/estruturas)'
    ]
  },
  {
    id: 'lubrificacao',
    title: '7. Lubrificação',
    items: [
      'Nível de graxa',
      'Verificar vazamentos (óleo/graxa)'
    ]
  },
  {
    id: 'parametros',
    title: '8. Parâmetros de Processo',
    items: [
      'Temperatura do óleo',
      'Nível de óleo',
      'Temperatura de processamento (matéria-prima)',
      'Parâmetros de resfriamento dentro do padrão',
      'Fluxo de água adequado (sem obstruções/vazamentos)'
    ]
  },
  {
    id: 'documentacao',
    title: '9. Documentação e Segurança',
    items: [
      'Manual disponível',
      'EPIs em uso',
      'Área de trabalho organizada e limpa'
    ]
  }
];
