import React from 'react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { TrendingUp, Users, ShoppingCart, DollarSign, UserCheck, AlertTriangle } from 'lucide-react';

import Layout from '@/components/Layout';
import { usePage } from '@inertiajs/react';
import type { PageProps } from '@/types/PageProps';


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

const AdminDashboard: React.FC = () => {
  const revenueChartData = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Receita Total',
        data: [45000, 52000, 48000, 61000, 55000, 67000, 73000],
        borderColor: '#3B9ED8',
        backgroundColor: 'rgba(59, 158, 216, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#2566B0',
        pointBorderColor: '#fff',
        pointBorderWidth: 3,
        pointRadius: 6,
      },
    ],
  };

  const clientsDistributionData = {
    labels: ['Ativos', 'Inativos', 'Novos', 'Pendentes'],
    datasets: [
      {
        data: [1247, 324, 189, 67],
        backgroundColor: ['#2566B0', '#3B9ED8', '#10B981', '#F59E0B'],
        borderWidth: 0,
        hoverOffset: 10,
      },
    ],
  };

  const performanceData = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Novos Clientes',
        data: [23, 34, 18, 28, 41, 15, 22],
        backgroundColor: 'rgba(37, 102, 176, 0.8)',
        borderColor: '#2566B0',
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const { stats, auth } = usePage<PageProps>().props;
  const status = stats;

  const adminStats = [
    {
      title: 'Receita Total',
      value: 'R$ 401.000',
      change: '+18.2%',
      icon: DollarSign,
      gradient: 'from-primary to-secondary',
      bgColor: 'bg-primary/10 dark:bg-primary/20'
    },
    {
      title: 'Total de Clientes',
      value: '10',
      change: '+12.5%',
      icon: Users,
      gradient: 'from-secondary to-primary',
      bgColor: 'bg-secondary/10 dark:bg-secondary/20'
    },
    {
      title: 'Clientes Ativos',
      value: '10',
      change: '+8.7%',
      icon: UserCheck,
      gradient: 'from-primary to-secondary',
      bgColor: 'bg-primary/10 dark:bg-primary/20'
    },
    {
      title: 'Alertas Pendentes',
      value: '23',
      change: '-5.1%',
      icon: AlertTriangle,
      gradient: 'from-secondary to-primary',
      bgColor: 'bg-secondary/10 dark:bg-secondary/20'
    },
  ];

  return (
    <div className="space-y-8">
      <div className="animate-slide-up">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          Dashboard Administrativo
        </h1>
        <p className="text-gray-600 dark:text-dark-text-secondary text-lg">Visão geral completa do sistema e clientes</p>
      </div>

      {/* Admin Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`
                ${stat.bgColor} backdrop-blur-glass rounded-2xl p-6 
                shadow-glass dark:shadow-glass-dark hover:shadow-glow-primary dark:hover:shadow-glow-dark transition-all duration-300 
                hover:transform hover:scale-105 animate-fade-in border border-white/20 dark:border-dark-border
              `}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-gradient-to-r ${stat.gradient} rounded-xl shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                  stat.change.startsWith('+') 
                    ? 'text-green-500 bg-green-100 dark:bg-green-900/30' 
                    : 'text-red-500 bg-red-100 dark:bg-red-900/30'
                }`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-gray-600 dark:text-dark-text-secondary text-sm font-medium mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-800 dark:text-dark-text">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl p-6 shadow-glass dark:shadow-glass-dark hover:shadow-glow dark:hover:shadow-glow-dark transition-all duration-300 border border-white/20 dark:border-dark-border">
          <h3 className="text-xl font-bold text-gray-800 dark:text-dark-text mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Evolução da Receita
          </h3>
          <div className="h-64">
            <Line data={revenueChartData} options={chartOptions} />
          </div>
        </div>

        {/* Clients Distribution */}
        <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl p-6 shadow-glass dark:shadow-glass-dark hover:shadow-glow dark:hover:shadow-glow-dark transition-all duration-300 border border-white/20 dark:border-dark-border">
          <h3 className="text-xl font-bold text-gray-800 dark:text-dark-text mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Distribuição de Clientes
          </h3>
          <div className="h-64">
            <Doughnut data={clientsDistributionData} options={{ ...chartOptions, cutout: '60%' }} />
          </div>
        </div>

        {/* Performance Chart - Full Width */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl p-6 shadow-glass dark:shadow-glass-dark hover:shadow-glow dark:hover:shadow-glow-dark transition-all duration-300 border border-white/20 dark:border-dark-border">
          <h3 className="text-xl font-bold text-gray-800 dark:text-dark-text mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Novos Clientes por Dia da Semana
          </h3>
          <div className="h-64">
            <Bar data={performanceData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

(AdminDashboard as any).layout = (page: React.ReactNode) => (
  <Layout>
    {page}
  </Layout>
);

export default AdminDashboard;