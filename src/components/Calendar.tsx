import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { MinisterSignup } from "@/components/MinisterSignup";
import { 
  DayData, 
  MinisterSlot, 
  getCalendarData,
  initializeSlots,
  startOfWeek
} from "@/utils/calendarHelpers";
import CalendarHeader from "@/components/calendar/CalendarHeader";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import DayCalendar from "@/components/calendar/DayCalendar";
import LoadingCalendar from "@/components/calendar/LoadingCalendar";
import EmptySchedule from "@/components/calendar/EmptySchedule";

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

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "day" : "grid");
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

  // Group the calendar days into weeks
  const weeks = calendarData.reduce<DayData[][]>((acc, day, index) => {
    const weekIndex = Math.floor(index / 7);
    if (!acc[weekIndex]) {
      acc[weekIndex] = [];
    }
    acc[weekIndex].push(day);
    return acc;
  }, []);

  // Check if there's any data to show in "My Schedule" view
  const hasMyScheduleData = filterOwnSchedule && calendarData.some(day => 
    day.services.some(service => 
      service.slots.some(slot => slot.ministerId === user?.id)
    )
  );

  return (
    <div className="p-4">
      <CalendarHeader 
        filterOwnSchedule={filterOwnSchedule}
        loading={loading}
        startDate={startDate}
        setStartDate={setStartDate}
        toggleViewMode={toggleViewMode}
        viewMode={viewMode}
      />
      
      {loading ? (
        <LoadingCalendar />
      ) : filterOwnSchedule && !hasMyScheduleData ? (
        <EmptySchedule />
      ) : (
        <>
          {/* On larger screens, always show grid view. On mobile, respect the viewMode setting */}
          <div className="hidden md:block">
            <CalendarGrid 
              weeks={weeks} 
              handleSlotClick={handleSlotClick} 
              filterOwnSchedule={filterOwnSchedule}
              user={user}
            />
          </div>
          <div className="md:hidden">
            {viewMode === "grid" ? (
              <CalendarGrid 
                weeks={weeks} 
                handleSlotClick={handleSlotClick} 
                filterOwnSchedule={filterOwnSchedule}
                user={user}
              />
            ) : (
              <DayCalendar 
                calendarData={calendarData} 
                handleSlotClick={handleSlotClick}
                filterOwnSchedule={filterOwnSchedule}
                user={user}
              />
            )}
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
