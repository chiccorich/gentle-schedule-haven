
import { addDays, format, getDay, startOfWeek, subDays } from "date-fns";
import { it } from "date-fns/locale";
import { getCalendarServiceTimes, ServiceTime, getDailyServiceTimes } from "./calendarManagement";

export interface Minister {
  id: string;
  name: string;
}

export interface Service {
  id: string;
  name: string;
  time: string;
  positions: number;
}

export interface MinisterSlot {
  id: string;
  serviceId: string;
  date: Date;
  position: number;
  ministerId?: string;
  ministerName?: string;
}

export interface DayData {
  date: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
  services: {
    service: Service;
    slots: MinisterSlot[];
  }[];
}

// Default services for fallback
export const SERVICES: Service[] = [
  { id: "1", name: "Santa Messa Mattutina", time: "9:00", positions: 2 },
  { id: "2", name: "Santa Messa Serale", time: "18:00", positions: 2 },
];

// Mock ministers data
export const MINISTERS: Minister[] = [
  { id: "1", name: "Giovanni Bianchi" },
  { id: "2", name: "Maria Rossi" },
  { id: "3", name: "Roberto Verdi" },
  { id: "4", name: "Patrizia Neri" },
  { id: "5", name: "Michele Russo" },
];

// Mock minister slots data
let MINISTER_SLOTS: MinisterSlot[] = [];

// Initialize slots for the next 4 weeks
export const initializeSlots = () => {
  MINISTER_SLOTS = [];
  const today = new Date();
  const startDate = startOfWeek(today, { weekStartsOn: 0 }); // Sunday start
  const serviceTimes = getCalendarServiceTimes();
  
  // Create slots for 4 weeks
  for (let i = 0; i < 28; i++) {
    const date = addDays(startDate, i);
    const servicesForDay = getDailyServiceTimes(serviceTimes, date);
    
    if (servicesForDay.length > 0) {
      servicesForDay.forEach(serviceTime => {
        for (let position = 1; position <= serviceTime.positions; position++) {
          MINISTER_SLOTS.push({
            id: `slot-${date.toISOString()}-${serviceTime.id}-${position}`,
            serviceId: serviceTime.id,
            date: date,
            position: position,
          });
        }
      });
    } else if (getDay(date) === 0) {
      // Fallback to default services for Sundays if no specific services defined
      SERVICES.forEach(service => {
        for (let position = 1; position <= service.positions; position++) {
          MINISTER_SLOTS.push({
            id: `slot-${date.toISOString()}-${service.id}-${position}`,
            serviceId: service.id,
            date: date,
            position: position,
          });
        }
      });
    }
  }
  
  // Add some example assignments
  if (MINISTER_SLOTS.length > 0) {
    MINISTER_SLOTS[0].ministerId = "1";
    MINISTER_SLOTS[0].ministerName = "Giovanni Bianchi";
    
    if (MINISTER_SLOTS.length > 2) {
      MINISTER_SLOTS[2].ministerId = "2";
      MINISTER_SLOTS[2].ministerName = "Maria Rossi";
    }
  }
  
  return MINISTER_SLOTS;
};

// Get calendar data for a specific date range
export const getCalendarData = (startDate: Date, numberOfDays = 21): DayData[] => {
  const result: DayData[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get the service times from the calendar management
  const serviceTimes = getCalendarServiceTimes();
  
  for (let i = 0; i < numberOfDays; i++) {
    const date = addDays(startDate, i);
    date.setHours(0, 0, 0, 0);
    
    const dayData: DayData = {
      date,
      isToday: date.getTime() === today.getTime(),
      isCurrentMonth: date.getMonth() === today.getMonth(),
      services: [],
    };
    
    // Get services for this specific day
    const servicesForDay = getDailyServiceTimes(serviceTimes, date);
    
    if (servicesForDay.length > 0) {
      // Use the services defined in calendar management
      servicesForDay.forEach(serviceTime => {
        const serviceObj: Service = {
          id: serviceTime.id,
          name: serviceTime.name,
          time: serviceTime.time,
          positions: serviceTime.positions
        };
        
        const slotsForService = MINISTER_SLOTS.filter(
          slot => 
            slot.serviceId === serviceTime.id && 
            slot.date.getTime() === date.getTime()
        );
        
        dayData.services.push({
          service: serviceObj,
          slots: slotsForService,
        });
      });
    } else if (getDay(date) === 0) {
      // Fallback to default services for Sundays if no specific services defined
      SERVICES.forEach(service => {
        const slotsForService = MINISTER_SLOTS.filter(
          slot => 
            slot.serviceId === service.id && 
            slot.date.getTime() === date.getTime()
        );
        
        dayData.services.push({
          service,
          slots: slotsForService,
        });
      });
    }
    
    result.push(dayData);
  }
  
  return result;
};

// Check if a minister is already assigned to any position in a service on a date
export const isMinisterAssignedToService = (
  ministerId: string, 
  serviceId: string, 
  date: Date
): boolean => {
  date.setHours(0, 0, 0, 0);
  return MINISTER_SLOTS.some(
    slot => 
      slot.serviceId === serviceId && 
      slot.date.getTime() === date.getTime() &&
      slot.ministerId === ministerId
  );
};

// Assign a minister to a slot
export const assignMinister = (
  slotId: string, 
  ministerId: string, 
  ministerName: string
): boolean => {
  const slotIndex = MINISTER_SLOTS.findIndex(slot => slot.id === slotId);
  
  if (slotIndex === -1) return false;
  
  const slot = MINISTER_SLOTS[slotIndex];
  
  // Check if minister is already assigned to this service
  if (isMinisterAssignedToService(ministerId, slot.serviceId, slot.date)) {
    return false;
  }
  
  // Update the slot
  MINISTER_SLOTS[slotIndex] = {
    ...slot,
    ministerId,
    ministerName,
  };
  
  return true;
};

// Remove a minister from a slot
export const removeMinister = (slotId: string): boolean => {
  const slotIndex = MINISTER_SLOTS.findIndex(slot => slot.id === slotId);
  
  if (slotIndex === -1) return false;
  
  // Update the slot by removing the minister
  MINISTER_SLOTS[slotIndex] = {
    ...MINISTER_SLOTS[slotIndex],
    ministerId: undefined,
    ministerName: undefined,
  };
  
  return true;
};

// Format date for display
export const formatDate = (date: Date): string => {
  return format(date, "d MMMM yyyy", { locale: it });
};

// Format day for display
export const formatDay = (date: Date): string => {
  return format(date, "EEE, d MMM", { locale: it });
};

// Get the previous week
export const getPreviousWeek = (currentStart: Date): Date => {
  return subDays(currentStart, 7);
};

// Get the next week
export const getNextWeek = (currentStart: Date): Date => {
  return addDays(currentStart, 7);
};

// Initialize the minister slots
initializeSlots();
