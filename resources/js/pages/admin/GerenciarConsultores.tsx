import React, { useState } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Eye, Mail, Phone, Calendar, MapPin, Building, User, DollarSign, CheckCircle, XCircle, Clock, ExternalLink, X, Save } from 'lucide-react';
import Layout from '@/components/Layout';
import axios from 'axios';
import { usePage } from '@inertiajs/react';

interface Consultor {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
}

interface NewConsultorData {
  nome: string;
  email: string;
  telefone?: string;
  senha: string;
}

const ConsultorManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewConsultorModal, setShowNewConsultorModal] = useState(false);
  const [showEditConsultorModal, setShowEditConsultorModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingConsultor, setEditingConsultor] = useState<Consultor | null>(null);
  const [deletingConsultor, setDeletingConsultor] = useState<Consultor | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 8;

  const [newConsultorData, setNewConsultorData] = useState<NewConsultorData>({
    nome: '',
    email: '',
    telefone: '',
    senha: ''
  });

  const [editConsultorData, setEditConsultorData] = useState<NewConsultorData>({
    nome: '',
    email: '',
    telefone: '',
    senha: ''
  });

  const { consultores: initialConsultores } = usePage<{ consultores: Consultor[] }>().props;
  const [consultores, setConsultores] = useState<Consultor[]>(initialConsultores);
  const filteredConsultores = consultores.filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.telefone && c.telefone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalConsultores = consultores.length;
  const activeConsultores = consultores.length; // Por enquanto, considerando todos como ativos

  const totalPages = Math.ceil(filteredConsultores.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentConsultores = filteredConsultores.slice(startIndex, startIndex + itemsPerPage);

  const handleInputChange = (field: keyof NewConsultorData, value: string) => {
    setNewConsultorData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveConsultor = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('/admin/consultants', newConsultorData);
      const newConsultant: Consultor = {
        id: response.data.user_id,
        nome: newConsultorData.nome,
        email: newConsultorData.email,
        telefone: newConsultorData.telefone
      };
      setConsultores(prev => [...prev, newConsultant]);
    } catch (error) {
      console.error('Erro ao salvar consultor:', error);
    } finally {
      setIsLoading(false);
      setShowNewConsultorModal(false);
      setNewConsultorData({
        nome: '',
        email: '',
        telefone: '',
        senha: ''
      });
    }
  };

  const handleCloseModal = () => setShowNewConsultorModal(false);

  const handleEditConsultor = (consultor: Consultor) => {
    setEditingConsultor(consultor);
    setEditConsultorData({
      nome: consultor.nome,
      email: consultor.email,
      telefone: consultor.telefone || '',
      senha: ''
    });
    setShowEditConsultorModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditConsultorModal(false);
    setEditingConsultor(null);
    setEditConsultorData({
      nome: '',
      email: '',
      telefone: '',
      senha: ''
    });
  };

  const handleDeleteConsultor = (consultor: Consultor) => {
    setDeletingConsultor(consultor);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingConsultor) return;

    setIsLoading(true);
    try {
      await axios.delete(`/admin/consultants/${deletingConsultor.id}`);
      setConsultores(prev => prev.filter(c => c.id !== deletingConsultor.id));
    } catch (error) {
      console.error('Erro ao deletar consultor:', error);
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
      setDeletingConsultor(null);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingConsultor(null);
  };

  const handleSaveEditConsultor = async () => {
    if (!editingConsultor) return;

    setIsLoading(true);
    try {
      await axios.put(`/admin/consultants/${editingConsultor.id}`, editConsultorData);
      // Update the state with the edited consultant
      setConsultores(prev => prev.map(c =>
        c.id === editingConsultor.id
          ? { ...c, nome: editConsultorData.nome, email: editConsultorData.email, telefone: editConsultorData.telefone }
          : c
      ));
    } catch (error) {
      console.error('Erro ao editar consultor:', error);
    } finally {
      setIsLoading(false);
      handleCloseEditModal();
    }
  };

  return (
    <div className="space-y-8 w-full">
      <div className="animate-slide-up">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          Gestão de Consultores
        </h1>
        <p className="text-gray-600 dark:text-dark-text-secondary text-lg">Gerencie todos os consultores do sistema</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl p-6 shadow-glass dark:shadow-glass-dark hover:shadow-glow-primary dark:hover:shadow-glow-dark transition-all duration-300 border border-white/20 dark:border-dark-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-dark-text-secondary text-sm font-medium">Total de Consultores</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-dark-text">{totalConsultores}</p>
            </div>
            <div className="p-3 bg-gradient-primary rounded-xl">
              <User className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl p-6 shadow-glass dark:shadow-glass-dark border border-white/20 dark:border-dark-border">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-dark-text-secondary w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
              />
            </div>
          </div>
          
          <button 
            onClick={() => setShowNewConsultorModal(true)}
            className="flex items-center space-x-2 px-6 py-2 bg-gradient-primary text-white rounded-xl hover:shadow-glow-primary dark:hover:shadow-glow-dark transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Consultor</span>
          </button>
        </div>
      </div>

      {/* Consultores Table */}
      <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl shadow-glass dark:shadow-glass-dark border border-white/20 dark:border-dark-border overflow-hidden">
        <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table className="w-full" style={{ minWidth: '1000px' }}>
              <thead className="bg-gradient-primary text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap min-w-[100px]">Nome</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap min-w-[100px]">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap min-w-[100px]">Telefone</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap min-w-[100px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                {currentConsultores.map((consultores, index) => (
                  <tr 
                    key={consultores.id} 
                    className="hover:bg-gray-50 dark:hover:bg-dark-surface/50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-dark-text whitespace-nowrap">
                      <div className="max-w-[120px] truncate" title={consultores.nome}>
                        {consultores.nome}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-dark-text whitespace-nowrap">
                      <div className="max-w-[200px] truncate" title={consultores.email}>
                        {consultores.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-dark-text whitespace-nowrap">
                      <div className="max-w-[150px] truncate" title={consultores.telefone || '-'}>
                        {consultores.telefone || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex space-x-1 justify-center">
                        <button className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Visualizar">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditConsultor(consultores)}
                          className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteConsultor(consultores)}
                          className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-dark-surface border-t border-gray-100 dark:border-dark-border">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700 dark:text-dark-text-secondary">
                Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredConsultores.length)} de {filteredConsultores.length} resultados
              </p>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-200 dark:border-dark-border rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                >
                  Anterior
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      currentPage === i + 1
                        ? 'bg-gradient-primary text-white'
                        : 'border border-gray-200 dark:border-dark-border hover:bg-gray-100 dark:hover:bg-dark-card bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-200 dark:border-dark-border rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                >
                  Próximo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Consultor Modal */}
      {showEditConsultorModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-primary text-white p-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <User className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Editar Consultor</h2>
              </div>
              <button
                onClick={handleCloseEditModal}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-8">
                {/* Informações Pessoais */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text mb-4 flex items-center space-x-2">
                    <User className="w-5 h-5 text-primary" />
                    <span>Informações Pessoais</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Nome Completo *</label>
                      <input
                        type="text"
                        value={editConsultorData.nome}
                        onChange={(e) => setEditConsultorData(prev => ({ ...prev, nome: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                        placeholder="Digite o nome completo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Email *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-dark-text-secondary w-4 h-4" />
                        <input
                          type="email"
                          value={editConsultorData.email}
                          onChange={(e) => setEditConsultorData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                          placeholder="email@exemplo.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Telefone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-dark-text-secondary w-4 h-4" />
                        <input
                          type="tel"
                          value={editConsultorData.telefone || ''}
                          onChange={(e) => setEditConsultorData(prev => ({ ...prev, telefone: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Nova Senha (opcional)</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-dark-text-secondary w-4 h-4" />
                        <input
                          type="password"
                          value={editConsultorData.senha}
                          onChange={(e) => setEditConsultorData(prev => ({ ...prev, senha: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                          placeholder="Deixe em branco para manter a senha atual"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 dark:bg-dark-surface px-6 py-4 flex items-center justify-end space-x-3 border-t border-gray-200 dark:border-dark-border">
              <button
                onClick={handleCloseEditModal}
                className="px-6 py-2 border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEditConsultor}
                disabled={isLoading || !editConsultorData.nome || !editConsultorData.email}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-primary text-white rounded-xl hover:shadow-glow-primary dark:hover:shadow-glow-dark transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Consultor Modal */}
      {showNewConsultorModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-primary text-white p-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <User className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Novo Consultor</h2>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-8">
                {/* Informações Pessoais */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text mb-4 flex items-center space-x-2">
                    <User className="w-5 h-5 text-primary" />
                    <span>Informações Pessoais</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Nome Completo *</label>
                      <input
                        type="text"
                        value={newConsultorData.nome}
                        onChange={(e) => handleInputChange('nome', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                        placeholder="Digite o nome completo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Email *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-dark-text-secondary w-4 h-4" />
                        <input
                          type="email"
                          value={newConsultorData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                          placeholder="email@exemplo.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Telefone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-dark-text-secondary w-4 h-4" />
                        <input
                          type="tel"
                          value={newConsultorData.telefone || ''}
                          onChange={(e) => handleInputChange('telefone', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Senha *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-dark-text-secondary w-4 h-4" />
                        <input
                          type="password"
                          value={newConsultorData.senha}
                          onChange={(e) => handleInputChange('senha', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                          placeholder="senha do consultor"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 dark:bg-dark-surface px-6 py-4 flex items-center justify-end space-x-3 border-t border-gray-200 dark:border-dark-border">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveConsultor}
                disabled={isLoading || !newConsultorData.nome || !newConsultorData.email || !newConsultorData.senha}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-primary text-white rounded-xl hover:shadow-glow-primary dark:hover:shadow-glow-dark transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Consultor</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingConsultor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-red-500 text-white p-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Trash2 className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Confirmar Exclusão</h2>
              </div>
              <button
                onClick={handleCloseDeleteModal}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="text-center">
                <p className="text-gray-700 dark:text-dark-text-secondary mb-4">
                  Tem certeza que deseja excluir o consultor <strong>{deletingConsultor.nome}</strong>?
                </p>
                <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 dark:bg-dark-surface px-6 py-4 flex items-center justify-end space-x-3 border-t border-gray-200 dark:border-dark-border">
              <button
                onClick={handleCloseDeleteModal}
                className="px-6 py-2 border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isLoading}
                className="flex items-center space-x-2 px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

(ConsultorManagement as any).layout = (page: React.ReactNode) => (
  <Layout>
    {page}
  </Layout>
);

export default ConsultorManagement;