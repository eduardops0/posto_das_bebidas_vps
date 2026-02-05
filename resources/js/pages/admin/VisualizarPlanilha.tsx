import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, FileSpreadsheet, Calendar } from 'lucide-react';
import { usePage, router } from '@inertiajs/react';
import Layout from '@/components/Layout';
import { TabelaCotacoes } from './components/TabelaCotacoes';
import { ResumoEstatisticas } from './components/ResumoEstatisticas';
import { agruparPorProduto } from './cotacaoUtils';

type CotacaoStatus = 'enabled' | 'disabled';

type Planilha = {
  id: number;
  nome: string;
  descricao: string;
  total_registros: number;
  criado_em: string;
};

type Cotacao = {
  id: number;
  fornecedor: string;
  produto: string;
  quantidade: string;
  preco: number;
  data_envio: string;
  data_referencia: string;
  arquivo_origem: string;
  criado_por: string;
  status: CotacaoStatus;
};

const VisualizarPlanilha: React.FC = () => {
  const { planilha, cotacoes: cotacoesFromServer } = usePage<{
    planilha: Planilha | null;
    cotacoes: Cotacao[];
  }>().props;

  // ✅ Estado local para updates otimistas
  const [cotacoes, setCotacoes] = useState<Cotacao[]>(cotacoesFromServer ?? []);

  // ✅ Sincroniza caso o backend recarregue as cotações (router.reload / navegação)
  useEffect(() => {
    setCotacoes(cotacoesFromServer ?? []);
  }, [cotacoesFromServer]);

  const produtosAgrupados = useMemo(() => agruparPorProduto(cotacoes), [cotacoes]);

  // ✅ controla requests em andamento p/ evitar spam no botão
  const pendingIdsRef = useRef<Set<number>>(new Set());

  const handleTrocarPlanilha = (id: number) => {
    router.visit(`/admin/planilhas/${id}`);
  };

  const handleDesativarCotacao = (cotacaoId: number) => {
    if (!planilha?.id) return;

    // evita duplo clique / spam
    if (pendingIdsRef.current.has(cotacaoId)) return;
    pendingIdsRef.current.add(cotacaoId);

    const prev = cotacoes;

    // ✅ update otimista
    setCotacoes((curr) =>
      curr.map((c) => (c.id === cotacaoId ? { ...c, status: 'disabled' } : c))
    );

    router.patch(
      // ✅ IMPORTANTE: path ABSOLUTO com "/" no início
      `/admin/planilhas/${planilha.id}/cotacoes/${cotacaoId}/disable`,
      {},
      {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          // ✅ puxa do servidor pra garantir que refletiu no Supabase
          router.reload({ only: ['cotacoes'] });
        },
        onError: () => {
          // rollback
          setCotacoes(prev);
        },
        onFinish: () => {
          pendingIdsRef.current.delete(cotacaoId);
        },
      }
    );
  };

  if (!planilha) {
    return (
      <div className="space-y-8 w-full">
        <div className="animate-slide-up">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Planilha não encontrada
          </h1>
          <p className="text-gray-600 dark:text-dark-text-secondary text-lg">
            A planilha solicitada não foi localizada
          </p>
        </div>

        <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl p-6 shadow-glass dark:shadow-glass-dark border border-white/20 dark:border-dark-border">
          <div className="text-center">
            <p className="text-gray-600 dark:text-dark-text-secondary mb-4">
              Planilha não encontrada
            </p>
            <button
              onClick={() => router.visit('/admin/gerenciador-de-planilhas')}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-primary text-white rounded-xl hover:shadow-glow-primary dark:hover:shadow-glow-dark transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full">
      <div className="animate-slide-up">
        <button
          onClick={() => router.visit('/admin/gerenciador-de-planilhas')}
          className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Voltar</span>
        </button>

        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-primary rounded-xl">
            <FileSpreadsheet className="w-8 h-8 text-white" />
          </div>

          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              {planilha.nome}
            </h1>

            <p className="text-gray-600 dark:text-dark-text-secondary text-lg">
              {planilha.descricao}
            </p>

            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-dark-text-secondary">
              <Calendar className="w-4 h-4" />
              <span>
                Criado em {new Date(planilha.criado_em).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ResumoEstatisticas produtosAgrupados={produtosAgrupados} />

      <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl p-8 shadow-glass dark:shadow-glass-dark border border-white/20 dark:border-dark-border">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-2">
            Análise Comparativa de Preços
          </h2>
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
            Cotações agrupadas por produto com destaque para os melhores preços (ignorando desativadas)
          </p>
        </div>

        <TabelaCotacoes
          produtosAgrupados={produtosAgrupados}
          onDesativarCotacao={handleDesativarCotacao}
        />
      </div>
    </div>
  );
};

(VisualizarPlanilha as any).layout = (page: React.ReactNode) => (
  <Layout>{page}</Layout>
);

export default VisualizarPlanilha;
