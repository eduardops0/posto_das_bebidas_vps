import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import {
  X, Package, Phone, DollarSign, User, Plus, Trash2, Save, Search, CheckCircle, Building
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
  products: { produto: string; preco: string }[];
  userRole: string;
  consultants: { id: number; name: string }[];
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
  columns,
  products,
  userRole,
  consultants
}: OrderModalProps) => {
  if (!isOpen || !order) return null;

  const { auth } = usePage().props as any;

  const [tags, setTags] = useState<Tag[]>([]);
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState<{[key: string]: boolean}>({});

  if (typeof order.tags === 'string') {
    try {
      order.tags = JSON.parse(order.tags);
    } catch {
      order.tags = [];
    }
  }

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase())
  );

  const filteredProducts = products.filter((product) =>
    product.produto.toLowerCase().includes(productSearchTerm.toLowerCase())
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

  // Calculate total value from items
  const calculateTotalValue = () => {
    return (order.items || []).reduce((total: number, item: any) => {
      const preco = parseFloat(item.preco || '0');
      const quantidade = parseInt(item.quantidade || '1');
      return total + (preco * quantidade);
    }, 0);
  };

  const handleSave = () => {
    // Update totalValue before saving
    updateField('totalValue', calculateTotalValue());
    onSave();
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

        <div className="p-6 space-y-6">
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl bg-gray-50 dark:bg-dark-surface dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-dark-text-secondary">Valor Total</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={calculateTotalValue().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl bg-gray-50 dark:bg-dark-surface text-center font-bold text-green-600 dark:text-green-400"
                />
              </div>
            </div>
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
            {userRole === 'admin' && (
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-dark-text-secondary">Consultor Responsável</label>
                <select
                  value={order.consultor_id || ''}
                  onChange={(e) => {
                    const selectedId = parseInt(e.target.value);
                    const selectedConsultant = consultants.find(c => c.id === selectedId);
                    updateField('consultor_id', selectedId || null);
                    updateField('consultor_nome', selectedConsultant ? selectedConsultant.name : '');
                  }}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um consultor</option>
                  {consultants.map((consultant) => (
                    <option key={consultant.id} value={consultant.id}>{consultant.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 dark:text-dark-text-secondary">Observações</label>
            <textarea
              value={order.observacoes || ''}
              onChange={(e) => updateField('observacoes', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite suas observações aqui..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-dark-text-secondary">Data de Retorno</label>
              <div className="relative">
                <input
                  type="date"
                  value={order.data_follow_up || ''}
                  onChange={(e) => updateField('data_follow_up', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-dark-text-secondary">Assunto Follow Up</label>
              <div className="relative">
                <input
                  type="text"
                  value={order.assunto_follow_up || ''}
                  onChange={(e) => updateField('assunto_follow_up', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite o assunto do follow up..."
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-bold dark:text-dark-text-secondary">Pedido</h3>
              <button onClick={() => {
                const newItem = { id: `item-${Date.now()}`, name: '', quantity: '1' };
                updateField('items', [...(order.items || []), newItem]);
              }} className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all">
                <Plus className="w-4 h-4" /><span>Adicionar Item</span>
              </button>
            </div>

            <div className="space-y-4">
              {order.items?.map((item: any) => (
                <div key={item.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      <h4 className="text-lg font-bold text-blue-900 dark:text-blue-100">Item do Pedido</h4>
                    </div>
                    <button onClick={() => removeItem(item.id.toString())} className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Remover Item">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="relative md:col-span-2 lg:col-span-3">
                      <label className="block text-sm font-medium mb-2 text-blue-900 dark:text-blue-100">Produto</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 w-4 h-4" />
                        <input
                          type="text"
                          value={item.produto || ''}
                          onChange={(e) => {
                            updateItem(item.id.toString(), 'produto', e.target.value);
                            setProductSearchTerm(e.target.value);
                          }}
                          onFocus={() => setShowProductDropdown({ ...showProductDropdown, [item.id]: true })}
                          onBlur={() => setTimeout(() => setShowProductDropdown({ ...showProductDropdown, [item.id]: false }), 200)}
                          placeholder="Buscar produto..."
                          className="w-full pl-10 pr-4 py-2 border border-blue-300 dark:border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-surface dark:text-white"
                        />
                      </div>
                      {showProductDropdown[item.id] && (
                        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-dark-surface border border-blue-300 dark:border-blue-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                          {filteredProducts.length > 0 ? (
                            filteredProducts.map((product, index) => (
                              <div
                                key={index}
                                onClick={() => {
                                  updateItem(item.id.toString(), 'produto', product.produto);
                                  updateItem(item.id.toString(), 'preco', product.preco);
                                  updateItem(item.id.toString(), 'quantidade', '1');
                                  setShowProductDropdown({ ...showProductDropdown, [item.id]: false });
                                }}
                                className="flex items-center justify-between p-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                              >
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-gray-100">{product.produto}</div>
                                </div>
                                <div className="text-sm font-medium text-green-600 dark:text-green-400">R$ {parseFloat(product.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                              </div>
                            ))
                          ) : (
                            <div className="p-3 text-gray-500 dark:text-gray-400 text-center">Nenhum produto encontrado</div>
                          )}
                        </div>
                      )}
                    </div>


                    <div>
                      <label className="block text-sm font-medium mb-2 text-blue-900 dark:text-gray-300">Quantidade</label>
                      <input
                        type="number"
                        value={item.quantidade || '1'}
                        onChange={(e) => updateItem(item.id.toString(), 'quantidade', e.target.value)}
                        className="w-full px-3 py-2 border border-blue-300 dark:border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-surface dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-blue-900 dark:text-blue-100">Preço Unitário</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.preco || ''}
                        readOnly
                        className="w-full px-3 py-2 border border-blue-300 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-gray-700 dark:text-gray-300"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-blue-900 dark:text-blue-100">Total</label>
                      <input
                        type="number"
                        step="0.01"
                        value={(parseFloat(item.preco || '0') * parseInt(item.quantidade || '1')).toFixed(2)}
                        readOnly
                        className="w-full px-3 py-2 border border-green-300 dark:border-green-700 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-bold"
                      />
                    </div>
                  </div>
                </div>
              )) || []}
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
