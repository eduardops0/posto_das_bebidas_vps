import { DashboardData, ConsultorMetrics, FunnelData, WeeklyData } from './dashboard';

export const dashboardData: DashboardData = {
  totalLeads: 1280,
  leadsResponderamIA: 980,
  conversoesAgendamento: 312,
  abandonoFluxo: 148,
  tempoMedioAgendamento: '1h 32min',
  taxaConversaoAgendamento: 0.3184,
  taxaAbandono: 0.1510,
};

export const consultoresData: ConsultorMetrics[] = [
  {
    nome: 'Lucca',
    tempoMedioResposta: '2m 58s',
    leadsAtendidos: 128,
    conversoes: 45,
  },
  {
    nome: 'Mario',
    tempoMedioResposta: '3m 12s',
    leadsAtendidos: 115,
    conversoes: 38,
  },
  {
    nome: 'Giovana',
    tempoMedioResposta: '5m 41s',
    leadsAtendidos: 98,
    conversoes: 29,
  },
];

export const funnelData: FunnelData[] = [
  { stage: 'Leads Totais', value: 1280, percentage: 100 },
  { stage: 'Interagiram', value: 980, percentage: 76.6 },
  { stage: 'Em Qualificação', value: 642, percentage: 50.2 },
  { stage: 'Agendamento', value: 312, percentage: 24.4 },
  { stage: 'Venda', value: 112, percentage: 8.8 },
];

export const weeklyData: WeeklyData[] = [
  { dia: 'Seg', leads: 165, conversoes: 42, tempoMedio: 92, tempoMedioIA: 0 },
  { dia: 'Ter', leads: 198, conversoes: 51, tempoMedio: 88, tempoMedioIA: 0 },
  { dia: 'Qua', leads: 210, conversoes: 58, tempoMedio: 85, tempoMedioIA: 0 },
  { dia: 'Qui', leads: 185, conversoes: 48, tempoMedio: 95, tempoMedioIA: 0 },
  { dia: 'Sex', leads: 220, conversoes: 62, tempoMedio: 82, tempoMedioIA: 0 },
  { dia: 'Sáb', leads: 142, conversoes: 28, tempoMedio: 105, tempoMedioIA: 0 },
  { dia: 'Dom', leads: 160, conversoes: 23, tempoMedio: 98, tempoMedioIA: 0 },
];
