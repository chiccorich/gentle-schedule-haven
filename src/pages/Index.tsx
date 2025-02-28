
import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Login from "@/components/Login";

const Index: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // If already authenticated, redirect to dashboard
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Login />
    </div>
  );
};

export default Index;
