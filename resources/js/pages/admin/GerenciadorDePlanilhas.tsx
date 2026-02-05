import React, { useState } from 'react';
import { LayoutDashboard, Grid, List, FileSpreadsheet, Calendar, Database, Eye } from 'lucide-react';
import Layout from '@/components/Layout';
import { usePage, router } from '@inertiajs/react';
import { PlanilhaCard } from './components/PlanilhaCard';
import VisualizarPlanilha from './VisualizarPlanilha';

const GerenciadorDePlanilhas: React.FC = () => {
  const { planilhas } = usePage<{ planilhas: any[] }>().props;
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  const handleAbrirPlanilha = (id: number) => {
    router.visit(`/admin/planilhas/${id}`);
  };

  return (
    <div className="space-y-8 w-full">
      <div className="animate-slide-up">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          Gerenciador de Planilhas
        </h1>
        <p className="text-gray-600 dark:text-dark-text-secondary text-lg">Análise e comparação de cotações</p>
      </div>

      <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl p-6 shadow-glass dark:shadow-glass-dark border border-white/20 dark:border-dark-border">
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2">
                Minhas Planilhas
              </h2>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                Clique em "Abrir Planilha" para visualizar os detalhes e análises
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                  viewMode === 'cards'
                    ? 'bg-gradient-primary text-white shadow-glow-primary dark:shadow-glow-dark'
                    : 'bg-gray-100 dark:bg-dark-surface text-gray-700 dark:text-dark-text hover:bg-gray-200 dark:hover:bg-dark-card'
                }`}
              >
                <Grid className="w-4 h-4" />
                <span>Cartões</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                  viewMode === 'list'
                    ? 'bg-gradient-primary text-white shadow-glow-primary dark:shadow-glow-dark'
                    : 'bg-gray-100 dark:bg-dark-surface text-gray-700 dark:text-dark-text hover:bg-gray-200 dark:hover:bg-dark-card'
                }`}
              >
                <List className="w-4 h-4" />
                <span>Lista</span>
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {planilhas.map((planilha: any) => (
              <PlanilhaCard
                key={planilha.id}
                planilha={planilha}
                onAbrir={handleAbrirPlanilha}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl shadow-glass dark:shadow-glass-dark border border-white/20 dark:border-dark-border overflow-hidden">
            <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
              <div style={{ width: '100%', overflowX: 'auto' }}>
                <table className="w-full" style={{ minWidth: '800px' }}>
                  <thead className="bg-gradient-primary text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap">Nome</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap">Descrição</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap">Criado em</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                    {planilhas.map((planilha: any, index: number) => (
                      <tr
                        key={planilha.id}
                        className="hover:bg-gray-50 dark:hover:bg-dark-surface/50 transition-colors animate-fade-in"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-dark-text whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-primary/10 rounded-lg">
                              <FileSpreadsheet className="w-4 h-4 text-primary" />
                            </div>
                            <span>{planilha.nome}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-dark-text">
                          <div className="max-w-[200px] truncate" title={planilha.descricao}>
                            {planilha.descricao}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-dark-text whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400 dark:text-dark-text-secondary" />
                            <span>{new Date(planilha.criado_em).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => handleAbrirPlanilha(planilha.id)}
                            className="flex items-center space-x-2 px-4 py-2 bg-gradient-primary text-white rounded-xl hover:shadow-glow-primary dark:hover:shadow-glow-dark transition-all duration-300"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Abrir</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

(GerenciadorDePlanilhas as any).layout = (page: React.ReactNode) => (
  <Layout>
    {page}
  </Layout>
);

export default GerenciadorDePlanilhas;
