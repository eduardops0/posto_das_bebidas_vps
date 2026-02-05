import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

import type { DateRange } from "react-day-picker";

interface Props {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
}

export function DateRangePicker({ date, setDate }: Props) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [tempRange, setTempRange] = React.useState<DateRange | undefined>(undefined);
  const [selectionStep, setSelectionStep] = React.useState<'start' | 'end' | 'complete'>('start');

  const handleDateClick = (selectedDate: Date) => {
    if (selectionStep === 'start') {
      // Primeiro clique: definir data inicial
      setTempRange({ from: selectedDate });
      setSelectionStep('end');
    } else if (selectionStep === 'end') {
      // Segundo clique: definir data final
      if (tempRange?.from) {
        const finalRange: DateRange = {
          from: tempRange.from,
          to: selectedDate
        };
        setDate(finalRange);
        setTempRange(undefined);
        setSelectionStep('complete');
        setIsOpen(false);
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDate(undefined);
    setTempRange(undefined);
    setSelectionStep('start');
  };

  // Combinar range temporário com range selecionado
  const displayRange = tempRange || date;
  
  // Configuração do calendário para o segundo clique (seleção de data final)
  const isSelectingEnd = selectionStep === 'end' && tempRange?.from;
  const fromDate = isSelectingEnd ? tempRange.from : undefined;
  
  // Modificar o estilo do calendário para desabilitar datas passadas da data inicial
  const disabledDays = isSelectingEnd
    ? { before: tempRange?.from, after: new Date() }
    : { after: new Date() };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className="w-[300px] justify-start text-left font-normal bg-white dark:bg-dark-surface border-gray-300 dark:border-dark-border text-gray-900 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-card"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayRange?.from ? (
            displayRange.to ? (
              <div className="flex items-center w-full">
                <span className="flex-1">
                  {format(displayRange.from, "dd/MM/yyyy", { locale: ptBR })} - {format(displayRange.to, "dd/MM/yyyy", { locale: ptBR })}
                </span>
                <span
                  onClick={handleClear}
                  className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded cursor-pointer"
                  title="Limpar datas"
                >
                  <X className="h-3 w-3" />
                </span>
              </div>
            ) : (
              <div className="flex items-center w-full">
                <span className="flex-1">
                  {format(displayRange.from, "dd/MM/yyyy", { locale: ptBR })} - Selecione a data final
                </span>
                <span
                  onClick={handleClear}
                  className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded cursor-pointer"
                  title="Limpar datas"
                >
                  <X className="h-3 w-3" />
                </span>
              </div>
            )
          ) : (
            <span>Selecione um período</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="min-w-[280px] p-2 z-50 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl shadow-xl"
        side="bottom"
        align="start"
      >
        <div className="p-2">
          <DayPicker
            mode="single"
            selected={isSelectingEnd ? tempRange?.to : displayRange?.from}
            onSelect={(selected) => {
              if (selected) {
                handleDateClick(selected);
              }
            }}
            disabled={disabledDays}
            numberOfMonths={1}
            className="dark:text-dark-text"
            locale={ptBR}
            showOutsideDays={false}
            footer={
              <div className="p-2 text-sm border-t border-gray-200 dark:border-gray-700">
                {selectionStep === 'start' && (
                  <div className="text-amber-600 dark:text-amber-400">
                    Clique na data inicial
                  </div>
                )}
                {selectionStep === 'end' && (
                  <div className="text-blue-600 dark:text-blue-400">
                    Agora clique na data final
                  </div>
                )}
                {displayRange?.from && displayRange?.to && (
                  <div className="text-green-600 dark:text-green-400">
                    Período: {format(displayRange.from, "dd/MM/yyyy", { locale: ptBR })} - {format(displayRange.to, "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                )}
              </div>
            }
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
