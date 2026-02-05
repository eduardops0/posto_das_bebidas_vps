export interface CotacaoRecord {
  id: number;
  fornecedor: string;
  produto: string;
  quantidade: string;
  preco: number;
  data_envio: string;
  data_referencia: string;
  arquivo_origem: string;
  criado_por: string;
}

export interface Planilha {
  id: number;
  nome: string;
  descricao: string;
  criado_em: string;
  total_registros: number;
}

export interface ProdutoAgrupado {
  produto: string;
  cotacoes: CotacaoRecord[];
  fornecedores: string[];
  melhorPreco: number;
  fornecedorVencedor: string;
}
