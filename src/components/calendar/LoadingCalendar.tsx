
import React from "react";

const LoadingCalendar: React.FC = () => {
  return (
    <div className="text-center p-8 border rounded-lg bg-gray-50">
      <h3 className="text-2xl font-bold mb-4">Caricamento Calendario</h3>
      <p className="text-xl">
        Stiamo caricando i dati del calendario, attendere prego...
      </p>
    </div>
  );
};

export default LoadingCalendar;
