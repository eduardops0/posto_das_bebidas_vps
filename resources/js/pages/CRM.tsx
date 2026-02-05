import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Package,
  Phone,
  DollarSign,
  FileText,
  Edit3,
  Check,
  X,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  Bot,
  UserCheck,
  Users,
  Star,
  ThumbsUp,
  MapPin,
  Bell,
  Search,
  Thermometer,
  CalendarCheck,
  PhoneCall,
  BriefcaseBusiness,
  Brain,
  UserCog,
  MonitorCog,
  Settings,
  Tag
} from 'lucide-react';

import { useEffect } from "react";

import Layout from '@/components/Layout';
import OrderModal from '@/components/EquipeEditClientModal';

import { usePage } from '@inertiajs/react';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import axios from "axios";
import { router } from '@inertiajs/react';

interface Tag {
  id: number;
  name: string;
  color: string;
}

interface OrderItem {
  id: string;
  produto: string;
  quantidade: string;
  preco: string;
}

interface PageProps {
  salesOrders: Order[];
}

interface CustomPageProps extends InertiaPageProps {
  salesOrders: Order[];
  products: { produto: string; preco: string }[];
  userRole: string;
  consultants: { id: number; name: string }[];
}

interface Responsavel {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
  role?: string;
}

interface Order {
      id: string;
      clientName: string;
      nome_empresa?: string;
      phone: string;
      totalValue: number;
      items: OrderItem[];
      termometro: string;
      status: string;
      createdAt: string;
      tags: Tag[];
      origem: string;
      observacoes?: string;
      data_follow_up?: string;
      assunto_follow_up?: string;
      responsaveis?: Responsavel[];
      consultor_id?: number | null;
      consultor_nome?: string;
   }

interface Column {
  id: string;
  title: string;
  status: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}

const OrderManagement: React.FC = () => {
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [editingField, setEditingField] = useState<{ orderId: string; field: string; itemId?: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalOrder, setModalOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const page = usePage<CustomPageProps>();
  const {
    salesOrders: initialSalesOrders,
    products,
    userRole,
    consultants,
  } = page.props;

  const [salesOrders, setSalesOrders] = useState<Order[]>(
    initialSalesOrders.map(o => ({ ...o, items: o.items || [] }))
  );

  // Sincroniza quando o Inertia atualizar as props
  useEffect(() => {
    setSalesOrders(initialSalesOrders.map(o => ({ ...o, items: o.items || [] })));
  }, [initialSalesOrders]);

  const openOrderModal = (order: Order): void => {
    setModalOrder({
      ...order,
      items: order.items || [],
      tags: order.tags || [],
      consultor_id: order.consultor_id || null,
      consultor_nome: order.consultor_nome || ''
    });
    setIsModalOpen(true);
  };

  const closeOrderModal = (): void => {
    setIsModalOpen(false);
    setModalOrder(null);
  };

  const updateModalOrder = (field: string, value: any): void => {
    setModalOrder((prev: any) => ({ ...prev, [field]: value }));
  };

  const addNewItem = (): void => {
    setModalOrder((prev: any) => ({
      ...prev,
      items: [...(prev.items || []), { id: Date.now().toString(), produto: '', quantidade: '1', preco: '0', type: 'pedido' }]
    }));
  };

  const removeItem = (itemId: string): void => {
    setModalOrder((prev: any) => ({
      ...prev,
      items: prev.items.filter((item: any) => item.id !== itemId)
    }));
  };

  const updateItem = (itemId: string, field: string, value: string): void => {
    setModalOrder((prev: any) => ({
      ...prev,
      items: prev.items.map((item: any) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    }));
  };


  const saveOrderChanges = (): void => {
    if (!modalOrder) return;

    axios.post("/client-management-store", modalOrder)
      .then(() => {
        console.log('Salvar pedido', modalOrder);
        router.reload({ only: ["salesOrders"] });
        closeOrderModal();
      })
      .catch((error) => {
        console.error("Erro ao salvar pedido:", error);
      });
  };

  // Colunas do Funil de Vendas
  const salesColumns: Column[] = [
    {
      id: 'caixa-entrada',
      title: 'Caixa de Entrada',
      status: 'caixa-entrada',
      description: 'lead',
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700'
    },
    {
      id: 'qualificacao-ia',
      title: 'Em Qualificação (IA)',
      status: 'qualificacao-ia',
      description: 'lead',
      icon: Bot,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700'
    },
    {
      id: 'aguardando',
      title: 'Aguardando',
      status: 'aguardando',
      description: 'lead',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700'
    },
    {
      id: 'consultor',
      title: 'Consultor',
      status: 'consultor',
      description: 'lead',
      icon: UserCheck,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700'
    },
    {
      id: 'atendimento',
      title: 'Em Atendimento',
      description: 'lead',
      status: 'atendimento',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700'
    },
    {
      id: 'follow-up',
      title: 'Follow Up',
      status: 'follow-up',
      description: 'cliente',
      icon: UserCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700'
    },
    {
      id: 'venda-ganha',
      title: 'Venda Ganha',
      status: 'venda-ganha',
      description: 'pedido',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700'
    },
    {
      id: 'standby',
      title: 'Clientes',
      status: 'standby',
      description: 'lead',
      icon: Clock,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700'
    },
    {
      id: 'venda-perdida',
      title: 'Venda Perdida',
      status: 'venda-perdida',
      description: 'lead',
      icon: X,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700'
    }
  ];


  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getCurrentOrders = () => salesOrders;
  const setCurrentOrders = setSalesOrders;
  const getCurrentColumns = () => salesColumns;

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const orders = getCurrentOrders();
    const order = orders.find(o => o.id === active.id);
    setActiveOrder(order || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const columns = getCurrentColumns();
    if (columns.find(col => col.id === overId)) {
      return;
    }

    const orders = getCurrentOrders();
    const activeOrder = orders.find(order => order.id === activeId);
    const overOrder = orders.find(order => order.id === overId);

    if (!activeOrder || !overOrder) return;

    if (activeOrder.status !== overOrder.status) {
      setCurrentOrders(prevOrders => {
        return prevOrders.map(order => {
          if (order.id === activeId) {
            return { ...order, status: overOrder.status };
          }
          return order;
        });
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveOrder(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const columns = getCurrentColumns();
    const targetColumn = columns.find(col => col.id === overId);

    setCurrentOrders((prevOrders: Order[]) => {
      return prevOrders.map((order) => {
        if (order.id === activeId) {
          const newStatus = targetColumn ? targetColumn.status : order.status;
          const updatedOrder = { ...order, status: newStatus };

          // Envia já para o back-end com status ajustado
          axios.post("/client-management-update", {
            phone: order.phone,
            status: newStatus,
            name: order.clientName,
            order: order,
          })
          .then(() => router.reload({ only: ["salesOrders", "postSalesOrders"] }))
          .catch((error) => console.error("Erro ao atualizar status no backend:", error));

          return updatedOrder;
        }
        return order;
      });
    });

    setActiveOrder(null);
  };

  const startEditing = (orderId: string, field: string, currentValue: string, itemId?: string) => {
    setEditingField({ orderId, field, itemId });
    setEditValue(currentValue);
  };

  const saveEdit = () => {
    if (!editingField) return;

    setCurrentOrders(prevOrders => 
      prevOrders.map(order => {
        if (order.id === editingField.orderId) {
          if (editingField.field === 'phone') {
            return { ...order, phone: editValue };
          } else if (editingField.field === 'totalValue') {
            return { ...order, totalValue: parseFloat(editValue) || 0 };
          } else if (editingField.field === 'description') {
            return { ...order, description: editValue };
          } else if (editingField.field === 'item' && editingField.itemId) {
            return {
              ...order,
              items: order.items.map(item => 
                item.id === editingField.itemId 
                  ? { ...item, name: editValue }
                  : item
              )
            };
          }
        }
        return order;
      })
    );

    setEditingField(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const getOrdersByStatus = (status: string) => {
    const orders = getCurrentOrders();
    return orders.filter(order => order.status === status);
  };

  const filterOrders = (orders: Order[]) => {
    if (!searchTerm) return orders;

    const term = searchTerm.toLowerCase();

    return orders.filter((order) => {
      const nameMatch = order.clientName.toLowerCase().includes(term);
      const phoneMatch = order.phone.toLowerCase().includes(term);
      const statusMatch = order.status.toLowerCase().includes(term);
      const valueMatch = order.totalValue.toString().includes(term);
      const dateMatch = new Date(order.createdAt).toLocaleDateString('pt-BR').includes(term);
      const empresaMatch = (order.nome_empresa || '').toLowerCase().includes(term);
      const responsaveisMatch = (order.responsaveis || []).some(r => (r.name || '').toLowerCase().includes(term));

      return nameMatch || phoneMatch || statusMatch || valueMatch || dateMatch || empresaMatch || responsaveisMatch;
    });
  };

  return (
    <div className="space-y-8">
      <div className="animate-slide-up">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          Gestão de Pedidos
        </h1>
        <p className="text-gray-600 dark:text-dark-text-secondary text-lg">
          Acompanhe e gerencie todos os seus pedidos em tempo real
        </p>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar por nome, empresa, telefone, status, valor, data ou responsável"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border rounded-xl"
        />
      </div>


      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-2">
          {getCurrentColumns().map((column) => (
            <div key={column.id} className="min-w-[280px] flex-shrink-0 mr-6">
              <DroppableColumn
                column={column}
                orders={filterOrders(getOrdersByStatus(column.status))}
                editingField={editingField}
                editValue={editValue}
                setEditValue={setEditValue}
                startEditing={startEditing}
                saveEdit={saveEdit}
                cancelEdit={cancelEdit}
                openModal={openOrderModal}
                userRole={userRole}
              />
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeOrder ? (
            <div className="bg-white/95 dark:bg-dark-card/95 backdrop-blur-glass rounded-2xl p-4 shadow-2xl border border-white/20 dark:border-dark-border transform rotate-2 scale-105">
              <div className="flex items-center space-x-3 mb-2">
                <Package className="w-4 h-4 text-primary" />
                <h4 className="font-bold text-gray-800 dark:text-dark-text text-sm">
                  {activeOrder.clientName}
                </h4>
                {activeOrder.nome_empresa && (
                  <h4 className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                    {activeOrder.nome_empresa}
                  </h4>
                )}
              </div>
              <p className="text-xs text-gray-600 dark:text-dark-text-secondary">
                Movendo pedido...
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <OrderModal
        isOpen={isModalOpen}
        order={modalOrder}
        onClose={closeOrderModal}
        onSave={saveOrderChanges}
        updateField={updateModalOrder}
        updateItem={updateItem}
        addItem={addNewItem}
        removeItem={removeItem}
        columns={salesColumns}
        products={products}
        userRole={userRole}
        consultants={consultants}
      />
    </div>
  );
};

interface DroppableColumnProps {
  column: Column;
  orders: Order[];
  editingField: { orderId: string; field: string; itemId?: string } | null;
  editValue: string;
  setEditValue: (value: string) => void;
  startEditing: (orderId: string, field: string, currentValue: string, itemId?: string) => void;
  saveEdit: () => void;
  cancelEdit: () => void;
  openModal: (order: Order) => void;
  userRole: string;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({
  column,
  orders,
  editingField,
  editValue,
  setEditValue,
  startEditing,
  saveEdit,
  cancelEdit,
  openModal,
  userRole
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const Icon = column.icon;

  const { props } = usePage();
  const { totalConversions } = props as any;
  
  return (
    <div className="space-y-3 w-full">
      {/* Column Header */}
      <div className={`${column.bgColor} border-2 rounded-2xl p-3 shadow-glass dark:shadow-glass-dark`}>
        <div className="flex items-center space-x-2 mb-2">
          <Icon className={`w-4 h-4 ${column.color}`} />
          <h3 className={`font-bold text-sm ${column.color}`}>
            {column.title}
          </h3>
        </div>
        {column.id === 'venda-ganha' ? (
          <p className="text-xs font-bold text-green-600 dark:text-green-400">
            {totalConversions} {column.description}{totalConversions !== 1 ? 's' : ''}
          </p>
        ) : (
          <p className="text-xs text-gray-600 dark:text-dark-text-secondary">
            {orders.length} {column.description}{orders.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Droppable Area */}
      <div 
        ref={setNodeRef}
        className={`min-h-[400px] max-h-[500px] overflow-y-auto space-y-3 p-3 rounded-2xl border-2 border-dashed transition-all duration-300 scrollbar-thin ${
          isOver 
            ? 'border-primary bg-primary/10 dark:bg-primary/20' 
            : 'border-gray-300 dark:border-dark-border bg-gray-50/30 dark:bg-dark-surface/30'
        }`}
      >
        <SortableContext items={orders.map(o => o.id)} strategy={verticalListSortingStrategy}>
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              editingField={editingField}
              editValue={editValue}
              setEditValue={setEditValue}
              startEditing={startEditing}
              saveEdit={saveEdit}
              cancelEdit={cancelEdit}
              openModal={openModal}
              userRole={userRole}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

interface OrderCardProps {
  order: Order;
  editingField: { orderId: string; field: string; itemId?: string } | null;
  editValue: string;
  setEditValue: (value: string) => void;
  startEditing: (orderId: string, field: string, currentValue: string, itemId?: string) => void;
  saveEdit: () => void;
  cancelEdit: () => void;
  openModal: (order: Order) => void;
  userRole: string;
}

// Resolve caminho salvo no banco para URL acessível
const resolvePublicUrl = (path?: string | null) => {
  if (!path) return undefined;
  const p = String(path).trim();
  if (!p) return undefined;
  if (/^https?:\/\//i.test(p)) return p;      // absoluto
  if (p.startsWith('/')) return encodeURI(p); // já relativo à raiz pública
  return encodeURI('/' + p);                  // relativo sem barra
};

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  editingField,
  editValue,
  setEditValue,
  startEditing,
  saveEdit,
  cancelEdit,
  openModal,
  userRole
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isEditing = (field: string, itemId?: string) => {
    return editingField?.orderId === order.id && 
           editingField?.field === field && 
           editingField?.itemId === itemId;
  };

  const getContrastColor = (hexColor: string) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  };

  const getTermometerColor = (termometro: string) => {
    switch (termometro) {
      case 'quente':
        return 'text-red-500';
      case 'morno':
        return 'text-yellow-400';
      default:
        return 'text-black dark:text-white';
    }
  };

  // Avatar com fallback para iniciais
  const Avatar: React.FC<{ name: string; src?: string | null; size?: number; title?: string }> = ({ name, src, size = 32, title }) => {
    const [error, setError] = useState(false);
    const url = resolvePublicUrl(src);
    const initials = (name || '')
      .split(' ')
      .map(p => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    if (url && !error) {
      return (
        <img
          src={url}
          alt={name}
          title={title || name}
          onError={() => setError(true)}
          className="rounded-full object-cover border border-white/60 dark:border-dark-border shadow-sm"
          style={{ width: size, height: size }}
        />
      );
    }

    return (
      <div
        title={title || name}
        className="rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center font-semibold border border-white/60 dark:border-dark-border shadow-sm"
        style={{ width: size, height: size }}
      >
        {initials || <UserCheck className="w-4 h-4" />}
      </div>
    );
  };

  // Renderiza até 2 responsáveis e +N
  const renderResponsaveis = (resp: Responsavel[] | undefined) => {
    const list = Array.isArray(resp) ? resp : [];
    if (list.length === 0) return null;

    const visibles = list.slice(0, 2);
    const extra = list.length - visibles.length;

    return (
      <div className="flex items-center gap-2">
        {visibles.map(r => (
          <Avatar key={r.id} name={r.name} src={r.avatarUrl ?? undefined} title={r.name} size={30} />
        ))}
        {extra > 0 && (
          <span
            title={list.slice(2).map(r => r.name).join(', ')}
            className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-dark-surface text-gray-700 dark:text-gray-200 border border-white/60 dark:border-dark-border"
          >
            +{extra}
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!editingField) {
          openModal(order);
        }
      }}
      className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl p-4 shadow-glass dark:shadow-glass-dark hover:shadow-glow-primary dark:hover:shadow-glow-dark transition-all duration-300 border border-white/20 dark:border-dark-border cursor-grab active:cursor-grabbing animate-fade-in"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
          <Package className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-800 dark:text-dark-text text-sm">
            {order.clientName}
          </h4>
          {order.nome_empresa && (
            <h4 className="font-bold text-blue-600 dark:text-blue-400 text-sm">
              {order.nome_empresa}
            </h4>
          )}
          <p className="text-xs text-gray-500 dark:text-dark-text-secondary">
            {new Date(order.createdAt).toLocaleDateString('pt-BR')}
          </p>
        </div>

        {/* Avatares dos responsáveis + WhatsApp + Settings */}
        <div className="flex flex-col space-y-2">
          <a
            href={`https://wa.me/${order.phone}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir WhatsApp"
          >
            <img className="w-8 h-8" src="/icons/icon-whatsapp.png" alt="WhatsApp" />
          </a>
        </div>
      </div>

      {/* Phone */}
      <div className="mb-3">
        <div className="flex items-center space-x-2 mb-1">
          <Phone className="w-3 h-3 text-gray-400 dark:text-dark-text-secondary" />
          <span className="text-xs font-medium text-gray-600 dark:text-dark-text-secondary">Telefone</span>
        </div>
        <div
          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-surface rounded-lg p-1 transition-colors"
        >
          <span className="text-xs text-gray-800 dark:text-dark-text">{order.phone}</span>
        </div>
      </div>

      {/* Consultor Responsável - only for admins */}
      {userRole === 'admin' && (
        <div className="mb-3">
          <div className="flex items-center space-x-2 mb-1">
            <UserCheck className="w-3 h-3 text-gray-400 dark:text-dark-text-secondary" />
            <span className="text-xs font-medium text-gray-600 dark:text-dark-text-secondary">Consultor Responsável</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-800 dark:text-dark-text">{order.consultor_nome || 'Não atribuído'}</span>
          </div>
        </div>
      )}

      {/* Total Value */}
      <div className="mb-3">
        <div className="flex items-center space-x-2 mb-1">
          <DollarSign className="w-3 h-3 text-gray-400 dark:text-dark-text-secondary" />
          <span className="text-xs font-medium text-gray-600 dark:text-dark-text-secondary">Valor Total</span>
        </div>
        <div 
          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-surface rounded-lg p-1 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-green-600 dark:text-green-400">
              R$ {order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
      <div className="mb-3">
        <div className="flex items-center space-x-2 mb-1">
          {renderResponsaveis(order.responsaveis)}
        </div>
      </div>

      <Thermometer className={`w-6 h-6 ${getTermometerColor(order.termometro)}`} />
<div className="my-3 text-sm font-medium">
  {(() => {
    let safeTags: Tag[] = [];

    if (Array.isArray(order.tags)) {
      safeTags = order.tags;
    } else if (typeof order.tags === 'string') {
      try {
        const parsed = JSON.parse(order.tags);
        // só atribui se for array
        if (Array.isArray(parsed)) {
          safeTags = parsed;
        }
      } catch (e) {
        safeTags = [];
      }
    }

    // Garante que safeTags é array
    if (!Array.isArray(safeTags) || safeTags.length === 0) return null;

    return (
      <div className="mb-3">
        <div className="flex items-center space-x-2 mb-2">
          <Tag className="w-3 h-3 text-gray-400 dark:text-dark-text-secondary" />
          <span className="text-xs font-medium text-gray-600 dark:text-dark-text-secondary">
            Tags
          </span>
        </div>

        <div className="flex flex-wrap gap-1">
          {safeTags.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: tag.color,
                color: getContrastColor(tag.color),
              }}
            >
              {tag.name || 'Nome da Tag'}
            </span>
          ))}

          {safeTags.length > 2 && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-dark-surface text-gray-600 dark:text-dark-text-secondary rounded-full text-xs font-medium">
              +{safeTags.length - 2}
            </span>
          )}
        </div>
      </div>
    );
  })()}
</div>
    </div>
  );
};

(OrderManagement as any).layout = (page: React.ReactNode) => (
  <Layout>
    {page}
  </Layout>
);

export default OrderManagement;
