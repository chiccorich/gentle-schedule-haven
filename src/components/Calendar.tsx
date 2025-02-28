import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { MinisterSignup } from "@/components/MinisterSignup";
import { 
  DayData, 
  MinisterSlot, 
  Service,
  getCalendarData,
  formatDate,
  formatDay,
  getPreviousWeek,
  getNextWeek
} from "@/utils/calendarHelpers";

const Calendar: React.FC = () => {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [calendarData, setCalendarData] = useState<DayData[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<MinisterSlot | null>(null);
  const [showSignupModal, setShowSignupModal] = useState(false);
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

  const formatServiceTime = (service: Service): string => {
    return `${service.name} - ${service.time}`;
  };

  // Function to render a minister slot
  const renderMinisterSlot = (slot: MinisterSlot) => {
    let slotClass = "minister-slot ";
    let slotText = "";
    
    if (!slot.ministerId) {
      slotClass += "minister-slot-available";
      slotText = "Available - Tap to Sign Up";
    } else {
      slotClass += "minister-slot-filled";
      slotText = slot.ministerName || "Assigned";
      
      // If it's the current user, indicate they can cancel
      if (slot.ministerId === user?.id) {
        slotText += " (Tap to Cancel)";
      }
    }
    
    return (
      <div 
        key={slot.id} 
        className={slotClass}
        onClick={() => handleSlotClick(slot)}
      >
        <div className="font-bold">{`Position ${slot.position}`}</div>
        <div>{slotText}</div>
      </div>
    );
  };

  // Group calendar data by week for better organization
  const calendarByWeek = calendarData.reduce<DayData[][]>((weeks, day, index) => {
    const weekIndex = Math.floor(index / 7);
    
    if (!weeks[weekIndex]) {
      weeks[weekIndex] = [];
    }
    
    weeks[weekIndex].push(day);
    return weeks;
  }, []);

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h2 className="text-3xl font-bold mb-4 md:mb-0">Minister Schedule</h2>
        <div className="flex space-x-4">
          <Button 
            onClick={handlePreviousWeek}
            className="text-xl"
          >
            Previous Week
          </Button>
          <Button 
            onClick={handleNextWeek}
            className="text-xl"
          >
            Next Week
          </Button>
        </div>
      </div>
      
      {calendarByWeek.map((week, weekIndex) => (
        <Card key={`week-${weekIndex}`} className="mb-8 overflow-hidden">
          <CardContent className="p-0">
            <div className="calendar-header text-center p-4">
              Week of {formatDate(week[0].date)}
            </div>
            
            <div className="grid grid-cols-1">
              {week.map((day, index) => {
                // Only show Sundays for church services
                if (day.date.getDay() !== 0) return null;
                
                return (
                  <div 
                    key={`day-${index}`}
                    className={`p-4 border-t ${day.isToday ? 'calendar-today' : ''}`}
                  >
                    <div className="calendar-day">
                      {formatDay(day.date)}
                      {day.isToday && <span className="ml-2 text-blue-600">(Today)</span>}
                    </div>
                    
                    {day.services.length === 0 ? (
                      <div className="text-center text-gray-500 text-xl py-4">
                        No services scheduled for this day
                      </div>
                    ) : (
                      day.services.map((serviceData) => (
                        <div key={serviceData.service.id} className="mb-6">
                          <h3 className="text-xl font-semibold mb-2">
                            {formatServiceTime(serviceData.service)}
                          </h3>
                          <div className="space-y-2">
                            {serviceData.slots.map(renderMinisterSlot)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
      
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
