import { ChevronRight } from 'lucide-react';
import { Planilha } from '../index';

interface SeletorPlanilhasProps {
  planilhas: Planilha[];
  planilhaAtualId: number;
  onSelecionarPlanilha: (id: number) => void;
}

export function SeletorPlanilhas({
  planilhas,
  planilhaAtualId,
  onSelecionarPlanilha
}: SeletorPlanilhasProps) {
  return (
    <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl p-6 shadow-glass dark:shadow-glass-dark border border-white/20 dark:border-dark-border">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">
        Outras Planilhas
      </h3>
      <div className="space-y-2">
        {planilhas.map(planilha => (
          <button
            key={planilha.id}
            onClick={() => onSelecionarPlanilha(planilha.id)}
            className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
              planilha.id === planilhaAtualId
                ? 'bg-gradient-primary/10 border border-primary/20 text-primary'
                : 'hover:bg-gray-50 dark:hover:bg-dark-surface/50 border border-gray-200 dark:border-dark-border text-gray-900 dark:text-dark-text'
            }`}
          >
            <div className="flex-1 text-left">
              <p className={`text-sm font-medium ${
                planilha.id === planilhaAtualId
                  ? 'text-primary'
                  : 'text-gray-900 dark:text-dark-text'
              }`}>
                {planilha.nome}
              </p>
              <p className={`text-xs ${
                planilha.id === planilhaAtualId
                  ? 'text-primary/70'
                  : 'text-gray-500 dark:text-dark-text-secondary'
              }`}>
                {planilha.total_registros} registros
              </p>
            </div>
            {planilha.id !== planilhaAtualId && (
              <ChevronRight className="w-4 h-4 text-gray-400 dark:text-dark-text-secondary" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
