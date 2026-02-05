import { CotacaoRecord, ProdutoAgrupado } from './index';

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

export function agruparPorProduto(cotacoes: CotacaoRecord[]): ProdutoAgrupado[] {
  const grupos = new Map<string, CotacaoRecord[]>();

  // Agrupar cotações por produto (incluindo todas, independente do preço/status)
  cotacoes.forEach((cotacao) => {
    const produtoKey = cotacao.produto?.trim() || 'Sem produto';
    if (!grupos.has(produtoKey)) {
      grupos.set(produtoKey, []);
    }
    grupos.get(produtoKey)!.push(cotacao);
  });

  // Transformar em ProdutoAgrupado
  const produtosAgrupados: ProdutoAgrupado[] = [];

  grupos.forEach((cotacoesProduto, produto) => {
    // ✅ status: default = enabled (caso algum registro antigo não tenha o campo)
    const isEnabled = (c: CotacaoRecord) => (c as any).status ? (c as any).status === 'enabled' : true;

    // ✅ Só conta para "melhor preço" se: enabled E preço > 0
    const fornecedoresValidos = cotacoesProduto.filter((c) => isEnabled(c) && c.preco > 0);

    // Mantém a lista de fornecedores como estava (inclui todos, mesmo disabled)
    const fornecedores = Array.from(new Set(cotacoesProduto.map((c) => c.fornecedor)));

    let melhorPreco = 0;
    let fornecedorVencedor = '';

    // Só calcular melhor preço se houver cotações válidas (enabled + preço > 0)
    if (fornecedoresValidos.length > 0) {
      const precos = fornecedoresValidos.map((c) => c.preco);
      melhorPreco = Math.min(...precos);
      fornecedorVencedor =
        fornecedoresValidos.find((c) => c.preco === melhorPreco)?.fornecedor || '';
    }

    produtosAgrupados.push({
      produto,
      cotacoes: cotacoesProduto, // inclui todas (enabled + disabled)
      fornecedores,
      melhorPreco,
      fornecedorVencedor,
    });
  });

  return produtosAgrupados;
}
