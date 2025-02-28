
import { isSameDay, format, getDay, parseISO } from "date-fns";
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
  
  // Save initial data to localStorage
  saveCalendarServiceTimes(initialData);
  
  return initialData;
};

// Save service times to localStorage
export const saveCalendarServiceTimes = (serviceTimes: ServiceTime[]): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serviceTimes));
    
    // Dispatch a custom event to notify components that calendar data has changed
    window.dispatchEvent(new CustomEvent('calendar-data-updated'));
  } catch (error) {
    console.error("Error saving service times:", error);
  }
};

// Get service times for a specific day
export const getDailyServiceTimes = (serviceTimes: ServiceTime[], date: Date): ServiceTime[] => {
  // Ensure date is a Date object
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  return serviceTimes.filter(service => {
    // Ensure service.date is a Date object
    const serviceDate = service.date instanceof Date ? service.date : new Date(service.date);
    
    // Check for exact date match
    if (isSameDay(serviceDate, date)) {
      return true;
    }
    
    // Check for recurring events on the same day of week
    if (service.isRecurring && getDay(serviceDate) === getDay(date)) {
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
    date: new Date(date), // Ensure it's a proper Date object
    time,
    name,
    isRecurring,
    positions: 2 // Default to 2 positions for each service
  };
  
  const updatedServiceTimes = [...serviceTimes, newService];
  
  // Save the updated service times to localStorage
  saveCalendarServiceTimes(updatedServiceTimes);
  
  return updatedServiceTimes;
};

// Delete a service time by ID
export const deleteServiceTime = (
  serviceTimes: ServiceTime[],
  serviceId: string
): ServiceTime[] => {
  const updatedServiceTimes = serviceTimes.filter(service => service.id !== serviceId);
  
  // Save the updated service times to localStorage
  saveCalendarServiceTimes(updatedServiceTimes);
  
  return updatedServiceTimes;
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
          date: new Date(nextDate), // Ensure it's a proper Date object
          time: service.time,
          name: service.name,
          isRecurring: false, // Copy as non-recurring
          positions: service.positions
        };
        
        updatedTimes.push(newService);
      }
    });
  });
  
  // Save the updated service times to localStorage
  saveCalendarServiceTimes(updatedTimes);
  
  return updatedTimes;
};

// Get a formatted description for a service
export const getServiceDescription = (service: ServiceTime): string => {
  const dayName = format(service.date, "EEEE", { locale: it });
  return `${service.name} - ${service.time} - ${dayName}`;
};
