
import { isSameDay, format, getDay } from "date-fns";
import { it } from "date-fns/locale";
import { v4 as uuidv4 } from 'uuid';

export interface ServiceTime {
  id: string;
  date: Date;
  time: string;
  name: string;
  isRecurring: boolean;
  positions: number;
}

// Mock storage for service times
const LOCAL_STORAGE_KEY = 'liturgical-calendar-service-times';

// Load service times from localStorage or create initial data
export const getCalendarServiceTimes = (): ServiceTime[] => {
  try {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      // Convert string dates back to Date objects
      return parsedData.map((item: any) => ({
        ...item,
        date: new Date(item.date)
      }));
    }
  } catch (error) {
    console.error("Error loading service times:", error);
  }
  
  // Create some initial demo data
  const today = new Date();
  const sunday = new Date(today);
  
  // Set to next Sunday
  sunday.setDate(today.getDate() + (7 - today.getDay()) % 7);
  
  const initialData: ServiceTime[] = [
    {
      id: uuidv4(),
      date: sunday,
      time: "09:00",
      name: "Santa Messa Mattutina",
      isRecurring: true,
      positions: 2
    },
    {
      id: uuidv4(),
      date: sunday,
      time: "18:00",
      name: "Santa Messa Vespertina",
      isRecurring: true,
      positions: 2
    }
  ];
  
  return initialData;
};

// Save service times to localStorage
export const saveCalendarServiceTimes = (serviceTimes: ServiceTime[]): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serviceTimes));
  } catch (error) {
    console.error("Error saving service times:", error);
  }
};

// Get service times for a specific day
export const getDailyServiceTimes = (serviceTimes: ServiceTime[], date: Date): ServiceTime[] => {
  return serviceTimes.filter(service => {
    // Check for exact date match
    if (isSameDay(service.date, date)) {
      return true;
    }
    
    // Check for recurring events on the same day of week
    if (service.isRecurring && getDay(service.date) === getDay(date)) {
      return true;
    }
    
    return false;
  });
};

// Add a new service time
export const addServiceTime = (
  serviceTimes: ServiceTime[],
  date: Date,
  time: string,
  name: string,
  isRecurring: boolean
): ServiceTime[] => {
  const newService: ServiceTime = {
    id: uuidv4(),
    date,
    time,
    name,
    isRecurring,
    positions: 2 // Default to 2 positions for each service
  };
  
  return [...serviceTimes, newService];
};

// Delete a service time by ID
export const deleteServiceTime = (
  serviceTimes: ServiceTime[],
  serviceId: string
): ServiceTime[] => {
  return serviceTimes.filter(service => service.id !== serviceId);
};

// Copy the schedule from current week to next week
export const copyWeekSchedule = (
  serviceTimes: ServiceTime[],
  currentWeekDates: Date[],
  nextWeekDates: Date[]
): ServiceTime[] => {
  let updatedTimes = [...serviceTimes];
  
  // For each day in the current week
  currentWeekDates.forEach((currentDate, index) => {
    const nextDate = nextWeekDates[index];
    const servicesForDay = getDailyServiceTimes(serviceTimes, currentDate);
    
    // Create copies of each service for the new week
    servicesForDay.forEach(service => {
      // Skip recurring services, they'll show up automatically
      if (service.isRecurring) return;
      
      // Check if this exact service already exists in next week
      const alreadyExists = updatedTimes.some(s => 
        isSameDay(s.date, nextDate) && 
        s.time === service.time && 
        s.name === service.name
      );
      
      if (!alreadyExists) {
        const newService: ServiceTime = {
          id: uuidv4(),
          date: nextDate,
          time: service.time,
          name: service.name,
          isRecurring: false, // Copy as non-recurring
          positions: service.positions
        };
        
        updatedTimes.push(newService);
      }
    });
  });
  
  return updatedTimes;
};

// Get a formatted description for a service
export const getServiceDescription = (service: ServiceTime): string => {
  const dayName = format(service.date, "EEEE", { locale: it });
  return `${service.name} - ${service.time} - ${dayName}`;
};
