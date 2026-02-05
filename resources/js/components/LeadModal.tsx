import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import axios from 'axios';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface LeadFormData {
  data: string;
  canal: string;
  n_abordagem: string;
}

const ROUTES = {
  LEADS_STORE: '/leads',            // POST
  CHANNELS_LIST: '/leads/channels', // GET
};

// ✅ Data local (yyyy-mm-dd) respeitando fuso do sistema (Brasília)
const getTodayLocal = (): string => {
  const d = new Date();
  // Corrige para remover o deslocamento UTC e ficar na data local
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

const TODAY = getTodayLocal();

const LeadModal: React.FC<LeadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<LeadFormData>({
    data: TODAY,
    canal: '',
    n_abordagem: '',
  });

  const [channels, setChannels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const defaultChannels = [
    'WhatsApp','Instagram','Facebook','LinkedIn','Email','Telefone','Presencial','Website',
  ];

  useEffect(() => {
    if (isOpen) {
      loadChannels();
      setFormData({
        data: getTodayLocal(), // ⛔ trava data ao abrir, usando data local
        canal: '',
        n_abordagem: '',
      });
      setErrors({});
    }
  }, [isOpen]);

  const loadChannels = async () => {
    // Se futuramente vier do backend, mantenha o isLoadingChannels
    setChannels(defaultChannels);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.data) newErrors.data = 'Data é obrigatória';
    if (!formData.canal) newErrors.canal = 'Canal é obrigatório';

    if (!formData.n_abordagem) {
      newErrors.n_abordagem = 'Número de abordagens é obrigatório';
    } else if (isNaN(Number(formData.n_abordagem)) || Number(formData.n_abordagem) < 1) {
      newErrors.n_abordagem = 'Deve ser um número válido maior que 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // ⛔ Reforço: garantir que a data enviada é HOJE (local)
      const todayStr = getTodayLocal();
      const date = new Date(todayStr);
      const dayNames = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
      const dia_semana = dayNames[date.getUTCDay()]; // após normalização acima, podemos usar getUTCDay

      const payload = {
        ...formData,
        data: todayStr,
        dia_semana,
        n_abordagem: Number(formData.n_abordagem),
      };

      await axios.post(ROUTES.LEADS_STORE, payload);

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create lead:', error);
      setErrors({ submit: 'Erro ao criar lead. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof LeadFormData, value: string) => {
    // ⛔ qualquer tentativa de alterar "data" é ignorada e volta para HOJE (local)
    if (field === 'data') value = getTodayLocal();
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  if (!isOpen) return null;

  const todayLocal = getTodayLocal(); // usado para min/max render-time

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text">
            Novas Abordagens
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-dark-text-secondary dark:hover:text-dark-text transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Data */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
              Data *
            </label>
            <input
              type="date"
              value={formData.data}
              min={todayLocal}
              max={todayLocal}
              // ⛔ impede digitação, colagem e drop; e deixa apenas o datepicker visual
              readOnly
              inputMode="none"
              onKeyDown={(e) => e.preventDefault()}
              onPaste={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
              onChange={(e) => handleInputChange('data', e.target.value)}
              className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text transition-colors ${
                errors.data ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-dark-border'
              }`}
            />
            {errors.data && (
              <p className="mt-1 text-sm text-red-600 dark:text-dark-text">{errors.data}</p>
            )}
          </div>

          {/* Canal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
              Canal *
            </label>
            {isLoadingChannels ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="ml-2 text-sm text-gray-600 dark:text-dark-text-secondary">
                  Carregando canais...
                </span>
              </div>
            ) : (
              <select
                value={formData.canal}
                onChange={(e) => handleInputChange('canal', e.target.value)}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text transition-colors ${
                  errors.canal ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-dark-border'
                }`}
              >
                <option value="">Selecione um canal</option>
                {channels.map((channel) => (
                  <option key={channel} value={channel}>
                    {channel}
                  </option>
                ))}
              </select>
            )}
            {errors.canal && (
              <p className="mt-1 text-sm text-red-600 dark:text-dark-text">{errors.canal}</p>
            )}
          </div>

          {/* n_abordagem */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
              Número de Abordagens *
            </label>
            <input
              type="number"
              min="1"
              value={formData.n_abordagem}
              onChange={(e) => handleInputChange('n_abordagem', e.target.value)}
              placeholder="Ex: 5"
              className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text transition-colors ${
                errors.n_abordagem ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-dark-border'
              }`}
            />
            {errors.n_abordagem && (
              <p className="mt-1 text-sm text-red-600 dark:text-dark-text">{errors.n_abordagem}</p>
            )}
          </div>

          {/* erro submit */}
          {errors.submit && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-600 dark:text-dark-text">{errors.submit}</p>
            </div>
          )}

          {/* actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-dark-text bg-gray-100 dark:bg-dark-surface hover:bg-gray-200 dark:hover:bg-dark-card rounded-xl transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gradient-primary text-white rounded-xl hover:shadow-glow-primary dark:hover:shadow-glow-dark transition-all duration-300 font-medium disabled:opacity-50 disabled:hover:shadow-none flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  + Abordagem
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadModal;
