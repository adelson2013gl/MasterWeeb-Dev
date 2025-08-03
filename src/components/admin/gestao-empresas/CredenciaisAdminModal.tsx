import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, Loader2 } from "lucide-react";

interface AdminCredentials {
  email: string;
  password: string;
  loginUrl: string;
}

interface CredenciaisAdminModalProps {
  empresa: any;
  isOpen: boolean;
  onClose: () => void;
}

export function CredenciaisAdminModal({ 
  empresa, 
  isOpen, 
  onClose 
}: CredenciaisAdminModalProps) {
  const [credentials, setCredentials] = useState<AdminCredentials | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCredentials = async () => {
    if (!empresa) return;

    setLoading(true);
    setError(null);

    try {
      // Implementação simplificada - gerar credenciais localmente
      const tempCredentials: AdminCredentials = {
        email: `admin@${empresa.nome.toLowerCase().replace(/\s+/g, '')}.com`,
        password: `${empresa.nome.slice(0, 3)}${Math.random().toString(36).slice(-6)}`,
        loginUrl: `${window.location.origin}/acesso-empresa/${empresa.dominio || empresa.id}`
      };

      setCredentials(tempCredentials);
      
      toast.success('Credenciais geradas com sucesso!');
      
    } catch (error: any) {
      console.error('Erro ao gerar credenciais:', error);
      setError(error.message || 'Erro ao gerar credenciais');
      toast.error('Erro ao gerar credenciais');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Credenciais de Administrador</DialogTitle>
          <DialogDescription>
            Gere as credenciais de acesso para o administrador da empresa.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                {/* Ícone de erro */}
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Erro ao gerar credenciais
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {credentials ? (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center">
                <Input id="email" value={credentials.email} readOnly className="mr-2" />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(credentials.email)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <div className="flex items-center">
                <Input id="password" value={credentials.password} readOnly className="mr-2" />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(credentials.password)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="login-url">URL de Acesso</Label>
              <div className="flex items-center">
                <Input id="login-url" value={credentials.loginUrl} readOnly className="mr-2" />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(credentials.loginUrl)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-muted-foreground">
            Clique em "Gerar Credenciais" para criar um novo usuário administrador.
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" onClick={generateCredentials} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gerar Credenciais
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
