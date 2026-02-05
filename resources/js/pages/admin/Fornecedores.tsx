import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Store,
  Plus,
  Edit3,
  Save,
  X,
  Search,
  Users,
  UserCheck,
  UserX,
  Package,
  Hash,
  Eye,
  Trash2,
  Phone,
  Building2,
  FileText,
  Send,
  Upload
} from 'lucide-react';

import Layout from '@/components/Layout';
import { usePage } from '@inertiajs/react';
import type { PageProps as AppPageProps } from '@/types/PageProps';

/** =======================
 * Tipos base
 * ======================= */

interface Fornecedor {
  id: number;
  nome_empresa: string;
  nome_responsavel: string;
  whatsapp: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface ArquivoCotacao {
  id?: string;
  arquivo: File | null;
  nome_original: string;
  tamanho: number;
  tipo: string;
}

interface Cotacao {
  id: number;
  fornecedores: Fornecedor[];
  arquivo_nome: string;
  arquivo_path: string;
  arquivo_tipo: string;
  prazo_maximo: string;
  status: 'scheduled' | 'sent' | 'received';
  data_agendada?: string;
  created_at: string;
}

interface NovoFornecedor {
  nome_empresa: string;
  nome_responsavel: string;
  whatsapp: string;
  status: 'active' | 'inactive';
}

interface ProdutoCotacao {
  id: number;
  nome?: string;
  nome_personalizado?: string;
  produto_id?: number;
}

interface Produto {
  id: number;
  nome: string;
}

interface NovaCotacao {
  fornecedores: number[];
  produtos: ProdutoCotacao[];
  arquivo: ArquivoCotacao;
  data_agendada?: string;
}

/** =======================
 * Mock Data (Removed - using real data from Supabase)
 * ======================= */

/** Page Props */
type PagePropsInertia = AppPageProps & {
  fornecedores?: Fornecedor[];
  cotacoes?: Cotacao[];
};

/** Helpers */
const formatPhone = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 11
    ? `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    : phone;
};

const cleanProductName = (name: string) => name.replace(/\s+R\$.*$/, '');

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/** =======================
 * Axios configurado
 * ======================= */
const axiosInstance = axios.create({
  baseURL: '/',
  headers: {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''
  }
});

/** =======================
 * Componente
 * ======================= */
const Fornecedores: React.FC = () => {
  const { props } = usePage<PagePropsInertia>();
  
  // Use data from props (from Supabase) or fall back to empty arrays
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>(props.fornecedores || []);
  const [cotacoes, setCotacoes] = useState<Cotacao[]>(props.cotacoes || []);
  const [produtos, setProdutos] = useState<Produto[]>([]);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
   const [modalType, setModalType] = useState<'create-supplier' | 'edit-supplier' | 'create-quotation' | 'edit-quotation' | 'view-quotation'>('create-supplier');
   const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);
   const [editingCotacao, setEditingCotacao] = useState<Cotacao | null>(null);
   const [viewingCotacao, setViewingCotacao] = useState<Cotacao | null>(null);

  const [novoFornecedor, setNovoFornecedor] = useState<NovoFornecedor>({
    nome_empresa: '',
    nome_responsavel: '',
    whatsapp: '',
    status: 'active',
  });

  const [novaCotacao, setNovaCotacao] = useState<NovaCotacao>({
    fornecedores: [],
    produtos: [],
    arquivo: {
      arquivo: null,
      nome_original: '',
      tamanho: 0,
      tipo: ''
    },
  });

  const [supplierSearch, setSupplierSearch] = useState('');
  const [cotacaoSearch, setCotacaoSearch] = useState('');
  const [quotationSupplierSearch, setQuotationSupplierSearch] = useState('');
  const [arquivoCotacao, setArquivoCotacao] = useState<ArquivoCotacao>({
    arquivo: null,
    nome_original: '',
    tamanho: 0,
    tipo: ''
  });

  // Helper function to get product name
  const getProductName = (produto: ProdutoCotacao): string => {
    // If it has a stored name, use it
    if (produto.nome) {
      return produto.nome;
    }

    // If it's a custom product, use the custom name
    if (produto.nome_personalizado && produto.nome_personalizado.trim()) {
      return produto.nome_personalizado;
    }

    // If it has a product_id, try to find it in the products array
    if (produto.produto_id) {
      const product = produtos.find((p: Produto) => p.id === produto.produto_id);
      if (product && product.nome) {
        return cleanProductName(product.nome);
      }
    }

    // Fallback for products without proper identification
    return produto.nome_personalizado || 'Produto não encontrado';
  };

  // Supplier filtering
  const filteredFornecedores = fornecedores.filter(fornecedor => {
    const matchesSearch = 
      fornecedor.nome_empresa.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      fornecedor.nome_responsavel.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      fornecedor.whatsapp.includes(supplierSearch);
    return matchesSearch;
  });

  const filteredQuotationSuppliers = useMemo(() => {
    return fornecedores.filter(fornecedor => {
      const matchesSearch = fornecedor.nome_empresa.toLowerCase().includes(quotationSupplierSearch.toLowerCase()) ||
        fornecedor.nome_responsavel.toLowerCase().includes(quotationSupplierSearch.toLowerCase()) ||
        fornecedor.whatsapp.includes(quotationSupplierSearch);
      return matchesSearch;
    });
  }, [fornecedores, quotationSupplierSearch]);

  const openCreateSupplierModal = () => {
    setNovoFornecedor({
      nome_empresa: '',
      nome_responsavel: '',
      whatsapp: '',
      status: 'active',
    });
    setModalType('create-supplier');
    setIsModalOpen(true);
  };

  const openEditSupplierModal = (fornecedor: Fornecedor) => {
    setEditingFornecedor(fornecedor);
    setModalType('edit-supplier');
    setIsModalOpen(true);
  };

  const openCreateQuotationModal = () => {
    setNovaCotacao({
      fornecedores: [],
      produtos: [],
      arquivo: {
        arquivo: null,
        nome_original: '',
        tamanho: 0,
        tipo: ''
      },
    });
    setArquivoCotacao({
      arquivo: null,
      nome_original: '',
      tamanho: 0,
      tipo: ''
    });
    setModalType('create-quotation');
    setIsModalOpen(true);
    setQuotationSupplierSearch('');
  };

  const openEditQuotationModal = (cotacao: Cotacao) => {
    setEditingCotacao(cotacao);
    setNovaCotacao({
      fornecedores: cotacao.fornecedores.map(f => f.id),
      produtos: [],
      arquivo: {
        arquivo: null,
        nome_original: cotacao.arquivo_nome,
        tamanho: 0,
        tipo: cotacao.arquivo_tipo
      },
      data_agendada: cotacao.data_agendada,
    });
    setArquivoCotacao({
      arquivo: null,
      nome_original: cotacao.arquivo_nome,
      tamanho: 0,
      tipo: cotacao.arquivo_tipo
    });
    setModalType('edit-quotation');
    setIsModalOpen(true);
    setQuotationSupplierSearch('');
  };

  const openViewQuotationModal = (cotacao: Cotacao) => {
    setViewingCotacao(cotacao);
    setModalType('view-quotation');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingFornecedor(null);
    setEditingCotacao(null);
    setViewingCotacao(null);
    setArquivoCotacao({
      arquivo: null,
      nome_original: '',
      tamanho: 0,
      tipo: ''
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Supplier CRUD
  const handleCreateSupplier = async () => {
    if (!novoFornecedor.nome_empresa || !novoFornecedor.nome_responsavel || !novoFornecedor.whatsapp) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      const { data } = await axiosInstance.post('/admin/fornecedores', novoFornecedor);
      setFornecedores(prev => [...prev, data]);
      closeModal();
      alert('Fornecedor cadastrado com sucesso!');
    } catch (err: any) {
      console.error(err);
      alert('Erro ao cadastrar fornecedor.');
    }
  };

  const handleEditSupplier = async () => {
    if (!editingFornecedor) return;

    try {
      const { data } = await axiosInstance.put(`/admin/fornecedores/${editingFornecedor.id}`, {
        nome_empresa: editingFornecedor.nome_empresa,
        nome_responsavel: editingFornecedor.nome_responsavel,
        whatsapp: editingFornecedor.whatsapp,
        status: editingFornecedor.status,
      });

      setFornecedores(prev =>
        prev.map(f => f.id === editingFornecedor.id ? data : f)
      );
      closeModal();
      alert('Fornecedor atualizado com sucesso!');
    } catch (err: any) {
      console.error(err);
      alert('Erro ao atualizar fornecedor.');
    }
  };

  const handleDeleteSupplier = async (fornecedorId: number) => {
    if (!confirm('Tem certeza que deseja excluir este fornecedor?')) return;

    try {
      await axiosInstance.delete(`/admin/fornecedores/${fornecedorId}`);
      setFornecedores(prev => prev.filter(f => f.id !== fornecedorId));
      alert('Fornecedor excluído com sucesso!');
    } catch (err: any) {
      console.error(err);
      alert('Erro ao excluir fornecedor.');
    }
  };

  // Quotation management
  
  const handleCreateQuotation = async () => {
    console.log('handleCreateQuotation called with:', {
      fornecedores: novaCotacao.fornecedores,
      arquivo: novaCotacao.arquivo,
      hasFile: !!novaCotacao.arquivo.arquivo
    });

    if (novaCotacao.fornecedores.length === 0 || !novaCotacao.arquivo.arquivo) {
      alert('Por favor, selecione fornecedores e envie o arquivo.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('fornecedores', JSON.stringify(novaCotacao.fornecedores));
      formData.append('arquivo', novaCotacao.arquivo.arquivo);

      console.log('Sending formData:', {
        fornecedores: JSON.stringify(novaCotacao.fornecedores),
        hasFile: !!novaCotacao.arquivo.arquivo,
        fileName: novaCotacao.arquivo.arquivo?.name
      });

      const { data } = await axiosInstance.post('/admin/cotacoes', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setCotacoes(prev => [...prev, data]);
      closeModal();
      alert('Cotacao agendada automaticamente para a proxima segunda-feira as 13h.');
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 422) {
        const errorData = err.response.data;
        let errorMessage = 'Erro de validacao'
        if (errorData.details) {
          Object.keys(errorData.details).forEach(field => {
            errorMessage += `- ${field}: ${errorData.details[field].join(', ')}`;
          });
        } else if (errorData.message) {
          errorMessage += errorData.message;
        } else {
          errorMessage += 'Dados invalidos fornecidos.';
        }
        alert(errorMessage);
      } else {
        alert(`Erro ao criar cotacao: ${err.response?.data?.error || err.message || 'Erro desconhecido'}`);
      }
    }
  };


  
  const handleEditQuotation = async () => {
    if (!editingCotacao) return;

    if (novaCotacao.fornecedores.length === 0) {
      alert('Por favor, selecione fornecedores.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('fornecedores', JSON.stringify(novaCotacao.fornecedores));
      if (novaCotacao.arquivo.arquivo) {
        formData.append('arquivo', novaCotacao.arquivo.arquivo);
      }

      const { data } = await axiosInstance.put(`/admin/cotacoes/${editingCotacao.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setCotacoes(prev => prev.map(c => c.id === editingCotacao.id ? data : c));
      closeModal();
      alert('Cotacao atualizada com sucesso!');
    } catch (err: any) {
      console.error(err);
      alert('Erro ao atualizar cotacao.');
    }
  };


  const handleDeleteQuotation = async (cotacaoId: number) => {
    if (!confirm('Tem certeza que deseja excluir esta cotação?')) return;

    try {
      await axiosInstance.delete(`/admin/cotacoes/${cotacaoId}`);
      setCotacoes(prev => prev.filter(c => c.id !== cotacaoId));
      alert('Cotação excluída com sucesso!');
    } catch (err: any) {
      console.error(err);
      alert('Erro ao excluir cotação.');
    }
  };

  const toggleQuotationSupplier = (fornecedorId: number) => {
    setNovaCotacao(prev => ({
      ...prev,
      fornecedores: prev.fornecedores.includes(fornecedorId)
        ? prev.fornecedores.filter(id => id !== fornecedorId)
        : [...prev.fornecedores, fornecedorId]
    }));
  };

  const selectAllSuppliers = () => {
    const allIds = filteredQuotationSuppliers.map((f: Fornecedor) => f.id);
    setNovaCotacao(prev => ({
      ...prev,
      fornecedores: allIds
    }));
  };

  const deselectAllSuppliers = () => {
    setNovaCotacao(prev => ({
      ...prev,
      fornecedores: []
    }));
  };

  const isAllSelected = filteredQuotationSuppliers.length > 0 && filteredQuotationSuppliers.every((f: Fornecedor) => novaCotacao.fornecedores.includes(f.id));

  // File handling
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv' // .csv
      ];
      
      if (!allowedTypes.includes(file.type)) {
        alert('Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV (.csv).');
        return;
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('O arquivo deve ter no máximo 10MB.');
        return;
      }

      const arquivoData: ArquivoCotacao = {
        arquivo: file,
        nome_original: file.name,
        tamanho: file.size,
        tipo: file.type
      };

      setArquivoCotacao(arquivoData);
      setNovaCotacao(prev => ({ ...prev, arquivo: arquivoData }));
    }
  };

  const removeFile = () => {
    setArquivoCotacao({
      arquivo: null,
      nome_original: '',
      tamanho: 0,
      tipo: ''
    });
    setNovaCotacao(prev => ({ 
      ...prev, 
      arquivo: {
        arquivo: null,
        nome_original: '',
        tamanho: 0,
        tipo: ''
      }
    }));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };


  return (
    <div className="space-y-8">
      <div className="animate-slide-up">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          Fornecedores
        </h1>
        <p className="text-gray-600 dark:text-dark-text-secondary text-lg">
          Gerencie fornecedores e cotações de produtos
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl p-6 shadow-glass dark:shadow-glass-dark border border-white/20 dark:border-dark-border">
        <div className="flex justify-end space-x-4">
          <button
            onClick={openCreateSupplierModal}
            className="flex items-center space-x-2 px-6 py-2 bg-gradient-primary text-white rounded-xl hover:shadow-glow-primary dark:hover:shadow-glow-dark transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
            <span>CADASTRAR FORNECEDOR</span>
          </button>
          <button
            onClick={openCreateQuotationModal}
            className="flex items-center space-x-2 px-6 py-2 bg-gradient-primary text-white rounded-xl hover:shadow-glow-primary dark:hover:shadow-glow-dark transition-all duration-300"
          >
            <FileText className="w-4 h-4" />
            <span>GERAR COTAÇÃO</span>
          </button>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl shadow-glass dark:shadow-glass-dark border border-white/20 dark:border-dark-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-primary text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Empresa</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Responsável</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">WhatsApp</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
              {filteredFornecedores.map((fornecedor, index) => (
                <tr
                  key={`fornecedor-${fornecedor.id}`}
                  className="hover:bg-gray-50 dark:hover:bg-dark-surface/50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-dark-text">
                        {fornecedor.nome_empresa}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-dark-text">
                    {fornecedor.nome_responsavel}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-dark-text">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{formatPhone(fornecedor.whatsapp)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      fornecedor.status === 'active'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                    }`}>
                      {fornecedor.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditSupplierModal(fornecedor)}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(fornecedor.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredFornecedores.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-dark-text-secondary">
                    Nenhum fornecedor encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quotations Section */}
      <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl shadow-glass dark:shadow-glass-dark border border-white/20 dark:border-dark-border overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-dark-border">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
              COTAÇÕES
            </h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar cotações..."
                value={cotacaoSearch}
                onChange={(e) => setCotacaoSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text text-sm"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark-surface">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-dark-text">Fornecedores</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-dark-text">Arquivo</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-dark-text">Prazo Máximo</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-dark-text">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-dark-text">Data</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-dark-text">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
              {cotacoes.map((cotacao, index) => (
                <tr
                  key={`cotacao-${cotacao.id}`}
                  className="hover:bg-gray-50 dark:hover:bg-dark-surface/50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {cotacao.fornecedores && Array.isArray(cotacao.fornecedores) && cotacao.fornecedores.map(f => (
                        <span key={`cotacao-fornecedor-${f.id}`} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded text-xs">
                          {f.nome_empresa}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-dark-text">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="truncate max-w-xs" title={cotacao.arquivo_nome}>
                        {cotacao.arquivo_nome}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-dark-text">
                    {formatDate(cotacao.prazo_maximo)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      cotacao.status === 'sent'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                        : cotacao.status === 'scheduled'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                    }`}>
                      {cotacao.status === 'sent' ? 'Enviada' : cotacao.status === 'scheduled' ? 'Agendada' : 'Recebida'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-dark-text">
                    {formatDate(cotacao.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openViewQuotationModal(cotacao)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Ver Detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {cotacao.status !== 'sent' && (
                        <button
                          onClick={() => openEditQuotationModal(cotacao)}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteQuotation(cotacao.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {cotacoes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-dark-text-secondary">
                    Nenhuma cotação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 dark:bg-dark-card/95 backdrop-blur-glass rounded-3xl shadow-2xl border border-white/20 dark:border-dark-border max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-primary text-white p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {modalType.includes('supplier') ? <Store className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                  <h2 className="text-2xl font-bold">
                    {modalType === 'create-supplier' && 'NOVO FORNECEDOR'}
                    {modalType === 'edit-supplier' && 'Editar Fornecedor'}
                    {modalType === 'create-quotation' && 'NOVA COTAÇÃO'}
                    {modalType === 'edit-quotation' && 'EDITAR COTAÇÃO'}
                    {modalType === 'view-quotation' && 'Detalhes da Cotação'}
                  </h2>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Supplier Create/Edit Forms */}
              {(modalType === 'create-supplier' || modalType === 'edit-supplier') && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                        Nome da Empresa *
                      </label>
                      <input
                        type="text"
                        value={modalType === 'edit-supplier' && editingFornecedor ? editingFornecedor.nome_empresa : novoFornecedor.nome_empresa}
                        onChange={(e) => {
                          if (modalType === 'edit-supplier' && editingFornecedor) {
                            setEditingFornecedor({ ...editingFornecedor, nome_empresa: e.target.value });
                          } else {
                            setNovoFornecedor(prev => ({ ...prev, nome_empresa: e.target.value }));
                          }
                        }}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                        placeholder="Nome da empresa"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                        Nome do Responsável *
                      </label>
                      <input
                        type="text"
                        value={modalType === 'edit-supplier' && editingFornecedor ? editingFornecedor.nome_responsavel : novoFornecedor.nome_responsavel}
                        onChange={(e) => {
                          if (modalType === 'edit-supplier' && editingFornecedor) {
                            setEditingFornecedor({ ...editingFornecedor, nome_responsavel: e.target.value });
                          } else {
                            setNovoFornecedor(prev => ({ ...prev, nome_responsavel: e.target.value }));
                          }
                        }}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                        placeholder="Nome do responsável"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                        WhatsApp *
                      </label>
                      <input
                        type="tel"
                        value={modalType === 'edit-supplier' && editingFornecedor ? editingFornecedor.whatsapp : novoFornecedor.whatsapp}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (modalType === 'edit-supplier' && editingFornecedor) {
                            setEditingFornecedor({ ...editingFornecedor, whatsapp: value });
                          } else {
                            setNovoFornecedor(prev => ({ ...prev, whatsapp: value }));
                          }
                        }}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                        placeholder="11999999999"
                        maxLength={11}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                        Status
                      </label>
                      <select
                        value={modalType === 'edit-supplier' && editingFornecedor ? editingFornecedor.status : novoFornecedor.status}
                        onChange={(e) => {
                          if (modalType === 'edit-supplier' && editingFornecedor) {
                            setEditingFornecedor({ ...editingFornecedor, status: e.target.value as 'active' | 'inactive' });
                          } else {
                            setNovoFornecedor(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }));
                          }
                        }}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                      >
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Quotation Create/Edit Forms */}
              {(modalType === 'create-quotation' || modalType === 'edit-quotation') && (
                <div className="space-y-6">
                  {/* Supplier selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                      Selecionar Fornecedores *
                    </label>
                    <div className="space-y-4">
                      {/* Search and Select All */}
                      <div className="flex items-center justify-between">
                        <div className="relative flex-1 max-w-xs">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Buscar fornecedores..."
                            value={quotationSupplierSearch}
                            onChange={(e) => setQuotationSupplierSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text text-sm"
                          />
                        </div>
                        <button
                          onClick={isAllSelected ? deselectAllSuppliers : selectAllSuppliers}
                          className="flex items-center space-x-2 px-4 py-2 bg-gradient-primary text-white rounded-xl hover:shadow-glow-primary dark:hover:shadow-glow-dark transition-all duration-300 text-sm"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>{isAllSelected ? 'Desmarcar Todos' : 'Selecionar Todos'}</span>
                        </button>
                      </div>
                      {/* Counter */}
                      <div className="text-sm text-gray-600 dark:text-dark-text-secondary">
                        {novaCotacao.fornecedores.length} de {filteredQuotationSuppliers.length} fornecedores selecionados
                      </div>
                      {/* Supplier List */}
                      <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-dark-border rounded-xl p-4 bg-white dark:bg-dark-surface">
                        {filteredQuotationSuppliers.length === 0 ? (
                          <p className="text-center text-gray-500 dark:text-dark-text-secondary">Nenhum fornecedor encontrado.</p>
                        ) : (
                          filteredQuotationSuppliers.map(fornecedor => (
                            <label key={fornecedor.id} className="flex items-center space-x-3 mb-3 last:mb-0 hover:bg-gray-50 dark:hover:bg-dark-surface/50 p-2 rounded-lg transition-colors">
                              <input
                                type="checkbox"
                                checked={novaCotacao.fornecedores.includes(fornecedor.id)}
                                onChange={() => toggleQuotationSupplier(fornecedor.id)}
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900 dark:text-dark-text">
                                  {fornecedor.nome_empresa}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-dark-text-secondary">
                                  {fornecedor.nome_responsavel} • {formatPhone(fornecedor.whatsapp)}
                                </div>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                fornecedor.status === 'active'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                              }`}>
                                {fornecedor.status === 'active' ? 'Ativo' : 'Inativo'}
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* File upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                      Arquivo de Cotação *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-dark-border rounded-xl p-6 text-center bg-gray-50 dark:bg-dark-surface/50">
                      {!arquivoCotacao.arquivo ? (
                        <>
                          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-4">
                            Arraste e solte um arquivo Excel (.xlsx, .xls) ou CSV (.csv) aqui, ou clique para selecionar
                          </p>
                          <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                          />
                          <label
                            htmlFor="file-upload"
                            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Selecionar Arquivo
                          </label>
                        </>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-8 h-8 text-primary" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-dark-text">
                                {arquivoCotacao.nome_original}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-dark-text-secondary">
                                {formatFileSize(arquivoCotacao.tamanho)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={removeFile}
                            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Quotation View Form */}
              {modalType === 'view-quotation' && viewingCotacao && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                        Fornecedores Selecionados
                      </label>
                      <div className="border border-gray-200 dark:border-dark-border rounded-xl p-4 bg-gray-50 dark:bg-dark-surface">
                        {viewingCotacao.fornecedores && Array.isArray(viewingCotacao.fornecedores) && viewingCotacao.fornecedores.map(f => (
                          <div key={f.id} className="text-sm text-gray-900 dark:text-dark-text mb-1">
                            {f.nome_empresa} - {f.nome_responsavel}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                        Arquivo
                      </label>
                      <div className="border border-gray-200 dark:border-dark-border rounded-xl p-4 bg-gray-50 dark:bg-dark-surface">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-5 h-5 text-primary" />
                          <span className="text-sm text-gray-900 dark:text-dark-text">
                            {viewingCotacao.arquivo_nome}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                        Status
                      </label>
                      <div className="border border-gray-200 dark:border-dark-border rounded-xl p-4 bg-gray-50 dark:bg-dark-surface">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          viewingCotacao.status === 'sent'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                            : viewingCotacao.status === 'scheduled'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                        }`}>
                          {viewingCotacao.status === 'sent' ? 'Enviada' : viewingCotacao.status === 'scheduled' ? 'Agendada' : 'Recebida'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                        Prazo Máximo
                      </label>
                      <div className="border border-gray-200 dark:border-dark-border rounded-xl p-4 bg-gray-50 dark:bg-dark-surface">
                        <span className="text-sm text-gray-900 dark:text-dark-text">
                          {formatDate(viewingCotacao.prazo_maximo)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 dark:bg-dark-surface p-6 rounded-b-3xl border-t border-gray-200 dark:border-dark-border">
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={closeModal}
                    className="px-6 py-3 border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card transition-colors"
                  >
                    {modalType === 'view-quotation' ? 'Fechar' : 'Cancelar'}
                  </button>

                  {modalType === 'create-supplier' && (
                    <button
                      onClick={handleCreateSupplier}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-primary text-white rounded-xl hover:shadow-glow-primary dark:hover:shadow-glow-dark transition-all duration-300"
                    >
                      <Save className="w-5 h-5" />
                      <span>Cadastrar Fornecedor</span>
                    </button>
                  )}

                  {modalType === 'edit-supplier' && (
                    <button
                      onClick={handleEditSupplier}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-primary text-white rounded-xl hover:shadow-glow-primary dark:hover:shadow-glow-dark transition-all duration-300"
                    >
                      <Save className="w-5 h-5" />
                      <span>Salvar Alteracoes</span>
                    </button>
                  )}

                  {(modalType === 'create-quotation' || modalType === 'edit-quotation') && (
                    <button
                      onClick={modalType === 'create-quotation' ? handleCreateQuotation : handleEditQuotation}
                      className="flex items-center space-x-3 px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                    >
                      <Send className="w-5 h-5" />
                      <span>{modalType === 'create-quotation' ? 'Enviar Cotacao' : 'Salvar Alteracoes'}</span>
                    </button>
                  )}

                  {modalType === 'view-quotation' && viewingCotacao && (
                    <button
                      onClick={() => {
                        closeModal();
                        openCreateQuotationModal();
                      }}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-primary text-white rounded-xl hover:shadow-glow-primary dark:hover:shadow-glow-dark transition-all duration-300"
                    >
                      <FileText className="w-5 h-5" />
                      <span>Nova Cotacao</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

(Fornecedores as any).layout = (page: React.ReactNode) => (
  <Layout>
    {page}
  </Layout>
);

export default Fornecedores;
