// Componente para seleção e checkout de planos
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, CreditCard, Star, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PLANOS_DISPONIVEIS, type PlanoType, type CheckoutData } from '@/types/subscription';
import { abacatePayService, AbacatePayService } from '@/services/abacatePayService';
import { CreatePixQrCodeRequest, EmpresaDataForPayment, CollectedPaymentData, PixQrCodeResponse } from '@/types/abacatepay';
import { retryApiCall } from '@/utils/retry';
import { isPlanoValido, getPlanoConfig } from '@/config/planos';
import { validateSubscriptionForm, formatValidationErrors, type ValidationError } from '@/utils/subscriptionValidation';
import { ValidationAlert } from '@/components/billing/ErrorAlert';
import { BillingErrorBoundary } from '@/components/ErrorBoundary/BillingErrorBoundary';
import { DataCollectionModal } from '@/components/billing/DataCollectionModal';
import { PixQrCodeModal } from '@/components/billing/PixQrCodeModal';
import { PaymentSuccessModal } from '@/components/billing/PaymentSuccessModal';

interface PlanoSelectorProps {
  empresaId: string;
  empresaNome: string;
  empresaEmail: string;
  planoAtual?: PlanoType;
  onPlanoSelecionado?: (plano: PlanoType) => void;
}

function PlanoSelectorComponent({
  empresaId,
  empresaNome,
  empresaEmail,
  planoAtual,
  onPlanoSelecionado
}: PlanoSelectorProps) {
  const [planoSelecionado, setPlanoSelecionado] = useState<PlanoType | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [dadosValidos, setDadosValidos] = useState(false);
  const [errosValidacao, setErrosValidacao] = useState<ValidationError[]>([]);
  const [validacaoRealizada, setValidacaoRealizada] = useState(false);
  const [showDataCollectionModal, setShowDataCollectionModal] = useState(false);
  const [showPixQrCodeModal, setShowPixQrCodeModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [collectedData, setCollectedData] = useState<CollectedPaymentData | null>(null);
  const [pixData, setPixData] = useState<PixQrCodeResponse | null>(null);
  const [planoConfirmado, setPlanoConfirmado] = useState<PlanoType | null>(null);
  const [dadosEmpresa, setDadosEmpresa] = useState<EmpresaDataForPayment>({
    name: empresaNome,
    email: empresaEmail,
    cellphone: '',
    taxId: ''
  });
  const { toast } = useToast();

  // Validar dados obrigatórios na inicialização e em tempo real
  useEffect(() => {
    const validarDados = () => {
      console.log('Validando dados da empresa:', {
        empresaId: empresaId ? `${empresaId.substring(0, 5)}...` : 'VAZIO',
        empresaNome: empresaNome ? `${empresaNome.substring(0, 10)}...` : 'VAZIO',
        empresaEmail: empresaEmail ? `${empresaEmail.substring(0, 5)}...` : 'VAZIO'
      });
      
      const erros = validateSubscriptionForm({
        empresaId,
        empresaNome,
        empresaEmail
      });
      
      setErrosValidacao(erros);
      setDadosValidos(erros.length === 0);
      setValidacaoRealizada(true);
      
      console.log('Resultado da validação:', {
        dadosValidos: erros.length === 0,
        quantidadeErros: erros.length,
        erros: erros.map(e => e.message)
      });
    };
    
    validarDados();
  }, [empresaId, empresaNome, empresaEmail]);

  const handleSelecionarPlano = async (plano: PlanoType) => {
    // Validações iniciais com logs detalhados
    console.log('Tentativa de seleção de plano:', {
      plano,
      dadosValidos,
      quantidadeErros: errosValidacao.length
    });
    
    if (!dadosValidos) {
      const mensagemErro = formatValidationErrors(errosValidacao);
      console.error('Validação falhou:', {
        erros: errosValidacao,
        mensagemFormatada: mensagemErro
      });
      
      toast({
        title: 'Dados inválidos',
        description: `Corrija os seguintes erros: ${mensagemErro}`,
        variant: 'destructive'
      });
      return;
    }
    
    if (!isPlanoValido(plano)) {
      toast({
        title: 'Plano inválido',
        description: 'O plano selecionado não é válido.',
        variant: 'destructive'
      });
      return;
    }
    
    if (plano === planoAtual) {
      toast({
        title: 'Plano atual',
        description: 'Este já é o seu plano atual.',
        variant: 'default'
      });
      return;
    }

    setPlanoSelecionado(plano);

    // Atualizar dados da empresa
    const dadosAtualizados: EmpresaDataForPayment = {
      name: empresaNome,
      email: empresaEmail,
      cellphone: collectedData?.cellphone || '',
      taxId: collectedData?.taxId || ''
    };

    // Validar se temos todos os dados necessários para PIX
    const validacao = AbacatePayService.validatePaymentData(dadosAtualizados);
    
    if (!validacao.isValid) {
      console.log('Dados insuficientes para PIX, abrindo modal de coleta:', validacao.missingFields);
      setDadosEmpresa(dadosAtualizados);
      setShowDataCollectionModal(true);
      return;
    }

    // Prosseguir com criação do PIX QR Code
    await criarPixQrCode(plano, dadosAtualizados);
  };

  const criarPixQrCode = async (plano: PlanoType, dadosCliente: EmpresaDataForPayment) => {
    setCarregando(true);

    try {
      console.log('Iniciando criação de PIX QR Code para plano:', plano);
      
      // Preparar dados para AbacatePay PIX
      const planoConfig = getPlanoConfig(plano);
      const pixRequest: CreatePixQrCodeRequest = {
        amount: AbacatePayService.convertToCents(planoConfig.preco),
        description: `Assinatura ${planoConfig.nome} - ${dadosCliente.name}`,
        expiresIn: 3600, // 1 hora
        customer: {
          name: dadosCliente.name,
          cellphone: AbacatePayService.formatCellphone(dadosCliente.cellphone!),
          email: dadosCliente.email,
          taxId: dadosCliente.taxId!
        }
      };
      
      console.log('Criando PIX QR Code AbacatePay:', {
        amount: pixRequest.amount,
        description: pixRequest.description,
        customer: {
          name: pixRequest.customer.name,
          email: pixRequest.customer.email,
          cellphone: pixRequest.customer.cellphone,
          taxId: '***' + pixRequest.customer.taxId.slice(-3)
        }
      });
      
      // Criar PIX QR Code no AbacatePay
      const response = await abacatePayService.createPixQrCode(pixRequest);
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      if (!response.data) {
        throw new Error('Resposta inválida do AbacatePay');
      }
      
      const createdPixData = response.data;
      console.log('PIX QR Code criado com sucesso:', createdPixData.id);
      
      // Armazenar dados do PIX e abrir modal
      setPixData(createdPixData);
      setShowPixQrCodeModal(true);
      
      toast({
        title: 'QR Code PIX criado',
        description: 'Escaneie o QR Code ou copie o código PIX para efetuar o pagamento.',
        variant: 'default'
      });
      
      console.log('Dados do PIX:', {
        id: createdPixData.id,
        brCode: createdPixData.brCode.substring(0, 50) + '...',
        status: createdPixData.status,
        amount: createdPixData.amount,
        expiresAt: createdPixData.expiresAt
      });
      
    } catch (error) {
      console.error('Erro ao criar PIX QR Code:', error);
      
      let errorMessage = 'Erro desconhecido ao processar pagamento PIX';
      let errorTitle = 'Erro no PIX';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Personalizar mensagens baseadas no tipo de erro
        if (error.message.includes('não autenticado')) {
          errorTitle = 'Sessão expirada';
          errorMessage = 'Sua sessão expirou. Faça login novamente.';
        } else if (error.message.includes('Dados inválidos')) {
          errorTitle = 'Dados inválidos';
        } else if (error.message.includes('servidor')) {
          errorTitle = 'Erro temporário';
          errorMessage = 'Erro temporário do servidor. Tente novamente em alguns minutos.';
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setCarregando(false);
      setPlanoSelecionado(null);
    }
  };

  const handleDataCollected = (data: CollectedPaymentData) => {
    console.log('Dados coletados do usuário:', {
      cellphone: data.cellphone.substring(0, 3) + '***',
      taxId: '***' + data.taxId.slice(-3)
    });
    
    setCollectedData(data);
    setShowDataCollectionModal(false);
    
    // Prosseguir com criação do PIX usando os dados coletados
    if (planoSelecionado) {
      const dadosCompletos: EmpresaDataForPayment = {
        name: empresaNome,
        email: empresaEmail,
        cellphone: data.cellphone,
        taxId: data.taxId
      };
      
      criarPixQrCode(planoSelecionado, dadosCompletos);
    }
  };

  const handlePixQrCodeClose = () => {
    setShowPixQrCodeModal(false);
    setPixData(null);
  };

  const handlePaymentConfirmed = () => {
    setShowPixQrCodeModal(false);
    setPixData(null);
    
    // Armazenar o plano confirmado e mostrar modal de sucesso
    if (planoSelecionado) {
      setPlanoConfirmado(planoSelecionado);
      setShowSuccessModal(true);
    }
  };

  const handleSuccessModalClose = () => {
    console.log('🎉 Modal de sucesso fechado, plano confirmado:', planoConfirmado);
    setShowSuccessModal(false);
    
    // Notificar o componente pai sobre a seleção do plano
    if (planoConfirmado) {
      console.log('✅ Notificando componente pai sobre novo plano:', planoConfirmado);
      onPlanoSelecionado?.(planoConfirmado);
      setPlanoConfirmado(null);
    }
  };

  const formatarPreco = (preco: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(preco);
  };

  const isPlanoAtual = (plano: PlanoType) => plano === planoAtual;
  const isCarregandoPlano = (plano: PlanoType) => carregando && planoSelecionado === plano;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Escolha seu plano</h2>
        <p className="text-muted-foreground">
          Selecione o plano ideal para sua empresa
        </p>
      </div>

      {/* Indicador de validação dos dados */}
      {validacaoRealizada && !dadosValidos && errosValidacao.length > 0 && (
        <ValidationAlert
          errors={errosValidacao.map(erro => erro.message)}
          className="mb-4"
        />
      )}
      
      {/* Informações sobre os dados da empresa para debug */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Debug - Dados da Empresa:</h4>
            <div className="text-xs text-blue-700 space-y-1">
              <p>ID: {empresaId || 'VAZIO'}</p>
              <p>Nome: {empresaNome || 'VAZIO'}</p>
              <p>Email: {empresaEmail || 'VAZIO'}</p>
              <p>Válidos: {dadosValidos ? 'SIM' : 'NÃO'}</p>
              <p>Erros: {errosValidacao.length}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANOS_DISPONIVEIS.map((plano) => (
          <Card 
            key={plano.id} 
            className={`relative transition-all duration-200 hover:shadow-lg ${
              plano.popular ? 'border-primary shadow-md' : ''
            } ${
              isPlanoAtual(plano.id) ? 'ring-2 ring-green-500' : ''
            }`}
          >
            {plano.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1">
                  <Star className="w-3 h-3 mr-1" />
                  Mais Popular
                </Badge>
              </div>
            )}
            
            {isPlanoAtual(plano.id) && (
              <div className="absolute -top-3 right-4">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Check className="w-3 h-3 mr-1" />
                  Atual
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl font-bold">{plano.nome}</CardTitle>
              <CardDescription className="text-sm">
                {plano.descricao}
              </CardDescription>
              <div className="pt-2">
                <span className="text-3xl font-bold">
                  {formatarPreco(plano.preco)}
                </span>
                <span className="text-muted-foreground">/mês</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Entregadores</span>
                  <span className="font-medium">{plano.max_entregadores}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Agendamentos/mês</span>
                  <span className="font-medium">{plano.max_agendas_mes}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Recursos inclusos:</h4>
                <ul className="space-y-1">
                  {plano.recursos.map((recurso, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{recurso}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                variant={isPlanoAtual(plano.id) ? 'secondary' : 'default'}
                disabled={carregando || isPlanoAtual(plano.id)}
                onClick={() => handleSelecionarPlano(plano.id)}
              >
                {isCarregandoPlano(plano.id) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : isPlanoAtual(plano.id) ? (
                  'Plano Atual'
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Assinar Agora
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground space-y-2">
        <p>✓ Cancele a qualquer momento</p>
        <p>✓ Suporte técnico incluído</p>
        <p>✓ Atualizações automáticas</p>
      </div>

      {/* Modal para coleta de dados adicionais */}
      <DataCollectionModal
        open={showDataCollectionModal}
        onClose={() => setShowDataCollectionModal(false)}
        onDataCollected={handleDataCollected}
        dadosEmpresa={dadosEmpresa}
      />

      {/* Modal para exibição do QR Code PIX */}
      {pixData && (
        <PixQrCodeModal
          open={showPixQrCodeModal}
          onClose={handlePixQrCodeClose}
          onPaymentConfirmed={handlePaymentConfirmed}
          pixData={pixData}
        />
      )}

      {/* Modal de confirmação de sucesso */}
      {planoConfirmado && (
        <PaymentSuccessModal
          open={showSuccessModal}
          onClose={handleSuccessModalClose}
          plano={planoConfirmado}
          empresaNome={empresaNome}
        />
      )}
    </div>
  );
}

// Wrapper com error boundary específico para seleção de planos
export function PlanoSelector(props: PlanoSelectorProps) {
  return (
    <BillingErrorBoundary 
      context="plan-selection"
      fallbackTitle="Erro na Seleção de Planos"
      onRetry={() => window.location.reload()}
    >
      <PlanoSelectorComponent {...props} />
    </BillingErrorBoundary>
  );
}

export default PlanoSelector;