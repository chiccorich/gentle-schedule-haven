
import React, { useState, useEffect } from "react";
import { format, addDays, startOfWeek, endOfWeek, addWeeks, getDay, isEqual } from "date-fns";
import { it } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  getCalendarServiceTimes, 
  saveCalendarServiceTimes, 
  ServiceTime, 
  copyWeekSchedule,
  deleteServiceTime,
  getDailyServiceTimes,
  addServiceTime
} from "@/utils/calendarManagement";

const CalendarManagement: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [serviceTimes, setServiceTimes] = useState<ServiceTime[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();

  // Initialize week dates when current date changes
  useEffect(() => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    const dates = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
    setWeekDates(dates);
    
    // Load service times
    const times = getCalendarServiceTimes();
    setServiceTimes(times);
  }, [currentDate]);

  const handlePreviousWeek = () => {
    setCurrentDate(prevDate => addDays(prevDate, -7));
  };

  const handleNextWeek = () => {
    setCurrentDate(prevDate => addDays(prevDate, 7));
  };

  const handleSaveChanges = () => {
    saveCalendarServiceTimes(serviceTimes);
    toast({
      title: "Modifiche Salvate",
      description: "Le modifiche al calendario sono state salvate con successo"
    });
  };

  const handleCopyWeek = () => {
    const nextWeekStart = addWeeks(startOfWeek(currentDate, { weekStartsOn: 1 }), 1);
    const nextWeekDates = Array.from({ length: 7 }, (_, i) => addDays(nextWeekStart, i));
    
    const updatedTimes = copyWeekSchedule(serviceTimes, weekDates, nextWeekDates);
    setServiceTimes(updatedTimes);
    
    toast({
      title: "Settimana Copiata",
      description: "L'orario di questa settimana è stato copiato nella settimana successiva"
    });
  };

  const handleAddService = (day: Date) => {
    setSelectedDay(day);
    setShowAddDialog(true);
  };

  const handleDeleteService = (serviceId: string) => {
    setServiceTimes(deleteServiceTime(serviceTimes, serviceId));
    toast({
      title: "Celebrazione Rimossa",
      description: "La celebrazione è stata rimossa dal calendario"
    });
  };

  const handleConfirmAddService = (time: string, name: string, isRecurring: boolean) => {
    if (!selectedDay) return;
    
    const newServiceTimes = addServiceTime(
      serviceTimes, 
      selectedDay, 
      time, 
      name, 
      isRecurring
    );
    
    setServiceTimes(newServiceTimes);
    setShowAddDialog(false);
    
    toast({
      title: "Celebrazione Aggiunta",
      description: `${name} è stata aggiunta per ${format(selectedDay, "EEEE", { locale: it })}`
    });
  };

  // Format dates for the week header
  const formatWeekRange = () => {
    if (weekDates.length === 0) return "";
    
    const weekStart = format(weekDates[0], "d MMMM", { locale: it });
    const weekEnd = format(weekDates[6], "d MMMM yyyy", { locale: it });
    return `${weekStart} - ${weekEnd}`;
  };

  const getServicesForDay = (date: Date): ServiceTime[] => {
    return getDailyServiceTimes(serviceTimes, date);
  };

  // Display Italian days of the week
  const italianDays = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

  const isSpecialDay = (day: Date): boolean => {
    // Example implementation - in a real app this would check against a list of feast days
    const isSunday = getDay(day) === 0;
    return isSunday;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Gestione Orari Celebrazioni</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="text-xl font-bold">
              Settimana del {formatWeekRange()}
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button 
                onClick={handlePreviousWeek}
                className="text-lg"
                variant="outline"
              >
                Settimana Precedente
              </Button>
              <Button 
                onClick={handleNextWeek}
                className="text-lg"
                variant="outline"
              >
                Settimana Successiva
              </Button>
              <Button 
                onClick={handleCopyWeek}
                className="text-lg"
                variant="outline"
              >
                Copia nella Prossima Settimana
              </Button>
              <Button 
                onClick={() => setPreviewMode(!previewMode)}
                className="text-lg"
                variant={previewMode ? "default" : "outline"}
              >
                {previewMode ? "Chiudi Anteprima" : "Anteprima Modifiche"}
              </Button>
            </div>
          </div>

          {previewMode ? (
            <div className="border rounded-md p-4 bg-gray-50">
              <h3 className="text-xl font-bold mb-4 text-center">Anteprima Calendario</h3>
              <div className="grid grid-cols-7 gap-2">
                {italianDays.map((day, index) => (
                  <div key={`header-${index}`} className="text-center font-bold border-b p-2">
                    {day}
                  </div>
                ))}
                
                {weekDates.map((date, index) => {
                  const dayServices = getServicesForDay(date);
                  const isSpecial = isSpecialDay(date);
                  
                  return (
                    <div 
                      key={`day-${index}`} 
                      className={`border rounded-md p-2 min-h-32 ${isSpecial ? 'bg-amber-50' : ''}`}
                    >
                      <div className={`text-center mb-2 ${isSpecial ? 'font-bold' : ''}`}>
                        {format(date, "d MMM", { locale: it })}
                        {isSpecial && <span className="ml-1 text-amber-600">(Festivo)</span>}
                      </div>
                      
                      {dayServices.length === 0 ? (
                        <div className="text-gray-500 text-center text-sm py-2">
                          Nessuna celebrazione
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {dayServices.map(service => (
                            <div key={service.id} className="text-sm border-b pb-1">
                              <div className="font-medium">{service.name}</div>
                              <div>{service.time}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Giorno</TableHead>
                  <TableHead>Celebrazioni</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weekDates.map((date, index) => {
                  const dayServices = getServicesForDay(date);
                  const isSpecial = isSpecialDay(date);
                  
                  return (
                    <TableRow key={`day-${index}`} className={isSpecial ? "bg-amber-50" : ""}>
                      <TableCell className="font-medium align-top">
                        <div className="text-lg">{italianDays[index]}</div>
                        <div className="text-sm">{format(date, "d MMM", { locale: it })}</div>
                        {isSpecial && <div className="text-amber-600 text-sm font-bold">Giorno Festivo</div>}
                      </TableCell>
                      <TableCell className="align-top">
                        {dayServices.length === 0 ? (
                          <div className="text-gray-500 italic">Nessuna celebrazione programmata</div>
                        ) : (
                          <div className="space-y-3">
                            {dayServices.map(service => (
                              <div key={service.id} className="flex items-center justify-between border-b pb-2">
                                <div>
                                  <div className="font-bold">{service.name}</div>
                                  <div>Orario: {service.time}</div>
                                  {service.isRecurring && (
                                    <div className="text-blue-600 text-sm">
                                      Ricorrente ogni {format(date, "EEEE", { locale: it })}
                                    </div>
                                  )}
                                </div>
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  onClick={() => handleDeleteService(service.id)}
                                  className="ml-2"
                                >
                                  Rimuovi
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right align-top">
                        <Button
                          onClick={() => handleAddService(date)}
                          variant="outline"
                          className="whitespace-nowrap"
                        >
                          Aggiungi Celebrazione
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={handleSaveChanges} 
              size="lg" 
              className="text-xl"
            >
              Salva Modifiche
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog for adding a new service */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Aggiungi Nuova Celebrazione</DialogTitle>
            <DialogDescription className="text-lg">
              {selectedDay && format(selectedDay, "EEEE, d MMMM yyyy", { locale: it })}
            </DialogDescription>
          </DialogHeader>
          
          <AddServiceForm 
            onSubmit={handleConfirmAddService} 
            onClose={() => setShowAddDialog(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Form component for adding a new service time
interface AddServiceFormProps {
  onSubmit: (time: string, name: string, isRecurring: boolean) => void;
  onClose: () => void;
}

const AddServiceForm: React.FC<AddServiceFormProps> = ({ onSubmit, onClose }) => {
  const [time, setTime] = useState('');
  const [name, setName] = useState('Santa Messa');
  const [isRecurring, setIsRecurring] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!time) {
      toast({
        title: "Errore",
        description: "L'orario è obbligatorio",
        variant: "destructive"
      });
      return;
    }
    
    onSubmit(time, name, isRecurring);
  };

  const commonMassTimes = [
    "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", 
    "10:00", "10:30", "11:00", "11:30", "12:00", "17:00",
    "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"
  ];

  const commonMassNames = [
    "Santa Messa", 
    "Santa Messa Festiva", 
    "Santa Messa Prefestiva",
    "Messa per i Bambini",
    "Messa Vespertina",
    "Messa del Mattino",
    "Adorazione Eucaristica",
    "Vespri Solenni"
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="service-name" className="text-lg">Nome Celebrazione</Label>
        <Select value={name} onValueChange={setName}>
          <SelectTrigger id="service-name">
            <SelectValue placeholder="Seleziona tipo di celebrazione" />
          </SelectTrigger>
          <SelectContent>
            {commonMassNames.map(massName => (
              <SelectItem key={massName} value={massName}>{massName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="service-time" className="text-lg">Orario</Label>
        <Select value={time} onValueChange={setTime}>
          <SelectTrigger id="service-time">
            <SelectValue placeholder="Seleziona orario" />
          </SelectTrigger>
          <SelectContent>
            {commonMassTimes.map(time => (
              <SelectItem key={time} value={time}>{time}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center space-x-2 mt-4">
        <Checkbox 
          id="recurring" 
          checked={isRecurring} 
          onCheckedChange={(checked) => setIsRecurring(checked === true)}
        />
        <Label htmlFor="recurring" className="text-lg">
          Ripeti ogni settimana nello stesso giorno
        </Label>
      </div>
      
      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" onClick={onClose}>
          Annulla
        </Button>
        <Button type="submit">
          Aggiungi Celebrazione
        </Button>
      </DialogFooter>
    </form>
  );
};

export default CalendarManagement;
