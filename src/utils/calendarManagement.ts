
import { isSameDay, format, getDay, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/integrations/supabase/client";

export interface ServiceTime {
  id: string;
  date: Date;
  time: string;
  name: string;
  isRecurring: boolean;
  positions: number;
}

// Get service times from Supabase
export const getCalendarServiceTimes = async (): Promise<ServiceTime[]> => {
  try {
    const { data, error } = await supabase
      .from('masses')
      .select('*');
    
    if (error) {
      console.error("Error loading service times:", error);
      return [];
    }
    
    // Convert database records to ServiceTime objects
    return data.map((item) => ({
      id: item.id,
      date: new Date(item.date),
      time: item.time.slice(0, 5), // Format time to HH:MM
      name: item.name,
      isRecurring: item.is_recurring,
      positions: item.positions
    }));
  } catch (error) {
    console.error("Error loading service times:", error);
    return [];
  }
};

// Save service times to Supabase
export const saveCalendarServiceTimes = async (serviceTimes: ServiceTime[]): Promise<void> => {
  try {
    // This is a more complex operation - we'll need to determine what changed
    // For simplicity, we'll implement just add/remove operations

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

// Add a new service time to Supabase
export const addServiceTime = async (
  date: Date,
  time: string,
  name: string,
  isRecurring: boolean
): Promise<ServiceTime | null> => {
  try {
    const { data, error } = await supabase
      .from('masses')
      .insert([
        { 
          date: format(date, 'yyyy-MM-dd'), 
          time: time, 
          name: name, 
          is_recurring: isRecurring,
          positions: 2 // Default to 2 positions for each service
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error("Error adding service time:", error);
      return null;
    }
    
    // Return the new service with the Date object
    return {
      id: data.id,
      date: new Date(data.date),
      time: data.time.slice(0, 5),
      name: data.name,
      isRecurring: data.is_recurring,
      positions: data.positions
    };
  } catch (error) {
    console.error("Error adding service time:", error);
    return null;
  }
};

// Delete a service time by ID
export const deleteServiceTime = async (serviceId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('masses')
      .delete()
      .eq('id', serviceId);
    
    if (error) {
      console.error("Error deleting service time:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting service time:", error);
    return false;
  }
};

// Copy the schedule from current week to next week
export const copyWeekSchedule = async (
  currentWeekDates: Date[],
  nextWeekDates: Date[]
): Promise<boolean> => {
  try {
    // Get all services for the current week
    const serviceTimes = await getCalendarServiceTimes();
    const newServices = [];
    
    // For each day in the current week
    for (let i = 0; i < currentWeekDates.length; i++) {
      const currentDate = currentWeekDates[i];
      const nextDate = nextWeekDates[i];
      const servicesForDay = getDailyServiceTimes(serviceTimes, currentDate);
      
      // Create copies of each service for the new week
      for (const service of servicesForDay) {
        // Skip recurring services, they'll show up automatically
        if (service.isRecurring) continue;
        
        // Check if this exact service already exists in next week
        const alreadyExists = serviceTimes.some(s => 
          isSameDay(s.date, nextDate) && 
          s.time === service.time && 
          s.name === service.name
        );
        
        if (!alreadyExists) {
          newServices.push({ 
            date: format(nextDate, 'yyyy-MM-dd'), 
            time: service.time, 
            name: service.name, 
            is_recurring: false, // Copy as non-recurring
            positions: service.positions
          });
        }
      }
    }
    
    // Insert all new services at once
    if (newServices.length > 0) {
      const { error } = await supabase
        .from('masses')
        .insert(newServices);
      
      if (error) {
        console.error("Error copying week schedule:", error);
        return false;
      }
    }
    
    // Dispatch an event to update the UI
    window.dispatchEvent(new CustomEvent('calendar-data-updated'));
    
    return true;
  } catch (error) {
    console.error("Error copying week schedule:", error);
    return false;
  }
};

// Get a formatted description for a service
export const getServiceDescription = (service: ServiceTime): string => {
  const dayName = format(service.date, "EEEE", { locale: it });
  return `${service.name} - ${service.time} - ${dayName}`;
};

// Function to clear all services
export const clearAllServices = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('masses')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
    
    if (error) {
      console.error("Error clearing all services:", error);
      return false;
    }
    
    console.log("All masses have been cleared");
    // Dispatch an event to update the UI
    window.dispatchEvent(new CustomEvent('calendar-data-updated'));
    return true;
  } catch (error) {
    console.error("Error clearing all services:", error);
    return false;
  }
};
