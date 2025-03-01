
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DayData, getWeekStart } from "@/utils/calendarHelpers";
import { format, endOfWeek } from "date-fns";
import { it } from "date-fns/locale";
import MinisterCell from "./MinisterCell";

interface CalendarGridProps {
  weeks: DayData[][];
  handleSlotClick: (slot: any) => void;
  filterOwnSchedule: boolean;
  user: any;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  weeks,
  handleSlotClick,
  filterOwnSchedule,
  user
}) => {
  // Italian days of the week - rearranged to start with Monday
  const italianDays = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

  // Format dates for week headers
  const formatWeekRange = (startOfWeekDate: Date) => {
    const weekStart = format(startOfWeekDate, "d MMMM", { locale: it });
    const weekEnd = format(endOfWeek(startOfWeekDate, { weekStartsOn: 1 }), "d MMMM yyyy", { locale: it });
    return `${weekStart} - ${weekEnd}`;
  };

  return (
    <>
      {weeks.map((week, weekIndex) => {
        // Get Monday of this week for the week header
        const mondayOfWeek = week.find(day => day.date.getDay() === 1)?.date || 
                          getWeekStart(week[0].date, 1);
        
        return (
          <Card key={`week-${weekIndex}`} className="mb-8 overflow-hidden print:mb-4 print:break-inside-avoid">
            <CardContent className="p-0">
              <div className="calendar-header text-center p-4 text-2xl">
                Settimana del {formatWeekRange(mondayOfWeek)}
              </div>
              
              <div className="grid grid-cols-7 border-b print:text-base">
                {/* Day headers */}
                {italianDays.map((day) => (
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
                          <MinisterCell
                            dayDate={day.date}
                            serviceId={serviceData.service.id}
                            position={positionIndex + 1}
                            calendarData={[day]}
                            handleSlotClick={handleSlotClick}
                            filterOwnSchedule={filterOwnSchedule}
                            user={user}
                          />
                        </div>
                      ))}
                    </React.Fragment>
                  ));
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </>
  );
};

export default CalendarGrid;
