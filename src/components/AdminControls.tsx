
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { MINISTERS, Minister } from "@/utils/calendarHelpers";

const AdminControls: React.FC = () => {
  const [ministers, setMinisters] = useState<Minister[]>([]);
  const [newMinisterName, setNewMinisterName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Load ministers from the helper
    setMinisters([...MINISTERS]);
  }, []);

  const handleAddMinister = () => {
    if (!newMinisterName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for the new minister",
        variant: "destructive"
      });
      return;
    }

    const newMinister: Minister = {
      id: `m-${Date.now()}`, // Generate a simple ID
      name: newMinisterName.trim()
    };

    // Update local state
    setMinisters(prev => [...prev, newMinister]);
    
    // In a real app, you would also update the backend data
    // For this demo, we're just updating the UI
    toast({
      title: "Minister Added",
      description: `${newMinisterName} has been added as a minister`
    });
    
    // Clear the input
    setNewMinisterName("");
  };

  const handleRemoveMinister = (id: string) => {
    // Remove minister from local state
    setMinisters(prev => prev.filter(minister => minister.id !== id));
    
    // In a real app, you would also update the backend data
    toast({
      title: "Minister Removed",
      description: "The minister has been removed from the system"
    });
  };

  const handlePrintSchedule = () => {
    toast({
      title: "Printing Schedule",
      description: "Preparing to print the current schedule"
    });
    
    // In a real app, this would trigger a print-friendly version
    window.print();
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Manage Ministers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="newMinister" className="text-xl">Add New Minister</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="newMinister"
                  value={newMinisterName}
                  onChange={(e) => setNewMinisterName(e.target.value)}
                  placeholder="Enter minister name"
                  className="large-input flex-grow"
                />
                <Button 
                  onClick={handleAddMinister}
                  className="text-xl"
                >
                  Add Minister
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-2">Current Ministers</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xl">Name</TableHead>
                    <TableHead className="text-xl text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ministers.map((minister) => (
                    <TableRow key={minister.id}>
                      <TableCell className="text-xl">{minister.name}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          onClick={() => handleRemoveMinister(minister.id)}
                          className="text-lg"
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Schedule Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handlePrintSchedule} 
            className="text-xl w-full sm:w-auto"
          >
            Print Current Schedule
          </Button>
          
          <div className="text-xl">
            <p>
              More administrative features would be available here, such as:
            </p>
            <ul className="list-disc list-inside mt-2 ml-4 space-y-2">
              <li>Managing service times</li>
              <li>Setting services as not requiring ministers</li>
              <li>Sending reminder emails</li>
              <li>Viewing participation reports</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminControls;
