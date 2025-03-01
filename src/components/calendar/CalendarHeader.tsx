
import React from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getPreviousWeek, getNextWeek } from "@/utils/calendarHelpers";

interface CalendarHeaderProps {
  filterOwnSchedule: boolean;
  loading: boolean;
  startDate: Date;
  setStartDate: (date: Date) => void;
  toggleViewMode: () => void;
  viewMode: "grid" | "day";
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  filterOwnSchedule,
  loading,
  startDate,
  setStartDate,
  toggleViewMode,
  viewMode,
}) => {
  const { toast } = useToast();
  
  const handlePreviousWeek = () => {
    setStartDate(getPreviousWeek(startDate));
  };

  const handleNextWeek = () => {
    setStartDate(getNextWeek(startDate));
  };
  
  const handlePrintCalendar = () => {
    window.print();
    toast({
      title: "Stampa Calendario",
      description: "Il calendario è stato inviato alla stampante"
    });
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 print:hidden">
      <h2 className="text-3xl font-bold mb-4 md:mb-0">
        {filterOwnSchedule ? "I Miei Servizi" : "Calendario Liturgico"}
      </h2>
      <div className="flex flex-wrap gap-3 justify-center">
        <Button 
          onClick={handlePreviousWeek}
          className="text-xl"
          variant="outline"
          disabled={loading}
        >
          Settimana Precedente
        </Button>
        <Button 
          onClick={handleNextWeek}
          className="text-xl"
          variant="outline"
          disabled={loading}
        >
          Settimana Successiva
        </Button>
        <Button
          onClick={toggleViewMode}
          className="text-xl md:hidden"
          variant="outline"
          disabled={loading}
        >
          {viewMode === "grid" ? "Vista Giornaliera" : "Vista Griglia"}
        </Button>
        <Button
          onClick={handlePrintCalendar}
          className="text-xl"
          variant="outline"
          disabled={loading}
        >
          <Printer className="mr-2 h-5 w-5" /> Stampa
        </Button>
      </div>
    </div>
  );
};

export default CalendarHeader;
