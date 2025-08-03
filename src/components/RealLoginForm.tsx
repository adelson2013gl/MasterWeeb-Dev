import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { ForgotPasswordModal } from "@/components/ForgotPasswordModal";
import { isError, getErrorMessage } from "@/lib/typeGuards";
import { logger } from "@/lib/logger";

export function RealLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Erro",
        description: "Email é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!password.trim()) {
      toast({
        title: "Erro",
        description: "Senha é obrigatória",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      logger.info('Tentando login', { email }, 'AUTH');
      
      const { error } = await signIn(email, password);
      
      if (error) {
        logger.error('Erro no login', { email, error: getErrorMessage(error) }, 'AUTH');
        
        let errorMessage = "Erro no login";
        const errorMsg = getErrorMessage(error);
        
        if (errorMsg === "Invalid login credentials") {
          errorMessage = "Email ou senha incorretos";
        } else if (errorMsg === "Email not confirmed") {
          errorMessage = "Confirme seu email antes de fazer login";
        } else if (errorMsg === "Too many requests") {
          errorMessage = "Muitas tentativas. Tente novamente em alguns minutos";
        } else {
          errorMessage = errorMsg;
        }
        
        toast({
          title: "Erro no login",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        logger.info('Login realizado com sucesso', { email }, 'AUTH');
        toast({
          title: "Login realizado!",
          description: "Bem-vindo ao sistema",
        });
      }
    } catch (error) {
      logger.error('Erro inesperado no login', { email, error: getErrorMessage(error) }, 'AUTH');
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          placeholder="seu@email.com"
          className="h-11"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          placeholder="Sua senha"
          className="h-11"
        />
      </div>
      
      <Button type="submit" className="w-full h-11" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Entrando...
          </>
        ) : (
          "Entrar"
        )}
      </Button>
      
      <div className="text-center pt-2">
        <ForgotPasswordModal />
      </div>
    </form>
  );
}
