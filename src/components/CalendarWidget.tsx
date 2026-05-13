import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { ptBR } from "date-fns/locale";

export function CalendarWidget() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Card className="p-4 shadow-card border-0 bg-card overflow-hidden">
      <h3 className="font-display font-bold text-sm mb-3 px-2">Calendário</h3>
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        locale={ptBR}
        className="rounded-md border-0"
      />
    </Card>
  );
}
