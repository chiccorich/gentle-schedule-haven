
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Compila tutti i campi",
        description: "Username e password sono obbligatori",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await login(username, password, remember);
      
      if (success) {
        toast({
          title: "Accesso effettuato",
          description: "Benvenuto al Calendario Ministri Eucaristici",
        });
        navigate("/dashboard");
      } else {
        toast({
          title: "Accesso fallito",
          description: "Controlla username e password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Errore di accesso",
        description: "Si è verificato un errore imprevisto",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 animate-fade-in">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Calendario Ministri Eucaristici</CardTitle>
          <CardDescription className="text-xl mt-2">Accedi per continuare</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xl">Nome Utente</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="large-input"
                placeholder="Inserisci nome utente"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xl">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="large-input"
                placeholder="Inserisci password"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remember" 
                checked={remember} 
                onCheckedChange={(checked) => setRemember(checked === true)}
                className="large-checkbox"
              />
              <Label htmlFor="remember" className="text-xl">Ricordami su questo dispositivo</Label>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full text-2xl py-6"
          >
            {isLoading ? "Accesso in corso..." : "Accedi"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
