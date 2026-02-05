// =============================================
// IMPORTS
// =============================================
import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import type { DateRange } from "react-day-picker";
import { router } from '@inertiajs/react';

import {
  Calendar,
  Bot,
  MessageSquare,
  TrendingUp,
  XCircle,
  Users,
  Clock,
  TrendingDown,
  BarChart3,
  Activity,
  AlertTriangle,
} from 'lucide-react';

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';


import Layout from '@/components/Layout';
import type {
  PeriodFilter as PeriodFilterType,
  WeeklyData,
  ConsultorMetrics,
  FunnelData
} from './consultor/dashboard';


// =============================================
// COMPONENTE: DashboardHeader
// =============================================
function DashboardHeader() {
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-dark-card rounded-2xl shadow-sm dark:shadow-glass-dark p-8 mb-6 border border-white/20 dark:border-dark-border"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-dark-text mb-2">
            Dashboard – Posto das Bebidas
          </h1>

          <p className="text-gray-600 dark:text-dark-text-secondary text-lg">
            Análise completa de performance de vendas com a IA
          </p>
        </div>

        <div className="flex items-center gap-2 text-gray-700 dark:text-dark-text bg-gray-50 dark:bg-dark-surface px-6 py-3 rounded-xl border border-gray-200 dark:border-dark-border">
          <Calendar className="w-5 h-5" />Hoje :
          <span className="font-medium">{currentDate}</span>
        </div>
      </div>
    </motion.div>
  );
}


// =============================================
// COMPONENTE: KPICard
// =============================================
interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  delay?: number;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

function KPICard({ title, value, subtitle, icon: Icon, iconColor, delay = 0, trend }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -5, transition: { duration: 0.25 } }}
      className="bg-white dark:bg-dark-card rounded-2xl shadow-sm dark:shadow-glass-dark p-6 hover:shadow-lg transition-shadow border border-white/20 dark:border-dark-border"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${iconColor} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${iconColor.replace('bg-', 'text-')}`} />
        </div>

        {trend && (
          <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>

      <h3 className="text-gray-600 dark:text-dark-text-secondary text-sm font-medium mb-2">
        {title}
      </h3>

      <p className="text-3xl font-bold text-gray-900 dark:text-dark-text mb-1">
        {value}
      </p>

      {subtitle && (
        <p className="text-gray-500 dark:text-dark-text-secondary text-sm">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}


// =============================================
// AIMetrics — Corrigido
// =============================================
interface AIMetricsProps {
  totalLeads: number;
  countQualificacaoIA: number;
  totalConversoes: number;
  totalValorVendido: number;
  abandonoFluxo: number;
  tempoMedioAgendamento: string;
}

function AIMetrics({ totalLeads, countQualificacaoIA, totalConversoes, totalValorVendido, abandonoFluxo, tempoMedioAgendamento }: AIMetricsProps) {

  const leadsResponderamIA = Math.floor(totalLeads * 0.65);
  const taxaConversaoAgendamento = totalLeads > 0 ? (totalConversoes / totalLeads) : 0;
  const taxaAbandono = totalLeads > 0 ? (abandonoFluxo / totalLeads) : 0;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-4">
        KPIs da Inteligência Artificial
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        <KPICard
          title="Total de Leads"
          value={totalLeads.toLocaleString('pt-BR')}
          subtitle="Leads captados no período"
          icon={Bot}
          iconColor="bg-blue-500 dark:text-white"
          delay={0}
        />

        {/* <KPICard
          title="Leads que Responderam à IA"
          value={countQualificacaoIA.toLocaleString('pt-BR')}
          subtitle={`${((leadsResponderamIA / totalLeads) * 100).toFixed(1)}% do total`}
          icon={MessageSquare}
          iconColor="bg-green-500"
          delay={0.1}
        /> */}

        <KPICard
          title="Valor Total Vendido"
          value={totalValorVendido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          subtitle="Total vendido no período"
          icon={TrendingUp}
          iconColor="bg-green-500"
          delay={0.2}
        />

        <KPICard
          title="Abandono no Fluxo"
          value={abandonoFluxo.toLocaleString('pt-BR')}
          subtitle={`${(taxaAbandono * 100).toFixed(1)}% taxa`}
          icon={XCircle}
          iconColor="bg-red-500"
          delay={0.3}
        />

        <KPICard
          title="Taxa de Conversão"
          value={`${(taxaConversaoAgendamento * 100).toFixed(1)}%`}
          subtitle="Leads → Venda Ganha"
          icon={TrendingUp}
          iconColor="bg-green-500"
          delay={0.4}
        />

        <KPICard
          title="Tempo Médio de Pedido"
          value={tempoMedioAgendamento}
          subtitle="Do primeiro contato até venda-ganha"
          icon={AlertTriangle}
          iconColor="bg-amber-500"
          delay={0.5}
        />

      </div>
    </div>
  );
}


// =============================================
// ConsultorMetrics
// =============================================
function ConsultorMetrics({ consultantMetrics }: { consultantMetrics: any[] }) {
  const maxLeads = Math.max(...consultantMetrics.map((c: any) => c.leadsAtendidos || 0));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
      className="bg-white dark:bg-dark-card rounded-2xl shadow-sm dark:shadow-glass-dark p-8 border border-white/20 dark:border-dark-border"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-indigo-500 bg-opacity-10">
          <Users className="w-6 h-6 text-indigo-500" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
          Performance dos Consultores
        </h2>
      </div>

      <div className="space-y-6">

        {consultantMetrics.map((consultor: any, index: number) => (
          <motion.div
            key={consultor.nome}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
            className="border-b border-gray-100 dark:border-dark-border last:border-0 pb-6 last:pb-0"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-dark-text">
                  {consultor.nome}
                </h3>

                <div className="flex items-center gap-2 text-gray-600 dark:text-dark-text-secondary mt-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">{consultor.tempoMedioResposta}</span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900 dark:text-dark-text">
                  {consultor.leadsAtendidos}
                </p>
                <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                  leads atendidos
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="h-3 bg-gray-100 dark:bg-dark-surface rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(consultor.leadsAtendidos / maxLeads) * 100}%`,
                  }}
                  transition={{ duration: 0.8, delay: 0.8 + index * 0.1 }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                />
              </div>

              <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-dark-text-secondary">
                <span>Porcentagem de Resposta:</span>

                <span className="font-semibold">
                  {((consultor.conversoes / consultor.leadsAtendidos) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </motion.div>
        ))}

      </div>
    </motion.div>
  );
}


// =============================================
// FunnelChart
// =============================================
function FunnelChart({ funnelData }: { funnelData: FunnelData[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.8 }}
      className="bg-white dark:bg-dark-card rounded-2xl shadow-sm dark:shadow-glass-dark p-8 border border-white/20 dark:border-dark-border"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-pink-500 bg-opacity-10">
          <TrendingDown className="w-6 h-6 text-pink-500" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
          Funil de Conversão
        </h2>
      </div>

      <div className="space-y-4">

        {funnelData.map((stage, index) => (
          <motion.div
            key={stage.stage}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
            className="relative"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-dark-text">
                {stage.stage}
              </span>

              <div className="text-right">
                <span className="text-lg font-bold text-gray-900 dark:text-dark-text">
                  {stage.value.toLocaleString('pt-BR')}
                </span>

                <span className="text-sm text-gray-500 dark:text-dark-text-secondary ml-2">
                  ({stage.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>

            <div className="h-12 bg-gray-100 dark:bg-dark-surface rounded-xl overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stage.percentage}%` }}
                transition={{ duration: 0.8, delay: 1 + index * 0.1 }}
                className={`
                  h-full rounded-xl flex items-center justify-start px-4
                  ${
                    index === 0
                      ? 'bg-gradient-to-r from-blue-500 to-blue-400'
                      : index === 1
                      ? 'bg-gradient-to-r from-green-500 to-green-400'
                      : index === 2
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                      : index === 3
                      ? 'bg-gradient-to-r from-orange-500 to-orange-400'
                      : 'bg-gradient-to-r from-red-500 to-red-400'
                  }
                `}
              >
                {stage.percentage > 15 && (
                  <span className="text-white font-bold text-sm">
                    {stage.value.toLocaleString('pt-BR')}
                  </span>
                )}
              </motion.div>
            </div>
          </motion.div>
        ))}

      </div>
    </motion.div>
  );
}


// =============================================
// WeeklyCharts
// =============================================
function WeeklyCharts({ weeklyData }: { weeklyData: WeeklyData[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* AREA CHART */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 1.2 }}
        className="bg-white dark:bg-dark-card rounded-2xl shadow-sm dark:shadow-glass-dark p-8 border border-white/20 dark:border-dark-border"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-cyan-500 bg-opacity-10">
            <BarChart3 className="w-6 h-6 text-cyan-500" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
            Leads e Conversões Semanais
          </h2>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={weeklyData}>
            <defs>
              <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>

              <linearGradient id="colorConversoes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

            <XAxis
              dataKey="dia"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              stroke="#e5e7eb"
            />

            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              stroke="#e5e7eb"
            />

            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />

            <Legend wrapperStyle={{ paddingTop: '20px' }} />

            <Area
              type="monotone"
              dataKey="leads"
              stroke="#06b6d4"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorLeads)"
              name="Leads"
            />

            <Area
              type="monotone"
              dataKey="conversoes"
              stroke="#8b5cf6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorConversoes)"
              name="Conversões"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* LINE CHART */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 1.3 }}
        className="bg-white dark:bg-dark-card rounded-2xl shadow-sm dark:shadow-glass-dark p-8 border border-white/20 dark:border-dark-border"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-teal-500 bg-opacity-10">
            <Activity className="w-6 h-6 text-teal-500" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
            Tempo Médio de Resposta
          </h2>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

            <XAxis
              dataKey="dia"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              stroke="#e5e7eb"
            />

            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              stroke="#e5e7eb"
              label={{
                value: 'Minutos',
                angle: -90,
                position: 'insideLeft',
                style: { fill: '#6b7280', fontSize: 12 },
              }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              formatter={(value: number) => [`${value} min`, 'Tempo Médio']}
            />

            <Legend wrapperStyle={{ paddingTop: '20px' }} />

            <Line
              type="monotone"
              dataKey="tempoMedio"
              stroke="#14b8a6"
              strokeWidth={3}
              dot={{ fill: '#14b8a6', r: 5 }}
              activeDot={{ r: 7 }}
              name="Tempo Médio Consultor (min)"
            />

            <Line
              type="monotone"
              dataKey="tempoMedioIA"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={{ fill: '#8b5cf6', r: 5 }}
              activeDot={{ r: 7 }}
              name="Tempo Médio IA (min)"
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

    </div>
  );
}


// =============================================
// PeriodFilter
// =============================================
function PeriodFilter({
  selected,
  onChange,
  dateRange,
  setDateRange,
  consultants,
  selectedConsultant,
  onConsultantChange,
}: {
  selected: PeriodFilterType;
  onChange: (p: PeriodFilterType) => void;
  dateRange?: DateRange;
  setDateRange?: (date: DateRange | undefined) => void;
  consultants?: any[];
  selectedConsultant?: string;
  onConsultantChange?: (consultant: string) => void;
}) {

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-dark-card rounded-2xl shadow-sm dark:shadow-glass-dark p-6 mb-6 border border-white/20 dark:border-dark-border"
    >
      <div className="flex items-center justify-between">

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border">
            <Calendar className="w-5 h-5 text-gray-700 dark:text-dark-text" />
          </div>

          <h3 className="text-lg font-bold text-gray-900 dark:text-dark-text">
            Filtro de Período
          </h3>
        </div>

        <div className="flex gap-2 flex-wrap items-center">

          <div className="flex gap-2">
            <button
              onClick={() => onChange('7d' as any)}
              className={`px-3 py-1 rounded text-sm ${selected === '7d' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-dark-surface text-gray-700 dark:text-dark-text'}`}
            >
              7 dias
            </button>

            <button
              onClick={() => onChange('30d' as any)}
              className={`px-3 py-1 rounded text-sm ${selected === '30d' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-dark-surface text-gray-700 dark:text-dark-text'}`}
            >
              30 dias
            </button>
          </div>

          {consultants && onConsultantChange && (
            <div className="flex items-center gap-2 ml-4">
              <Users className="w-4 h-4 text-gray-700 dark:text-dark-text-secondary" />
              <span className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
                Filtrar Consultor:
              </span>
              <select
                value={selectedConsultant || ''}
                onChange={(e) => onConsultantChange(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm bg-white dark:bg-dark-surface text-gray-700 dark:text-dark-text border border-gray-300 dark:border-dark-border shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">📊 Todos os Consultores</option>
                {consultants.length > 0 ? (
                  consultants.map((consultant) => (
                    <option key={consultant.id} value={consultant.name}>
                      👤 {consultant.name}
                    </option>
                  ))
                ) : (
                  <option disabled value="">
                    Nenhum consultor encontrado
                  </option>
                )}
              </select>
            </div>
          )}

          {setDateRange && (
            <div className="flex items-center gap-2 ml-4">
              <span className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
                Filtrar por Data:
              </span>
              <DateRangePicker date={dateRange} setDate={setDateRange} />
            </div>
          )}

        </div>
      </div>
    </motion.div>
  );
}


// =============================================
// DASHBOARD — CORRIGIDO: tempo + total vendido filtrado
// =============================================
interface DashboardProps {
  authUser?: any;
  empresa?: string;
  customData?: any;
  dataLeads?: any[];
  dataConversoes?: any[];
  totalValorVendido?: number; // valor bruto vindo do backend
  tempoMedioAgendamento?: string;
  consultantMetrics?: any[];
  consultants?: any[];
  selectedConsultant?: string;
}

const Dashboard: React.FC<DashboardProps> = ({
  authUser,
  empresa,
  customData,
  dataLeads = [],
  dataConversoes = [],
  totalValorVendido = 0,
  tempoMedioAgendamento = "0h 0min",
  consultantMetrics = [],
  consultants = [],
  selectedConsultant,
}) => {

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilterType>('7d');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => undefined);
  const [selectedConsultantFilter, setSelectedConsultantFilter] = useState<string>(selectedConsultant || '');

  const handleConsultantChange = (consultantName: string) => {
    setSelectedConsultantFilter(consultantName);
    const params = new URLSearchParams(window.location.search);
    if (consultantName) {
      params.set('consultant', consultantName);
    } else {
      params.delete('consultant');
    }
    router.get(window.location.pathname, Object.fromEntries(params), {
      preserveState: true,
      replace: true,
    });
  };

  // Atualiza range automático (7d / 30d)
  useEffect(() => {
    const today = new Date();
    let from: Date | undefined;

    if (selectedPeriod === '7d') {
      from = new Date(today);
      from.setDate(today.getDate() - 7);
    } else if (selectedPeriod === '30d') {
      from = new Date(today);
      from.setDate(today.getDate() - 30);
    } else {
      from = undefined;
    }

    setDateRange(from ? { from, to: today } : undefined);
  }, [selectedPeriod]);


  // ================================================
  // useMemo — Agora com: 
  // ✔ tempo médio corrigido
  // ✔ total vendido filtrado corretamente
  // ================================================
  const {
    filteredLeads,
    filteredConversoes,
    realTotalLeads,
    countQualificacaoIA,
    totalConversoes,
    abandonoFluxo,
    funnelData,
    weeklyData,
    tempoMedioAgendamentoReact,
    totalValorVendidoFiltrado
  } = useMemo(() => {

    let filteredLeads = dataLeads;
    let filteredConversoes = dataConversoes;

    // FILTRO DE DATA
    if (dateRange?.from || dateRange?.to) {
      const startTime = dateRange.from ? dateRange.from.getTime() : null;
      const endTime = dateRange.to ? new Date(dateRange.to).setHours(23, 59, 59, 999) : null;

      filteredLeads = dataLeads.filter(item => {
        const ts = new Date(item.created_at).getTime();
        return (!startTime || ts >= startTime) && (!endTime || ts <= endTime);
      });

      filteredConversoes = dataConversoes.filter(item => {
        const ts = new Date(item.created_at).getTime();
        return (!startTime || ts >= startTime) && (!endTime || ts <= endTime);
      });
    }

    const realTotalLeads = filteredLeads.length;
    const countQualificacaoIA = filteredLeads.filter(item => item.status === 'qualificacao-ia').length;
    const totalConversoes = filteredConversoes.length;

    // ================================================
    // TEMPO MÉDIO DE AGENDAMENTO — CORRIGIDO
    // ================================================
    const diffs = filteredConversoes.map(c => {
      const lead = filteredLeads.find(l => l.session_id === c.session_id);
      if (!lead) return 0;

      return (new Date(c.created_at).getTime() - new Date(lead.created_at).getTime()) / 1000;
    }).filter(d => d > 0);

    const tempoMedioAgendamentoReact =
      diffs.length > 0
        ? (() => {
            const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
            const h = Math.floor(avg / 3600);
            const m = Math.floor((avg % 3600) / 60);
            return `${h}h ${m}min`;
          })()
        : "0h 0min";

    // ================================================
    // TOTAL VENDIDO — FILTRADO
    // ================================================
    const totalValorVendidoFiltrado = filteredConversoes.reduce((acc, item) => {
      const valor = parseFloat(item.valor_total ?? 0);
      return acc + (isNaN(valor) ? 0 : valor);
    }, 0);

    // FUNIL (como antes)
    const interagiram = filteredLeads.filter(l => l.ultima_interacao).length;

    const funnelData: FunnelData[] = [
      { stage: 'Leads Totais', value: realTotalLeads, percentage: 100 },
      { stage: 'Interagiram', value: interagiram, percentage: realTotalLeads > 0 ? (interagiram / realTotalLeads) * 100 : 0 },
      { stage: 'Em Qualificação', value: countQualificacaoIA, percentage: realTotalLeads > 0 ? (countQualificacaoIA / realTotalLeads) * 100 : 0 },
      { stage: 'Pedidos', value: totalConversoes, percentage: realTotalLeads > 0 ? (totalConversoes / realTotalLeads) * 100 : 0 },
    ];

    // SEMANAIS
    const weeklyData: WeeklyData[] = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => {
      const idx = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].indexOf(dia);

      const leadsForDay = filteredLeads.filter(l => new Date(l.created_at).getDay() === idx);
      const conversoesForDay = filteredConversoes.filter(c => new Date(c.created_at).getDay() === idx);

      const diffsDay = conversoesForDay.map(c => {
        const lead = leadsForDay.find(l => l.session_id === c.session_id);
        return lead ? (new Date(c.created_at).getTime() - new Date(lead.created_at).getTime()) / 60000 : 0;
      }).filter(d => d > 0);

      const tempoMedio = diffsDay.length > 0
        ? diffsDay.reduce((a, b) => a + b, 0) / diffsDay.length
        : 0;

      return {
        dia,
        leads: leadsForDay.length,
        conversoes: conversoesForDay.length,
        tempoMedio: Math.round(tempoMedio),
        tempoMedioIA: 0,
      };
    });

    return {
      filteredLeads,
      filteredConversoes,
      realTotalLeads,
      countQualificacaoIA,
      totalConversoes,
      abandonoFluxo: 0,
      funnelData,
      weeklyData,
      tempoMedioAgendamentoReact,
      totalValorVendidoFiltrado
    };
  }, [dataLeads, dataConversoes, dateRange]);


  // ================================================
  // RENDER FINAL
  // ================================================
  return (
    <div className="min-h-screen">
      <div className="space-y-8">

        <DashboardHeader />

        <PeriodFilter
          selected={selectedPeriod}
          onChange={setSelectedPeriod}
          dateRange={dateRange}
          setDateRange={setDateRange}
          consultants={consultants}
          selectedConsultant={selectedConsultantFilter}
          onConsultantChange={handleConsultantChange}
        />

        <AIMetrics
          totalLeads={realTotalLeads}
          countQualificacaoIA={countQualificacaoIA}
          totalConversoes={totalConversoes}
          totalValorVendido={totalValorVendidoFiltrado}
          abandonoFluxo={0}
          tempoMedioAgendamento={tempoMedioAgendamentoReact}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConsultorMetrics consultantMetrics={consultantMetrics} />
          <FunnelChart funnelData={funnelData} />
        </div>

        <WeeklyCharts weeklyData={weeklyData} />

      </div>
    </div>
  );
};


// =============================================
// INERTIA LAYOUT
// =============================================
(Dashboard as any).layout = (page: React.ReactNode) => (
  <Layout>{page}</Layout>
);

export default Dashboard;
