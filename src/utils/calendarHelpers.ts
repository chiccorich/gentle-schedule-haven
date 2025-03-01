
import { addDays, format, getDay, startOfWeek, subDays } from "date-fns";
import { it } from "date-fns/locale";
import { getCalendarServiceTimes, ServiceTime, getDailyServiceTimes } from "./calendarManagement";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/integrations/supabase/client";

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

// Ministers data will be fetched from Supabase
export let MINISTERS: Minister[] = [];

// Minister slots data will be fetched from Supabase
let MINISTER_SLOTS: MinisterSlot[] = [];

// Load ministers from Supabase
export const loadMinisters = async (): Promise<Minister[]> => {
  try {
    const { data, error } = await supabase
      .from('ministers')
      .select('*');
    
    if (error) {
      console.error("Error loading ministers:", error);
      return [];
    }
    
    MINISTERS = data.map(minister => ({
      id: minister.id,
      name: minister.name
    }));
    
    return MINISTERS;
  } catch (error) {
    console.error("Error loading ministers:", error);
    return [];
  }
};

// Load minister slots from Supabase
export const loadMinisterSlots = async (): Promise<MinisterSlot[]> => {
  try {
    const { data, error } = await supabase
      .from('minister_slots')
      .select(`
        id,
        mass_id,
        minister_id,
        position,
        date,
        ministers(name)
      `);
    
    if (error) {
      console.error("Error loading minister slots:", error);
      return [];
    }
    
    MINISTER_SLOTS = data.map(slot => ({
      id: slot.id,
      serviceId: slot.mass_id,
      date: new Date(slot.date),
      position: slot.position,
      ministerId: slot.minister_id,
      ministerName: slot.ministers?.name
    }));
    
    return MINISTER_SLOTS;
  } catch (error) {
    console.error("Error loading minister slots:", error);
    return [];
  }
};

// Initialize slots for the next 4 weeks
export const initializeSlots = async (): Promise<MinisterSlot[]> => {
  try {
    // Load existing slots first
    await loadMinisterSlots();
    
    const today = new Date();
    // Use Monday as the start of the week
    const startDate = startOfWeek(today, { weekStartsOn: 1 }); 
    const serviceTimes = await getCalendarServiceTimes();
    
    // Create slots for 4 weeks if they don't exist
    for (let i = 0; i < 28; i++) {
      const date = addDays(startDate, i);
      const servicesForDay = getDailyServiceTimes(serviceTimes, date);
      
      if (servicesForDay.length > 0) {
        for (const serviceTime of servicesForDay) {
          for (let position = 1; position <= serviceTime.positions; position++) {
            // Check if slot already exists
            const existingSlot = MINISTER_SLOTS.find(slot => 
              isSameDay(slot.date, date) && 
              slot.serviceId === serviceTime.id && 
              slot.position === position
            );
            
            if (!existingSlot) {
              // Create new slot in Supabase
              const { data, error } = await supabase
                .from('minister_slots')
                .insert([{
                  mass_id: serviceTime.id,
                  date: format(date, 'yyyy-MM-dd'),
                  position: position
                }])
                .select()
                .single();
              
              if (error) {
                console.error("Error creating minister slot:", error);
                continue;
              }
              
              // Add to local array
              MINISTER_SLOTS.push({
                id: data.id,
                serviceId: data.mass_id,
                date: new Date(data.date),
                position: data.position,
                ministerId: data.minister_id,
                ministerName: undefined
              });
            }
          }
        }
      }
    }
    
    return MINISTER_SLOTS;
  } catch (error) {
    console.error("Error initializing slots:", error);
    return [];
  }
};

// Get calendar data for a specific date range
export const getCalendarData = async (startDate: Date, numberOfDays = 21): Promise<DayData[]> => {
  try {
    // Force slots to be initialized/re-initialized
    await initializeSlots();
    
    const result: DayData[] = [];
    const today = new Date();
    // Reset time portion to ensure correct day comparison
    today.setHours(0, 0, 0, 0);
    
    // Get the service times from the calendar management
    const serviceTimes = await getCalendarServiceTimes();
    
    for (let i = 0; i < numberOfDays; i++) {
      const date = addDays(startDate, i);
      // Reset time portion to ensure correct day comparison
      date.setHours(0, 0, 0, 0);
      
      const dayData: DayData = {
        date: new Date(date), // Ensure we have a proper Date object
        isToday: isSameDay(date, today),
        isCurrentMonth: date.getMonth() === today.getMonth(),
        services: [],
      };
      
      // Get services for this specific day
      const servicesForDay = getDailyServiceTimes(serviceTimes, date);
      
      if (servicesForDay.length > 0) {
        // Use the services defined in calendar management
        for (const serviceTime of servicesForDay) {
          const serviceObj: Service = {
            id: serviceTime.id,
            name: serviceTime.name,
            time: serviceTime.time,
            positions: serviceTime.positions
          };
          
          // Find slots for this service and day
          const slotsForService = MINISTER_SLOTS.filter(
            slot => 
              slot.serviceId === serviceTime.id && 
              isSameDay(slot.date, date)
          );
          
          // If no slots found, create them
          if (slotsForService.length === 0) {
            const newSlots: MinisterSlot[] = [];
            
            for (let position = 1; position <= serviceTime.positions; position++) {
              // Create new slot in Supabase
              const { data, error } = await supabase
                .from('minister_slots')
                .insert([{
                  mass_id: serviceTime.id,
                  date: format(date, 'yyyy-MM-dd'),
                  position: position
                }])
                .select()
                .single();
              
              if (error) {
                console.error("Error creating minister slot:", error);
                continue;
              }
              
              const newSlot: MinisterSlot = {
                id: data.id,
                serviceId: data.mass_id,
                date: new Date(data.date),
                position: data.position,
                ministerId: data.minister_id,
                ministerName: undefined
              };
              
              newSlots.push(newSlot);
              MINISTER_SLOTS.push(newSlot);
            }
            
            dayData.services.push({
              service: serviceObj,
              slots: newSlots,
            });
          } else {
            dayData.services.push({
              service: serviceObj,
              slots: slotsForService,
            });
          }
        }
      } else if (getDay(date) === 0) {
        // Fallback to default services for Sundays if no specific services defined
        for (const service of SERVICES) {
          const slotsForService = MINISTER_SLOTS.filter(
            slot => 
              slot.serviceId === service.id && 
              isSameDay(slot.date, date)
          );
          
          dayData.services.push({
            service,
            slots: slotsForService,
          });
        }
      }
      
      result.push(dayData);
    }
    
    return result;
  } catch (error) {
    console.error("Error getting calendar data:", error);
    return [];
  }
};

// Function to reset the calendar data (also clearing assigned ministers)
export const resetCalendarData = async (): Promise<boolean> => {
  try {
    // Clear all minister slots
    const { error: slotsError } = await supabase
      .from('minister_slots')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
    
    if (slotsError) {
      console.error("Error clearing minister slots:", slotsError);
      return false;
    }
    
    // Initialize slots again (will be empty since we cleared masses)
    MINISTER_SLOTS = [];
    await initializeSlots();
    
    // Dispatch event to update calendar UI
    window.dispatchEvent(new CustomEvent('calendar-data-updated'));
    
    return true;
  } catch (error) {
    console.error("Error resetting calendar data:", error);
    return false;
  }
};

// Helper function to compare dates without time
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// Check if a minister is already assigned to any position in a service on a date
export const isMinisterAssignedToService = (
  ministerId: string, 
  serviceId: string, 
  date: Date
): boolean => {
  date = new Date(date);
  date.setHours(0, 0, 0, 0);
  return MINISTER_SLOTS.some(
    slot => 
      slot.serviceId === serviceId && 
      isSameDay(slot.date, date) &&
      slot.ministerId === ministerId
  );
};

// Assign a minister to a slot
export const assignMinister = async (
  slotId: string, 
  ministerId: string, 
  ministerName: string
): Promise<boolean> => {
  try {
    const slotIndex = MINISTER_SLOTS.findIndex(slot => slot.id === slotId);
    
    if (slotIndex === -1) return false;
    
    const slot = MINISTER_SLOTS[slotIndex];
    
    // Check if minister is already assigned to this service
    if (isMinisterAssignedToService(ministerId, slot.serviceId, slot.date)) {
      return false;
    }
    
    // Update in Supabase
    const { error } = await supabase
      .from('minister_slots')
      .update({ minister_id: ministerId })
      .eq('id', slotId);
    
    if (error) {
      console.error("Error assigning minister:", error);
      return false;
    }
    
    // Update the slot locally
    MINISTER_SLOTS[slotIndex] = {
      ...slot,
      ministerId,
      ministerName,
    };
    
    return true;
  } catch (error) {
    console.error("Error assigning minister:", error);
    return false;
  }
};

// Remove a minister from a slot
export const removeMinister = async (slotId: string): Promise<boolean> => {
  try {
    const slotIndex = MINISTER_SLOTS.findIndex(slot => slot.id === slotId);
    
    if (slotIndex === -1) return false;
    
    // Update in Supabase
    const { error } = await supabase
      .from('minister_slots')
      .update({ minister_id: null })
      .eq('id', slotId);
    
    if (error) {
      console.error("Error removing minister:", error);
      return false;
    }
    
    // Update the slot locally
    MINISTER_SLOTS[slotIndex] = {
      ...MINISTER_SLOTS[slotIndex],
      ministerId: undefined,
      ministerName: undefined,
    };
    
    return true;
  } catch (error) {
    console.error("Error removing minister:", error);
    return false;
  }
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
(async () => {
  try {
    await loadMinisters();
    await initializeSlots();
  } catch (error) {
    console.error("Error initializing data:", error);
  }
})();
