import React, { useState, useEffect } from 'react';
import {
  X, Package, Phone, DollarSign, User, Plus, Trash2, Save, Search, CheckCircle, BriefcaseBusiness,
  Bot, ExternalLink
} from 'lucide-react';
import axios from "axios";
import { router } from '@inertiajs/react';
import { MultiSelect } from 'primereact/multiselect';
import { PrimeReactProvider } from 'primereact/api';

interface Tag {
  id: number;
  name: string;
  color: string;
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
}: any) => {
  if (!isOpen || !order) return null;

  // ✅ Normaliza as tags se vierem como string JSON após reload
  if (typeof order.tags === 'string') {
    try {
      order.tags = JSON.parse(order.tags);
    } catch {
      order.tags = [];
    }
  }

  const handleSave = async () => {
    try {
      await axios.post("/client-management-store", order);
      router.reload({ only: ["salesOrders", "postSalesOrders"] });
      onClose();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar o pedido");
    }
  };

  const [tags, setTags] = useState<Tag[]>([]);
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase())
  );

  useEffect(() => {
    const fetchTags = async () => {
      const response = await axios.get<{ tags: Tag[] }>('/tags');
      setTags(response.data.tags);
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

  // ========= Helpers para links =========
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
  // =====================================

  return (
    <div className="fixed top-[-50px] left-0 w-full h-[calc(100%+50px)] flex bg-black/50 backdrop-blur-sm z-50 items-center justify-center">
      <div className="bg-white/95 dark:bg-dark-card/95 backdrop-blur-glass rounded-3xl shadow-2xl border border-white/20 dark:border-dark-border max-w-4xl w-full max-h-[100vh] overflow-y-auto">
        <div className="relative bg-gradient-primary text-white p-6 rounded-t-3xl flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Editar Pedido</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 ">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="dark:text-dark-text-secondary">Nome do Cliente</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={order.clientName}
                  onChange={(e) => updateField('clientName', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="dark:text-dark-text-secondary">Telefone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="tel"
                  value={order.phone}
                  readOnly
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="dark:text-dark-text-secondary">Segmento</label>
              <div className="relative">
                <BriefcaseBusiness className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={order.segmento}
                  onChange={(e) => updateField('segmento', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="dark:text-dark-text-secondary">Tipo de Agente</label>
              <div className="relative">
                <Bot className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={order.tipo_agente}
                  onChange={(e) => updateField('tipo_agente', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="dark:text-dark-text-secondary">Valor Total</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  value={order.totalValue}
                  onChange={(e) => updateField('totalValue', parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-4 py-3 border rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="dark:text-dark-text-secondary">Status</label>
              <select
                value={order.status}
                onChange={(e) => updateField('status', e.target.value)}
                className="w-full px-4 py-3 border rounded-xl"
              >
                {columns.map((col: any) => (
                  <option key={col.status} value={col.status}>{col.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ==================== Observações ==================== */}
          <div>
            <label className="dark:text-dark-text-secondary">Observações</label>
            <textarea
              value={order.description ?? ''}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Anote detalhes importantes: prazos, histórico, condições, responsáveis, etc."
              rows={4}
              className="w-full px-4 py-3 border rounded-xl resize-y"
            />
          </div>
          {/* ===================================================== */}

          <div>
            <div className="flex justify-between mb-4 dark:text-dark-text-secondary">
              <h3 className="text-lg font-bold ">Links do Pedido</h3>
              <button onClick={addItem} className="flex items-center space-x-2 px-4 py-2 bg-gradient-primary text-white rounded-xl">
                <Plus className="w-4 h-4" /><span>Adicionar Link</span>
              </button>
            </div>

            <div className="space-y-3">
              {order.items.map((item: any) => {
                const linkName = item.linkName ?? item.name ?? '';
                const linkUrl = item.linkUrl ?? item.url ?? item.quantity ?? ''; // compatibilidade com estrutura anterior
                const valid = isValidUrl(linkUrl);

                return (
                  <div key={item.id} className="bg-gray-50 p-4 rounded-xl flex flex-col md:flex-row md:items-center gap-3">
                    <input
                      type="text"
                      placeholder="Nome do link (ex.: Relatório)"
                      value={linkName}
                      onChange={(e) => updateItem(item.id, 'linkName', e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="URL (ex.: linkdorelatorio.com.br)"
                      value={linkUrl}
                      onChange={(e) => updateItem(item.id, 'linkUrl', e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => window.open(ensureHttp(linkUrl), '_blank', 'noopener,noreferrer')}
                        disabled={!valid}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${
                          valid
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        }`}
                        title={valid ? 'Abrir link em nova guia' : 'Informe uma URL válida para abrir'}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Abrir link
                      </button>

                      <button onClick={() => removeItem(item.id)} className="p-2 text-red-600 hover:text-red-700" title="Remover">
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
              <label className="dark:text-dark-text-secondary">Termometro</label>
              <select
                value={order.termometro || 'frio'}
                onChange={(e) => updateField('termometro', e.target.value)}
                className="w-full px-4 py-3 border rounded-xl"
              >
                <option value="frio">Frio</option>
                <option value="morno">Morno</option>
                <option value="quente">Quente</option>
              </select>
            </div>

            <div>
              <label className="dark:text-dark-text-secondary">Origem</label>
              <select
                value={order.origem || 'Whatsapp'}
                onChange={(e) => updateField('origem', e.target.value)}
                className="w-full px-4 py-3 border rounded-xl"
              >
                <option value="Whatsapp">Whatsapp</option>
                <option value="Instagram">Instagram</option>
                <option value="Google Ads">Google Ads</option>
              </select>
            </div>
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
                  placeholder="Buscar tags..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
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
        </div>

        <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-3xl border dark:bg-dark-card/95 backdrop-blur-glass">
          <div className="flex justify-end space-x-4">
            <button onClick={onClose} className="px-6 py-3 border rounded-xl dark:text-dark-text-secondary">Cancelar</button>
            <button onClick={handleSave} className="flex items-center space-x-2 px-6 py-3 bg-gradient-primary text-white rounded-xl">
              <Save className="w-5 h-5" /><span>Salvar Alterações</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderModal;
