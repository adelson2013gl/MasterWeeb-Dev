
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Mail } from "lucide-react";

export function ForgotPasswordModal() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const sanitizeEmail = (emailInput: string): string => {
    return emailInput.trim().toLowerCase();
  };

  const isValidEmail = (emailInput: string): boolean => {
    const sanitizedEmail = sanitizeEmail(emailInput);
    
    console.log('ForgotPasswordModal: Validando email:', {
      original: `"${emailInput}"`,
      sanitized: `"${sanitizedEmail}"`,
      length: sanitizedEmail.length
    });

    if (!sanitizedEmail || sanitizedEmail.length === 0) {
      console.log('ForgotPasswordModal: Email vazio após sanitização');
      return false;
    }

    // Validação simples de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(sanitizedEmail)) {
      console.log('ForgotPasswordModal: Formato de email inválido:', sanitizedEmail);
      return false;
    }

    return true;
  };

  const getRedirectUrl = (): string => {
    const currentHost = window.location.origin;
    const resetPath = '/reset-password';
    const fullUrl = `${currentHost}${resetPath}`;
    
    console.log('ForgotPasswordModal: Configurando URL de redirecionamento:', {
      currentHost,
      resetPath,
      fullUrl,
      isProduction: currentHost.includes('lovable.app')
    });
    
    return fullUrl;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('ForgotPasswordModal: === INICIANDO PROCESSO DE RESET ===');
    console.log('ForgotPasswordModal: Email do formulário:', `"${email}"`);
    
    // Verificação simplificada
    if (!email.trim()) {
      console.log('ForgotPasswordModal: Campo email está vazio');
      toast({
        title: "Erro",
        description: "Por favor, digite seu email",
        variant: "destructive",
      });
      return;
    }
    
    if (!isValidEmail(email)) {
      console.log('ForgotPasswordModal: Email inválido');
      toast({
        title: "Erro", 
        description: "Por favor, digite um email válido",
        variant: "destructive",
      });
      return;
    }

    const sanitizedEmail = sanitizeEmail(email);
    const redirectUrl = getRedirectUrl();

    setLoading(true);

    try {
      console.log('ForgotPasswordModal: === ENVIANDO PARA SUPABASE ===');
      console.log('ForgotPasswordModal: Email sanitizado:', sanitizedEmail);
      console.log('ForgotPasswordModal: URL de redirecionamento:', redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
        redirectTo: redirectUrl,
      });
      
      if (error) {
        console.error('ForgotPasswordModal: === ERRO DO SUPABASE ===');
        console.error('ForgotPasswordModal: Erro completo:', error);
        
        let errorMessage = "Erro ao enviar email de recuperação";
        
        if (error.message === "For security purposes, you can only request this once every 60 seconds") {
          errorMessage = "Por segurança, você só pode solicitar um novo email a cada 60 segundos";
        } else if (error.message.includes("rate limit")) {
          errorMessage = "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente";
        } else if (error.message.includes("Invalid email")) {
          errorMessage = "Email inválido. Verifique se digitou corretamente";
        }
        
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        console.log('ForgotPasswordModal: === SUCESSO ===');
        console.log('ForgotPasswordModal: Email enviado para:', sanitizedEmail);
        
        toast({
          title: "Email enviado!",
          description: "Verifique sua caixa de entrada e spam para redefinir sua senha.",
        });
        setEmail("");
        setOpen(false);
      }
    } catch (error: any) {
      console.error('ForgotPasswordModal: === ERRO INESPERADO ===');
      console.error('ForgotPasswordModal: Erro:', error);
      
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    console.log('ForgotPasswordModal: Email alterado para:', `"${newEmail}"`);
    setEmail(newEmail);
  };

  // Verificação simples para habilitar o botão
  const canSubmit = email.trim().length > 0 && !loading;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link" className="p-0 h-auto text-sm text-muted-foreground hover:text-primary">
          Esqueci minha senha
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Recuperar Senha
          </DialogTitle>
          <DialogDescription>
            Digite seu email para receber um link de recuperação de senha.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input
              id="reset-email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              disabled={loading}
              placeholder="seu@email.com"
              autoComplete="email"
              className={loading ? "opacity-50" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Certifique-se de que o email está correto
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={!canSubmit}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Email"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
