
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface CadastroFormProps {
  onBack: () => void;
}

export function CadastroForm({ onBack }: CadastroFormProps) {
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    email: "",
    cpf: "",
    cidade: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);

  // Mock data - em produção viria do banco
  const cidades = [
    { id: 1, nome: "São Paulo", estado: "SP" },
    { id: 2, nome: "Rio de Janeiro", estado: "RJ" },
    { id: 3, nome: "Belo Horizonte", estado: "MG" },
    { id: 4, nome: "Salvador", estado: "BA" },
    { id: 5, nome: "Fortaleza", estado: "CE" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validações básicas
    if (!formData.nome || !formData.email || !formData.cpf || !formData.telefone || !formData.cidade) {
      toast.error("Preencha todos os campos obrigatórios");
      setLoading(false);
      return;
    }

    // Simular cadastro
    setTimeout(() => {
      toast.success("Cadastro realizado com sucesso! Aguarde a aprovação do administrador.");
      setLoading(false);
      onBack();
    }, 2000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle className="flex items-center">
              <UserPlus className="h-5 w-5 mr-2" />
              Cadastro de Entregador
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              placeholder="Seu nome completo"
              value={formData.nome}
              onChange={(e) => handleInputChange("nome", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone *</Label>
            <Input
              id="telefone"
              placeholder="(11) 99999-9999"
              value={formData.telefone}
              onChange={(e) => handleInputChange("telefone", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF *</Label>
            <Input
              id="cpf"
              placeholder="000.000.000-00"
              value={formData.cpf}
              onChange={(e) => handleInputChange("cpf", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade *</Label>
            <Select onValueChange={(value) => handleInputChange("cidade", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione sua cidade" />
              </SelectTrigger>
              <SelectContent>
                {cidades.map(cidade => (
                  <SelectItem key={cidade.id} value={cidade.id.toString()}>
                    {cidade.nome} - {cidade.estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha *</Label>
            <Input
              id="password"
              type="password"
              placeholder="Crie uma senha"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Cadastrando..." : "Cadastrar"}
          </Button>

          <p className="text-sm text-gray-600 text-center">
            Após o cadastro, seu perfil será analisado pelo administrador.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
