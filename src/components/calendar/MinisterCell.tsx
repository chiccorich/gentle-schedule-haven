
import React from "react";
import { DayData } from "@/utils/calendarHelpers";

interface MinisterCellProps {
  dayDate: Date;
  serviceId: string;
  position: number;
  calendarData: DayData[];
  handleSlotClick: (slot: any) => void;
  filterOwnSchedule: boolean;
  user: any;
}

const MinisterCell: React.FC<MinisterCellProps> = ({
  dayDate,
  serviceId,
  position,
  calendarData,
  handleSlotClick,
  filterOwnSchedule,
  user
}) => {
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
      className={cellClasses}
      onClick={() => handleSlotClick(slot)}
    >
      <div className="text-lg">{`Servizio ${position}`}</div>
      <div className="text-lg font-medium">{slotText}</div>
    </div>
  );
};

export default MinisterCell;
