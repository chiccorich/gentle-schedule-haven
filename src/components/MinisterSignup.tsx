
import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { 
  MinisterSlot, 
  assignMinister, 
  removeMinister, 
  formatDate, 
  SERVICES 
} from "@/utils/calendarHelpers";

interface MinisterSignupProps {
  slot: MinisterSlot;
  onClose: () => void;
  onComplete: () => void;
}

export const MinisterSignup: React.FC<MinisterSignupProps> = ({ 
  slot, 
  onClose, 
  onComplete 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  
  if (!user) {
    onClose();
    return null;
  }

  const serviceName = SERVICES.find(s => s.id === slot.serviceId)?.name || "Santa Messa";
  const serviceTime = SERVICES.find(s => s.id === slot.serviceId)?.time || "";
  const isUserAssigned = slot.ministerId === user.id;
  
  const handleSignup = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const success = await assignMinister(slot.id, user.id, user.name);
      
      if (success) {
        toast({
          title: "Iscrizione Confermata",
          description: `Sei stato assegnato alla ${serviceName} del ${formatDate(slot.date)}`
        });
        onComplete();
      } else {
        toast({
          title: "Iscrizione Fallita",
          description: "Potresti essere già assegnato ad un altro servizio in questa celebrazione",
          variant: "destructive"
        });
        onClose();
      }
    } catch (error) {
      console.error("Error during signup:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'iscrizione",
        variant: "destructive"
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = async () => {
    if (!user || !isUserAssigned) return;
    
    setLoading(true);
    try {
      const success = await removeMinister(slot.id);
      
      if (success) {
        toast({
          title: "Servizio Cancellato",
          description: `Sei stato rimosso dalla ${serviceName} del ${formatDate(slot.date)}`
        });
        onComplete();
      } else {
        toast({
          title: "Errore",
          description: "Impossibile cancellare il tuo servizio",
          variant: "destructive"
        });
        onClose();
      }
    } catch (error) {
      console.error("Error during cancellation:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la cancellazione",
        variant: "destructive"
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isUserAssigned ? "Cancella Servizio" : "Conferma Disponibilità"}
          </DialogTitle>
          <DialogDescription className="text-xl pt-2">
            {serviceName} - {serviceTime}<br />
            {formatDate(slot.date)}<br />
            Servizio {slot.position}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          <p className="text-xl">
            {isUserAssigned
              ? "Sei sicuro di voler cancellare la tua disponibilità per questo servizio?"
              : "Vuoi confermare la tua disponibilità per questo servizio?"}
          </p>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          <Button variant="outline" onClick={onClose} className="text-xl" disabled={loading}>
            Annulla
          </Button>
          
          {isUserAssigned ? (
            <Button 
              variant="destructive" 
              onClick={handleCancel}
              className="text-xl"
              disabled={loading}
            >
              Rimuovi Il Mio Servizio
            </Button>
          ) : (
            <Button 
              onClick={handleSignup}
              className="text-xl"
              disabled={loading}
            >
              Conferma Disponibilità
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
