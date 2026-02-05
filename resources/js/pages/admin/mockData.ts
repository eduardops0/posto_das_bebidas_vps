import { CotacaoRecord, Planilha } from '../types';

export const mockPlanilhas: Planilha[] = [
  {
    id: 1,
    nome: 'Cotações - Materiais de Escritório',
    descricao: 'Comparativo de preços para materiais de escritório',
    criado_em: '2025-01-15',
    total_registros: 15
  },
  {
    id: 2,
    nome: 'Cotações - Equipamentos de TI',
    descricao: 'Análise de fornecedores de equipamentos',
    criado_em: '2025-01-10',
    total_registros: 12
  },
  {
    id: 3,
    nome: 'Cotações - Material de Limpeza',
    descricao: 'Comparativo mensal de produtos de limpeza',
    criado_em: '2025-01-05',
    total_registros: 18
  }
];

export const mockCotacoes: Record<number, CotacaoRecord[]> = {
  1: [
    {
      id: 1,
      fornecedor: 'Papelaria Central',
      produto: 'Resma de Papel A4',
      quantidade: '100 unidades',
      preco: 22.50,
      data_envio: '2025-01-10',
      data_referencia: '2025-01-15',
      arquivo_origem: 'cotacao_papelaria_central.pdf',
      criado_por: 'João Silva'
    },
    {
      id: 2,
      fornecedor: 'Office Plus',
      produto: 'Resma de Papel A4',
      quantidade: '100 unidades',
      preco: 21.80,
      data_envio: '2025-01-11',
      data_referencia: '2025-01-15',
      arquivo_origem: 'cotacao_office_plus.pdf',
      criado_por: 'João Silva'
    },
    {
      id: 3,
      fornecedor: 'MegaOffice',
      produto: 'Resma de Papel A4',
      quantidade: '100 unidades',
      preco: 23.00,
      data_envio: '2025-01-12',
      data_referencia: '2025-01-15',
      arquivo_origem: 'cotacao_megaoffice.pdf',
      criado_por: 'João Silva'
    },
    {
      id: 4,
      fornecedor: 'Papelaria Central',
      produto: 'Caneta Esferográfica Azul',
      quantidade: '500 unidades',
      preco: 0.85,
      data_envio: '2025-01-10',
      data_referencia: '2025-01-15',
      arquivo_origem: 'cotacao_papelaria_central.pdf',
      criado_por: 'João Silva'
    },
    {
      id: 5,
      fornecedor: 'Office Plus',
      produto: 'Caneta Esferográfica Azul',
      quantidade: '500 unidades',
      preco: 0.75,
      data_envio: '2025-01-11',
      data_referencia: '2025-01-15',
      arquivo_origem: 'cotacao_office_plus.pdf',
      criado_por: 'João Silva'
    },
    {
      id: 6,
      fornecedor: 'MegaOffice',
      produto: 'Caneta Esferográfica Azul',
      quantidade: '500 unidades',
      preco: 0.80,
      data_envio: '2025-01-12',
      data_referencia: '2025-01-15',
      arquivo_origem: 'cotacao_megaoffice.pdf',
      criado_por: 'João Silva'
    },
    {
      id: 7,
      fornecedor: 'Papelaria Central',
      produto: 'Grampeador de Mesa',
      quantidade: '20 unidades',
      preco: 15.90,
      data_envio: '2025-01-10',
      data_referencia: '2025-01-15',
      arquivo_origem: 'cotacao_papelaria_central.pdf',
      criado_por: 'Maria Santos'
    },
    {
      id: 8,
      fornecedor: 'Office Plus',
      produto: 'Grampeador de Mesa',
      quantidade: '20 unidades',
      preco: 14.50,
      data_envio: '2025-01-11',
      data_referencia: '2025-01-15',
      arquivo_origem: 'cotacao_office_plus.pdf',
      criado_por: 'Maria Santos'
    },
    {
      id: 9,
      fornecedor: 'MegaOffice',
      produto: 'Grampeador de Mesa',
      quantidade: '20 unidades',
      preco: 16.20,
      data_envio: '2025-01-12',
      data_referencia: '2025-01-15',
      arquivo_origem: 'cotacao_megaoffice.pdf',
      criado_por: 'Maria Santos'
    },
    {
      id: 10,
      fornecedor: 'Papelaria Central',
      produto: 'Caderno Universitário',
      quantidade: '50 unidades',
      preco: 12.80,
      data_envio: '2025-01-10',
      data_referencia: '2025-01-15',
      arquivo_origem: 'cotacao_papelaria_central.pdf',
      criado_por: 'Carlos Oliveira'
    },
    {
      id: 11,
      fornecedor: 'Office Plus',
      produto: 'Caderno Universitário',
      quantidade: '50 unidades',
      preco: 11.90,
      data_envio: '2025-01-11',
      data_referencia: '2025-01-15',
      arquivo_origem: 'cotacao_office_plus.pdf',
      criado_por: 'Carlos Oliveira'
    },
    {
      id: 12,
      fornecedor: 'MegaOffice',
      produto: 'Caderno Universitário',
      quantidade: '50 unidades',
      preco: 13.50,
      data_envio: '2025-01-12',
      data_referencia: '2025-01-15',
      arquivo_origem: 'cotacao_megaoffice.pdf',
      criado_por: 'Carlos Oliveira'
    },
    {
      id: 13,
      fornecedor: 'Papelaria Central',
      produto: 'Envelope A4',
      quantidade: '200 unidades',
      preco: 0.45,
      data_envio: '2025-01-10',
      data_referencia: '2025-01-15',
      arquivo_origem: 'cotacao_papelaria_central.pdf',
      criado_por: 'Ana Costa'
    },
    {
      id: 14,
      fornecedor: 'Office Plus',
      produto: 'Envelope A4',
      quantidade: '200 unidades',
      preco: 0.42,
      data_envio: '2025-01-11',
      data_referencia: '2025-01-15',
      arquivo_origem: 'cotacao_office_plus.pdf',
      criado_por: 'Ana Costa'
    },
    {
      id: 15,
      fornecedor: 'MegaOffice',
      produto: 'Envelope A4',
      quantidade: '200 unidades',
      preco: 0.48,
      data_envio: '2025-01-12',
      data_referencia: '2025-01-15',
      arquivo_origem: 'cotacao_megaoffice.pdf',
      criado_por: 'Ana Costa'
    }
  ],
  2: [],
  3: []
};
