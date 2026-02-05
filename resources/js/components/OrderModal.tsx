import React from 'react';
import { X, Package, Phone, DollarSign, User, Calendar, CreditCard, Plus, Trash2, Save } from 'lucide-react';
import axios from "axios";
import { router } from '@inertiajs/react';

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

  const handleSave = async () => {
  try {
    await axios.post("/order-management-store", order); 
   
    router.reload({ only: ["salesOrders", "postSalesOrders"] });
    onClose(); // fecha o modal
  } catch (error) {
    console.error(error);
    alert("Erro ao salvar o pedido");
  }
};
  return (
    <div className="fixed top-[-50px] left-0 w-full h-[calc(100%+50px)] flex bg-black/50 backdrop-blur-sm z-50 items-center justify-center">
      <div className="bg-white/95 dark:bg-dark-card/95 backdrop-blur-glass rounded-3xl shadow-2xl border border-white/20 dark:border-dark-border max-w-4xl w-full max-h-[100vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-primary text-white p-6 rounded-t-3xl flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Editar Pedido</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 ">
          {/* Basic Information */}
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

          {/* Items */}
          <div>
            <div className="flex justify-between mb-4 dark:text-dark-text-secondary">
              <h3 className="text-lg font-bold ">Itens do Pedido</h3>
              <button onClick={addItem} className="flex items-center space-x-2 px-4 py-2 bg-gradient-primary text-white rounded-xl">
                <Plus className="w-4 h-4" /><span>Adicionar Item</span>
              </button>
            </div>
            <div className="space-y-3">
              {order.items.map((item: any) => (
                <div key={item.id} className="bg-gray-50 p-4 rounded-xl flex space-x-4">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                    className="w-32 px-3 py-2 border rounded-lg"
                  />
                  <button onClick={() => removeItem(item.id)} className="p-2 text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Created At & Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="dark:text-dark-text-secondary" >Data de Recompra</label>
              <input
                type="datetime-local"
                value={order.dataRecompra.slice(0, 16)}
                onChange={(e) => updateField('dataRecompra', e.target.value + ':00Z')}
                className="w-full px-4 py-3 border rounded-xl"
              />
            </div>
            <div>
              <label className="dark:text-dark-text-secondary">Método de Pagamento</label>
              <select
                value={order.paymentMethod || 'PIX'}
                onChange={(e) => updateField('paymentMethod', e.target.value)}
                className="w-full px-4 py-3 border rounded-xl"
              >
                <option value="PIX">PIX</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="Boleto">Boleto</option>
                <option value="Transferência">Transferência</option>
                <option value="Dinheiro">Dinheiro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-3xl border-t dark:bg-dark-card/95 backdrop-blur-glass">
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
