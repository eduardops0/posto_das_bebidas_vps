import { TrendingDown, Package, Users } from 'lucide-react';
import { ProdutoAgrupado } from '../index';
import { formatarMoeda } from '../cotacaoUtils';

interface ResumoEstatisticasProps {
  produtosAgrupados: ProdutoAgrupado[];
}

export function ResumoEstatisticas({ produtosAgrupados }: ResumoEstatisticasProps) {
  const totalProdutos = produtosAgrupados.length;
  const totalFornecedores = new Set(
    produtosAgrupados.flatMap(p => p.fornecedores)
  ).size;
  const economiaTotal = produtosAgrupados.reduce((acc, produto) => {
    // Só calcular economia para produtos que têm preços válidos
    const precosValidos = produto.cotacoes.filter(c => c.preco > 0).map(c => c.preco);
    if (precosValidos.length === 0) return acc;
    
    const maiorPreco = Math.max(...precosValidos);
    return acc + (maiorPreco - produto.melhorPreco);
  }, 0);

  const vencedoresPorFornecedor = produtosAgrupados.reduce((acc, produto) => {
    // Só contar se houver fornecedor vencedor válido
    if (produto.fornecedorVencedor) {
      acc[produto.fornecedorVencedor] = (acc[produto.fornecedorVencedor] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const fornecedorMaisCompetitivo = Object.entries(vencedoresPorFornecedor).sort(
    ([, a], [, b]) => b - a
  )[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl p-6 shadow-glass dark:shadow-glass-dark hover:shadow-glow-primary dark:hover:shadow-glow-dark transition-all duration-300 border border-white/20 dark:border-dark-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 dark:text-dark-text-secondary text-sm mb-1">Total de Produtos</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-dark-text">{totalProdutos}</p>
          </div>
          <div className="p-3 bg-gradient-primary rounded-xl">
            <Package className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl p-6 shadow-glass dark:shadow-glass-dark hover:shadow-glow-primary dark:hover:shadow-glow-dark transition-all duration-300 border border-white/20 dark:border-dark-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 dark:text-dark-text-secondary text-sm mb-1">Economia Potencial</p>
            <p className="text-3xl font-bold text-green-700 dark:text-green-400">
              {formatarMoeda(economiaTotal)}
            </p>
          </div>
          <div className="p-3 bg-gradient-primary rounded-xl">
            <TrendingDown className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl p-6 shadow-glass dark:shadow-glass-dark hover:shadow-glow-primary dark:hover:shadow-glow-dark transition-all duration-300 border border-white/20 dark:border-dark-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 dark:text-dark-text-secondary text-sm mb-1">Fornecedor Líder</p>
            <p className="text-xl font-bold text-gray-900 dark:text-dark-text">
              {fornecedorMaisCompetitivo?.[0] || '-'}
            </p>
            <p className="text-sm text-gray-500 dark:text-dark-text-secondary mt-1">
              {fornecedorMaisCompetitivo?.[1] || 0} vitórias
            </p>
          </div>
          <div className="p-3 bg-gradient-primary rounded-xl">
            <Users className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
