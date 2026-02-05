import { FileSpreadsheet, Calendar, Database } from 'lucide-react';
import { Planilha } from '..';

interface PlanilhaCardProps {
  planilha: Planilha;
  onAbrir: (id: number) => void;
}

export function PlanilhaCard({ planilha, onAbrir }: PlanilhaCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-lg">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{planilha.nome}</h3>
            <p className="text-sm text-gray-500 mt-1">{planilha.descricao}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{new Date(planilha.criado_em).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      <button
        onClick={() => onAbrir(planilha.id)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        Abrir Planilha
      </button>
    </div>
  );
}
