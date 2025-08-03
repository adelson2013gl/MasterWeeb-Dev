
import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { isDataHoje, isDataAmanha } from "@/lib/utils"

interface DatePickerProps {
  date?: Date
  onDateChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  minDate?: Date
  className?: string
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Selecione uma data",
  disabled = false,
  minDate,
  className
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleDateSelect = (selectedDate: Date | undefined) => {
    onDateChange(selectedDate)
    setOpen(false)
  }

  // Usar as funções padronizadas para verificar se é hoje ou amanhã
  const hoje = date && isDataHoje(format(date, 'yyyy-MM-dd'))
  const amanha = date && isDataAmanha(format(date, 'yyyy-MM-dd'))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            <span>
              {format(date, "dd/MM/yyyy", { locale: ptBR })}
              {hoje && <span className="ml-2 text-xs text-green-600">(Hoje)</span>}
              {amanha && <span className="ml-2 text-xs text-blue-600">(Amanhã)</span>}
            </span>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDateSelect(new Date())}
              className="flex-1"
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDateSelect(new Date(Date.now() + 24 * 60 * 60 * 1000))}
              className="flex-1"
            >
              Amanhã
            </Button>
          </div>
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          disabled={(date) => minDate ? date < minDate : false}
          initialFocus
          className="p-3 pointer-events-auto"
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  )
}
