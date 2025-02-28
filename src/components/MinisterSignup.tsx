
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
  
  if (!user) {
    onClose();
    return null;
  }

  const serviceName = SERVICES.find(s => s.id === slot.serviceId)?.name || "Service";
  const serviceTime = SERVICES.find(s => s.id === slot.serviceId)?.time || "";
  const isUserAssigned = slot.ministerId === user.id;
  
  const handleSignup = () => {
    if (!user) return;
    
    const success = assignMinister(slot.id, user.id, user.name);
    
    if (success) {
      toast({
        title: "Sign Up Successful",
        description: `You have been assigned to ${serviceName} on ${formatDate(slot.date)}`
      });
      onComplete();
    } else {
      toast({
        title: "Sign Up Failed",
        description: "You may already be assigned to another position in this service",
        variant: "destructive"
      });
      onClose();
    }
  };
  
  const handleCancel = () => {
    if (!user || !isUserAssigned) return;
    
    const success = removeMinister(slot.id);
    
    if (success) {
      toast({
        title: "Assignment Canceled",
        description: `You have been removed from ${serviceName} on ${formatDate(slot.date)}`
      });
      onComplete();
    } else {
      toast({
        title: "Error",
        description: "Failed to cancel your assignment",
        variant: "destructive"
      });
      onClose();
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isUserAssigned ? "Cancel Assignment" : "Sign Up for Service"}
          </DialogTitle>
          <DialogDescription className="text-xl pt-2">
            {serviceName} - {serviceTime}<br />
            {formatDate(slot.date)}<br />
            Position {slot.position}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          <p className="text-xl">
            {isUserAssigned
              ? "Are you sure you want to cancel your assignment for this service?"
              : "Would you like to sign up for this ministry position?"}
          </p>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          <Button variant="outline" onClick={onClose} className="text-xl">
            Cancel
          </Button>
          
          {isUserAssigned ? (
            <Button 
              variant="destructive" 
              onClick={handleCancel}
              className="text-xl"
            >
              Remove Me From This Service
            </Button>
          ) : (
            <Button 
              onClick={handleSignup}
              className="text-xl"
            >
              Confirm Sign Up
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
