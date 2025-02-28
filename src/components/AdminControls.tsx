
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
        title: "Errore",
        description: "Inserisci un nome per il nuovo ministro",
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
      title: "Ministro Aggiunto",
      description: `${newMinisterName} è stato aggiunto come ministro eucaristico`
    });
    
    // Clear the input
    setNewMinisterName("");
  };

  const handleRemoveMinister = (id: string) => {
    // Remove minister from local state
    setMinisters(prev => prev.filter(minister => minister.id !== id));
    
    // In a real app, you would also update the backend data
    toast({
      title: "Ministro Rimosso",
      description: "Il ministro è stato rimosso dal sistema"
    });
  };

  const handlePrintSchedule = () => {
    toast({
      title: "Stampa Calendario",
      description: "Preparazione della stampa del calendario"
    });
    
    // In a real app, this would trigger a print-friendly version
    window.print();
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Gestione Ministri Eucaristici</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="newMinister" className="text-xl">Aggiungi Nuovo Ministro</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="newMinister"
                  value={newMinisterName}
                  onChange={(e) => setNewMinisterName(e.target.value)}
                  placeholder="Inserisci nome del ministro"
                  className="large-input flex-grow"
                />
                <Button 
                  onClick={handleAddMinister}
                  className="text-xl"
                >
                  Aggiungi Ministro
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-2">Ministri Attuali</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xl">Nome</TableHead>
                    <TableHead className="text-xl text-right">Azioni</TableHead>
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
                          Rimuovi
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
          <CardTitle className="text-2xl">Opzioni Calendario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handlePrintSchedule} 
            className="text-xl w-full sm:w-auto"
          >
            Stampa Calendario Attuale
          </Button>
          
          <div className="text-xl">
            <p>
              Altre funzionalità amministrative sarebbero disponibili qui, come:
            </p>
            <ul className="list-disc list-inside mt-2 ml-4 space-y-2">
              <li>Gestione orari delle celebrazioni</li>
              <li>Impostare celebrazioni che non richiedono ministri</li>
              <li>Invio email di promemoria</li>
              <li>Visualizzazione dei report di partecipazione</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminControls;
