
import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import AdminControls from "@/components/AdminControls";

const Admin: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }
  
  // Redirect to dashboard if not an admin
  if (!isAdmin()) {
    return <Navigate to="/dashboard" />;
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };
  
  const handleDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col animate-fade-in">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center">
          <div className="flex flex-col items-center md:items-start mb-4 md:mb-0">
            <h1 className="text-3xl font-bold">Pannello Amministratore</h1>
            <p className="text-xl text-gray-600">Benvenuto, {user?.name}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={handleDashboard} 
              variant="outline"
              className="text-xl"
            >
              Calendario Liturgico
            </Button>
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
        <AdminControls />
      </main>
      
      <footer className="bg-gray-100 border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg text-gray-600">Calendario Ministri Eucaristici • Pannello Amministratore</p>
        </div>
      </footer>
    </div>
  );
};

export default Admin;
