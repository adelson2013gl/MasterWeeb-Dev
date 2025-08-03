
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Eye, EyeOff, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { updatePassword } = useAuth();

  useEffect(() => {
    console.log('ResetPassword: === INICIANDO VERIFICAÇÃO DE TOKEN ===');
    console.log('ResetPassword: URL completa:', window.location.href);
    console.log('ResetPassword: Hash:', window.location.hash);
    console.log('ResetPassword: Search:', window.location.search);
    
    const validateTokens = async () => {
      try {
        // Verificar se veio de um link direto do Supabase
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        // Tentar pegar tokens de diferentes lugares
        let accessToken = urlParams.get('access_token') || hashParams.get('access_token');
        let refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
        const type = urlParams.get('type') || hashParams.get('type');
        const token = urlParams.get('token');
        
        console.log('ResetPassword: === TOKENS ENCONTRADOS ===');
        console.log('ResetPassword: Access Token presente:', !!accessToken);
        console.log('ResetPassword: Refresh Token presente:', !!refreshToken);
        console.log('ResetPassword: Type:', type);
        console.log('ResetPassword: Token hash:', token ? token.substring(0, 10) + '...' : 'null');
        
        // Se temos um token de verificação do link de email, precisamos trocar por tokens de sessão
        if (token && type === 'recovery' && !accessToken) {
          console.log('ResetPassword: === CONVERTENDO TOKEN DE VERIFICAÇÃO ===');
          
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery'
          });
          
          if (error) {
            console.error('ResetPassword: Erro ao verificar token:', error);
            throw error;
          }
          
          if (data.session) {
            console.log('ResetPassword: Token convertido com sucesso');
            accessToken = data.session.access_token;
            refreshToken = data.session.refresh_token;
          }
        }
        
        // Verificar se há tokens válidos para recuperação de senha
        const hasValidTokens = accessToken && refreshToken;
        const isRecoveryType = type === 'recovery';
        
        console.log('ResetPassword: === VALIDAÇÃO FINAL ===');
        console.log('ResetPassword: Tem tokens válidos:', hasValidTokens);
        console.log('ResetPassword: É tipo recovery:', isRecoveryType);
        
        if (!hasValidTokens || !isRecoveryType) {
          console.log('ResetPassword: === TOKEN INVÁLIDO ===');
          setTokenValid(false);
          toast({
            title: "Link inválido",
            description: "O link de redefinição de senha é inválido ou expirou. Solicite um novo link.",
            variant: "destructive",
          });
          setTimeout(() => navigate('/'), 3000);
          return;
        }
        
        console.log('ResetPassword: === DEFININDO SESSÃO ===');
        
        // Definir a sessão com os tokens encontrados
        const { data: sessionData, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        
        if (error) {
          console.error('ResetPassword: === ERRO AO DEFINIR SESSÃO ===');
          console.error('ResetPassword: Erro:', error);
          
          setTokenValid(false);
          toast({
            title: "Erro na sessão",
            description: "Não foi possível processar o link de recuperação. Solicite um novo link.",
            variant: "destructive",
          });
          setTimeout(() => navigate('/'), 3000);
        } else {
          console.log('ResetPassword: === SESSÃO DEFINIDA COM SUCESSO ===');
          console.log('ResetPassword: User ID:', sessionData.session?.user?.id);
          
          setTokenValid(true);
        }
        
      } catch (error) {
        console.error('ResetPassword: === ERRO INESPERADO NA VALIDAÇÃO ===');
        console.error('ResetPassword: Erro:', error);
        
        setTokenValid(false);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao processar o link. Solicite um novo link de recuperação.",
          variant: "destructive",
        });
        setTimeout(() => navigate('/'), 3000);
      }
    };
    
    validateTokens();
  }, [location, navigate]);

  const validatePassword = (pwd: string): { isValid: boolean; message?: string } => {
    if (!pwd || pwd.length < 6) {
      return { isValid: false, message: "A senha deve ter pelo menos 6 caracteres" };
    }
    if (pwd.length > 128) {
      return { isValid: false, message: "A senha não pode ter mais de 128 caracteres" };
    }
    return { isValid: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('ResetPassword: === INICIANDO ATUALIZAÇÃO DE SENHA ===');
    console.log('ResetPassword: Token válido:', tokenValid);
    
    if (tokenValid === false) {
      console.log('ResetPassword: Token inválido, abortando');
      toast({
        title: "Erro",
        description: "Link de recuperação inválido",
        variant: "destructive",
      });
      return;
    }
    
    // Validação da nova senha
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      console.log('ResetPassword: Senha inválida:', passwordValidation.message);
      toast({
        title: "Erro",
        description: passwordValidation.message,
        variant: "destructive",
      });
      return;
    }

    // Verificar se as senhas coincidem
    if (password !== confirmPassword) {
      console.log('ResetPassword: Senhas não coincidem');
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('ResetPassword: === TENTANDO ATUALIZAR SENHA ===');
      
      const { error } = await updatePassword(password);
      
      if (error) {
        console.error('ResetPassword: === ERRO AO ATUALIZAR SENHA ===');
        console.error('ResetPassword: Erro:', error);
        
        let errorMessage = "Erro ao atualizar senha";
        
        if (error.message === "Auth session missing!") {
          errorMessage = "Sessão de autenticação expirada. Solicite um novo link de recuperação.";
        } else if (error.message === "New password should be different from the old password.") {
          errorMessage = "A nova senha deve ser diferente da senha atual.";
        } else if (error.message === "Password should be at least 6 characters") {
          errorMessage = "A senha deve ter pelo menos 6 caracteres.";
        } else if (error.message.includes("session_not_found")) {
          errorMessage = "Link de recuperação expirou. Solicite um novo link.";
        } else if (error.message.includes("Invalid session")) {
          errorMessage = "Sessão inválida. Solicite um novo link de recuperação.";
        }
        
        toast({
          title: "Erro ao redefinir senha",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        console.log('ResetPassword: === SENHA ATUALIZADA COM SUCESSO ===');
        toast({
          title: "Senha redefinida!",
          description: "Sua senha foi atualizada com sucesso. Você já está logado.",
        });
        
        // Redirecionar para a página principal após sucesso
        navigate('/');
      }
    } catch (error: any) {
      console.error('ResetPassword: === ERRO INESPERADO ===');
      console.error('ResetPassword: Erro:', error);
      
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro inesperado. Tente novamente ou solicite um novo link.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading enquanto verifica o token
  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-muted-foreground">Verificando link de recuperação...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mostrar erro se token inválido
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
              <KeyRound className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Link Inválido</CardTitle>
            <CardDescription>
              O link de redefinição de senha é inválido ou expirou. Solicite um novo link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/')}
              className="w-full"
            >
              Voltar para o login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full w-fit">
            <KeyRound className="h-6 w-6 text-white" />
          </div>
          <CardTitle>Redefinir Senha</CardTitle>
          <CardDescription>
            Digite sua nova senha abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Digite sua nova senha"
                  className="pr-10"
                  minLength={6}
                  maxLength={128}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Mínimo de 6 caracteres
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Confirme sua nova senha"
                  className="pr-10"
                  minLength={6}
                  maxLength={128}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !password || !confirmPassword || password !== confirmPassword}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Redefinindo...
                </>
              ) : (
                "Redefinir Senha"
              )}
            </Button>
            
            <div className="text-center pt-2">
              <Button 
                type="button" 
                variant="link" 
                onClick={() => navigate('/')}
                disabled={loading}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Voltar para o login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
