import React, { useState } from 'react';
import { 
  Tag, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Search, 
  Filter,
  Palette,
  Hash,
  Eye,
  Copy,
  Check
} from 'lucide-react';

import Layout from '@/components/Layout';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { useEffect } from 'react';
import { router } from '@inertiajs/react';

interface AppPageProps {
  authUser?: any; // se você envia usuário
  [key: string]: any; // <- para aceitar qualquer outra prop
}

interface TagData {
  id: number;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
  usageCount: number;
}

const TagManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterColor, setFilterColor] = useState('Todas');
  const [isCreating, setIsCreating] = useState(false);
  const [editingTag, setEditingTag] = useState<TagData | null>(null);
  const [copiedTagId, setCopiedTagId] = useState<number | null>(null);

  const [newTag, setNewTag] = useState({
    name: '',
    color: '#2566B0'
  });

const fetchTags = async () => {
  const response = await axios.get('/tags');
  setTags(response.data.tags ?? response.data);
};

  useEffect(() => {
  fetchTags();
}, []);

  // Mock data para tags
  const [tags, setTags] = useState<TagData[]>([]);

  // Cores predefinidas
  const predefinedColors = [
    '#2566B0', '#3B9ED8', '#10B981', '#F59E0B', 
    '#EF4444', '#8B5CF6', '#06B6D4', '#F97316',
    '#EC4899', '#84CC16', '#6366F1', '#14B8A6',
    '#F43F5E', '#A855F7', '#0EA5E9', '#22C55E'
  ];

  const filteredTags = tags.filter(tag => {
    const matchesSearch = tag.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesColor = filterColor === 'Todas' || tag.color === filterColor;
    return matchesSearch && matchesColor;
  });

  const uniqueColors = [...new Set(tags.map(tag => tag.color))];

  const handleCreateTag = async () => {
  if (!newTag.name.trim()) return;

  await axios.post('/tags', newTag);
  fetchTags(); // atualiza lista em tempo real
  setNewTag({ name: '', color: '#2566B0' });
  setIsCreating(false);
};

  const handleEditTag = (tag: TagData) => {
    setEditingTag({ ...tag });
  };

 const handleSaveEdit = async () => {
  if (!editingTag) return;
  await axios.put(`/tags/${editingTag.id}`, editingTag);
  fetchTags();
  setEditingTag(null);
};

  const handleDeleteTag = async (id: number) => {
  if (!window.confirm('Tem certeza que deseja excluir esta tag?')) return;
  await axios.delete(`/tags/${id}`);
  fetchTags();
};

  const handleCopyColor = (color: string, tagId: number) => {
    navigator.clipboard.writeText(color);
    setCopiedTagId(tagId);
    setTimeout(() => setCopiedTagId(null), 2000);
  };

  const getContrastColor = (hexColor: string) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  };

  const totalTags = tags.length;
  const totalUsage = tags.reduce((sum, tag) => sum + tag.usageCount ? tag.usageCount : 0, 0);
  const mostUsedTag = tags.length > 0 
  ? tags.reduce((prev, current) => prev.usageCount > current.usageCount ? prev : current)
  : { id: 0, name: '-', color: '#ccc', createdAt: '', updatedAt: '', usageCount: 0 };

  return (
    <div className="space-y-8">
      <div className="animate-slide-up">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          Gerenciador de Tags
        </h1>
        <p className="text-gray-600 dark:text-dark-text-secondary text-lg">
          Crie e gerencie tags personalizadas para organizar seus dados
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl p-6 shadow-glass dark:shadow-glass-dark hover:shadow-glow-primary dark:hover:shadow-glow-dark transition-all duration-300 border border-white/20 dark:border-dark-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-dark-text-secondary text-sm font-medium">Total de Tags</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-dark-text">{totalTags}</p>
            </div>
            <div className="p-3 bg-gradient-primary rounded-xl">
              <Tag className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl p-6 shadow-glass dark:shadow-glass-dark hover:shadow-glow-primary dark:hover:shadow-glow-dark transition-all duration-300 border border-white/20 dark:border-dark-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-dark-text-secondary text-sm font-medium">Uso Total</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-dark-text">{totalUsage.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-gradient-secondary rounded-xl">
              <Hash className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl p-6 shadow-glass dark:shadow-glass-dark hover:shadow-glow-primary dark:hover:shadow-glow-dark transition-all duration-300 border border-white/20 dark:border-dark-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-dark-text-secondary text-sm font-medium">Mais Usada</p>
              <p className="text-lg font-bold text-gray-800 dark:text-dark-text truncate">{mostUsedTag.name}</p>
              <p className="text-sm text-gray-500 dark:text-dark-text-secondary">{mostUsedTag.usageCount} usos</p>
            </div>
            <div className="p-3 bg-gradient-primary rounded-xl">
              <Eye className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl p-6 shadow-glass dark:shadow-glass-dark border border-white/20 dark:border-dark-border">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-dark-text-secondary w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-dark-text-secondary w-4 h-4" />
              <select
                value={filterColor}
                onChange={(e) => setFilterColor(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
              >
                <option value="Todas">Todas as Cores</option>
                {uniqueColors.map(color => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center space-x-2 px-6 py-2 bg-gradient-primary text-white rounded-xl hover:shadow-glow-primary dark:hover:shadow-glow-dark transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Tag</span>
          </button>
        </div>
      </div>

      {/* Create Tag Form */}
      {isCreating && (
        <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl p-6 shadow-glass dark:shadow-glass-dark border border-white/20 dark:border-dark-border animate-fade-in">
          <h3 className="text-xl font-bold text-gray-800 dark:text-dark-text mb-4 flex items-center space-x-2">
            <Plus className="w-5 h-5 text-primary" />
            <span>Criar Nova Tag</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                Nome da Tag
              </label>
              <input
                type="text"
                value={newTag.name}
                onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Digite o nome da tag..."
                className="w-full px-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                Cor da Tag
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={newTag.color}
                  onChange={(e) => setNewTag(prev => ({ ...prev, color: e.target.value }))}
                  className="w-12 h-12 border border-gray-200 dark:border-dark-border rounded-xl cursor-pointer"
                />
                <input
                  type="text"
                  value={newTag.color}
                  onChange={(e) => setNewTag(prev => ({ ...prev, color: e.target.value }))}
                  className="flex-1 px-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text font-mono"
                />
              </div>
            </div>
          </div>
          
          {/* Cores Predefinidas */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-3">
              Cores Predefinidas
            </label>
            <div className="grid grid-cols-8 md:grid-cols-16 gap-2">
              {predefinedColors.map(color => (
                <button
                  key={color}
                  onClick={() => setNewTag(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                    newTag.color === color ? 'border-gray-400 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
          
          {/* Preview */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
              Preview
            </label>
            <div className="flex items-center space-x-3">
              <span
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{ 
                  backgroundColor: newTag.color, 
                  color: getContrastColor(newTag.color) 
                }}
              >
                {newTag.name || 'Nome da Tag'}
              </span>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setIsCreating(false);
                setNewTag({ name: '', color: '#2566B0' });
              }}
              className="px-4 py-2 border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text rounded-xl hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateTag}
              disabled={!newTag.name.trim()}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-primary text-white rounded-xl hover:shadow-glow-primary dark:hover:shadow-glow-dark transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>Criar Tag</span>
            </button>
          </div>
        </div>
      )}

      {/* Tags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTags.map((tag, index) => (
          <div
            key={tag.id}
            className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl p-6 shadow-glass dark:shadow-glass-dark hover:shadow-glow-primary dark:hover:shadow-glow-dark transition-all duration-300 border border-white/20 dark:border-dark-border animate-fade-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {editingTag?.id === tag.id ? (
              // Edit Mode
              <div className="space-y-4">
                <input
                  type="text"
                  value={editingTag.name}
                  onChange={(e) => setEditingTag(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                />
                
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={editingTag.color}
                    onChange={(e) => setEditingTag(prev => prev ? { ...prev, color: e.target.value } : null)}
                    className="w-8 h-8 border border-gray-200 dark:border-dark-border rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editingTag.color}
                    onChange={(e) => setEditingTag(prev => prev ? { ...prev, color: e.target.value } : null)}
                    className="flex-1 px-2 py-1 text-sm border border-gray-200 dark:border-dark-border rounded focus:outline-none focus:ring-1 focus:ring-primary/50 bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text font-mono"
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setEditingTag(null)}
                    className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-dark-surface rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: tag.color, 
                      color: getContrastColor(tag.color) 
                    }}
                  >
                    {tag.name}
                  </span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEditTag(tag)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-dark-text-secondary">Cor:</span>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded border border-gray-200 dark:border-dark-border"
                        style={{ backgroundColor: tag.color }}
                      />
                      <button
                        onClick={() => handleCopyColor(tag.color, tag.id)}
                        className="text-xs font-mono text-gray-700 dark:text-dark-text hover:text-primary dark:hover:text-secondary transition-colors flex items-center space-x-1"
                      >
                        <span>{tag.color}</span>
                        {copiedTagId === tag.id ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-dark-text-secondary">Usos:</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-dark-text">
                      {(tag.usageCount ?? 0).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-dark-text-secondary">Criada em:</span>
                    <span className="text-sm text-gray-800 dark:text-dark-text">
                      {new Date(tag.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-dark-text-secondary">Atualizado em:</span>
                    <span className="text-sm text-gray-800 dark:text-dark-text">
                      {new Date(tag.updated_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredTags.length === 0 && (
        <div className="text-center py-12">
          <Tag className="w-16 h-16 text-gray-400 dark:text-dark-text-secondary mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-dark-text-secondary mb-2">
            Nenhuma tag encontrada
          </h3>
          <p className="text-gray-500 dark:text-dark-text-secondary">
            {searchTerm || filterColor !== 'Todas' 
              ? 'Tente ajustar os filtros de busca'
              : 'Crie sua primeira tag para começar'
            }
          </p>
        </div>
      )}
    </div>
  );
};

(TagManager as any).layout = (page: React.ReactNode) => (
  <Layout>
    {page}
  </Layout>
);

export default TagManager;