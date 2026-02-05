export interface DashboardData {
  totalLeads: number;
  leadsResponderamIA: number;
  conversoesAgendamento: number;
  abandonoFluxo: number;
  tempoMedioAgendamento: string;
  taxaConversaoAgendamento: number;
  taxaAbandono: number;
}

export interface ConsultorMetrics {
  nome: string;
  tempoMedioResposta: string;
  leadsAtendidos: number;
  conversoes: number;
}

export interface FunnelData {
  stage: string;
  value: number;
  percentage: number;
}

export interface WeeklyData {
  dia: string;
  leads: number;
  conversoes: number;
  tempoMedio: number;
  tempoMedioIA: number;
}

export type PeriodFilter = '7d' | '14d' | '30d';
