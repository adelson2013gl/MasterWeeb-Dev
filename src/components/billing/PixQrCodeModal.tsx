// Modal para exibição do QR Code PIX e verificação de pagamento
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { PixQrCodeResponse } from '@/types/abacatepay';
import { abacatePayService } from '@/services/abacatePayService';
import { Copy, Check, Loader2, QrCode, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface PixQrCodeModalProps {
  open: boolean;
  onClose: () => void;
  onPaymentConfirmed: () => void;
  pixData: PixQrCodeResponse;
}

export function PixQrCodeModal({
  open,
  onClose,
  onPaymentConfirmed,
  pixData
}: PixQrCodeModalProps) {
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED'>(pixData.status);
  const { toast } = useToast();

  // Atualizar tempo restante
  useEffect(() => {
    const updateTimeRemaining = () => {
      const expiresAt = new Date(pixData.expiresAt);
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expirado');
        setPaymentStatus('EXPIRED');
        return;
      }

      const minutes = Math.floor(diff / 1000 / 60);
      const seconds = Math.floor((diff / 1000) % 60);
      
      if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [pixData.expiresAt]);

  const handleCopyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(pixData.brCode);
      setCopied(true);
      
      toast({
        title: 'Código PIX copiado',
        description: 'O código PIX foi copiado para a área de transferência.',
        variant: 'default'
      });

      // Reset após 3 segundos
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('Erro ao copiar código PIX:', error);
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o código. Tente selecionar e copiar manualmente.',
        variant: 'destructive'
      });
    }
  };

  /**
   * VALIDAÇÃO REAL DE PAGAMENTO
   * 
   * Esta função NÃO emite sucesso automático. Ela consulta a API real da AbacatePay
   * para verificar se o pagamento foi efetivamente processado.
   * 
   * Fluxo: Frontend → Supabase Edge Function → AbacatePay API → Status Real
   */
  const checkPaymentStatus = async () => {
    setCheckingPayment(true);

    try {
      console.log('Verificando status do pagamento PIX:', pixData.id);
      
      // IMPORTANTE: Esta chamada vai para a API REAL da AbacatePay
      const response = await abacatePayService.checkPixPaymentStatus(pixData.id);
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data) {
        throw new Error('Resposta inválida ao verificar pagamento');
      }

      const updatedPixData = response.data;
      console.log('Status atualizado do PIX:', {
        id: updatedPixData.id,
        status: updatedPixData.status,
        amount: updatedPixData.amount
      });

      setPaymentStatus(updatedPixData.status);

      if (updatedPixData.status === 'PAID') {
        toast({
          title: '🎉 Pagamento confirmado!',
          description: 'Seu pagamento foi processado com sucesso. Redirecionando...',
          variant: 'default'
        });

        // Aguardar um pouco antes de fechar e confirmar
        setTimeout(() => {
          onPaymentConfirmed();
        }, 2000);
        
      } else if (updatedPixData.status === 'EXPIRED') {
        toast({
          title: 'PIX expirado',
          description: 'O tempo para pagamento expirou. Gere um novo PIX.',
          variant: 'destructive'
        });
        
      } else if (updatedPixData.status === 'CANCELLED') {
        toast({
          title: 'PIX cancelado',
          description: 'O pagamento foi cancelado.',
          variant: 'destructive'
        });
        
      } else {
        toast({
          title: 'Pagamento ainda pendente',
          description: 'O pagamento ainda não foi identificado. Aguarde alguns instantes e tente novamente.',
          variant: 'default'
        });
      }

    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
      
      toast({
        title: 'Erro na verificação',
        description: error instanceof Error ? error.message : 'Erro desconhecido ao verificar pagamento',
        variant: 'destructive'
      });
    } finally {
      setCheckingPayment(false);
    }
  };

  const formatAmount = (amountInCents: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amountInCents / 100);
  };

  // Função para garantir formato correto da imagem base64
  const getQrCodeImageSrc = (brCodeBase64: string): string => {
    // Se já tem o prefixo, usar como está
    if (brCodeBase64.startsWith('data:image/')) {
      return brCodeBase64;
    }
    // Se não tem o prefixo, adicionar
    return `data:image/png;base64,${brCodeBase64}`;
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'PAID':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'EXPIRED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'CANCELLED':
        return <XCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-amber-500" />;
    }
  };

  const getStatusText = () => {
    switch (paymentStatus) {
      case 'PAID':
        return 'Pagamento confirmado';
      case 'EXPIRED':
        return 'PIX expirado';
      case 'CANCELLED':
        return 'PIX cancelado';
      default:
        return 'Aguardando pagamento';
    }
  };

  const isExpiredOrCancelled = paymentStatus === 'EXPIRED' || paymentStatus === 'CANCELLED';
  const isPaid = paymentStatus === 'PAID';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Pagamento PIX
          </DialogTitle>
          <DialogDescription>
            Escaneie o QR Code ou copie o código PIX para efetuar o pagamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status do pagamento */}
          <Card className={`${isPaid ? 'border-green-500 bg-green-50' : isExpiredOrCancelled ? 'border-red-500 bg-red-50' : 'border-amber-500 bg-amber-50'}`}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <span className="font-medium">{getStatusText()}</span>
                </div>
                {!isExpiredOrCancelled && !isPaid && (
                  <div className="flex items-center gap-1 text-sm text-amber-600">
                    <Clock className="w-4 h-4" />
                    <span>{timeRemaining}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Valor do pagamento */}
          <div className="text-center">
            <p className="text-sm text-gray-600">Valor a pagar:</p>
            <p className="text-2xl font-bold text-green-600">
              {formatAmount(pixData.amount)}
            </p>
          </div>

          {!isExpiredOrCancelled && (
            <>
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  <img
                    src={getQrCodeImageSrc(pixData.brCodeBase64)}
                    alt="QR Code PIX"
                    className="w-48 h-48"
                    onError={(e) => {
                      console.error('Erro ao carregar QR Code:', e);
                      console.log('brCodeBase64 original:', pixData.brCodeBase64.substring(0, 100) + '...');
                    }}
                  />
                </div>
              </div>

              {/* Código PIX para copiar */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Ou copie o código PIX:</p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-gray-100 p-3 rounded-lg font-mono text-xs break-all">
                    {pixData.brCode}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPixCode}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Instruções */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Como pagar:</h4>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Abra o app do seu banco</li>
                  <li>Escaneie o QR Code ou cole o código PIX</li>
                  <li>Confirme o pagamento</li>
                  <li>Clique em "Já efetuei o pagamento" abaixo</li>
                </ol>
              </div>

              {/* Botão de verificação */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={checkingPayment}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={checkPaymentStatus}
                  disabled={checkingPayment}
                  className="flex-1"
                >
                  {checkingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    'Já efetuei o pagamento'
                  )}
                </Button>
              </div>
            </>
          )}

          {isExpiredOrCancelled && (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <span>Este PIX não está mais válido</span>
              </div>
              <Button onClick={onClose} className="w-full">
                Fechar
              </Button>
            </div>
          )}

          {isPaid && (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span>Pagamento confirmado com sucesso!</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}