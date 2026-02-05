import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { 
  Store, 
  Plus, 
  Edit3, 
  Save, 
  X, 
  Search, 
  Calendar,
  Users,
  UserCheck,
  UserX,
  Package,
  Hash,
  Clock,
  CheckCircle,
  Eye,
  Trash2,
  Phone,
  Building2,
  FileText,
  Send,
  Calendar as CalendarIcon,
  Timer
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

interface Produto {
  id: number;
  nome: string;
  categoria: string;
  existe_no_banco: boolean;
}

interface ProdutoCotacao {
  produto_id?: number;
  nome_personalizado?: string;
  quantidade: number;
  categoria: string;
  nome?: string;
}

interface Cotacao {
  id: number;
  fornecedores: Fornecedor[];
  produtos: ProdutoCotacao[];
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

interface NovaCotacao {
  fornecedores: number[];
  produtos: ProdutoCotacao[];
  prazo_maximo: string;
  data_agendada?: string;
  agendar: boolean;
}

/** =======================
 * Mock Data (Removed - using real data from Supabase)
 * ======================= */

/** Page Props */
type PagePropsInertia = AppPageProps & {
  fornecedores?: Fornecedor[];
  produtos?: Produto[];
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
  const [produtos, setProdutos] = useState<Produto[]>(props.produtos || []);
  const [cotacoes, setCotacoes] = useState<Cotacao[]>(props.cotacoes || []);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'create-supplier' | 'edit-supplier' | 'create-quotation' | 'view-quotation'>('create-supplier');
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);
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
    prazo_maximo: '',
    agendar: false,
  });

  const [supplierSearch, setSupplierSearch] = useState('');
  const [cotacaoSearch, setCotacaoSearch] = useState('');
  const [produtosCotacao, setProdutosCotacao] = useState<ProdutoCotacao[]>([]);
  const [productSearch, setProductSearch] = useState('');

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
      const product = produtos.find(p => p.id === produto.produto_id);
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
      prazo_maximo: '',
      agendar: false,
    });
    setProdutosCotacao([]);
    setModalType('create-quotation');
    setIsModalOpen(true);
  };

  const openViewQuotationModal = (cotacao: Cotacao) => {
    setViewingCotacao(cotacao);
    setModalType('view-quotation');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingFornecedor(null);
    setViewingCotacao(null);
    setProdutosCotacao([]);
    setProductSearch('');
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
    if (novaCotacao.fornecedores.length === 0 || produtosCotacao.length === 0 || !novaCotacao.prazo_maximo) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      const quotationData = {
        fornecedores: novaCotacao.fornecedores,
        produtos: produtosCotacao,
        prazo_maximo: novaCotacao.prazo_maximo,
        data_agendada: novaCotacao.data_agendada,
        agendar: novaCotacao.agendar,
      };

      const { data } = await axiosInstance.post('/admin/cotacoes', quotationData);
      setCotacoes(prev => [...prev, data]);
      closeModal();
      alert(`Cotação ${novaCotacao.agendar ? 'agendada' : 'enviada'} com sucesso!`);
    } catch (err: any) {
      console.error(err);
      alert('Erro ao criar cotação.');
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

  // Product filtering
  const filteredProducts = produtos.filter(produto => {
    const matchesSearch = produto.nome.toLowerCase().includes(productSearch.toLowerCase());
    return matchesSearch;
  });

  const addProductToQuotation = (produto?: Produto) => {
    const newProduct: ProdutoCotacao = {
      produto_id: produto?.id,
      nome_personalizado: produto ? undefined : '',
      quantidade: 1,
      categoria: produto?.categoria || '',
      nome: produto ? cleanProductName(produto.nome) : undefined,
    };
    setProdutosCotacao(prev => [...prev, newProduct]);
  };

  const addCustomProduct = () => {
    if (productSearch.trim()) {
      addProductToQuotation(undefined);
      // Set the custom name for the last added product
      setTimeout(() => {
        setProdutosCotacao(prev => {
          const newProducts = [...prev];
          const lastIndex = newProducts.length - 1;
          if (lastIndex >= 0) {
            newProducts[lastIndex] = {
              ...newProducts[lastIndex],
              nome_personalizado: productSearch.trim(),
              categoria: 'Produto Personalizado'
            };
          }
          return newProducts;
        });
        setProductSearch('');
      }, 100);
    }
  };

  const updateProductQuantity = (index: number, quantidade: number) => {
    setProdutosCotacao(prev =>
      prev.map((product, i) => i === index ? { ...product, quantidade } : product)
    );
  };

  const updateCustomProductName = (index: number, nome: string) => {
    setProdutosCotacao(prev =>
      prev.map((product, i) => i === index ? { ...product, nome_personalizado: nome } : product)
    );
  };

  const removeProductFromQuotation = (index: number) => {
    setProdutosCotacao(prev => prev.filter((_, i) => i !== index));
  };

  const requestQuotationNow = async () => {
    if (novaCotacao.fornecedores.length === 0 || produtosCotacao.length === 0 || !novaCotacao.prazo_maximo) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const cotacao: Cotacao = {
        id: Date.now(),
        fornecedores: fornecedores.filter(f => novaCotacao.fornecedores.includes(f.id)),
        produtos: produtosCotacao,
        prazo_maximo: novaCotacao.prazo_maximo,
        status: 'sent',
        created_at: new Date().toISOString(),
      };

      setCotacoes(prev => [...prev, cotacao]);
      closeModal();
      alert('Cotação enviada para os fornecedores selecionados!');
    } catch (err: any) {
      console.error(err);
      alert('Erro ao enviar cotação.');
    }
  };

  const scheduleQuotation = async () => {
    if (novaCotacao.fornecedores.length === 0 || produtosCotacao.length === 0 || !novaCotacao.prazo_maximo || !novaCotacao.data_agendada) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      const cotacao: Cotacao = {
        id: Date.now(),
        fornecedores: fornecedores.filter(f => novaCotacao.fornecedores.includes(f.id)),
        produtos: produtosCotacao,
        prazo_maximo: novaCotacao.prazo_maximo,
        data_agendada: novaCotacao.data_agendada,
        status: 'scheduled',
        created_at: new Date().toISOString(),
      };

      setCotacoes(prev => [...prev, cotacao]);
      closeModal();
      alert('Cotação agendada com sucesso!');
    } catch (err: any) {
      console.error(err);
      alert('Erro ao agendar cotação.');
    }
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
                  key={fornecedor.id}
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-dark-text">Produtos</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-dark-text">Prazo Máximo</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-dark-text">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-dark-text">Data</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-dark-text">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
              {cotacoes.map((cotacao, index) => (
                <tr
                  key={cotacao.id}
                  className="hover:bg-gray-50 dark:hover:bg-dark-surface/50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {cotacao.fornecedores.map(f => (
                        <span key={f.id} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded text-xs">
                          {f.nome_empresa}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-dark-text">
                    {cotacao.produtos.length} produto(s)
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
                    <button
                      onClick={() => openViewQuotationModal(cotacao)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title="Ver Detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
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

              {/* Quotation Create Form */}
              {modalType === 'create-quotation' && (
                <div className="space-y-6">
                  {/* Supplier Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
                        Fornecedores Selecionados ({novaCotacao.fornecedores.length})
                      </label>
                    </div>

                    <div className="mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Buscar fornecedores..."
                          value={supplierSearch}
                          onChange={(e) => setSupplierSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
                      {filteredFornecedores.map((fornecedor) => {
                        const isSelected = novaCotacao.fornecedores.includes(fornecedor.id);
                        return (
                          <div
                            key={fornecedor.id}
                            onClick={() => toggleQuotationSupplier(fornecedor.id)}
                            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                              isSelected
                                ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-lg'
                                : 'border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                                isSelected ? 'bg-primary' : 'bg-gray-400 dark:bg-gray-600'
                              }`}>
                                {getInitials(fornecedor.nome_empresa)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 dark:text-dark-text text-sm truncate">
                                  {fornecedor.nome_empresa}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-dark-text-secondary truncate">
                                  {fornecedor.nome_responsavel}
                                </p>
                              </div>

                              {isSelected && (
                                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                  <CheckCircle className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </div>

                            {isSelected && (
                              <div className="absolute inset-0 bg-primary/10 rounded-xl border-2 border-primary pointer-events-none" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Products Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
                        Produtos ({produtosCotacao.length})
                      </label>
                    </div>

                    {/* Product Search */}
                    <div className="mb-6">
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Buscar produtos..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && filteredProducts.length === 0 && productSearch.trim()) {
                              addCustomProduct();
                            }
                          }}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text text-sm"
                        />
                      </div>

                      {/* Search Results */}
                      {productSearch && (
                        <div className="mb-4 max-h-40 overflow-y-auto">
                          {filteredProducts.length > 0 ? (
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500 dark:text-dark-text-secondary mb-2">
                                Produtos encontrados ({filteredProducts.length}):
                              </p>
                              {filteredProducts.map((produto) => (
                                <div
                                  key={produto.id}
                                  onClick={() => {
                                    addProductToQuotation(produto);
                                    setProductSearch('');
                                  }}
                                  className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-surface rounded-lg border border-gray-200 dark:border-dark-border transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium text-gray-900 dark:text-dark-text text-sm">
                                        {cleanProductName(produto.nome)}
                                      </p>
                                    </div>
                                    <Package className="w-4 h-4 text-gray-400" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-3">
                              <p className="text-sm text-gray-500 dark:text-dark-text-secondary mb-2">
                                Nenhum produto encontrado
                              </p>
                              <button
                                type="button"
                                onClick={addCustomProduct}
                                className="flex items-center space-x-2 mx-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                              >
                                <Plus className="w-4 h-4" />
                                <span>Adicionar "{productSearch}" como produto personalizado</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Selected Products */}
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {produtosCotacao.map((produto, index) => (
                        <div key={index} className="p-4 border border-gray-200 dark:border-dark-border rounded-xl bg-gray-50 dark:bg-dark-surface">
                          <div className="flex items-center space-x-4">
                            <div className="flex-1">
                              {(() => {
                                if (produto.nome) {
                                  // Selected product with stored name
                                  return (
                                    <div>
                                      <p className="font-medium text-gray-900 dark:text-dark-text">
                                        {produto.nome}
                                      </p>
                                    </div>
                                  );
                                } else if (produto.nome_personalizado !== undefined) {
                                  // Custom product
                                  return (
                                    <div>
                                      <input
                                        type="text"
                                        placeholder="Nome do produto personalizado"
                                        value={produto.nome_personalizado}
                                        onChange={(e) => updateCustomProductName(index, e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text text-sm"
                                      />
                                      <p className="text-xs text-gray-500 dark:text-dark-text-secondary mt-1">
                                        Produto personalizado
                                      </p>
                                    </div>
                                  );
                                } else {
                                  // Fallback
                                  return (
                                    <div>
                                      <input
                                        type="text"
                                        placeholder="Nome do produto personalizado"
                                        value={produto.nome_personalizado || ''}
                                        onChange={(e) => updateCustomProductName(index, e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text text-sm"
                                      />
                                      <p className="text-xs text-gray-500 dark:text-dark-text-secondary mt-1">
                                        Produto personalizado
                                      </p>
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600 dark:text-dark-text-secondary">Qtd:</span>
                              <input
                                type="number"
                                min="1"
                                value={produto.quantidade}
                                onChange={(e) => updateProductQuantity(index, parseInt(e.target.value) || 1)}
                                className="w-20 px-3 py-2 border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text text-sm"
                              />
                              <button
                                onClick={() => removeProductFromQuotation(index)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                title="Remover"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {produtosCotacao.length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-dark-text-secondary">
                          <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Nenhum produto selecionado</p>
                          <p className="text-sm">Busque e selecione produtos ou adicione produtos personalizados</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Deadline and Scheduling */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                        Prazo Máximo de Devolutiva *
                      </label>
                      <input
                        type="datetime-local"
                        value={novaCotacao.prazo_maximo}
                        onChange={(e) => setNovaCotacao(prev => ({ ...prev, prazo_maximo: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-4">
                        Como deseja enviar a cotação?
                      </label>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Enviar Agora Option */}
                        <div
                          onClick={() => setNovaCotacao(prev => ({ ...prev, agendar: false }))}
                          className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                            !novaCotacao.agendar
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg'
                              : 'border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-green-300 dark:hover:border-green-600'
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              !novaCotacao.agendar 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                            }`}>
                              <Send className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                              <h3 className={`text-lg font-semibold ${
                                !novaCotacao.agendar ? 'text-green-700 dark:text-green-400' : 'text-gray-900 dark:text-dark-text'
                              }`}>
                                Enviar Agora
                              </h3>
                              <p className={`text-sm ${
                                !novaCotacao.agendar ? 'text-green-600 dark:text-green-300' : 'text-gray-500 dark:text-dark-text-secondary'
                              }`}>
                                A cotação será enviada imediatamente para os fornecedores selecionados
                              </p>
                            </div>
                          </div>
                          
                          {!novaCotacao.agendar && (
                            <div className="absolute top-4 right-4">
                              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          )}
                          
                          <div className={`absolute inset-0 rounded-2xl border-2 border-green-500 pointer-events-none ${
                            !novaCotacao.agendar ? 'opacity-100' : 'opacity-0'
                          }`} />
                        </div>

                        {/* Agendar Option */}
                        <div
                          onClick={() => setNovaCotacao(prev => ({ ...prev, agendar: true }))}
                          className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                            novaCotacao.agendar
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                              : 'border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-blue-300 dark:hover:border-blue-600'
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              novaCotacao.agendar 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                            }`}>
                              <CalendarIcon className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                              <h3 className={`text-lg font-semibold ${
                                novaCotacao.agendar ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-dark-text'
                              }`}>
                                Agendar Envio
                              </h3>
                              <p className={`text-sm ${
                                novaCotacao.agendar ? 'text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-dark-text-secondary'
                              }`}>
                                Escolha uma data e horário específico para enviar a cotação
                              </p>
                            </div>
                          </div>
                          
                          {novaCotacao.agendar && (
                            <div className="absolute top-4 right-4">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          )}
                          
                          <div className={`absolute inset-0 rounded-2xl border-2 border-blue-500 pointer-events-none ${
                            novaCotacao.agendar ? 'opacity-100' : 'opacity-0'
                          }`} />
                        </div>
                      </div>
                    </div>

                    {novaCotacao.agendar && (
                      <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200 dark:border-blue-700">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <Timer className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                              Configure o Agendamento
                            </h4>
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                              Defina quando a cotação será enviada automaticamente
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                              📅 Data e Horário do Agendamento *
                            </label>
                            <input
                              type="datetime-local"
                              value={novaCotacao.data_agendada}
                              onChange={(e) => setNovaCotacao(prev => ({ ...prev, data_agendada: e.target.value }))}
                              min={new Date().toISOString().slice(0, 16)} // Prevent past dates
                              className="w-full px-4 py-3 border border-blue-300 dark:border-blue-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                            />
                          </div>
                          
                          {novaCotacao.data_agendada && (
                            <div className="md:col-span-2 p-4 bg-blue-100 dark:bg-blue-800/30 rounded-lg border border-blue-200 dark:border-blue-600">
                              <p className="text-sm text-blue-700 dark:text-blue-300">
                                <strong>📋 Resumo do Agendamento:</strong><br />
                                A cotação será enviada automaticamente em: <strong>{formatDate(novaCotacao.data_agendada)}</strong>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* View Quotation */}
              {modalType === 'view-quotation' && viewingCotacao && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text mb-3">Fornecedores</h3>
                      <div className="flex flex-wrap gap-2">
                        {viewingCotacao.fornecedores.map(f => (
                          <span key={f.id} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-sm">
                            {f.nome_empresa}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text mb-3">Prazo Máximo</h3>
                      <p className="text-gray-600 dark:text-dark-text-secondary">
                        {formatDate(viewingCotacao.prazo_maximo)}
                      </p>
                    </div>

                    <div className="col-span-full">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text mb-3">Produtos</h3>
                      <div className="space-y-2">
                        {viewingCotacao.produtos.map((produto, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-surface rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-dark-text">
                                {getProductName(produto)}
                              </p>
                            </div>
                            <span className="font-semibold text-gray-900 dark:text-dark-text">
                              Qtd: {produto.quantidade}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                      viewingCotacao.status === 'sent'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                        : viewingCotacao.status === 'scheduled'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                    }`}>
                      Status: {viewingCotacao.status === 'sent' ? 'Enviada' : viewingCotacao.status === 'scheduled' ? 'Agendada' : 'Recebida'}
                    </span>
                  </div>
                </div>
              )}
            </div>

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
                    <span>Salvar Alterações</span>
                  </button>
                )}

                {modalType === 'create-quotation' && (
                  <div className="flex space-x-3">
                    {!novaCotacao.agendar ? (
                      <button
                        onClick={requestQuotationNow}
                        className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <Send className="w-5 h-5" />
                        <span>🚀 Enviar Cotação Agora</span>
                      </button>
                    ) : (
                      <button
                        onClick={scheduleQuotation}
                        disabled={!novaCotacao.data_agendada}
                        className={`flex items-center space-x-3 px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                          novaCotacao.data_agendada
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <CalendarIcon className="w-5 h-5" />
                        <span>📅 Agendar Cotação</span>
                      </button>
                    )}
                    
                    {/* Additional helper text */}
                    <div className="flex items-center">
                      {!novaCotacao.agendar ? (
                        <div className="text-sm text-gray-500 dark:text-dark-text-secondary flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span>Envio imediato para todos os fornecedores</span>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-dark-text-secondary flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span>Agendamento automático configurado</span>
                        </div>
                      )}
                    </div>
                  </div>
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
                    <span>Nova Cotação</span>
                  </button>
                )}
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