
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { MinisterSignup } from "@/components/MinisterSignup";
import { 
  DayData, 
  MinisterSlot, 
  getCalendarData,
  formatDate,
  getPreviousWeek,
  getNextWeek,
} from "@/utils/calendarHelpers";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";
import { it } from "date-fns/locale";

const Calendar: React.FC<{ filterOwnSchedule?: boolean }> = ({ filterOwnSchedule = false }) => {
  const [startDate, setStartDate] = useState<Date>(() => {
    // Start the week on Monday (weekStartsOn: 1)
    return startOfWeek(new Date(), { weekStartsOn: 1 });
  });
  const [calendarData, setCalendarData] = useState<DayData[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<MinisterSlot | null>(null);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "day">("grid");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Function to load calendar data
  const loadCalendarData = async () => {
    setLoading(true);
    try {
      const data = await getCalendarData(startDate, 21); // Show 3 weeks
      setCalendarData(data);
    } catch (error) {
      console.error("Error loading calendar data:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il caricamento del calendario",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize calendar data on component mount and when start date changes
  useEffect(() => {
    loadCalendarData();
  }, [startDate]);

  // Listen for calendar data updates
  useEffect(() => {
    // This event is dispatched when calendar data is updated via admin panel
    const handleCalendarDataUpdated = () => {
      console.log("Calendar data updated event received");
      loadCalendarData();
    };

    window.addEventListener('calendar-data-updated', handleCalendarDataUpdated);
    
    return () => {
      window.removeEventListener('calendar-data-updated', handleCalendarDataUpdated);
    };
  }, [startDate]); // Re-add listener if startDate changes

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

  const handleSlotClick = (slot: MinisterSlot) => {
    // If user is the assigned minister, ask if they want to cancel
    if (slot.ministerId === user?.id) {
      setSelectedSlot(slot);
      setShowSignupModal(true);
      return;
    }
    
    // If slot is already taken by someone else, show who has it
    if (slot.ministerId && slot.ministerId !== user?.id) {
      toast({
        title: "Incarico Già Assegnato",
        description: `Questo incarico è già assegnato a ${slot.ministerName}`,
      });
      return;
    }
    
    // Otherwise, let them sign up
    setSelectedSlot(slot);
    setShowSignupModal(true);
  };

  const handleSignupCompleted = () => {
    setShowSignupModal(false);
    setSelectedSlot(null);
    
    // Refresh calendar data
    loadCalendarData();
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "day" : "grid");
  };

  // Function to render a minister position cell
  const renderPositionCell = (dayDate: Date, serviceId: string, position: number) => {
    // Find the slot for this specific day, service, and position
    const slot = calendarData
      .find(day => 
        day.date.getFullYear() === dayDate.getFullYear() &&
        day.date.getMonth() === dayDate.getMonth() &&
        day.date.getDate() === dayDate.getDate()
      )
      ?.services
      .find(s => s.service.id === serviceId)
      ?.slots
      .find(s => s.position === position);
    
    if (!slot) {
      // If slot doesn't exist, render an empty cell
      return (
        <div 
          className="minister-slot-empty p-2 rounded-lg text-center h-[60px] flex items-center justify-center"
        >
          <div className="text-lg">Nessuna Celebrazione</div>
        </div>
      );
    }
    
    // For "My Schedule" view, don't show slots that aren't assigned to the current user
    if (filterOwnSchedule && slot.ministerId !== user?.id) {
      return null;
    }
    
    let cellClasses = "p-2 rounded-lg text-center h-[60px] flex flex-col justify-center"; 
    let slotText = "";
    
    if (!slot.ministerId) {
      cellClasses += " minister-slot-available cursor-pointer hover:opacity-90";
      slotText = "Disponibile";
    } else {
      cellClasses += " minister-slot-filled cursor-pointer hover:opacity-90";
      slotText = slot.ministerName || "Assegnato";
    }
    
    return (
      <div
        key={`${dayDate.toISOString()}-${serviceId}-${position}`}
        className={cellClasses}
        onClick={() => handleSlotClick(slot)}
      >
        <div className="text-lg">{`Servizio ${position}`}</div>
        <div className="text-lg font-medium">{slotText}</div>
      </div>
    );
  };

  // Group the calendar days into weeks
  const weeks = calendarData.reduce<DayData[][]>((acc, day, index) => {
    const weekIndex = Math.floor(index / 7);
    if (!acc[weekIndex]) {
      acc[weekIndex] = [];
    }
    acc[weekIndex].push(day);
    return acc;
  }, []);

  // Format dates for week headers
  const formatWeekRange = (startOfWeekDate: Date) => {
    const weekStart = format(startOfWeekDate, "d MMMM", { locale: it });
    const weekEnd = format(endOfWeek(startOfWeekDate, { weekStartsOn: 1 }), "d MMMM yyyy", { locale: it });
    return `${weekStart} - ${weekEnd}`;
  };

  // Italian days of the week - rearranged to start with Monday
  const italianDays = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

  // Function to render the grid calendar view (week by week)
  const renderGridCalendar = () => {
    return weeks.map((week, weekIndex) => {
      // Get Monday of this week for the week header
      const mondayOfWeek = week.find(day => day.date.getDay() === 1)?.date || 
                           startOfWeek(week[0].date, { weekStartsOn: 1 });
      
      return (
        <Card key={`week-${weekIndex}`} className="mb-8 overflow-hidden print:mb-4 print:break-inside-avoid">
          <CardContent className="p-0">
            <div className="calendar-header text-center p-4 text-2xl">
              Settimana del {formatWeekRange(mondayOfWeek)}
            </div>
            
            <div className="grid grid-cols-7 border-b print:text-base">
              {/* Day headers */}
              {italianDays.map((day, index) => (
                <div key={day} className="p-2 font-bold text-lg text-center border-r last:border-r-0">
                  {day}
                </div>
              ))}
              
              {/* Date headers */}
              {week.map((day, index) => (
                <div key={`date-${index}`} className={`p-2 text-center border-r last:border-r-0 text-lg ${day.isToday ? 'bg-calendar-current font-bold' : ''}`}>
                  {format(day.date, "d/MM")}
                  {day.isToday && <span className="ml-1 text-blue-600">(Oggi)</span>}
                </div>
              ))}
              
              {/* Services for each day */}
              {week.map(day => {
                if (day.services.length === 0) {
                  return (
                    <div key={`empty-day-${day.date.toISOString()}`} className="col-span-1 p-2 text-center border-r border-t">
                      <div className="text-gray-500">Nessuna celebrazione</div>
                    </div>
                  );
                }
                
                return day.services.map(serviceData => (
                  <React.Fragment key={`${day.date.toISOString()}-${serviceData.service.id}`}>
                    {/* Service header */}
                    <div className="bg-gray-100 p-2 text-lg font-semibold border-t border-r">
                      {serviceData.service.name} - {serviceData.service.time}
                    </div>
                    
                    {/* Service slots */}
                    {Array.from({ length: serviceData.service.positions }).map((_, positionIndex) => (
                      <div key={`${serviceData.service.id}-position-${positionIndex + 1}`} className="border-t border-r p-1">
                        {renderPositionCell(day.date, serviceData.service.id, positionIndex + 1)}
                      </div>
                    ))}
                  </React.Fragment>
                ));
              })}
            </div>
          </CardContent>
        </Card>
      );
    });
  };

  // Function to render the day-by-day calendar view (for small mobile screens)
  const renderDayCalendar = () => {
    // Only display days with services for simplicity in the day view
    const daysWithServices = calendarData.filter(day => day.services.length > 0);
    
    return daysWithServices.map((day, dayIndex) => (
      <Card key={`day-${dayIndex}`} className="mb-6">
        <CardContent>
          <div className="calendar-header text-center p-2 text-xl">
            {format(day.date, "EEEE, d MMMM yyyy", { locale: it })}
            {day.isToday && <span className="ml-2 text-blue-600 font-semibold">(Oggi)</span>}
          </div>
          
          <div className="space-y-4 mt-4">
            {day.services.map(serviceData => (
              <div key={serviceData.service.id} className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 p-2 text-lg font-semibold">
                  {serviceData.service.name} - {serviceData.service.time}
                </div>
                
                <div className="grid grid-cols-1 gap-2 p-2">
                  {serviceData.slots
                    .filter(slot => !filterOwnSchedule || slot.ministerId === user?.id)
                    .map(slot => {
                      let cellClasses = "p-3 rounded-lg text-center"; 
                      
                      if (!slot.ministerId) {
                        cellClasses += " minister-slot-available";
                      } else {
                        cellClasses += " minister-slot-filled";
                      }
                      
                      return (
                        <div
                          key={slot.id}
                          className={cellClasses}
                          onClick={() => handleSlotClick(slot)}
                        >
                          <div className="text-lg font-semibold">{`Servizio ${slot.position}`}</div>
                          <div className="text-lg">
                            {!slot.ministerId ? "Disponibile - Tocca per Confermare" : slot.ministerName}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ));
  };
  
  const renderCalendarHeader = () => (
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

  // Check if there's any data to show in "My Schedule" view
  const hasMyScheduleData = filterOwnSchedule && calendarData.some(day => 
    day.services.some(service => 
      service.slots.some(slot => slot.ministerId === user?.id)
    )
  );

  return (
    <div className="p-4">
      {renderCalendarHeader()}
      
      {loading ? (
        <div className="text-center p-8 border rounded-lg bg-gray-50">
          <h3 className="text-2xl font-bold mb-4">Caricamento Calendario</h3>
          <p className="text-xl">
            Stiamo caricando i dati del calendario, attendere prego...
          </p>
        </div>
      ) : filterOwnSchedule && !hasMyScheduleData ? (
        <div className="text-center p-8 border rounded-lg bg-gray-50">
          <h3 className="text-2xl font-bold mb-4">Nessun Servizio Programmato</h3>
          <p className="text-xl">
            Al momento non sei iscritto a nessun servizio.
          </p>
          <p className="text-xl mt-4">
            Vai alla vista Calendario per iscriverti ai servizi disponibili.
          </p>
        </div>
      ) : (
        <>
          {/* On larger screens, always show grid view. On mobile, respect the viewMode setting */}
          <div className="hidden md:block">
            {renderGridCalendar()}
          </div>
          <div className="md:hidden">
            {viewMode === "grid" ? renderGridCalendar() : renderDayCalendar()}
          </div>
        </>
      )}
      
      {showSignupModal && selectedSlot && (
        <MinisterSignup
          slot={selectedSlot}
          onClose={() => setShowSignupModal(false)}
          onComplete={handleSignupCompleted}
        />
      )}
    </div>
  );
};

export default Calendar;
