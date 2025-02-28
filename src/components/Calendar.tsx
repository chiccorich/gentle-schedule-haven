
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
  Service,
  getCalendarData,
  formatDate,
  getPreviousWeek,
  getNextWeek,
  SERVICES
} from "@/utils/calendarHelpers";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";

const Calendar: React.FC<{ filterOwnSchedule?: boolean }> = ({ filterOwnSchedule = false }) => {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [calendarData, setCalendarData] = useState<DayData[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<MinisterSlot | null>(null);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "day">("grid");
  const { user } = useAuth();
  const { toast } = useToast();

  // Initialize calendar data on component mount and when start date changes
  useEffect(() => {
    const data = getCalendarData(startDate, 21); // Show 3 weeks
    setCalendarData(data);
  }, [startDate]);

  const handlePreviousWeek = () => {
    setStartDate(getPreviousWeek(startDate));
  };

  const handleNextWeek = () => {
    setStartDate(getNextWeek(startDate));
  };
  
  const handlePrintCalendar = () => {
    window.print();
    toast({
      title: "Printing Calendar",
      description: "Your calendar has been sent to the printer"
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
        title: "Position Already Filled",
        description: `This position is already assigned to ${slot.ministerName}`,
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
    const data = getCalendarData(startDate, 21);
    setCalendarData(data);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "day" : "grid");
  };

  // Function to render a minister position cell
  const renderPositionCell = (dayDate: Date, serviceId: string, position: number) => {
    // Find the slot for this specific day, service, and position
    const slot = calendarData
      .find(day => day.date.getTime() === dayDate.getTime())
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
          <div className="text-lg">No Service</div>
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
      slotText = "Available";
    } else {
      cellClasses += " minister-slot-filled cursor-pointer hover:opacity-90";
      slotText = slot.ministerName || "Assigned";
    }
    
    return (
      <div
        key={`${dayDate.toISOString()}-${serviceId}-${position}`}
        className={cellClasses}
        onClick={() => handleSlotClick(slot)}
      >
        <div className="text-lg">{`Position ${position}`}</div>
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
    const weekStart = format(startOfWeekDate, "MMMM d");
    const weekEnd = format(endOfWeek(startOfWeekDate), "MMMM d, yyyy");
    return `${weekStart} - ${weekEnd}`;
  };

  // Function to render the grid calendar view (week by week)
  const renderGridCalendar = () => {
    return weeks.map((week, weekIndex) => {
      // Get Sunday of this week for the week header
      const sundayOfWeek = week.find(day => day.date.getDay() === 0)?.date || startOfWeek(week[0].date);
      
      return (
        <Card key={`week-${weekIndex}`} className="mb-8 overflow-hidden print:mb-4 print:break-inside-avoid">
          <CardContent className="p-0">
            <div className="calendar-header text-center p-4 text-2xl">
              Week of {formatWeekRange(sundayOfWeek)}
            </div>
            
            <div className="grid grid-cols-7 border-b print:text-base">
              {/* Day headers */}
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                <div key={day} className="p-2 font-bold text-lg text-center border-r last:border-r-0">
                  {day}
                </div>
              ))}
              
              {/* Date headers */}
              {week.map((day, index) => (
                <div key={`date-${index}`} className={`p-2 text-center border-r last:border-r-0 text-lg ${day.isToday ? 'bg-calendar-current font-bold' : ''}`}>
                  {format(day.date, "d/MM")}
                  {day.isToday && <span className="ml-1 text-blue-600">(Today)</span>}
                </div>
              ))}
              
              {/* Service rows */}
              {SERVICES.map(service => (
                <React.Fragment key={service.id}>
                  {/* Service header spans all 7 days */}
                  <div className="col-span-7 bg-gray-100 p-2 text-lg font-semibold border-t">
                    {service.name} - {service.time}
                  </div>
                  
                  {/* For each service, show position rows with cells for each day */}
                  {[...Array(service.positions)].map((_, positionIndex) => (
                    <React.Fragment key={`${service.id}-position-${positionIndex + 1}`}>
                      {week.map((day, dayIndex) => (
                        <div key={`day-${dayIndex}-service-${service.id}-position-${positionIndex + 1}`} className="border-t border-r p-1">
                          {renderPositionCell(day.date, service.id, positionIndex + 1)}
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    });
  };

  // Function to render the day-by-day calendar view (for small mobile screens)
  const renderDayCalendar = () => {
    // Only display Sundays for simplicity in the day view
    const sundays = calendarData.filter(day => day.date.getDay() === 0);
    
    return sundays.map((day, dayIndex) => (
      <Card key={`day-${dayIndex}`} className="mb-6">
        <CardContent>
          <div className="calendar-header text-center p-2 text-xl">
            {format(day.date, "EEEE, MMMM d, yyyy")}
            {day.isToday && <span className="ml-2 text-blue-600 font-semibold">(Today)</span>}
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
                          <div className="text-lg font-semibold">{`Position ${slot.position}`}</div>
                          <div className="text-lg">
                            {!slot.ministerId ? "Available - Tap to Sign Up" : slot.ministerName}
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
        {filterOwnSchedule ? "My Schedule" : "Minister Schedule"}
      </h2>
      <div className="flex flex-wrap gap-3 justify-center">
        <Button 
          onClick={handlePreviousWeek}
          className="text-xl"
          variant="outline"
        >
          Previous Week
        </Button>
        <Button 
          onClick={handleNextWeek}
          className="text-xl"
          variant="outline"
        >
          Next Week
        </Button>
        <Button
          onClick={toggleViewMode}
          className="text-xl md:hidden"
          variant="outline"
        >
          {viewMode === "grid" ? "Day View" : "Grid View"}
        </Button>
        <Button
          onClick={handlePrintCalendar}
          className="text-xl"
          variant="outline"
        >
          <Printer className="mr-2 h-5 w-5" /> Print
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
      
      {filterOwnSchedule && !hasMyScheduleData ? (
        <div className="text-center p-8 border rounded-lg bg-gray-50">
          <h3 className="text-2xl font-bold mb-4">No Scheduled Services</h3>
          <p className="text-xl">
            You are not currently signed up for any services.
          </p>
          <p className="text-xl mt-4">
            Go to the Calendar View to sign up for available positions.
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
