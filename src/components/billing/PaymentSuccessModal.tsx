// Modal de confirmação de sucesso do pagamento
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Sparkles, Gift, Zap, Star, ArrowRight } from 'lucide-react';
import { PlanoType } from '@/types/subscription';
import { getPlanoConfig } from '@/config/planos';

interface PaymentSuccessModalProps {
  open: boolean;
  onClose: () => void;
  plano: PlanoType;
  empresaNome: string;
}

export function PaymentSuccessModal({
  open,
  onClose,
  plano,
  empresaNome
}: PaymentSuccessModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const planoConfig = getPlanoConfig(plano);

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      // Remover confetti após a animação
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const mensagensMotivacionais = [
    "🚀 Sua jornada para o sucesso acaba de começar!",
    "⭐ Agora você tem acesso a recursos premium!",
    "🎯 Pronto para levar sua empresa ao próximo nível!",
    "💪 Ferramentas poderosas nas suas mãos!",
    "🌟 Bem-vindo ao time premium!"
  ];

  const proximosPassos = [
    "Configure seu painel administrativo",
    "Adicione entregadores à sua equipe",
    "Crie suas primeiras agendas",
    "Explore os relatórios avançados"
  ];

  const mensagemAleatoria = mensagensMotivacionais[Math.floor(Math.random() * mensagensMotivacionais.length)];

  const formatarPreco = (preco: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(preco);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="relative overflow-hidden">
          {/* Animação de confetti */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="absolute top-0 right-1/4 w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
              <div className="absolute top-10 left-1/3 w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '1s' }} />
              <div className="absolute top-10 right-1/3 w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '1.5s' }} />
              <div className="absolute top-5 left-1/2 w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.25s' }} />
            </div>
          )}

          <div className="space-y-6 py-6">
            {/* Ícone de sucesso */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Título e mensagem */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-green-600">
                Pagamento Confirmado!
              </h2>
              <p className="text-lg font-medium text-gray-800">
                {mensagemAleatoria}
              </p>
              <p className="text-sm text-gray-600">
                Obrigado, <span className="font-medium">{empresaNome}</span>!
              </p>
            </div>

            {/* Detalhes do plano */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">Plano Ativado</span>
                  </div>
                  <span className="text-sm bg-green-200 text-green-800 px-2 py-1 rounded-full">
                    Ativo
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-700">Plano:</span>
                    <span className="font-medium text-green-800">{planoConfig.nome}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-700">Valor:</span>
                    <span className="font-medium text-green-800">{formatarPreco(planoConfig.preco)}/mês</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-700">Ativação:</span>
                    <span className="font-medium text-green-800">Imediata</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recursos liberados */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span className="font-medium">Recursos liberados:</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {planoConfig.recursos.slice(0, 3).map((recurso, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Star className="w-4 h-4 text-amber-500" />
                    <span>{recurso}</span>
                  </div>
                ))}
                {planoConfig.recursos.length > 3 && (
                  <div className="text-sm text-gray-500 ml-6">
                    E mais {planoConfig.recursos.length - 3} recursos...
                  </div>
                )}
              </div>
            </div>

            {/* Próximos passos */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-blue-500" />
                <span className="font-medium">Próximos passos:</span>
              </div>
              <div className="space-y-2">
                {proximosPassos.map((passo, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <span>{passo}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Botão para continuar */}
            <Button 
              onClick={onClose} 
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <Zap className="w-4 h-4 mr-2" />
              Começar a usar agora!
            </Button>

            {/* Mensagem de suporte */}
            <div className="text-center text-xs text-gray-500">
              <p>Precisa de ajuda? Entre em contato com nosso suporte.</p>
              <p>Estamos aqui para garantir seu sucesso! 🚀</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}