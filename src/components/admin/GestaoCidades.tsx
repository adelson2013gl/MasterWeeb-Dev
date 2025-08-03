import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Plus, Building, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useEmpresaUnificado } from "@/contexts/EmpresaUnificadoContext";
import { logger } from "@/lib/logger";

type Cidade = Database['public']['Tables']['cidades']['Row'];
type Regiao = Database['public']['Tables']['regioes']['Row'];

interface RegiaoComCidade extends Regiao {
  cidadeNome: string;
}

export function GestaoCidades() {
  const { empresa } = useEmpresaUnificado();
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [regioes, setRegioes] = useState<RegiaoComCidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [novaCidade, setNovaCidade] = useState({ nome: "", estado: "" });
  const [novaRegiao, setNovaRegiao] = useState({ nome: "", cidadeId: "", descricao: "" });
  const [dialogOpen, setDialogOpen] = useState({ cidade: false, regiao: false });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (empresa) {
      fetchData();
    }
  }, [empresa]);

  const fetchData = async () => {
    if (!empresa) return;
    
    try {
      logger.debug('Carregando dados de cidades e regiões', { empresaId: empresa.id }, 'ADMIN');
      
      // Carregar cidades
      const { data: cidadesData, error: cidadesError } = await supabase
        .from('cidades')
        .select('*')
        .eq('ativo', true)
        .eq('empresa_id', empresa.id)
        .order('nome');

      if (cidadesError) {
        logger.error('Erro ao carregar cidades', { empresaId: empresa.id, error: cidadesError.message }, 'ADMIN');
        throw cidadesError;
      }

      logger.info('Cidades carregadas', { empresaId: empresa.id, quantidade: cidadesData?.length }, 'ADMIN');
      setCidades(cidadesData || []);

      // Carregar regiões
      const { data: regioesData, error: regioesError } = await supabase
        .from('regioes')
        .select('*')
        .eq('ativo', true)
        .eq('empresa_id', empresa.id)
        .order('nome');

      if (regioesError) {
        logger.error('Erro ao carregar regiões', { empresaId: empresa.id, error: regioesError.message }, 'ADMIN');
        throw regioesError;
      }

      logger.info('Regiões carregadas', { empresaId: empresa.id, quantidade: regioesData?.length }, 'ADMIN');

      // Buscar informações das cidades para cada região
      if (regioesData && regioesData.length > 0) {
        const regioesComCidade: RegiaoComCidade[] = [];
        
        for (const regiao of regioesData) {
          const { data: cidadeData, error: cidadeError } = await supabase
            .from('cidades')
            .select('nome')
            .eq('id', regiao.cidade_id)
            .single();

          if (cidadeError) {
            logger.error('Erro ao buscar cidade da região', { regiaoId: regiao.id, cidadeId: regiao.cidade_id, error: cidadeError.message }, 'ADMIN');
          }

          regioesComCidade.push({
            ...regiao,
            cidadeNome: cidadeData?.nome || 'Cidade não encontrada'
          });
        }

        logger.debug('Regiões com cidades processadas', { quantidade: regioesComCidade.length }, 'ADMIN');
        setRegioes(regioesComCidade);
      }

    } catch (error: any) {
      logger.error('Erro ao carregar dados', { empresaId: empresa.id, error: error?.message }, 'ADMIN');
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCidade = async () => {
    if (!novaCidade.nome || !novaCidade.estado || !empresa) {
      toast.error("Preencha todos os campos");
      return;
    }

    setSubmitting(true);
    try {
      logger.info('Adicionando cidade', { nome: novaCidade.nome, estado: novaCidade.estado, empresaId: empresa.id }, 'ADMIN');
      
      const { data, error } = await supabase
        .from('cidades')
        .insert({
          nome: novaCidade.nome,
          estado: novaCidade.estado,
          empresa_id: empresa.id,  // CORRIGIDO: Adicionado empresa_id obrigatório
          ativo: true
        })
        .select()
        .single();

      if (error) {
        logger.error('Erro ao adicionar cidade', { nome: novaCidade.nome, empresaId: empresa.id, error: error.message }, 'ADMIN');
        throw error;
      }

      logger.info('Cidade adicionada com sucesso', { cidadeId: data.id, nome: data.nome }, 'ADMIN');
      
      // Atualizar lista local
      setCidades(prev => [...prev, data]);
      
      setNovaCidade({ nome: "", estado: "" });
      setDialogOpen(prev => ({ ...prev, cidade: false }));
      toast.success("Cidade adicionada com sucesso!");
      
    } catch (error: any) {
      logger.error('Erro ao adicionar cidade', { nome: novaCidade.nome, error: error?.message }, 'ADMIN');
      toast.error(`Erro ao adicionar cidade: ${error?.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddRegiao = async () => {
    if (!novaRegiao.nome || !novaRegiao.cidadeId || !empresa) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setSubmitting(true);
    try {
      logger.info('Adicionando região', { nome: novaRegiao.nome, cidadeId: novaRegiao.cidadeId, empresaId: empresa.id }, 'ADMIN');
      
      const { data, error } = await supabase
        .from('regioes')
        .insert({
          nome: novaRegiao.nome,
          cidade_id: novaRegiao.cidadeId,
          empresa_id: empresa.id,  // CORRIGIDO: Adicionado empresa_id obrigatório
          ativo: true
        })
        .select()
        .single();

      if (error) {
        logger.error('Erro ao adicionar região', { nome: novaRegiao.nome, error: error.message }, 'ADMIN');
        throw error;
      }

      logger.info('Região adicionada com sucesso', { regiaoId: data.id, nome: data.nome }, 'ADMIN');
      
      // Buscar informações da cidade para a nova região
      const { data: cidadeData } = await supabase
        .from('cidades')
        .select('nome')
        .eq('id', data.cidade_id)
        .single();

      // Transformar dados e atualizar lista local
      const novaRegiaoComCidade: RegiaoComCidade = {
        ...data,
        cidadeNome: cidadeData?.nome || 'Cidade não encontrada'
      };
      
      setRegioes(prev => [...prev, novaRegiaoComCidade]);
      
      setNovaRegiao({ nome: "", cidadeId: "", descricao: "" });
      setDialogOpen(prev => ({ ...prev, regiao: false }));
      toast.success("Região adicionada com sucesso!");
      
    } catch (error: any) {
      logger.error('Erro ao adicionar região', { nome: novaRegiao.nome, error: error?.message }, 'ADMIN');
      toast.error(`Erro ao adicionar região: ${error?.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCidadeStatus = async (id: string) => {
    try {
      if (!empresa) return;
      
      const cidade = cidades.find(c => c.id === id);
      if (!cidade) return;

      logger.info('Alterando status da cidade', { cidadeId: id, novoStatus: !cidade.ativo }, 'ADMIN');
      
      const { error } = await supabase
        .from('cidades')
        .update({ ativo: !cidade.ativo })
        .eq('id', id)
        .eq('empresa_id', empresa.id);  // CORRIGIDO: Verificar empresa por segurança

      if (error) {
        logger.error('Erro ao alterar status da cidade', { cidadeId: id, error: error.message }, 'ADMIN');
        throw error;
      }

      // Atualizar lista local
      setCidades(prev => prev.map(c => 
        c.id === id ? { ...c, ativo: !c.ativo } : c
      ));
      
      toast.success("Status da cidade atualizado!");
      
    } catch (error: any) {
      logger.error('Erro ao alterar status da cidade', { cidadeId: id, error: error?.message }, 'ADMIN');
      toast.error(`Erro ao alterar status: ${error?.message}`);
    }
  };

  const toggleRegiaoStatus = async (id: string) => {
    try {
      if (!empresa) return;
      
      const regiao = regioes.find(r => r.id === id);
      if (!regiao) return;

      logger.info('Alterando status da região', { regiaoId: id, novoStatus: !regiao.ativo }, 'ADMIN');
      
      const { error } = await supabase
        .from('regioes')
        .update({ ativo: !regiao.ativo })
        .eq('id', id)
        .eq('empresa_id', empresa.id);  // CORRIGIDO: Verificar empresa por segurança

      if (error) {
        logger.error('Erro ao alterar status da região', { regiaoId: id, error: error.message }, 'ADMIN');
        throw error;
      }

      // Atualizar lista local
      setRegioes(prev => prev.map(r => 
        r.id === id ? { ...r, ativo: !r.ativo } : r
      ));
      
      toast.success("Status da região atualizado!");
      
    } catch (error: any) {
      logger.error('Erro ao alterar status da região', { regiaoId: id, error: error?.message }, 'ADMIN');
      toast.error(`Erro ao alterar status: ${error?.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Cidades e Regiões</h2>
        <p className="text-gray-600">Configure as cidades e regiões disponíveis para agendamento</p>
      </div>

      <Tabs defaultValue="cidades" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cidades">Cidades</TabsTrigger>
          <TabsTrigger value="regioes">Regiões</TabsTrigger>
        </TabsList>

        <TabsContent value="cidades" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Cidades Cadastradas ({cidades.length})</h3>
            <Dialog open={dialogOpen.cidade} onOpenChange={(open) => setDialogOpen(prev => ({ ...prev, cidade: open }))}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Cidade
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Nova Cidade</DialogTitle>
                  <DialogDescription>
                    Cadastre uma nova cidade para o sistema de agendamentos
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nome-cidade">Nome da Cidade</Label>
                    <Input
                      id="nome-cidade"
                      placeholder="Ex: São Paulo"
                      value={novaCidade.nome}
                      onChange={(e) => setNovaCidade(prev => ({ ...prev, nome: e.target.value }))}
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="estado-cidade">Estado (UF)</Label>
                    <Input
                      id="estado-cidade"
                      placeholder="Ex: SP"
                      maxLength={2}
                      value={novaCidade.estado}
                      onChange={(e) => setNovaCidade(prev => ({ ...prev, estado: e.target.value.toUpperCase() }))}
                      disabled={submitting}
                    />
                  </div>
                  <Button onClick={handleAddCidade} className="w-full" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adicionando...
                      </>
                    ) : (
                      "Adicionar Cidade"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cidades.map(cidade => (
              <Card key={cidade.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-lg">
                      <Building className="h-5 w-5 mr-2" />
                      {cidade.nome}
                    </CardTitle>
                    <Badge variant={cidade.ativo ? "secondary" : "outline"} 
                           className={cidade.ativo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {cidade.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                  <CardDescription>{cidade.estado}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toggleCidadeStatus(cidade.id)}
                    >
                      {cidade.ativo ? "Desativar" : "Ativar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="regioes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Regiões Cadastradas ({regioes.length})</h3>
            <Dialog open={dialogOpen.regiao} onOpenChange={(open) => setDialogOpen(prev => ({ ...prev, regiao: open }))}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Região
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Nova Região</DialogTitle>
                  <DialogDescription>
                    Cadastre uma nova região para uma cidade
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cidade-regiao">Cidade</Label>
                    <select 
                      id="cidade-regiao"
                      className="w-full p-2 border rounded-md"
                      value={novaRegiao.cidadeId}
                      onChange={(e) => setNovaRegiao(prev => ({ ...prev, cidadeId: e.target.value }))}
                      disabled={submitting}
                    >
                      <option value="">Selecione uma cidade</option>
                      {cidades.filter(c => c.ativo).map(cidade => (
                        <option key={cidade.id} value={cidade.id}>
                          {cidade.nome} - {cidade.estado}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="nome-regiao">Nome da Região</Label>
                    <Input
                      id="nome-regiao"
                      placeholder="Ex: Centro, Zona Norte"
                      value={novaRegiao.nome}
                      onChange={(e) => setNovaRegiao(prev => ({ ...prev, nome: e.target.value }))}
                      disabled={submitting}
                    />
                  </div>
                  <Button onClick={handleAddRegiao} className="w-full" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adicionando...
                      </>
                    ) : (
                      "Adicionar Região"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regioes.map(regiao => (
              <Card key={regiao.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-lg">
                      <MapPin className="h-5 w-5 mr-2" />
                      {regiao.nome}
                    </CardTitle>
                    <Badge variant={regiao.ativo ? "secondary" : "outline"} 
                           className={regiao.ativo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {regiao.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                  <CardDescription>{regiao.cidadeNome}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toggleRegiaoStatus(regiao.id)}
                    >
                      {regiao.ativo ? "Desativar" : "Ativar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
