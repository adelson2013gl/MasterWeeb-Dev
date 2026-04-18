
import { supabase } from '@/integrations/supabase/client';
import { adminManagementService } from './adminManagementService';
import { logger } from '@/lib/logger';
import { supabaseSecurityManager } from '@/lib/supabaseSecurityManager';

export interface EntregadorImport {
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  cidade: string;
  senha: string; // NOVO: Campo obrigatório para senha
  perfil?: 'tecnico' | 'admin';
  status?: 'pendente' | 'aprovado';
  observacoes?: string;
  linha: number; // Para rastreamento de erros
}

export interface ValidationError {
  linha: number;
  campo: string;
  erro: string;
  valor: any;
}

export interface ProcessamentoResult {
  sucesso: EntregadorImport[];
  erros: ValidationError[];
  duplicados: EntregadorImport[];
  tempoProcessamento: number;
}

class ImportacaoService {
  /**
   * Processa uma lista de entregadores para importação
   */
  async processarLote(
    entregadores: EntregadorImport[], 
    empresaId: string,
    allowedEmpresaIds: string[]
  ): Promise<ProcessamentoResult> {
    const inicioProcessamento = Date.now();
    
    const resultado: ProcessamentoResult = {
      sucesso: [],
      erros: [],
      duplicados: [],
      tempoProcessamento: 0
    };

    try {
      logger.info('🚀 IMPORTAÇÃO: Iniciando importação em massa', {
        totalEntregadores: entregadores.length,
        empresaId,
        allowedEmpresaIds: allowedEmpresaIds.length,
        debugModeAtivo: supabaseSecurityManager.isDebugMode()
      });

      // NOVO: Ativar modo debug do logger para importação
      console.log('🔧 IMPORTAÇÃO: Ativando modo debug para importação...');
      logger.enableImportDebugMode();
      supabaseSecurityManager.enableDebugMode();

      // Validar permissões
      if (!allowedEmpresaIds.includes(empresaId)) {
        throw new Error('Sem permissão para importar para esta empresa');
      }

      // Verificar limite da empresa
      await this.verificarLimiteEmpresa(empresaId, entregadores.length);

      // Log detalhado dos primeiros 3 entregadores SEM MASCARAMENTO
      logger.info('📋 IMPORTAÇÃO: Preview dos dados a serem processados (DEBUG MODE)', {
        preview: entregadores.slice(0, 3).map(e => ({
          linha: e.linha,
          nome: e.nome,
          email: e.email, // AGORA NÃO SERÁ MASCARADO
          telefone: e.telefone,
          cpf: e.cpf,
          cidade: e.cidade || '[VAZIO]' // CRÍTICO: Verificar se cidade existe
        }))
      });

      // Processar em lotes de 25 para não sobrecarregar
      const TAMANHO_LOTE = 25;
      for (let i = 0; i < entregadores.length; i += TAMANHO_LOTE) {
        const lote = entregadores.slice(i, i + TAMANHO_LOTE);
        logger.info(`📦 IMPORTAÇÃO: Processando lote ${Math.floor(i / TAMANHO_LOTE) + 1}`, {
          inicio: i + 1,
          fim: Math.min(i + TAMANHO_LOTE, entregadores.length),
          total: entregadores.length
        });
        
        await this.processarLoteSequencial(lote, empresaId, allowedEmpresaIds, resultado);
      }

      resultado.tempoProcessamento = Date.now() - inicioProcessamento;

      logger.info('✅ IMPORTAÇÃO: Importação concluída', {
        sucessos: resultado.sucesso.length,
        erros: resultado.erros.length,
        duplicados: resultado.duplicados.length,
        tempoMs: resultado.tempoProcessamento
      });

      return resultado;

    } catch (error) {
      resultado.tempoProcessamento = Date.now() - inicioProcessamento;
      logger.error('❌ IMPORTAÇÃO: Erro na importação em massa', { error });
      throw error;
    } finally {
      // NOVO: Sempre desativar modos debug no final
      console.log('🔒 IMPORTAÇÃO: Desativando modo debug...');
      logger.disableImportDebugMode();
      supabaseSecurityManager.disableDebugMode();
    }
  }

  private async verificarLimiteEmpresa(empresaId: string, novosEntregadores: number): Promise<void> {
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('max_entregadores, nome')
      .eq('id', empresaId)
      .single();

    if (empresaError) {
      throw new Error('Erro ao verificar dados da empresa');
    }

    const { data: entregadoresExistentes, error: entregadoresError } = await supabase
      .from('tecnicos')
      .select('id')
      .eq('empresa_id', empresaId);

    if (entregadoresError) {
      throw new Error('Erro ao verificar entregadores existentes');
    }

    const totalAtual = entregadoresExistentes?.length || 0;
    const novoTotal = totalAtual + novosEntregadores;

    if (empresa?.max_entregadores && novoTotal > empresa.max_entregadores) {
      throw new Error(
        `Limite de ${empresa.max_entregadores} entregadores seria excedido. ` +
        `Atual: ${totalAtual}, Tentativa: +${novosEntregadores}, ` +
        `Total resultante: ${novoTotal}`
      );
    }

    logger.info('✅ IMPORTAÇÃO: Limite verificado', {
      empresa: empresa?.nome,
      maxEntregadores: empresa?.max_entregadores,
      totalAtual,
      novosEntregadores,
      novoTotal
    });
  }

  /**
   * Processa um lote de entregadores sequencialmente
   */
  private async processarLoteSequencial(
    lote: EntregadorImport[],
    empresaId: string,
    allowedEmpresaIds: string[],
    resultado: ProcessamentoResult
  ): Promise<void> {
    for (const entregador of lote) {
      try {
        // LOGS DETALHADOS SEM MASCARAMENTO
        logger.info(`🔍 IMPORTAÇÃO: Processando linha ${entregador.linha} (DEBUG)`, {
          nome: entregador.nome,
          email: entregador.email, // NÃO MASCARADO
          telefone: entregador.telefone,
          cpf: entregador.cpf, // NÃO MASCARADO
          cidade: entregador.cidade || '[CIDADE_VAZIA]', // CRÍTICO: Mostrar se está vazia
          cidadeTipo: typeof entregador.cidade,
          cidadeLength: entregador.cidade ? entregador.cidade.length : 'N/A',
          temSenha: !!(entregador.senha && entregador.senha.trim()) // NOVO: Verificar se tem senha
        });

        // Validar campos obrigatórios
        const validacao = this.validarEntregador(entregador);
        if (validacao.length > 0) {
          resultado.erros.push(...validacao);
          logger.warn(`⚠️ IMPORTAÇÃO: Entregador inválido na linha ${entregador.linha}`, { 
            erros: validacao.map(e => e.erro),
            dadosInvalidos: {
              nome: entregador.nome,
              email: entregador.email,
              telefone: entregador.telefone,
              cpf: entregador.cpf,
              cidade: entregador.cidade || '[VAZIO]',
              senha: entregador.senha ? '[FORNECIDA]' : '[VAZIA]'
            }
          });
          continue;
        }

        logger.info(`✅ IMPORTAÇÃO: Validação OK para linha ${entregador.linha}`);

        // Verificar duplicados por email
        const { data: existente } = await supabase
          .from('tecnicos')
          .select('id, email, nome')
          .eq('email', entregador.email.toLowerCase().trim())
          .maybeSingle();

        if (existente) {
          resultado.duplicados.push(entregador);
          logger.warn(`🔄 IMPORTAÇÃO: Email duplicado na linha ${entregador.linha}`, { 
            email: entregador.email, // NÃO MASCARADO
            entregadorExistente: existente.nome
          });
          continue;
        }

        logger.info(`✅ IMPORTAÇÃO: Email único confirmado para linha ${entregador.linha}`);

        // Buscar ou criar cidade - COM PROTEÇÃO CONTRA NULOS
        logger.info(`🏙️ IMPORTAÇÃO: Buscando cidade para linha ${entregador.linha}`, {
          cidadeOriginal: entregador.cidade,
          cidadeTipo: typeof entregador.cidade,
          cidadeValida: !!(entregador.cidade && entregador.cidade.trim())
        });

        const cidade = await this.buscarOuCriarCidade(entregador.cidade, empresaId);
        if (!cidade) {
          resultado.erros.push({
            linha: entregador.linha,
            campo: 'cidade',
            erro: 'Não foi possível encontrar ou criar a cidade',
            valor: entregador.cidade
          });
          continue;
        }

        logger.info(`🏙️ IMPORTAÇÃO: Cidade OK para linha ${entregador.linha}`, {
          cidade: cidade.nome,
          cidadeId: cidade.id
        });

        // Criar entregador - USANDO SENHA DO EXCEL
        
        // LOG CRÍTICO COM TODOS OS DADOS REAIS
        logger.info(`🚀 IMPORTAÇÃO: Chamando adminManagementService para linha ${entregador.linha} (DADOS REAIS)`, {
          dadosEntregador: {
            nome: entregador.nome.trim(),
            email: entregador.email.toLowerCase().trim(), // EMAIL REAL VISÍVEL
            telefone: entregador.telefone.trim(),
            cpf: entregador.cpf.trim(), // CPF REAL VISÍVEL
            cidade_id: cidade.id,
            empresa_id: empresaId,
            senhaFornecida: '[SENHA_DO_EXCEL]' // NOVO: Indicar que veio do Excel
          }
        });

        await adminManagementService.createEntregador({
          nome: entregador.nome.trim(),
          email: entregador.email.toLowerCase().trim(),
          telefone: entregador.telefone.trim(),
          cpf: entregador.cpf.trim(),
          cidade_id: cidade.id,
          empresa_id: empresaId,
          senha: entregador.senha.trim() // NOVO: Usar senha do Excel em vez de gerar
        }, allowedEmpresaIds);

        resultado.sucesso.push(entregador);
        logger.info(`✅ IMPORTAÇÃO: Entregador criado com sucesso linha ${entregador.linha}`, { 
          nome: entregador.nome,
          email: entregador.email // EMAIL REAL VISÍVEL
        });

      } catch (error) {
        resultado.erros.push({
          linha: entregador.linha,
          campo: 'geral',
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
          valor: entregador.email
        });
        
        // LOG DE ERRO COM DADOS REAIS PARA DEBUG
        logger.error(`❌ IMPORTAÇÃO: Erro ao criar entregador linha ${entregador.linha} (DEBUG)`, { 
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          dadosEntregador: {
            nome: entregador.nome,
            email: entregador.email, // EMAIL REAL PARA DEBUG
            telefone: entregador.telefone,
            cpf: entregador.cpf, // CPF REAL PARA DEBUG
            cidade: entregador.cidade || '[VAZIO]',
            senha: entregador.senha ? '[FORNECIDA]' : '[VAZIA]'
          }
        });
      }
    }
  }

  private async buscarOuCriarCidade(nomeCidade: string, empresaId: string) {
    try {
      // PROTEÇÃO CRÍTICA CONTRA VALORES NULOS/UNDEFINED
      if (!nomeCidade || typeof nomeCidade !== 'string') {
        logger.error('🚨 IMPORTAÇÃO: nomeCidade inválido', {
          nomeCidade,
          tipo: typeof nomeCidade,
          empresaId
        });
        throw new Error(`Nome da cidade inválido: ${nomeCidade} (tipo: ${typeof nomeCidade})`);
      }

      const nomeCidadeLimpo = nomeCidade.trim();
      if (!nomeCidadeLimpo) {
        logger.error('🚨 IMPORTAÇÃO: nomeCidade vazio após trim', {
          nomeCidadeOriginal: nomeCidade,
          empresaId
        });
        throw new Error('Nome da cidade está vazio');
      }

      logger.info('🔍 BUSCA_CIDADE: Iniciando busca', {
        nomeCidade: nomeCidadeLimpo,
        empresaId
      });

      // Primeiro, tentar encontrar cidade existente
      const { data: cidadeExistente, error: errorBusca } = await supabase
        .from('cidades')
        .select('id, nome')
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .ilike('nome', nomeCidadeLimpo)
        .maybeSingle();

      if (errorBusca) {
        logger.error('❌ BUSCA_CIDADE: Erro na consulta', {
          error: errorBusca,
          nomeCidade: nomeCidadeLimpo,
          empresaId
        });
        throw new Error(`Erro ao buscar cidade: ${errorBusca.message}`);
      }

      if (cidadeExistente) {
        logger.info('✅ BUSCA_CIDADE: Cidade encontrada', {
          cidade: cidadeExistente.nome,
          id: cidadeExistente.id
        });
        return cidadeExistente;
      }

      logger.info('🆕 CRIAR_CIDADE: Cidade não encontrada, criando nova', {
        nomeCidade: nomeCidadeLimpo,
        empresaId
      });

      // Se não existe, criar nova cidade
      const { data: novaCidade, error: errorCriacao } = await supabase
        .from('cidades')
        .insert({
          nome: nomeCidadeLimpo,
          estado: 'SP', // Estado padrão - pode ser configurado
          empresa_id: empresaId,
          ativo: true
        })
        .select('id, nome')
        .single();

      if (errorCriacao) {
        logger.error('❌ CRIAR_CIDADE: Erro ao criar cidade', {
          error: errorCriacao,
          nomeCidade: nomeCidadeLimpo,
          empresaId
        });
        throw new Error(`Erro ao criar cidade: ${errorCriacao.message}`);
      }

      logger.info('✅ CRIAR_CIDADE: Nova cidade criada', {
        cidade: novaCidade.nome,
        id: novaCidade.id,
        empresaId
      });

      return novaCidade;

    } catch (error) {
      logger.error('💥 BUSCAR_OU_CRIAR_CIDADE: Erro geral', {
        error: error instanceof Error ? error.message : error,
        nomeCidade,
        empresaId,
        stack: error instanceof Error ? error.stack : undefined
      });
      return null;
    }
  }

  private validarEntregador(entregador: EntregadorImport): ValidationError[] {
    const erros: ValidationError[] = [];

    // Nome obrigatório
    if (!entregador.nome || typeof entregador.nome !== 'string' || !entregador.nome.trim()) {
      erros.push({
        linha: entregador.linha,
        campo: 'nome',
        erro: 'Nome é obrigatório e deve ser uma string válida',
        valor: entregador.nome
      });
    } else if (entregador.nome.trim().length < 3) {
      erros.push({
        linha: entregador.linha,
        campo: 'nome',
        erro: 'Nome deve ter pelo menos 3 caracteres',
        valor: entregador.nome
      });
    }

    // Email obrigatório e válido
    if (!entregador.email || typeof entregador.email !== 'string' || !entregador.email.trim()) {
      erros.push({
        linha: entregador.linha,
        campo: 'email',
        erro: 'Email é obrigatório e deve ser uma string válida',
        valor: entregador.email
      });
    } else if (!this.validarEmail(entregador.email)) {
      erros.push({
        linha: entregador.linha,
        campo: 'email',
        erro: 'Email inválido',
        valor: entregador.email
      });
    }

    // Telefone obrigatório
    if (!entregador.telefone || typeof entregador.telefone !== 'string' || !entregador.telefone.trim()) {
      erros.push({
        linha: entregador.linha,
        campo: 'telefone',
        erro: 'Telefone é obrigatório e deve ser uma string válida',
        valor: entregador.telefone
      });
    } else if (!this.validarTelefone(entregador.telefone)) {
      erros.push({
        linha: entregador.linha,
        campo: 'telefone',
        erro: 'Telefone inválido (use formato: 11999999999)',
        valor: entregador.telefone
      });
    }

    // CPF obrigatório e válido
    if (!entregador.cpf || typeof entregador.cpf !== 'string' || !entregador.cpf.trim()) {
      erros.push({
        linha: entregador.linha,
        campo: 'cpf',
        erro: 'CPF é obrigatório e deve ser uma string válida',
        valor: entregador.cpf
      });
    } else if (!this.validarCPF(entregador.cpf)) {
      erros.push({
        linha: entregador.linha,
        campo: 'cpf',
        erro: 'CPF inválido',
        valor: entregador.cpf
      });
    }

    // Cidade obrigatória - VALIDAÇÃO MELHORADA
    if (!entregador.cidade || typeof entregador.cidade !== 'string' || !entregador.cidade.trim()) {
      erros.push({
        linha: entregador.linha,
        campo: 'cidade',
        erro: 'Cidade é obrigatória e deve ser uma string válida',
        valor: entregador.cidade
      });
    }

    // NOVO: Senha obrigatória
    if (!entregador.senha || typeof entregador.senha !== 'string' || !entregador.senha.trim()) {
      erros.push({
        linha: entregador.linha,
        campo: 'senha',
        erro: 'Senha é obrigatória e deve ser uma string válida',
        valor: entregador.senha
      });
    } else if (entregador.senha.trim().length < 6) {
      erros.push({
        linha: entregador.linha,
        campo: 'senha',
        erro: 'Senha deve ter pelo menos 6 caracteres',
        valor: entregador.senha
      });
    }

    return erros;
  }

  /**
   * Valida formato de email
   */
  private validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Valida formato de telefone brasileiro
   */
  private validarTelefone(telefone: string): boolean {
    const telefoneLimpo = telefone.replace(/\D/g, '');
    return telefoneLimpo.length >= 10 && telefoneLimpo.length <= 11;
  }

  /**
   * Valida CPF brasileiro
   */
  private validarCPF(cpf: string): boolean {
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    if (cpfLimpo.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpfLimpo)) return false; // CPFs com todos os dígitos iguais

    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfLimpo.charAt(9))) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfLimpo.charAt(10))) return false;

    return true;
  }

  /**
   * Gera uma senha temporária
   */
  private gerarSenhaTemporaria(): string {
    return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
  }

  /**
   * Processa dados de planilha Excel/CSV
   */
  parseExcelData(data: any[]): EntregadorImport[] {
    return data.map((row, index) => {
      // PROTEÇÃO CONTRA VALORES UNDEFINED/NULL DOS CAMPOS DO EXCEL
      const processField = (value: any): string => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return value;
        return String(value); // Converter outros tipos para string
      };

      return {
        nome: processField(row['Nome'] || row['nome']),
        email: processField(row['Email'] || row['email']),
        telefone: processField(row['Telefone'] || row['telefone']),
        cpf: processField(row['CPF'] || row['cpf']),
        cidade: processField(row['Cidade'] || row['cidade']),
        senha: processField(row['Senha'] || row['senha']), // NOVO: Processar campo senha
        perfil: (row['Perfil'] || row['perfil'] || 'tecnico') as 'tecnico' | 'admin',
        status: (row['Status'] || row['status'] || 'pendente') as 'pendente' | 'aprovado',
        observacoes: processField(row['Observacoes'] || row['observacoes']),
        linha: index + 2 // +2 porque linha 1 é cabeçalho e queremos 1-indexed
      };
    });
  }
}

export const importacaoService = new ImportacaoService();
