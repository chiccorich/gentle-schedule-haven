
import React, { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import Calendar from "@/components/Calendar";
import { initializeSlots } from "@/utils/calendarHelpers";

const Dashboard: React.FC = () => {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  // When Dashboard loads, make sure calendar data is initialized
  useEffect(() => {
    // Initialize calendar slots to ensure they're up to date
    initializeSlots();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };
  
  const handleAdminPage = () => {
    navigate("/admin");
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
              <Button 
                onClick={handleAdminPage} 
                variant="outline"
                className="text-xl"
              >
                Pannello Amministratore
              </Button>
            )}
            <Button 
              onClick={handleLogout} 
              variant="outline"
              className="text-xl"
            >
              Esci
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-6">
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
