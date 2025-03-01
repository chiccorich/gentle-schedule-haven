
import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import Calendar from "@/components/Calendar";
import { initializeSlots, resetCalendarData } from "@/utils/calendarHelpers";
import { clearAllServices } from "@/utils/calendarManagement";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Dashboard: React.FC = () => {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  // When Dashboard loads, make sure calendar data is initialized
  useEffect(() => {
    // Initialize calendar slots to ensure they're up to date
    const initializeData = async () => {
      setIsLoading(true);
      try {
        await initializeSlots();
        
        // Dispatch event to ensure calendar is up to date
        window.dispatchEvent(new CustomEvent('calendar-data-updated'));
      } catch (error) {
        console.error("Error initializing data:", error);
        toast({
          title: "Errore",
          description: "Si è verificato un errore durante l'inizializzazione del calendario",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeData();
  }, []);

  const handleLogout = async () => {
    try {
      // Use Supabase for logout
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Also call our custom logout to update local state
      logout();
      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il logout",
        variant: "destructive"
      });
    }
  };
  
  const handleAdminPage = () => {
    navigate("/admin");
  };
  
  const handleResetCalendar = async () => {
    if (isAdmin()) {
      setIsLoading(true);
      try {
        await clearAllServices();
        await resetCalendarData();
        toast({
          title: "Calendario Resettato",
          description: "Tutte le messe sono state cancellate dal calendario",
        });
      } catch (error) {
        console.error("Error resetting calendar:", error);
        toast({
          title: "Errore",
          description: "Si è verificato un errore durante il reset del calendario",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col animate-fade-in">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center">
          <div className="flex flex-col items-center md:items-start mb-4 md:mb-0">
            <h1 className="text-3xl font-bold">Calendario Ministri Eucaristici</h1>
            <p className="text-xl text-gray-600">Benvenuto, {user?.name}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {isAdmin() && (
              <>
                <Button 
                  onClick={handleAdminPage} 
                  variant="outline"
                  className="text-xl"
                  disabled={isLoading}
                >
                  Pannello Amministratore
                </Button>
                <Button 
                  onClick={handleResetCalendar} 
                  variant="destructive"
                  className="text-xl"
                  disabled={isLoading}
                >
                  Reset Calendario
                </Button>
              </>
            )}
            <Button 
              onClick={handleLogout} 
              variant="outline"
              className="text-xl"
              disabled={isLoading}
            >
              Esci
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-2xl text-gray-600">Caricamento calendario...</div>
          </div>
        ) : (
          <Tabs defaultValue="calendar" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="calendar" className="text-xl py-3">
                Calendario Completo
              </TabsTrigger>
              <TabsTrigger value="my-schedule" className="text-xl py-3">
                I Miei Servizi
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="calendar">
              <Calendar />
            </TabsContent>
            
            <TabsContent value="my-schedule">
              <Calendar filterOwnSchedule={true} />
            </TabsContent>
          </Tabs>
        )}
      </main>
      
      <footer className="bg-gray-100 border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg text-gray-600">Calendario Ministri Eucaristici • Tocca Aiuto per Istruzioni</p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
