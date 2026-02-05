import React from 'react';
import { Trophy, X } from 'lucide-react';
import { ProdutoAgrupado } from '../index';
import { formatarMoeda } from '../cotacaoUtils';

interface TabelaCotacoesProps {
  produtosAgrupados: ProdutoAgrupado[];
  onDesativarCotacao: (cotacaoId: number) => void; // ✅ NOVO
}

export function TabelaCotacoes({ produtosAgrupados, onDesativarCotacao }: TabelaCotacoesProps) {
  if (produtosAgrupados.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-dark-text-secondary">
        Nenhuma cotação encontrada
      </div>
    );
  }

  const todosFornecedores = Array.from(
    new Set(produtosAgrupados.flatMap((p) => p.fornecedores))
  ).sort();

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl overflow-hidden shadow-glass dark:shadow-glass-dark border border-white/20 dark:border-dark-border">
        <thead className="bg-gradient-primary text-white">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-semibold">
              Produto
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold">
              Quantidade
            </th>
            {todosFornecedores.map((fornecedor) => (
              <th
                key={fornecedor}
                className="px-6 py-4 text-center text-sm font-semibold"
              >
                {fornecedor}
              </th>
            ))}
            <th className="px-6 py-4 text-left text-sm font-semibold">
              Melhor Preço
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold">
              Vencedor
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
          {produtosAgrupados.map((produto) => {
            // ✅ Em vez de map de preço, guardamos a cotação inteira por fornecedor
            const cotacaoPorFornecedor = new Map<string, any>();
            produto.cotacoes.forEach((cotacao: any) => {
              cotacaoPorFornecedor.set(cotacao.fornecedor, cotacao);
            });

            const quantidade = produto.cotacoes[0]?.quantidade;

            return (
              <tr
                key={produto.produto}
                className="hover:bg-gray-50 dark:hover:bg-dark-surface/50 transition-colors"
              >
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-dark-text">
                  {produto.produto}
                </td>

                <td className="px-6 py-4 text-sm text-gray-600 dark:text-dark-text-secondary">
                  {quantidade}
                </td>

                {todosFornecedores.map((fornecedor) => {
                  const cotacao = cotacaoPorFornecedor.get(fornecedor) as any | undefined;

                  const preco = cotacao?.preco;
                  const status: 'enabled' | 'disabled' = (cotacao?.status ?? 'enabled');

                  // ✅ melhor preço vindo do utils já ignora disabled,
                  // então aqui o troféu só faz sentido se a cotação estiver enabled
                  const isMelhorPreco = status === 'enabled' && preco === produto.melhorPreco;
                  const isDisabled = status === 'disabled';

                  return (
                    <td
                      key={fornecedor}
                      className={`px-6 py-4 text-center text-sm ${
                        isMelhorPreco
                          ? 'bg-green-50 dark:bg-green-900/20 font-bold text-green-700 dark:text-green-400'
                          : isDisabled
                            ? 'opacity-50 text-gray-600 dark:text-dark-text-secondary'
                            : 'text-gray-600 dark:text-dark-text-secondary'
                      }`}
                    >
                      {preco ? (
                        <span className="inline-flex items-center justify-center gap-2">
                          {formatarMoeda(preco)}

                          {isMelhorPreco && (
                            <Trophy className="w-4 h-4 text-green-600 dark:text-green-400" />
                          )}

                          {/* ✅ BOTÃO X: só aparece se existir cotação e estiver enabled */}
                          {cotacao?.id && status === 'enabled' && (
                            <button
                              type="button"
                              title="Desativar este preço"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onDesativarCotacao(cotacao.id);
                              }}
                              className="ml-1 inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-300 transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}

                          {/* Opcional: etiqueta quando desativado */}
                          {isDisabled && (
                            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-200/70 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                              desativado
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-dark-text-secondary">-</span>
                      )}
                    </td>
                  );
                })}

                <td className="px-6 py-4 text-center text-sm font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20">
                  {produto.melhorPreco > 0 ? (
                    formatarMoeda(produto.melhorPreco)
                  ) : (
                    <span className="text-gray-400 dark:text-dark-text-secondary">-</span>
                  )}
                </td>

                <td className="px-6 py-4 text-center text-sm font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20">
                  {produto.fornecedorVencedor || (
                    <span className="text-gray-400 dark:text-dark-text-secondary">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
