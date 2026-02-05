import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import {
  X, Package, Phone, DollarSign, User, Plus, Trash2, Save, Search, CheckCircle, BriefcaseBusiness,
  Bot, ExternalLink, Upload, Link as LinkIcon, FileText, Building, File, Link, Key, ChevronRight, Eye, EyeOff, CalendarCheck
} from 'lucide-react';

interface Tag {
  id: number;
  name: string;
  color: string;
}

interface OrderModalProps {
  isOpen: boolean;
  order: any;
  onClose: () => void;
  onSave: () => void;
  updateField: (field: string, value: any) => void;
  updateItem: (id: string, field: string, value: any) => void;
  addItem: () => void;
  removeItem: (id: string) => void;
  columns: any[];
}

const OrderModal = ({
  isOpen,
  order,
  onClose,
  onSave,
  updateField,
  updateItem,
  addItem,
  removeItem,
  columns
}: OrderModalProps) => {
  if (!isOpen || !order) return null;

  const { auth } = usePage().props as any;
  const userRole = auth?.user?.role;

  const [activeTab, setActiveTab] = useState<'dados' | 'projeto'>('dados');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});

  // ✅ Normaliza as tags se vierem como string JSON após reload
  if (typeof order.tags === 'string') {
    try {
      order.tags = JSON.parse(order.tags);
    } catch {
      order.tags = [];
    }
  }

  if (typeof order.link_adicionais === 'string') {
    try {
      order.link_adicionais = JSON.parse(order.link_adicionais);
    } catch {
      order.link_adicionais = [];
    }
  }

  if (typeof order.acessos === 'string') {
    try {
      order.acessos = JSON.parse(order.acessos);
    } catch {
      order.acessos = [];
    }
  }

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase())
  );

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/tags');
        const data = await response.json();
        setTags(data.tags || []);
      } catch (error) {
        console.error('Erro ao carregar tags:', error);
      }
    };
    fetchTags();
  }, []);

  const getContrastColor = (hexColor: string) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  };

  const safeTags = order.tags ?? [];

  // Separate documentos and links_adicionais from order.items
  const linksPedido = order.items?.filter((item: any) =>
    item.type === 'pedido' ||
    (!item.type && item.linkName !== undefined && item.linkUrl !== undefined && item.docName === undefined)
  ) || [];
  const documentos = order.items?.filter((item: any) =>
    item.type === 'documento' ||
    (!item.type && item.docName !== undefined && item.docUrl !== undefined)
  ) || [];
  const linksAdicionais = order.link_adicionais || [];

  const ensureHttp = (url: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const isValidUrl = (url: string) => {
    try {
      const u = new URL(ensureHttp(url));
      return !!u.hostname;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

      const response = await fetch("/client-management-store", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken || ''
        },
        body: JSON.stringify(order)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Salvar pedido', result);

      onSave();
      // onClose(); // Removido para não fechar o modal automaticamente
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar o pedido");
    }
  };

  return (
    <div className="fixed top-[-50px] left-0 w-full h-[calc(100%+50px)] flex bg-black/50 backdrop-blur-sm z-50 items-center justify-center">
      <div className="bg-white/95 dark:bg-dark-card/95 backdrop-blur-glass rounded-3xl shadow-2xl border border-white/20 dark:border-dark-border max-w-4xl w-full max-h-[100vh] overflow-y-auto">
        <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-3xl flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Editar Pedido</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-dark-border">
          <button
            onClick={() => {
              if (activeTab !== 'dados' && !isTransitioning) {
                setSlideDirection('right');
                setIsTransitioning(true);
                setTimeout(() => {
                  setActiveTab('dados');
                  setIsTransitioning(false);
                }, 300);
              }
            }}
            disabled={isTransitioning}
            className={`flex-1 px-6 py-4 font-semibold transition-all duration-300 ease-in-out relative overflow-hidden ${
              activeTab === 'dados'
                ? 'text-white bg-gradient-to-r from-blue-600 to-blue-700 border-b-2 border-blue-600 transform scale-105 shadow-lg'
                : 'text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-surface hover:scale-102 hover:shadow-md'
            } ${isTransitioning ? 'pointer-events-none' : ''}`}
          >
            <span className="relative z-10">Dados</span>
            {activeTab === 'dados' && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 opacity-50 animate-pulse"></div>
            )}
          </button>
          <button
            onClick={() => {
              if (activeTab !== 'projeto' && !isTransitioning) {
                setSlideDirection('left');
                setIsTransitioning(true);
                setTimeout(() => {
                  setActiveTab('projeto');
                  setIsTransitioning(false);
                }, 300);
              }
            }}
            disabled={isTransitioning}
            className={`flex-1 px-6 py-4 font-semibold transition-all duration-300 ease-in-out relative overflow-hidden ${
              activeTab === 'projeto'
                ? 'text-white bg-gradient-to-r from-blue-600 to-blue-700 border-b-2 border-blue-600 transform scale-105 shadow-lg'
                : 'text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-surface hover:scale-102 hover:shadow-md'
            } ${isTransitioning ? 'pointer-events-none' : ''}`}
          >
            <span className="relative z-10">Projeto</span>
            {activeTab === 'projeto' && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 opacity-50 animate-pulse"></div>
            )}
          </button>
        </div>

        <div className={`p-6 space-y-6 transition-all duration-500 ease-in-out relative overflow-hidden ${
          isTransitioning
            ? `opacity-0 transform ${slideDirection === 'left' ? 'translate-x-4' : '-translate-x-4'}`
            : 'opacity-100 transform translate-x-0'
        }`}>
          {activeTab === 'dados' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-dark-text-secondary">Nome do Cliente</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={order.clientName || ''}
                      onChange={(e) => updateField('clientName', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-dark-text-secondary">Nome da Empresa</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={order.nome_empresa || ''}
                      onChange={(e) => updateField('nome_empresa', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-dark-text-secondary">Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="tel"
                      value={order.phone || ''}
                      readOnly
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl bg-gray-50 dark:bg-dark-surface"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-dark-text-secondary">Segmento</label>
                  <div className="relative">
                    <BriefcaseBusiness className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={order.segmento || ''}
                      onChange={(e) => updateField('segmento', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-dark-text-secondary">Tipo de Agente</label>
                  <div className="relative">
                    <Bot className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={order.tipo_agente || ''}
                      onChange={(e) => updateField('tipo_agente', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-dark-text-secondary">Valor Implementação</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="number"
                      value={order.valor_implementacao || 0}
                      onChange={(e) => updateField('valor_implementacao', parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-dark-text-secondary">Valor Mensalidade</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="number"
                      value={order.valor_mensalidade || 0}
                      onChange={(e) => updateField('valor_mensalidade', parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-dark-text-secondary">Data Mensalidade</label>
                  <div className="relative">
                    <CalendarCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="date"
                      value={order.data_mensalidade || ''}
                      onChange={(e) => updateField('data_mensalidade', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-dark-text-secondary">Valor Total</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="number"
                      value={(order.valor_implementacao || 0) + ((order.valor_mensalidade || 0) * 12)}
                      readOnly
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl bg-gray-50 dark:bg-dark-surface"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-dark-text-secondary">Status</label>
                  <select
                    value={order.status || ''}
                    onChange={(e) => updateField('status', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {columns.map((col: any) => (
                      <option key={col.status} value={col.status}>{col.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-dark-text-secondary">Observações</label>
                <textarea
                  value={order.description ?? ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Anote detalhes importantes: prazos, histórico, condições, responsáveis, etc."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between mb-4">
                  <h3 className="text-lg font-bold dark:text-dark-text-secondary">Links do Pedido</h3>
                  <button onClick={() => {
                    const newLink = { id: `link-${Date.now()}`, type: 'pedido', linkName: '', linkUrl: '' };
                    updateField('items', [...(order.items || []), newLink]);
                  }} className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all">
                    <Plus className="w-4 h-4" /><span>Adicionar Link</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {linksPedido.map((item: any) => {
                    const linkName = item.linkName ?? item.name ?? '';
                    const linkUrl = item.linkUrl ?? item.url ?? item.quantity ?? '';
                    const valid = isValidUrl(linkUrl);

                    return (
                      <div key={item.id} className="bg-gray-50 dark:bg-dark-surface p-4 rounded-xl flex flex-col md:flex-row md:items-center gap-3">
                        <input
                          type="text"
                          placeholder="Nome do link (ex.: Relatório)"
                          value={linkName}
                          onChange={(e) => updateItem(item.id.toString(), 'linkName', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="URL (ex.: linkdorelatorio.com.br)"
                          value={linkUrl}
                          onChange={(e) => updateItem(item.id.toString(), 'linkUrl', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => window.open(ensureHttp(linkUrl), '_blank', 'noopener,noreferrer')}
                            disabled={!valid}
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                              valid
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            }`}
                            title={valid ? 'Abrir link em nova guia' : 'Informe uma URL válida para abrir'}
                          >
                            <ExternalLink className="w-4 h-4" />
                            Abrir
                          </button>

                          <button onClick={() => removeItem(item.id.toString())} className="p-2 text-red-600 hover:text-red-700 transition-colors" title="Remover">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-dark-text-secondary">Termômetro</label>
                  <select
                    value={order.termometro || 'frio'}
                    onChange={(e) => updateField('termometro', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="frio">Frio</option>
                    <option value="morno">Morno</option>
                    <option value="quente">Quente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-dark-text-secondary">Origem</label>
                  <select
                    value={order.origem || 'Whatsapp'}
                    onChange={(e) => updateField('origem', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Whatsapp">Whatsapp</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="indicação">indicação</option>
                    <option value="instagram p.a">instagram p.a</option>
                    <option value="instagram o.r.c">instagram o.r.c</option>
                    <option value="meta ads">meta ads</option>
                    <option value="Douglas">Douglas</option>
                    <option value="Youtube Ads">Youtube Ads</option>
                    <option value="Youtube (Org)">Youtube (Org)</option>
                    <option value="Linkedin">Linkedin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-dark-text-secondary">Histórico</label>
                <textarea
                  value={order.historico ?? ''}
                  onChange={(e) => updateField('historico', e.target.value)}
                  placeholder="Histórico do cliente..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <h3 className="text-lg font-bold mb-4 dark:text-dark-text-secondary">Tags dos Clientes</h3>
                <div className="mb-3">
                  <div className="flex flex-wrap gap-2">
                    {safeTags.length > 0 ? (
                      safeTags.map((tag: Tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: tag.color, color: getContrastColor(tag.color) }}
                          onClick={() => {
                            const newTags = safeTags.filter((t: Tag) => t.id !== tag.id);
                            updateField('tags', newTags);
                          }}
                        >
                          <span>{tag.name}</span>
                          <X className="w-3 h-3" />
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 dark:text-dark-text-secondary text-sm">Nenhuma tag selecionada</span>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-text-secondary w-4 h-4" />
                    <input
                      type="text"
                      value={tagSearchTerm}
                      onChange={(e) => setTagSearchTerm(e.target.value)}
                      onFocus={() => setShowTagDropdown(true)}
                      onBlur={() => setTimeout(() => setShowTagDropdown(false), 200)}
                      placeholder="Buscar tags..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                    />
                  </div>
                  {showTagDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {filteredTags.length > 0 ? (
                        filteredTags.map((tag: Tag) => {
                          const isSelected = safeTags.some((t: Tag) => t.id === tag.id);
                          return (
                            <div
                              key={tag.id}
                              onClick={() => {
                                const newTags = isSelected
                                  ? safeTags.filter((t: Tag) => t.id !== tag.id)
                                  : [...safeTags, tag];
                                updateField('tags', newTags);
                                setShowTagDropdown(false);
                              }}
                              className={`flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-dark-card cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                            >
                              <div
                                className="w-4 h-4 rounded-full border border-gray-300 dark:border-dark-border"
                                style={{ backgroundColor: tag.color }}
                              />
                              <span className="flex-1 text-gray-900 dark:text-dark-text">{tag.name}</span>
                              {isSelected && <CheckCircle className="w-4 h-4 text-green-500" />}
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-3 text-gray-500 dark:text-dark-text-secondary text-center">Nenhuma tag encontrada</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-dark-text-secondary">Entregáveis</label>
                <textarea
                  value={order.entregaveis || ''}
                  onChange={(e) => updateField('entregaveis', e.target.value)}
                  placeholder="Descreva os entregáveis do projeto..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-dark-text-secondary">Resumo Reunião/Objetivos</label>
                <textarea
                  value={order.resumo_reuniao || ''}
                  onChange={(e) => updateField('resumo_reuniao', e.target.value)}
                  placeholder="Resumo da reunião e objetivos do projeto..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Documentos Section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                      <File className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">Documentos</h3>
                  </div>
                  <button onClick={() => {
                    const newDoc = { id: `doc-${Date.now()}`, type: 'documento', docName: '', docUrl: '' };
                    updateField('items', [...(order.items || []), newDoc]);
                  }} className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg transform hover:scale-105">
                    <Plus className="w-4 h-4" /><span>Adicionar Documento</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {documentos.map((item: any) => {
                    const docName = item.docName ?? item.name ?? '';
                    const docUrl = item.docUrl ?? item.url ?? item.quantity ?? '';
                    const valid = isValidUrl(docUrl);

                    return (
                      <div key={item.id} className="bg-white dark:bg-dark-card p-4 rounded-xl border border-gray-200 dark:border-dark-border shadow-sm hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center gap-3">
                        <select
                          value={docName}
                          onChange={(e) => updateItem(item.id.toString(), 'docName', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        >
                          <option value="">Selecione um documento</option>
                          <option value="Proposta Comercial">Proposta Comercial</option>
                          <option value="Reunião Descoberta">Reunião Descoberta</option>
                          <option value="Construir">Construir</option>
                          <option value="Entrevista Técnica">Entrevista Técnica</option>
                          <option value="Checklist Agendado">Checklist Agendado</option>
                        </select>
                        <input
                          type="text"
                          placeholder="URL (ex.: linkdodocumento.com.br)"
                          value={docUrl}
                          onChange={(e) => updateItem(item.id.toString(), 'docUrl', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => window.open(ensureHttp(docUrl), '_blank', 'noopener,noreferrer')}
                            disabled={!valid}
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                              valid
                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            }`}
                            title={valid ? 'Abrir documento em nova guia' : 'Informe uma URL válida para abrir'}
                          >
                            <ExternalLink className="w-4 h-4" />
                            Abrir
                          </button>

                          <button onClick={() => removeItem(item.id.toString())} className="p-2 text-red-600 hover:text-red-700 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Remover">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Separator */}
              <div className="flex items-center justify-center py-6">
                <div className="flex items-center space-x-4">
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent w-20"></div>
                  <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent w-20"></div>
                </div>
              </div>

              {/* Links Adicionais Section */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-xl">
                      <Link className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold text-green-900 dark:text-green-100">Links Adicionais</h3>
                  </div>
                  <button onClick={() => {
                    const newLink = { id: `link-${Date.now()}`, linkName: '', linkUrl: '' };
                    updateField('link_adicionais', [...(order.link_adicionais || []), newLink]);
                  }} className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg transform hover:scale-105">
                    <Plus className="w-4 h-4" /><span>Adicionar Link</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {linksAdicionais.map((item: any, index: number) => {
                    const linkName = item.linkName ?? item.name ?? '';
                    const linkUrl = item.linkUrl ?? item.url ?? item.quantity ?? '';
                    const valid = isValidUrl(linkUrl);

                    return (
                      <div key={item.id || index} className="bg-white dark:bg-dark-card p-4 rounded-xl border border-gray-200 dark:border-dark-border shadow-sm hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center gap-3">
                        <input
                          type="text"
                          placeholder="Nome do link (ex.: Repositório)"
                          value={linkName}
                          onChange={(e) => {
                            const newLinks = [...linksAdicionais];
                            newLinks[index] = { ...newLinks[index], linkName: e.target.value };
                            updateField('link_adicionais', newLinks);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        />
                        <input
                          type="text"
                          placeholder="URL (ex.: linkdorepositorio.com.br)"
                          value={linkUrl}
                          onChange={(e) => {
                            const newLinks = [...linksAdicionais];
                            newLinks[index] = { ...newLinks[index], linkUrl: e.target.value };
                            updateField('link_adicionais', newLinks);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => window.open(ensureHttp(linkUrl), '_blank', 'noopener,noreferrer')}
                            disabled={!valid}
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                              valid
                                ? 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
                                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            }`}
                            title={valid ? 'Abrir link em nova guia' : 'Informe uma URL válida para abrir'}
                          >
                            <ExternalLink className="w-4 h-4" />
                            Abrir
                          </button>

                          <button onClick={() => {
                            const newLinks = linksAdicionais.filter((_: any, i: number) => i !== index);
                            updateField('link_adicionais', newLinks);
                          }} className="p-2 text-red-600 hover:text-red-700 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Remover">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Separator */}
              <div className="flex items-center justify-center py-6">
                <div className="flex items-center space-x-4">
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent w-20"></div>
                  <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent w-20"></div>
                </div>
              </div>

              {/* Acessos Section */}
              {(userRole === 'admin' || userRole === 'equipe_interna') && (
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                        <Key className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-xl font-bold text-purple-900 dark:text-purple-100">Acessos</h3>
                    </div>
                    <button onClick={() => {
                      const newAcesso = { id: `acesso-${Date.now()}`, url: '', username: '', password: '' };
                      updateField('acessos', [...(order.acessos || []), newAcesso]);
                    }} className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg transform hover:scale-105">
                      <Plus className="w-4 h-4" /><span>Adicionar Acesso</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(order.acessos || []).map((acesso: any, index: number) => (
                      <div key={acesso.id || index} className="bg-white dark:bg-dark-card p-4 rounded-xl border border-gray-200 dark:border-dark-border shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                              type="text"
                              placeholder="URL (ex.: painel.admin.com)"
                              value={acesso.url || ''}
                              onChange={(e) => {
                                const newAcessos = [...(order.acessos || [])];
                                newAcessos[index] = { ...newAcessos[index], url: e.target.value };
                                updateField('acessos', newAcessos);
                              }}
                              className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            />
                            <input
                              type="text"
                              placeholder="Username/Login"
                              value={acesso.username || ''}
                              onChange={(e) => {
                                const newAcessos = [...(order.acessos || [])];
                                newAcessos[index] = { ...newAcessos[index], username: e.target.value };
                                updateField('acessos', newAcessos);
                              }}
                              className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            />
                            <div className="relative">
                              <input
                                type={showPasswords[`acesso-${acesso.id || index}`] ? 'text' : 'password'}
                                placeholder="Senha"
                                value={acesso.password || ''}
                                onChange={(e) => {
                                  const newAcessos = [...(order.acessos || [])];
                                  newAcessos[index] = { ...newAcessos[index], password: e.target.value };
                                  updateField('acessos', newAcessos);
                                }}
                                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const key = `acesso-${acesso.id || index}`;
                                  setShowPasswords(prev => ({
                                    ...prev,
                                    [key]: !prev[key]
                                  }));
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-purple-600 transition-colors"
                                title={showPasswords[`acesso-${acesso.id || index}`] ? 'Ocultar senha' : 'Mostrar senha'}
                              >
                                {showPasswords[`acesso-${acesso.id || index}`] ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          <button onClick={() => {
                            const newAcessos = (order.acessos || []).filter((_: any, i: number) => i !== index);
                            updateField('acessos', newAcessos);
                          }} className="flex-shrink-0 p-2 text-red-600 hover:text-red-700 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg mt-1" title="Remover">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 dark:bg-dark-card/95 backdrop-blur-glass p-6 rounded-b-3xl border-t border-gray-200 dark:border-dark-border">
          <div className="flex justify-end space-x-4">
            <button onClick={onClose} className="px-6 py-3 border border-gray-300 dark:border-dark-border rounded-xl hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors dark:text-dark-text-secondary">
              Cancelar
            </button>
            <button onClick={handleSave} className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg">
              <Save className="w-5 h-5" /><span>Salvar Alterações</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderModal;
