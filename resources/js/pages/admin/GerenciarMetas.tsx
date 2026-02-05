import React, { useEffect, useMemo, useState, useRef } from 'react';
import axios from 'axios';
import {
    Target,
    Plus,
    Edit3,
    Save,
    X,
    Search,
    Calendar,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertCircle,
    BarChart3,
    Eye,
    Trash2,
    DollarSign,
    Users,
    UserCheck,
    UserX,
    Hash,
    Package,
    ChevronDown,
    X as XIcon
} from 'lucide-react';

import Layout from '@/components/Layout';
import { usePage, router } from '@inertiajs/react'; // NEW: router p/ poder recarregar com filtros (se quiser)
import type { PageProps as AppPageProps } from '@/types/PageProps';

/** =======================
 * Tipos base
 * ======================= */
interface Consultant {
  id: number;
  name: string;
  email?: string;
  department?: string;
  table_supabase?: string;
  // NEW: status de metas calculado no backend
  metasStatus?: MetasStatus;
}



type GoalStatus = 'active' | 'inactive';
type GoalType = 'percentage' | 'bonus' | 'time';

interface MetasStatus {
  totalGoals: number;
  achievedGoals: number;
  percentage: number;
}

interface Produto {
   id: number;
   nome: string;
   categoria: string;
   existe_no_banco: boolean;
}

interface Goal {
   id: number;
   consultants: Consultant[];
   products: Produto[];
   startDate: string;
   endDate: string;
   type: GoalType;
   target_value: number;
   commission_value: number;
   status: GoalStatus;
   created_at: string;
   updated_at: string;
}

interface NewGoal {
   consultants: number[];
   products: number[];
   startDate: string;
   endDate: string;
   type: GoalType;
   target_value: number;
   commission_value: number;
   status: GoalStatus;
}

/** Page Props da página (EXTENDE o PageProps do projeto!) */
type PagePropsInertia = AppPageProps & {
   goals?: Goal[];
   consultores?: Consultant[];
   produtos?: Produto[];
};

/** Helpers */
const formatCurrency = (value: number) => `R$ ${value.toLocaleString('pt-BR')}`;
const formatPercentage = (value: number) => `${value}%`;

/** =======================
 * Componente ProductSelector - Otimizado
 * ======================= */
interface ProductSelectorProps {
  selectedProducts: number[];
  onChange: (productIds: number[]) => void;
  produtos: Produto[];
  placeholder?: string;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({
  selectedProducts,
  onChange,
  produtos,
  placeholder = "Buscar produtos..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtrar produtos válidos (com ID não nulo)
  const validProdutos = useMemo(() => {
    return produtos.filter(produto => produto.id != null && produto.id !== undefined);
  }, [produtos]);

  // Filtrar produtos baseado na busca
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return validProdutos;
    return validProdutos.filter(produto =>
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [validProdutos, searchTerm]);

  // Produtos disponíveis (não selecionados)
  const availableProducts = filteredProducts.filter(p => !selectedProducts.includes(p.id));

  // Produtos selecionados
  const selectedProductObjects = validProdutos.filter(p => selectedProducts.includes(p.id));

  // Handlers
  const handleSelectProduct = (productId: number) => {
    if (!selectedProducts.includes(productId)) {
      onChange([...selectedProducts, productId]);
    } else {
      onChange(selectedProducts.filter(id => id !== productId));
    }
  };

  const handleRemoveProduct = (productId: number) => {
    onChange(selectedProducts.filter(id => id !== productId));
  };

  const handleSelectAll = () => {
    const newIds = [...new Set([...selectedProducts, ...availableProducts.map(p => p.id)])];
    onChange(newIds);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Products Display */}
      {selectedProductObjects.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {selectedProductObjects.map(product => (
            <span
              key={product.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium"
            >
              {product.nome}
              <button
                onClick={() => handleRemoveProduct(product.id)}
                className="hover:bg-primary/20 rounded-full p-0.5"
              >
                <XIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsOpen(true)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text text-sm"
            />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl shadow-lg max-h-64 overflow-hidden">
            {/* Actions */}
            <div className="flex items-center justify-between p-2 border-b border-gray-100 dark:border-dark-border">
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center space-x-1 px-2 py-1 text-xs bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-800/50 text-green-700 dark:text-green-400 rounded transition-colors"
                >
                  <Package className="w-3 h-3" />
                  <span>Selecionar Todos</span>
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex items-center space-x-1 px-2 py-1 text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/50 text-red-700 dark:text-red-400 rounded transition-colors"
                >
                  <XIcon className="w-3 h-3" />
                  <span>Limpar</span>
                </button>
              </div>
              <span className="text-xs text-gray-500 dark:text-dark-text-secondary">
                {availableProducts.length} disponíveis
              </span>
            </div>

            {/* Product List */}
            <div className="max-h-48 overflow-y-auto">
              {availableProducts.length > 0 ? (
                availableProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleSelectProduct(product.id)}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-dark-surface cursor-pointer border-b border-gray-50 dark:border-dark-border last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-dark-surface flex items-center justify-center">
                        <span className="text-xs font-semibold text-gray-600 dark:text-dark-text-secondary">
                          {product.nome.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-dark-text">
                          {product.nome}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-dark-text-secondary">
                          {product.categoria}
                        </p>
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100" />
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-dark-text-secondary">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum produto encontrado</p>
                  <p className="text-xs">Tente ajustar o termo de busca</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-2 text-xs text-gray-500 dark:text-dark-text-secondary">
        <Hash className="w-3 h-3 inline mr-1" />
        {selectedProducts.length} produto{selectedProducts.length !== 1 ? 's' : ''} selecionado{selectedProducts.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
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
const GoalsManager: React.FC = () => {
   const { props } = usePage<PagePropsInertia>();
   const goals = props.goals || [];
   const consultants = props.consultores || [];
   const produtos = props.produtos || [];

   const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
   const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>('create');
   const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
   const [editingConsultantSearch, setEditingConsultantSearch] = useState('');
   const [viewingGoal, setViewingGoal] = useState<Goal | null>(null);

   const [newGoal, setNewGoal] = useState<NewGoal>({
      consultants: [],
      products: [],
      startDate: '',
      endDate: '',
      type: 'percentage',
      target_value: 0,
      commission_value: 0,
      status: 'active',
   });

   const [goalsList, setGoalsList] = useState<Goal[]>(goals);
   const [consultantSearch, setConsultantSearch] = useState('');

  useEffect(() => {
     setGoalsList(goals.map(g => ({
        ...g,
        consultants: Array.isArray(g.consultants) ? g.consultants : [],
        products: Array.isArray(g.products) ? g.products : []
     })));
  }, [goals]);

  // When type changes to 'time', set consultants to all
  useEffect(() => {
     if (newGoal.type === 'time') {
        setNewGoal(prev => ({
           ...prev,
           consultants: consultants.map(c => c.id),
           products: []
        }));
     }
  }, [newGoal.type, consultants]);

  const openCreateModal = () => {
     setNewGoal({
        consultants: [],
        products: [],
        startDate: '',
        endDate: '',
        type: 'percentage',
        target_value: 0,
        commission_value: 0,
        status: 'active',
     });
     setConsultantSearch('');
     setModalType('create');
     setIsModalOpen(true);
  };

  // Helper functions for consultant selection
  const filteredConsultants = consultants.filter(consultant => {
    const matchesSearch = consultant.name.toLowerCase().includes(consultantSearch.toLowerCase()) ||
                         consultant.email?.toLowerCase().includes(consultantSearch.toLowerCase());
    return matchesSearch;
  });

  const toggleConsultant = (consultantId: number) => {
    setNewGoal(prev => ({
      ...prev,
      consultants: prev.consultants.includes(consultantId)
        ? prev.consultants.filter(id => id !== consultantId)
        : [...prev.consultants, consultantId]
    }));
  };

  const selectAllConsultants = () => {
    const availableConsultantIds = filteredConsultants.map(c => c.id);
    setNewGoal(prev => ({
      ...prev,
      consultants: [...new Set([...prev.consultants, ...availableConsultantIds])]
    }));
  };

  const clearAllConsultants = () => {
     setNewGoal(prev => ({
        ...prev,
        consultants: []
     }));
  };


  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };



  const openEditModal = (goal: Goal) => {
     setEditingGoal({
        ...goal,
        consultants: Array.isArray(goal.consultants) ? goal.consultants : [],
        products: Array.isArray(goal.products) ? goal.products : []
     });
     setEditingConsultantSearch('');
     setModalType('edit');
     setIsModalOpen(true);
  };

  // Helper functions for edit modal consultant selection
  const filteredEditConsultants = consultants.filter(consultant => {
    const matchesSearch = consultant.name.toLowerCase().includes(editingConsultantSearch.toLowerCase()) ||
                         consultant.email?.toLowerCase().includes(editingConsultantSearch.toLowerCase());
    return matchesSearch;
  });

  const toggleEditConsultant = (consultantId: number) => {
    if (!editingGoal) return;
    
    const updatedConsultants = editingGoal.consultants.some(c => c.id === consultantId)
      ? editingGoal.consultants.filter(c => c.id !== consultantId)
      : [...editingGoal.consultants, consultants.find(c => c.id === consultantId)!];
    
    setEditingGoal({
      ...editingGoal,
      consultants: updatedConsultants
    });
  };

  const selectAllEditConsultants = () => {
    if (!editingGoal) return;
    
    const availableConsultantIds = filteredEditConsultants.map(c => c.id);
    const existingIds = editingGoal.consultants.map(c => c.id);
    const newConsultants = consultants.filter(c => 
      availableConsultantIds.includes(c.id) && !existingIds.includes(c.id)
    );
    
    setEditingGoal({
      ...editingGoal,
      consultants: [...editingGoal.consultants, ...newConsultants]
    });
  };

  const clearAllEditConsultants = () => {
     if (!editingGoal) return;

     setEditingGoal({
        ...editingGoal,
        consultants: []
     });
  };


  const openViewModal = (goal: Goal) => {
    setViewingGoal({...goal, consultants: Array.isArray(goal.consultants) ? goal.consultants : []});
    setModalType('view');
    setIsModalOpen(true);
  };

  const closeModal = () => {
     setIsModalOpen(false);
     setEditingGoal(null);
     setViewingGoal(null);
  };

  /** CRUD */
  const handleCreateGoal = async () => {
     if (newGoal.consultants.length === 0 || newGoal.products.length === 0 || !newGoal.startDate || !newGoal.endDate || newGoal.target_value <= 0 || newGoal.commission_value <= 0) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
     }

     try {
        const { data } = await axiosInstance.post('/admin/goals', {
           consultants: newGoal.consultants,
           products: newGoal.products,
           start_date: newGoal.startDate,
           end_date: newGoal.endDate,
           type: newGoal.type,
           target_value: newGoal.target_value,
           commission_value: newGoal.commission_value,
           status: newGoal.status,
        });

        // Transform data to match Goal interface
        const goal: Goal = {
           id: data.id,
           consultants: consultants.filter(c => newGoal.consultants.includes(c.id)),
           products: produtos.filter(p => newGoal.products.includes(p.id)),
           startDate: data.start_date,
           endDate: data.end_date,
           type: data.type,
           target_value: data.target_value,
           commission_value: data.commission_value,
           status: data.status,
           created_at: data.created_at,
           updated_at: data.updated_at,
        };
        setGoalsList(prev => [...prev, goal]);
        closeModal();
     } catch (err: any) {
        console.error(err);
        alert(err?.response?.data?.message || 'Erro ao criar meta.');
     }
  };

  const handleEditGoal = async () => {
     if (!editingGoal) return;

     try {
        await axiosInstance.put(`/admin/goals/${editingGoal.id}`, {
           consultants: editingGoal.consultants.map(c => c.id),
           products: editingGoal.products.map(p => p.id),
           start_date: editingGoal.startDate,
           end_date: editingGoal.endDate,
           type: editingGoal.type,
           target_value: editingGoal.target_value,
           commission_value: editingGoal.commission_value,
           status: editingGoal.status,
        });

        setGoalsList(prev =>
           prev.map(goal =>
              goal.id === editingGoal.id ? editingGoal : goal
           )
        );
        closeModal();
     } catch (err: any) {
        console.error(err);
        alert(err?.response?.data?.message || 'Erro ao atualizar meta.');
     }
  };

  const handleDeleteGoal = async (goalId: number) => {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return;

    try {
      await axiosInstance.delete(`/admin/goals/${goalId}`);
      setGoalsList(prev => prev.filter(goal => goal.id !== goalId));
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || 'Erro ao excluir meta.');
    }
  };

  const handleToggleStatus = async (goal: Goal) => {
    try {
      const { data } = await axiosInstance.patch(`/admin/goals/${goal.id}/status`);
      setGoalsList(prev =>
        prev.map(g => g.id === goal.id ? { ...g, status: data.status } : g)
      );
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || 'Erro ao alterar status.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="animate-slide-up">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          Gerenciador de Metas
        </h1>
        <p className="text-gray-600 dark:text-dark-text-secondary text-lg">
          Defina e acompanhe as metas dos consultores
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl p-6 shadow-glass dark:shadow-glass-dark border border-white/20 dark:border-dark-border">
        <div className="flex justify-end">
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-6 py-2 bg-gradient-primary text-white rounded-xl hover:shadow-glow-primary dark:hover:shadow-glow-dark transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
            <span>NOVA META</span>
          </button>
        </div>
      </div>

      {/* Goals Table */}
      <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl shadow-glass dark:shadow-glass-dark border border-white/20 dark:border-dark-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-primary text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Consultores</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Período</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Tipo</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Meta e Comissão</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
              {goalsList.map((goal, index) => (
                <tr
                  key={goal.id}
                  className="hover:bg-gray-50 dark:hover:bg-dark-surface/50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(goal.consultants) ? goal.consultants : []).map(c => (
                        <span key={c.id} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded text-xs">
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-dark-text">
                    {new Date(goal.startDate).toLocaleDateString('pt-BR')} - {new Date(goal.endDate).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-dark-text">
                    {goal.type === 'percentage' ? 'Porcentagem (%)' : goal.type === 'bonus' ? 'Bônus Fixo' : 'Tempo de Resposta'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="space-y-1">
                      <div className="font-semibold text-gray-900 dark:text-dark-text">
                        Meta: {goal.type === 'time' ? `${goal.target_value} min` : formatCurrency(goal.target_value)}
                      </div>
                      <div className="text-gray-600 dark:text-dark-text-secondary">
                        Comissão: {formatCurrency(goal.commission_value)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      goal.status === 'active'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                    }`}>
                      {goal.status === 'active' ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openViewModal(goal)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Ver Detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(goal)}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(goal)}
                        className={`p-2 rounded-lg transition-colors ${
                          goal.status === 'active'
                            ? 'text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30'
                            : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
                        }`}
                        title={goal.status === 'active' ? 'Pausar' : 'Iniciar'}
                      >
                        {goal.status === 'active' ? <Clock className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {goalsList.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-dark-text-secondary">
                    Nenhuma meta encontrada.
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
          <div className="bg-white/95 dark:bg-dark-card/95 backdrop-blur-glass rounded-3xl shadow-2xl border border-white/20 dark:border-dark-border max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-primary text-white p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Target className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">
                    {modalType === 'create' && 'NOVA META'}
                    {modalType === 'edit' && 'Editar Meta'}
                    {modalType === 'view' && 'Detalhes da Meta'}
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
              {modalType === 'create' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-full">
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
                          {newGoal.type === 'time' ? 'Aplicável a todos os consultores' : `Consultores Selecionados (${newGoal.consultants.length})`}
                        </label>
                        {newGoal.type !== 'time' && (
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={selectAllConsultants}
                              className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-800/50 text-green-700 dark:text-green-400 rounded-lg transition-colors"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Selecionar Todos</span>
                            </button>
                            <button
                              type="button"
                              onClick={clearAllConsultants}
                              className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/50 text-red-700 dark:text-red-400 rounded-lg transition-colors"
                            >
                              <UserX className="w-3 h-3" />
                              <span>Limpar</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {newGoal.type !== 'time' && (
                        <>
                          {/* Search Control */}
                          <div className="mb-4">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <input
                                type="text"
                                placeholder="Buscar consultores..."
                                value={consultantSearch}
                                onChange={(e) => setConsultantSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text text-sm"
                              />
                            </div>
                          </div>

                          {/* Consultant Cards Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
                            {filteredConsultants.map((consultant) => {
                              const isSelected = newGoal.consultants.includes(consultant.id);
                              return (
                                <div
                                  key={consultant.id}
                                  onClick={() => toggleConsultant(consultant.id)}
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
                                      {getInitials(consultant.name)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-gray-900 dark:text-dark-text text-sm truncate">
                                        {consultant.name}
                                      </h4>
                                      <p className="text-xs text-gray-500 dark:text-dark-text-secondary truncate">
                                        {consultant.email}
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

                          {filteredConsultants.length === 0 && (
                            <div className="text-center py-8 text-gray-500 dark:text-dark-text-secondary">
                              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                              <p>Nenhum consultor encontrado</p>
                              <p className="text-sm">Tente ajustar os filtros ou termo de busca</p>
                            </div>
                          )}

                          {newGoal.consultants.length > 0 && (
                            <div className="mt-4 p-3 bg-gray-50 dark:bg-dark-surface rounded-lg">
                              <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-2">
                                <Hash className="w-4 h-4 inline mr-1" />
                                Consultores selecionados:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {newGoal.consultants.map(id => {
                                  const consultant = consultants.find(c => c.id === id);
                                  return consultant ? (
                                    <span key={id} className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
                                      {consultant.name}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {newGoal.type === 'time' && (
                        <div className="mt-4 p-3 bg-gray-50 dark:bg-dark-surface rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-2">
                            <Hash className="w-4 h-4 inline mr-1" />
                            Aplicável a todos os consultores
                          </p>
                        </div>
                      )}
                    </div>

                    {newGoal.type !== 'time' && (
                      <div className="col-span-full">
                        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-4">
                          Selecionar Produtos
                        </label>
                        <ProductSelector
                          selectedProducts={newGoal.products}
                          onChange={(productIds) => {
                            setNewGoal(prev => ({ ...prev, products: productIds }));
                          }}
                          produtos={produtos}
                          placeholder="Buscar produtos..."
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                        Data de Início
                      </label>
                      <input
                        type="date"
                        value={newGoal.startDate}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                        Data Final
                      </label>
                      <input
                        type="date"
                        value={newGoal.endDate}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                        Tipo de Meta
                      </label>
                      <select
                        value={newGoal.type}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, type: e.target.value as GoalType }))}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                      >
                        <option value="percentage">Porcentagem (%)</option>
                        <option value="bonus">Bônus Fixo</option>
                        <option value="time">Tempo de Resposta</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                        Meta {editingGoal?.type === 'time' ? '(Tempo de Resposta em Minutos)' : '(Valor de Vendas)'}
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-dark-text-secondary w-4 h-4" />
                        <input
                          type="number"
                          step="0.01"
                          value={newGoal.target_value}
                          onChange={(e) => setNewGoal(prev => ({ ...prev, target_value: parseFloat(e.target.value) || 0 }))}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                          placeholder="0,00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                        Comissão do Consultor (R$)
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-dark-text-secondary w-4 h-4" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newGoal.commission_value}
                          onChange={(e) => setNewGoal(prev => ({ ...prev, commission_value: parseFloat(e.target.value) || 0 }))}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                          placeholder="0,00"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Valor de comissão por atingir a meta</p>
                    </div>
                  </div>
                </div>
              )}

              {modalType === 'edit' && editingGoal && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-full">
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
                          {editingGoal?.type === 'time' ? 'Aplicável a todos os consultores' : `Consultores Selecionados (${(Array.isArray(editingGoal.consultants) ? editingGoal.consultants : []).length})`}
                        </label>
                        {editingGoal?.type !== 'time' && (
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={selectAllEditConsultants}
                              className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-800/50 text-green-700 dark:text-green-400 rounded-lg transition-colors"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Selecionar Todos</span>
                            </button>
                            <button
                              type="button"
                              onClick={clearAllEditConsultants}
                              className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/50 text-red-700 dark:text-red-400 rounded-lg transition-colors"
                            >
                              <UserX className="w-3 h-3" />
                              <span>Limpar</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Search Control */}
                      <div className="mb-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Buscar consultores..."
                            value={editingConsultantSearch}
                            onChange={(e) => setEditingConsultantSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text text-sm"
                          />
                        </div>
                      </div>

                      {/* Consultant Cards Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
                        {filteredEditConsultants.map((consultant) => {
                          const isSelected = editingGoal.consultants.some(c => c.id === consultant.id);
                          return (
                            <div
                              key={consultant.id}
                              onClick={() => toggleEditConsultant(consultant.id)}
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
                                  {getInitials(consultant.name)}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900 dark:text-dark-text text-sm truncate">
                                    {consultant.name}
                                  </h4>
                                  <p className="text-xs text-gray-500 dark:text-dark-text-secondary truncate">
                                    {consultant.email}
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

                      {filteredEditConsultants.length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-dark-text-secondary">
                          <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Nenhum consultor encontrado</p>
                          <p className="text-sm">Tente ajustar os filtros ou termo de busca</p>
                        </div>
                      )}

                      {editingGoal.consultants.length > 0 && (
                        <div className="mt-4 p-3 bg-gray-50 dark:bg-dark-surface rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-2">
                            <Hash className="w-4 h-4 inline mr-1" />
                            Consultores selecionados:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {(Array.isArray(editingGoal.consultants) ? editingGoal.consultants : []).map(consultant => (
                              <span key={consultant.id} className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
                                {consultant.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {editingGoal?.type !== 'time' && (
                      <div className="col-span-full">
                        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-4">
                          Selecionar Produtos
                        </label>
                        <ProductSelector
                          selectedProducts={editingGoal.products.map(p => p.id)}
                          onChange={(productIds) => {
                            const selectedProductObjects = produtos.filter(p => productIds.includes(p.id));
                            setEditingGoal({ ...editingGoal, products: selectedProductObjects });
                          }}
                          produtos={produtos}
                          placeholder="Buscar produtos..."
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                        Data de Início
                      </label>
                      <input
                        type="date"
                        value={editingGoal.startDate}
                        onChange={(e) => setEditingGoal({ ...editingGoal, startDate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                        Data Final
                      </label>
                      <input
                        type="date"
                        value={editingGoal.endDate}
                        onChange={(e) => setEditingGoal({ ...editingGoal, endDate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                        Tipo de Meta
                      </label>
                      <select
                        value={editingGoal.type}
                        onChange={(e) => setEditingGoal({ ...editingGoal, type: e.target.value as GoalType })}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                      >
                        <option value="percentage">Porcentagem (%)</option>
                        <option value="bonus">Bônus Fixo</option>
                        <option value="time">Tempo de Resposta</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                        Meta (Valor de Vendas)
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-dark-text-secondary w-4 h-4" />
                        <input
                          type="number"
                          step="0.01"
                          value={editingGoal.target_value}
                          onChange={(e) => setEditingGoal({ ...editingGoal, target_value: parseFloat(e.target.value) || 0 })}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                          placeholder="0,00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                        Comissão do Consultor (R$)
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-dark-text-secondary w-4 h-4" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editingGoal.commission_value}
                          onChange={(e) => setEditingGoal({ ...editingGoal, commission_value: parseFloat(e.target.value) || 0 })}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                          placeholder="0,00"
                        />
                      </div>
                      {editingGoal.type === 'percentage' && (
                        <p className="text-xs text-gray-500 mt-1">Percentual de comissão sobre a meta atingida</p>
                      )}
                      {editingGoal.type === 'bonus' && (
                        <p className="text-xs text-gray-500 mt-1">Valor fixo de comissão por atingir a meta</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {modalType === 'view' && viewingGoal && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text mb-3">Consultores</h3>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(viewingGoal.consultants) ? viewingGoal.consultants : []).map(c => (
                          <span key={c.id} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-sm">
                            {c.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text mb-3">Produtos</h3>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(viewingGoal.products) ? viewingGoal.products : []).map(p => (
                          <span key={p.id} className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-sm">
                            {p.nome}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text mb-3">Período</h3>
                      <p className="text-gray-600 dark:text-dark-text-secondary">
                        {new Date(viewingGoal.startDate).toLocaleDateString('pt-BR')} - {new Date(viewingGoal.endDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text mb-3">Meta e Comissão</h3>
                      <div className="space-y-2">
                        <p className="text-gray-600 dark:text-dark-text-secondary">
                          <span className="font-medium">Meta:</span> {formatCurrency(viewingGoal.target_value)}
                        </p>
                        <p className="text-gray-600 dark:text-dark-text-secondary">
                          <span className="font-medium">Tipo:</span> {viewingGoal.type === 'percentage' ? 'Porcentagem' : viewingGoal.type === 'bonus' ? 'Bônus Fixo' : 'Tempo de Resposta'}
                        </p>
                        <p className="text-gray-600 dark:text-dark-text-secondary">
                          <span className="font-medium">Comissão:</span> {viewingGoal.type === 'percentage' ? formatPercentage(viewingGoal.commission_value) : formatCurrency(viewingGoal.commission_value)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                      viewingGoal.status === 'active'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                    }`}>
                      Status: {viewingGoal.status === 'active' ? 'Ativa' : 'Inativa'}
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
                  {modalType === 'view' ? 'Fechar' : 'Cancelar'}
                </button>

                {modalType === 'create' && (
                  <button
                    onClick={handleCreateGoal}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-primary text-white rounded-xl hover:shadow-glow-primary dark:hover:shadow-glow-dark transition-all duration-300"
                  >
                    <Save className="w-5 h-5" />
                    <span>Criar Meta</span>
                  </button>
                )}

                {modalType === 'edit' && (
                  <button
                    onClick={handleEditGoal}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-primary text-white rounded-xl hover:shadow-glow-primary dark:hover:shadow-glow-dark transition-all duration-300"
                  >
                    <Save className="w-5 h-5" />
                    <span>Salvar Alterações</span>
                  </button>
                )}

                {modalType === 'view' && viewingGoal && (
                  <button
                    onClick={() => openEditModal(viewingGoal)}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-primary text-white rounded-xl hover:shadow-glow-primary dark:hover:shadow-glow-dark transition-all duration-300"
                  >
                    <Edit3 className="w-5 h-5" />
                    <span>Editar Meta</span>
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

(GoalsManager as any).layout = (page: React.ReactNode) => (
  <Layout>
    {page}
  </Layout>
);

export default GoalsManager;
