// Serviço para gerenciar webhooks do AbacatePay
import { AbacatePayWebhook } from '@/types/abacatepay';
import { supabase } from '@/integrations/supabase/client';

export class AbacatePayWebhookService {
  // Validar signature do webhook (se AbacatePay fornecer)
  static validateWebhookSignature(payload: string, signature: string): boolean {
    // TODO: Implementar validação quando AbacatePay fornecer documentação
    console.log('Validando signature webhook:', { signature });
    return true; // Temporariamente aceitar todos
  }

  // Processar webhook recebido
  static async processWebhook(webhook: AbacatePayWebhook): Promise<void> {
    console.log('Processando webhook AbacatePay:', {
      event: webhook.event,
      billId: webhook.data.id,
      status: webhook.data.status
    });

    try {
      // Salvar webhook no banco para auditoria
      await this.saveWebhookRecord(webhook);

      // Processar baseado no tipo de evento
      switch (webhook.event) {
        case 'bill.paid':
          await this.handleBillPaid(webhook.data);
          break;
        
        case 'bill.cancelled':
          await this.handleBillCancelled(webhook.data);
          break;
        
        case 'bill.expired':
          await this.handleBillExpired(webhook.data);
          break;
        
        default:
          console.log('Evento de webhook não tratado:', webhook.event);
      }

      console.log('Webhook processado com sucesso');
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      throw error;
    }
  }

  // Salvar registro do webhook para auditoria
  private static async saveWebhookRecord(webhook: AbacatePayWebhook): Promise<void> {
    try {
      const { error } = await supabase
        .from('abacatepay_webhooks')
        .insert({
          evento: webhook.event,
          bill_id: webhook.data.id,
          empresa_id: webhook.data.metadata?.empresa_id,
          payload: webhook,
          processado: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Erro ao salvar webhook:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro ao inserir webhook no banco:', error);
      // Não propagar erro para não bloquear processamento
    }
  }

  // Processar pagamento aprovado
  private static async handleBillPaid(billData: any): Promise<void> {
    console.log('Processando pagamento aprovado:', billData.id);

    try {
      // Extrair informações do metadata
      const empresaId = billData.metadata?.empresa_id;
      const plano = billData.metadata?.plano;

      if (!empresaId || !plano) {
        console.warn('Metadata incompleto no webhook:', billData.metadata);
        return;
      }

      // Atualizar ou criar assinatura no banco
      const { error: upsertError } = await supabase
        .from('assinaturas')
        .upsert({
          empresa_id: empresaId,
          abacatepay_bill_id: billData.id,
          plano: plano,
          status: 'active',
          valor_mensal: billData.amount / 100, // Converter centavos para reais
          data_proximo_pagamento: this.calculateNextPaymentDate(),
          metadata: billData.metadata,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'empresa_id'
        });

      if (upsertError) {
        console.error('Erro ao atualizar assinatura:', upsertError);
        throw upsertError;
      }

      // Criar registro de transação
      const { error: transactionError } = await supabase
        .from('transacoes')
        .insert({
          assinatura_id: empresaId, // Usar empresa_id como referência
          abacatepay_bill_id: billData.id,
          status: 'approved',
          valor: billData.amount / 100,
          metodo_pagamento: 'PIX',
          created_at: billData.paidAt || new Date().toISOString()
        });

      if (transactionError) {
        console.error('Erro ao criar transação:', transactionError);
        // Não falhar se transação não for criada
      }

      console.log('Assinatura ativada com sucesso para empresa:', empresaId);
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      throw error;
    }
  }

  // Processar cancelamento
  private static async handleBillCancelled(billData: any): Promise<void> {
    console.log('Processando cancelamento:', billData.id);

    try {
      const { error } = await supabase
        .from('assinaturas')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('abacatepay_bill_id', billData.id);

      if (error) {
        console.error('Erro ao cancelar assinatura:', error);
        throw error;
      }

      console.log('Assinatura cancelada:', billData.id);
    } catch (error) {
      console.error('Erro ao processar cancelamento:', error);
      throw error;
    }
  }

  // Processar expiração
  private static async handleBillExpired(billData: any): Promise<void> {
    console.log('Processando expiração:', billData.id);

    try {
      const { error } = await supabase
        .from('assinaturas')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('abacatepay_bill_id', billData.id);

      if (error) {
        console.error('Erro ao expirar assinatura:', error);
        throw error;
      }

      console.log('Assinatura expirada:', billData.id);
    } catch (error) {
      console.error('Erro ao processar expiração:', error);
      throw error;
    }
  }

  // Calcular próxima data de pagamento (30 dias)
  private static calculateNextPaymentDate(): string {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 30);
    return nextDate.toISOString();
  }

  // Reprocessar webhook que falhou
  static async reprocessWebhook(webhookId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('abacatepay_webhooks')
        .select('*')
        .eq('id', webhookId)
        .single();

      if (error || !data) {
        throw new Error('Webhook não encontrado');
      }

      await this.processWebhook(data.payload);

      // Marcar como processado
      await supabase
        .from('abacatepay_webhooks')
        .update({ 
          processado: true,
          erro: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', webhookId);

    } catch (error) {
      console.error('Erro ao reprocessar webhook:', error);
      
      // Salvar erro
      await supabase
        .from('abacatepay_webhooks')
        .update({ 
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
          updated_at: new Date().toISOString()
        })
        .eq('id', webhookId);
      
      throw error;
    }
  }
}

export default AbacatePayWebhookService;