import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Search, Filter, Download, Eye, Calendar, DollarSign } from 'lucide-react';
import Layout from '@/components/Layout';
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import type { DateRange } from "react-day-picker";


interface Conversion {
  id: number;
  data: string;
  nomeCliente: string;
  nomeEmpresa: string;
  valorTotal: number;
  origem: string;
  consultor_id: number | null;
  consultor_nome: string;
}

export interface PageProps {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

const Conversions: React.FC<PageProps> = ({ user }) => {
  const { props } = usePage();
  const { conversions } = props as any;

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const itemsPerPage = 10;

const conversionList: Conversion[] = Array.isArray(props.conversions) ? props.conversions : [];

const filteredConversions = conversionList.filter((conversion) => {
  const matchesSearch =
    conversion.nomeCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (conversion.nomeEmpresa || '').toLowerCase().includes(searchTerm.toLowerCase());

  const conversionTime = new Date(conversion.data).getTime();
  const startTime = dateRange?.from ? dateRange.from.getTime() : null;
  const endTime = dateRange?.to ? new Date(dateRange.to).setHours(23,59,59,999) : null;

  const matchesDate =
    (!startTime || conversionTime >= startTime) &&
    (!endTime || conversionTime <= endTime);

  return matchesSearch && matchesDate;
});


  const totalPages = Math.ceil(filteredConversions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentConversions = filteredConversions.slice(startIndex, startIndex + itemsPerPage);

  const totalValue = filteredConversions.reduce((sum, conversion) => sum + conversion.valorTotal, 0);
  const totalConversions = filteredConversions.length;



  return (
    <div className="space-y-8">
      <div className="animate-slide-up">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          Registro de Conversões
        </h1>
        <p className="text-gray-600 dark:text-dark-text-secondary text-lg">
          Acompanhe todas as suas vendas e conversões
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: 'Total de Conversões',
            value: totalConversions,
            icon: Eye,
            gradient: 'bg-gradient-primary',
          },
          {
            label: 'Valor Total',
            value: `R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            icon: DollarSign,
            gradient: 'bg-gradient-primary',
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl p-6 shadow-glass dark:shadow-glass-dark border border-white/20 dark:border-dark-border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-dark-text-secondary text-sm font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-dark-text">{stat.value}</p>
              </div>
              <div className={`p-3 ${stat.gradient} rounded-xl`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl p-6 shadow-glass dark:shadow-glass-dark border border-white/20 dark:border-dark-border">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-dark-text-secondary w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por cliente ou produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
              />
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-4 items-center z-auto justify-between overflow-visible relative dark:text-dark-text">
            <DateRangePicker date={dateRange} setDate={setDateRange} />
          </div>


        </div>
      </div>

      {/* Table */}
      <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl shadow-glass dark:shadow-glass-dark border border-white/20 dark:border-dark-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-primary text-white">
              <tr>
                {['Data', 'Cliente', 'Empresa', 'Valor Total', 'Origem', 'Consultor Responsável'].map((th) => (
                  <th key={th} className="px-6 py-4 text-left text-sm font-semibold">{th}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border dark:text-dark-text-secondary">
              {currentConversions.map((conversion) => (
                <tr key={conversion.id} className="hover:bg-gray-50 dark:hover:bg-dark-surface/50 transition-colors">
                  <td className="px-6 py-4 text-sm">{new Date(conversion.data).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 text-sm font-medium">{conversion.nomeCliente}</td>
                  <td className="px-6 py-4 text-sm">{conversion.nomeEmpresa}</td>
                  <td className="px-6 py-4 text-sm font-semibold">
                    R$ {conversion.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 bg-secondary/20 dark:bg-secondary/30 text-primary dark:text-secondary text-xs font-medium rounded-lg">
                      {conversion.origem}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{conversion.consultor_nome || 'Não atribuído'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-dark-surface border-t border-gray-100 dark:border-dark-border flex justify-between items-center">
            <p className="text-sm">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredConversions.length)} de {filteredConversions.length}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-dark-border rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card disabled:opacity-50"
              >
                Anterior
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 text-sm rounded-lg ${
                    currentPage === i + 1
                      ? 'bg-gradient-primary text-white'
                      : 'border border-gray-200 dark:border-dark-border hover:bg-gray-100 dark:hover:bg-dark-card'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-dark-border rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

(Conversions as any).layout = (page: React.ReactNode) => (
  <Layout>
    {page}
  </Layout>
);

export default Conversions;