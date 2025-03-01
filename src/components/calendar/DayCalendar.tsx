
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DayData } from "@/utils/calendarHelpers";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface DayCalendarProps {
  calendarData: DayData[];
  handleSlotClick: (slot: any) => void;
  filterOwnSchedule: boolean;
  user: any;
}

const DayCalendar: React.FC<DayCalendarProps> = ({
  calendarData,
  handleSlotClick,
  filterOwnSchedule,
  user
}) => {
  // Only display days with services for simplicity in the day view
  const daysWithServices = calendarData.filter(day => day.services.length > 0);
  
  return (
    <>
      {daysWithServices.map((day, dayIndex) => (
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
      ))}
    </>
  );
};

export default DayCalendar;
