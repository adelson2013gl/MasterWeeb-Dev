
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCheck, Shield } from "lucide-react";
import { toast } from "sonner";

interface LoginFormProps {
  onLogin: (type: "admin" | "entregador") => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (type: "admin" | "entregador") => {
    setLoading(true);
    
    // Demo login - em produção, conectar com Supabase
    setTimeout(() => {
      if (
        (type === "admin" && email === "admin@teste.com" && password === "123456") ||
        (type === "entregador" && email === "entregador@teste.com" && password === "123456")
      ) {
        toast.success(`Login realizado como ${type}`);
        onLogin(type);
      } else {
        toast.error("Credenciais inválidas");
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <Tabs defaultValue="entregador" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="entregador">
          <UserCheck className="h-4 w-4 mr-2" />
          Entregador
        </TabsTrigger>
        <TabsTrigger value="admin">
          <Shield className="h-4 w-4 mr-2" />
          Administrador
        </TabsTrigger>
      </TabsList>

      <TabsContent value="entregador" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email-entregador">Email</Label>
          <Input
            id="email-entregador"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password-entregador">Senha</Label>
          <Input
            id="password-entregador"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button 
          className="w-full" 
          onClick={() => handleSubmit("entregador")}
          disabled={loading}
        >
          {loading ? "Entrando..." : "Entrar como Entregador"}
        </Button>
      </TabsContent>

      <TabsContent value="admin" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email-admin">Email</Label>
          <Input
            id="email-admin"
            type="email"
            placeholder="admin@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password-admin">Senha</Label>
          <Input
            id="password-admin"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button 
          className="w-full" 
          onClick={() => handleSubmit("admin")}
          disabled={loading}
        >
          {loading ? "Entrando..." : "Entrar como Admin"}
        </Button>
      </TabsContent>
    </Tabs>
  );
}
