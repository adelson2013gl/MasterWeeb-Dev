import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useConfiguracoesSistema } from "@/hooks/useConfiguracoesSistema";
import { Save, Settings, Clock, Mail, Shield, Calendar, Star, AlertCircle } from "lucide-react";
import { logger } from '@/lib/logger';
import { useEmpresaUnificado } from "@/contexts/EmpresaUnificadoContext";

export function ConfiguracoesSistema() {
  const { configs, loading, saveAllConfiguracoes, updateConfig, hasUnsavedChanges, isSaving } = useConfiguracoesSistema();
  const { isSuperAdmin } = useEmpresaUnificado();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      logger.info('Salvando configurações do sistema', {
        hasUnsavedChanges
      });
      
      await saveAllConfiguracoes();
      toast.success("Configurações salvas com sucesso!");
      
      logger.info('Configurações salvas com sucesso');
      
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      logger.error('Erro ao salvar configurações', { error });
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchChange = (key: keyof typeof configs, value: any) => {
    logger.debug(`Configuração alterada: ${key}`, {
      chave: key,
      valorAntigo: configs[key],
      valorNovo: value
    });
    
    updateConfig(key, value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configurações do Sistema
          </h1>
          <p className="text-muted-foreground">
            Configure o comportamento do sistema de agendamentos
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <div className="flex items-center gap-1 text-orange-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              Há mudanças não salvas
            </div>
          )}
          <Button 
            onClick={handleSave} 
            disabled={saving || isSaving || !hasUnsavedChanges} 
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving || isSaving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="priorizacao_horarios" className="space-y-4">
        <TabsList className={`grid w-full ${isSuperAdmin ? 'grid-cols-6' : 'grid-cols-5'}`}>
          <TabsTrigger value="priorizacao_horarios" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horários
          </TabsTrigger>
          <TabsTrigger value="agendamento" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Agendamento
          </TabsTrigger>
          {/* RESTRIÇÃO: Aba "Sistema Antigo" apenas para super admins */}
          {isSuperAdmin && (
            <TabsTrigger value="priorizacao_antiga" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Priorização
            </TabsTrigger>
          )}
          <TabsTrigger value="notificacoes" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="validacao" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Validação
          </TabsTrigger>
          <TabsTrigger value="sistema">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="priorizacao_horarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Priorização por Horários Específicos
              </CardTitle>
              <CardDescription>
                Configure os horários de liberação das agendas baseado no nível de estrelas dos entregadores.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Habilitar Sistema de Horários Específicos</Label>
                  <p className="text-sm text-muted-foreground">
                    Quando habilitado, substitui o sistema antigo de "horas de antecedência"
                  </p>
                  <div className="text-xs mt-1 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                    <strong>Estado atual:</strong> {configs.habilitarPriorizacaoHorarios ? '✅ HABILITADO' : '❌ DESABILITADO'}
                    <br />
                    <strong>Tipo:</strong> {typeof configs.habilitarPriorizacaoHorarios}
                    <br />
                    <strong>Valor:</strong> {String(configs.habilitarPriorizacaoHorarios)}
                    {hasUnsavedChanges && (
                      <>
                        <br />
                        <strong>Status:</strong> <span className="text-orange-600">⚠️ MUDANÇA PENDENTE</span>
                      </>
                    )}
                  </div>
                </div>
                <Switch
                  checked={configs.habilitarPriorizacaoHorarios}
                  onCheckedChange={(value) => handleSwitchChange('habilitarPriorizacaoHorarios', value)}
                  disabled={isSaving}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horario5estrelas" className="flex items-center gap-2">
                    <div className="flex">
                      {"★".repeat(5)} 
                    </div>
                    5 Estrelas
                  </Label>
                  <Input
                    id="horario5estrelas"
                    type="time"
                    value={configs.horarioLiberacao5Estrelas}
                    onChange={(e) => handleSwitchChange('horarioLiberacao5Estrelas', e.target.value)}
                    disabled={!configs.habilitarPriorizacaoHorarios || isSaving}
                  />
                  <p className="text-xs text-muted-foreground">Maior prioridade - veem primeiro</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horario4estrelas" className="flex items-center gap-2">
                    <div className="flex">
                      {"★".repeat(4)}{"☆".repeat(1)}
                    </div>
                    4 Estrelas
                  </Label>
                  <Input
                    id="horario4estrelas"
                    type="time"
                    value={configs.horarioLiberacao4Estrelas}
                    onChange={(e) => handleSwitchChange('horarioLiberacao4Estrelas', e.target.value)}
                    disabled={!configs.habilitarPriorizacaoHorarios || isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horario3estrelas" className="flex items-center gap-2">
                    <div className="flex">
                      {"★".repeat(3)}{"☆".repeat(2)}
                    </div>
                    3 Estrelas
                  </Label>
                  <Input
                    id="horario3estrelas"
                    type="time"
                    value={configs.horarioLiberacao3Estrelas}
                    onChange={(e) => handleSwitchChange('horarioLiberacao3Estrelas', e.target.value)}
                    disabled={!configs.habilitarPriorizacaoHorarios || isSaving}
                  />
                  <p className="text-xs text-muted-foreground">Nível padrão</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horario2estrelas" className="flex items-center gap-2">
                    <div className="flex">
                      {"★".repeat(2)}{"☆".repeat(3)}
                    </div>
                    2 Estrelas
                  </Label>
                  <Input
                    id="horario2estrelas"
                    type="time"
                    value={configs.horarioLiberacao2Estrelas}
                    onChange={(e) => handleSwitchChange('horarioLiberacao2Estrelas', e.target.value)}
                    disabled={!configs.habilitarPriorizacaoHorarios || isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horario1estrela" className="flex items-center gap-2">
                    <div className="flex">
                      {"★".repeat(1)}{"☆".repeat(4)}
                    </div>
                    1 Estrela
                  </Label>
                  <Input
                    id="horario1estrela"
                    type="time"
                    value={configs.horarioLiberacao1Estrela}
                    onChange={(e) => handleSwitchChange('horarioLiberacao1Estrela', e.target.value)}
                    disabled={!configs.habilitarPriorizacaoHorarios || isSaving}
                  />
                  <p className="text-xs text-muted-foreground">Menor prioridade - veem por último</p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <h4 className="font-medium mb-2">Como funciona:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Entregadores só veem agendas <strong>após</strong> o horário configurado para seu nível</li>
                  <li>• Exemplo: Entregador 3★ só vê agendas de hoje após às {configs.horarioLiberacao3Estrelas}</li>
                  <li>• Para agendas de outros dias, liberação é normal (sem restrição de horário)</li>
                  <li>• Sistema substitui completamente o antigo baseado em "horas de antecedência"</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agendamento" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Agendamento</CardTitle>
              <CardDescription>
                Configure as regras básicas para agendamentos e cancelamentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prazoMinimo">Prazo Mínimo para Agendamento (horas)</Label>
                  <Input
                    id="prazoMinimo"
                    type="number"
                    value={configs.prazoMinimoAgendamento}
                    onChange={(e) => handleSwitchChange('prazoMinimoAgendamento', parseInt(e.target.value))}
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prazoLimite">Prazo Limite para Cancelamento (horas)</Label>
                  <Input
                    id="prazoLimite"
                    type="number"
                    value={configs.prazoLimiteCancelamento}
                    onChange={(e) => handleSwitchChange('prazoLimiteCancelamento', parseInt(e.target.value))}
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="limiteAgendamentos">Limite de Agendamentos por Dia</Label>
                  <Input
                    id="limiteAgendamentos"
                    type="number"
                    value={configs.limiteAgendamentosDia}
                    onChange={(e) => handleSwitchChange('limiteAgendamentosDia', parseInt(e.target.value))}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Permitir Cancelamento</Label>
                    <p className="text-sm text-muted-foreground">Entregadores podem cancelar agendamentos</p>
                  </div>
                  <Switch
                    checked={configs.permiteCancel}
                    onCheckedChange={(value) => handleSwitchChange('permiteCancel', value)}
                    disabled={isSaving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Permitir Múltiplos Turnos</Label>
                    <p className="text-sm text-muted-foreground">Entregador pode agendar múltiplos turnos no mesmo dia</p>
                  </div>
                  <Switch
                    checked={configs.permiteMultiplosTurnos}
                    onCheckedChange={(value) => handleSwitchChange('permiteMultiplosTurnos', value)}
                    disabled={isSaving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Permitir Reagendamento</Label>
                    <p className="text-sm text-muted-foreground">Entregadores podem reagendar compromissos</p>
                  </div>
                  <Switch
                    checked={configs.permiteReagendamento}
                    onCheckedChange={(value) => handleSwitchChange('permiteReagendamento', value)}
                    disabled={isSaving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Permitir Agendamento no Mesmo Dia</Label>
                    <p className="text-sm text-muted-foreground">
                      Entregadores podem agendar para o mesmo dia
                      <br />
                      <span className="text-xs text-blue-600">
                        💡 Estado atual: {configs.permitirAgendamentoMesmoDia ? '✅ HABILITADO' : '❌ DESABILITADO'}
                      </span>
                    </p>
                  </div>
                  <Switch
                    checked={configs.permitirAgendamentoMesmoDia}
                    onCheckedChange={(value) => handleSwitchChange('permitirAgendamentoMesmoDia', value)}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RESTRIÇÃO: TabsContent "Sistema Antigo" apenas para super admins */}
        {isSuperAdmin && (
          <TabsContent value="priorizacao_antiga" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Sistema Antigo - Priorização por Horas de Antecedência
                </CardTitle>
                <CardDescription>
                  <strong>⚠️ Sistema Legado:</strong> Configure horas de antecedência por estrela.
                  <br />
                  Recomendamos usar o novo "Sistema de Horários Específicos" na primeira aba.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Habilitar Sistema Antigo (Horas de Antecedência)</Label>
                    <p className="text-sm text-muted-foreground">
                      ⚠️ Desabilitado por padrão. Use apenas se não quiser o sistema de horários específicos.
                    </p>
                  </div>
                  <Switch
                    checked={configs.habilitarPriorizacao}
                    onCheckedChange={(value) => handleSwitchChange('habilitarPriorizacao', value)}
                    disabled={isSaving}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>5 Estrelas - Horas de Antecedência</Label>
                    <Input
                      type="number"
                      value={configs.prioridadeEstrelas5h}
                      onChange={(e) => handleSwitchChange('prioridadeEstrelas5h', parseInt(e.target.value))}
                      disabled={!configs.habilitarPriorizacao || isSaving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>4 Estrelas - Horas de Antecedência</Label>
                    <Input
                      type="number"
                      value={configs.prioridadeEstrelas4h}
                      onChange={(e) => handleSwitchChange('prioridadeEstrelas4h', parseInt(e.target.value))}
                      disabled={!configs.habilitarPriorizacao || isSaving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>3 Estrelas - Horas de Antecedência</Label>
                    <Input
                      type="number"
                      value={configs.prioridadeEstrelas3h}
                      onChange={(e) => handleSwitchChange('prioridadeEstrelas3h', parseInt(e.target.value))}
                      disabled={!configs.habilitarPriorizacao || isSaving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>2 Estrelas - Horas de Antecedência</Label>
                    <Input
                      type="number"
                      value={configs.prioridadeEstrelas2h}
                      onChange={(e) => handleSwitchChange('prioridadeEstrelas2h', parseInt(e.target.value))}
                      disabled={!configs.habilitarPriorizacao || isSaving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>1 Estrela - Horas de Antecedência</Label>
                    <Input
                      type="number"
                      value={configs.prioridadeEstrelas1h}
                      onChange={(e) => handleSwitchChange('prioridadeEstrelas1h', parseInt(e.target.value))}
                      disabled={!configs.habilitarPriorizacao || isSaving}
                    />
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <h4 className="font-medium mb-2">⚠️ Sistema Antigo vs Novo:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• <strong>Antigo:</strong> "Entregador 3★ precisa de 4h de antecedência"</li>
                    <li>• <strong>Novo:</strong> "Entregador 3★ vê agendas após às 09:20"</li>
                    <li>• Recomendamos migrar para o sistema de horários específicos</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="notificacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>Configure quando e como notificar os usuários</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Notificações por E-mail</h4>
                  
                  <div className="flex items-center justify-between">
                    <Label>E-mail de Confirmação</Label>
                    <Switch
                      checked={configs.emailConfirmacao}
                      onCheckedChange={(value) => handleSwitchChange('emailConfirmacao', value)}
                      disabled={isSaving}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>E-mail de Aprovação</Label>
                    <Switch
                      checked={configs.emailAprovacao}
                      onCheckedChange={(value) => handleSwitchChange('emailAprovacao', value)}
                      disabled={isSaving}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>E-mail de Agendamento</Label>
                    <Switch
                      checked={configs.emailAgendamento}
                      onCheckedChange={(value) => handleSwitchChange('emailAgendamento', value)}
                      disabled={isSaving}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>E-mail de Cancelamento</Label>
                    <Switch
                      checked={configs.emailCancelamento}
                      onCheckedChange={(value) => handleSwitchChange('emailCancelamento', value)}
                      disabled={isSaving}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>E-mail de Lembrete</Label>
                    <Switch
                      checked={configs.emailLembrete}
                      onCheckedChange={(value) => handleSwitchChange('emailLembrete', value)}
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Configurações Adicionais</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="antecedencia">Antecedência do Lembrete (horas)</Label>
                    <Input
                      id="antecedencia"
                      type="number"
                      value={configs.antecedenciaLembrete}
                      onChange={(e) => handleSwitchChange('antecedenciaLembrete', parseInt(e.target.value))}
                      disabled={isSaving}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Ativar SMS</Label>
                      <p className="text-sm text-muted-foreground">Envio de SMS (funcionalidade futura)</p>
                    </div>
                    <Switch
                      checked={configs.ativarSms}
                      onCheckedChange={(value) => handleSwitchChange('ativarSms', value)}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validacao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Validação e Segurança</CardTitle>
              <CardDescription>Configure validações de dados e regras de segurança</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Validar CPF</Label>
                    <p className="text-sm text-muted-foreground">Validar formato e dígitos verificadores do CPF</p>
                  </div>
                  <Switch
                    checked={configs.validarCpf}
                    onCheckedChange={(value) => handleSwitchChange('validarCpf', value)}
                    disabled={isSaving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Confirmar Telefone</Label>
                    <p className="text-sm text-muted-foreground">Exigir confirmação por SMS do telefone</p>
                  </div>
                  <Switch
                    checked={configs.confirmarTelefone}
                    onCheckedChange={(value) => handleSwitchChange('confirmarTelefone', value)}
                    disabled={isSaving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Aprovação Automática</Label>
                    <p className="text-sm text-muted-foreground">Aprovar entregadores automaticamente após cadastro</p>
                  </div>
                  <Switch
                    checked={configs.aprovacaoAutomatica}
                    onCheckedChange={(value) => handleSwitchChange('aprovacaoAutomatica', value)}
                    disabled={isSaving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Múltiplos com Mesmo Telefone</Label>
                    <p className="text-sm text-muted-foreground">Permitir vários entregadores com mesmo telefone</p>
                  </div>
                  <Switch
                    checked={configs.multiplosComTelefone}
                    onCheckedChange={(value) => handleSwitchChange('multiplosComTelefone', value)}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sistema" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sistema</CardTitle>
              <CardDescription>Configurações gerais do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tempoSessao">Tempo de Sessão (minutos)</Label>
                    <Input
                      id="tempoSessao"
                      type="number"
                      value={configs.tempoSessao}
                      onChange={(e) => handleSwitchChange('tempoSessao', parseInt(e.target.value))}
                      disabled={isSaving}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Modo Manutenção</Label>
                      <p className="text-sm text-muted-foreground">Bloquear acesso temporariamente</p>
                    </div>
                    <Switch
                      checked={configs.modoManutencao}
                      onCheckedChange={(value) => handleSwitchChange('modoManutencao', value)}
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Logs Detalhados</Label>
                      <p className="text-sm text-muted-foreground">Registrar logs detalhados do sistema</p>
                    </div>
                    <Switch
                      checked={configs.logsDetalhados}
                      onCheckedChange={(value) => handleSwitchChange('logsDetalhados', value)}
                      disabled={isSaving}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Backup Automático</Label>
                      <p className="text-sm text-muted-foreground">Executar backup automático dos dados</p>
                    </div>
                    <Switch
                      checked={configs.backupAutomatico}
                      onCheckedChange={(value) => handleSwitchChange('backupAutomatico', value)}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
