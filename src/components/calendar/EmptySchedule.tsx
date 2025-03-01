
import React from "react";

const EmptySchedule: React.FC = () => {
  return (
    <div className="text-center p-8 border rounded-lg bg-gray-50">
      <h3 className="text-2xl font-bold mb-4">Nessun Servizio Programmato</h3>
      <p className="text-xl">
        Al momento non sei iscritto a nessun servizio.
      </p>
      <p className="text-xl mt-4">
        Vai alla vista Calendario per iscriverti ai servizi disponibili.
      </p>
    </div>
  );
};

export default EmptySchedule;
