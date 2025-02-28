
import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import Calendar from "@/components/Calendar";

const Dashboard: React.FC = () => {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

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
            <h1 className="text-3xl font-bold">Church Ministers Calendar</h1>
            <p className="text-xl text-gray-600">Welcome, {user?.name}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {isAdmin() && (
              <Button 
                onClick={handleAdminPage} 
                variant="outline"
                className="text-xl"
              >
                Admin Dashboard
              </Button>
            )}
            <Button 
              onClick={handleLogout} 
              variant="outline"
              className="text-xl"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="calendar" className="text-xl py-3">
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="my-schedule" className="text-xl py-3">
              My Schedule
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendar">
            <Calendar />
          </TabsContent>
          
          <TabsContent value="my-schedule">
            <div className="p-4 text-center">
              <h2 className="text-2xl font-bold mb-6">My Scheduled Services</h2>
              <p className="text-xl">
                This tab would show only the services you are scheduled for.
              </p>
              <p className="text-xl mt-4">
                In the full application, this would filter the calendar to show only your assignments.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <footer className="bg-gray-100 border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg text-gray-600">Church Ministers Calendar • Tap Help for Instructions</p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
