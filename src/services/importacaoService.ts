
import { supabase } from '@/integrations/supabase/client';
import { adminManagementService } from './adminManagementService';
import { logger } from '@/lib/logger';
import { supabaseSecurityManager } from '@/lib/supabaseSecurityManager';

export interface TecnicoImport {
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
  sucesso: TecnicoImport[];
  erros: ValidationError[];
  duplicados: TecnicoImport[];
  tempoProcessamento: number;
}

class ImportacaoService {
  /**
   * Processa uma lista de tecnicos para importação
   */
  async processarLote(
    tecnicos: TecnicoImport[], 
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
        totalTecnicos: tecnicos.length,
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
      await this.verificarLimiteEmpresa(empresaId, tecnicos.length);

      // Log detalhado dos primeiros 3 tecnicos SEM MASCARAMENTO
      logger.info('📋 IMPORTAÇÃO: Preview dos dados a serem processados (DEBUG MODE)', {
        preview: tecnicos.slice(0, 3).map(e => ({
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
      for (let i = 0; i < tecnicos.length; i += TAMANHO_LOTE) {
        const lote = tecnicos.slice(i, i + TAMANHO_LOTE);
        logger.info(`📦 IMPORTAÇÃO: Processando lote ${Math.floor(i / TAMANHO_LOTE) + 1}`, {
          inicio: i + 1,
          fim: Math.min(i + TAMANHO_LOTE, tecnicos.length),
          total: tecnicos.length
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

  private async verificarLimiteEmpresa(empresaId: string, novosTecnicos: number): Promise<void> {
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('max_entregadores, nome')
      .eq('id', empresaId)
      .single();

    if (empresaError) {
      throw new Error('Erro ao verificar dados da empresa');
    }

    const { data: tecnicosExistentes, error: tecnicosError } = await supabase
      .from('tecnicos')
      .select('id')
      .eq('empresa_id', empresaId);

    if (tecnicosError) {
      throw new Error('Erro ao verificar tecnicos existentes');
    }

    const totalAtual = tecnicosExistentes?.length || 0;
    const novoTotal = totalAtual + novosTecnicos;

    if (empresa?.max_entregadores && novoTotal > empresa.max_entregadores) {
      throw new Error(
        `Limite de ${empresa.max_entregadores} tecnicos seria excedido. ` +
        `Atual: ${totalAtual}, Tentativa: +${novosTecnicos}, ` +
        `Total resultante: ${novoTotal}`
      );
    }

    logger.info('✅ IMPORTAÇÃO: Limite verificado', {
      empresa: empresa?.nome,
      maxTecnicos: empresa?.max_entregadores,
      totalAtual,
      novosTecnicos,
      novoTotal
    });
  }

  /**
   * Processa um lote de tecnicos sequencialmente
   */
  private async processarLoteSequencial(
    lote: TecnicoImport[],
    empresaId: string,
    allowedEmpresaIds: string[],
    resultado: ProcessamentoResult
  ): Promise<void> {
    for (const tecnico of lote) {
      try {
        // LOGS DETALHADOS SEM MASCARAMENTO
        logger.info(`🔍 IMPORTAÇÃO: Processando linha ${tecnico.linha} (DEBUG)`, {
          nome: tecnico.nome,
          email: tecnico.email, // NÃO MASCARADO
          telefone: tecnico.telefone,
          cpf: tecnico.cpf, // NÃO MASCARADO
          cidade: tecnico.cidade || '[CIDADE_VAZIA]', // CRÍTICO: Mostrar se está vazia
          cidadeTipo: typeof tecnico.cidade,
          cidadeLength: tecnico.cidade ? tecnico.cidade.length : 'N/A',
          temSenha: !!(tecnico.senha && tecnico.senha.trim()) // NOVO: Verificar se tem senha
        });

        // Validar campos obrigatórios
        const validacao = this.validarTecnico(tecnico);
        if (validacao.length > 0) {
          resultado.erros.push(...validacao);
          logger.warn(`⚠️ IMPORTAÇÃO: Tecnico inválido na linha ${tecnico.linha}`, { 
            erros: validacao.map(e => e.erro),
            dadosInvalidos: {
              nome: tecnico.nome,
              email: tecnico.email,
              telefone: tecnico.telefone,
              cpf: tecnico.cpf,
              cidade: tecnico.cidade || '[VAZIO]',
              senha: tecnico.senha ? '[FORNECIDA]' : '[VAZIA]'
            }
          });
          continue;
        }

        logger.info(`✅ IMPORTAÇÃO: Validação OK para linha ${tecnico.linha}`);

        // Verificar duplicados por email
        const { data: existente } = await supabase
          .from('tecnicos')
          .select('id, email, nome')
          .eq('email', tecnico.email.toLowerCase().trim())
          .maybeSingle();

        if (existente) {
          resultado.duplicados.push(tecnico);
          logger.warn(`🔄 IMPORTAÇÃO: Email duplicado na linha ${tecnico.linha}`, { 
            email: tecnico.email, // NÃO MASCARADO
            tecnicoExistente: existente.nome
          });
          continue;
        }

        logger.info(`✅ IMPORTAÇÃO: Email único confirmado para linha ${tecnico.linha}`);

        // Buscar ou criar cidade - COM PROTEÇÃO CONTRA NULOS
        logger.info(`🏙️ IMPORTAÇÃO: Buscando cidade para linha ${tecnico.linha}`, {
          cidadeOriginal: tecnico.cidade,
          cidadeTipo: typeof tecnico.cidade,
          cidadeValida: !!(tecnico.cidade && tecnico.cidade.trim())
        });

        const cidade = await this.buscarOuCriarCidade(tecnico.cidade, empresaId);
        if (!cidade) {
          resultado.erros.push({
            linha: tecnico.linha,
            campo: 'cidade',
            erro: 'Não foi possível encontrar ou criar a cidade',
            valor: tecnico.cidade
          });
          continue;
        }

        logger.info(`🏙️ IMPORTAÇÃO: Cidade OK para linha ${tecnico.linha}`, {
          cidade: cidade.nome,
          cidadeId: cidade.id
        });

        // Criar tecnico - USANDO SENHA DO EXCEL
        
        // LOG CRÍTICO COM TODOS OS DADOS REAIS
        logger.info(`🚀 IMPORTAÇÃO: Chamando adminManagementService para linha ${tecnico.linha} (DADOS REAIS)`, {
          dadosTecnico: {
            nome: tecnico.nome.trim(),
            email: tecnico.email.toLowerCase().trim(), // EMAIL REAL VISÍVEL
            telefone: tecnico.telefone.trim(),
            cpf: tecnico.cpf.trim(), // CPF REAL VISÍVEL
            cidade_id: cidade.id,
            empresa_id: empresaId,
            senhaFornecida: '[SENHA_DO_EXCEL]' // NOVO: Indicar que veio do Excel
          }
        });

        await adminManagementService.createTecnico({
          nome: tecnico.nome.trim(),
          email: tecnico.email.toLowerCase().trim(),
          telefone: tecnico.telefone.trim(),
          cpf: tecnico.cpf.trim(),
          cidade_id: cidade.id,
          empresa_id: empresaId,
          senha: tecnico.senha.trim() // NOVO: Usar senha do Excel em vez de gerar
        }, allowedEmpresaIds);

        resultado.sucesso.push(tecnico);
        logger.info(`✅ IMPORTAÇÃO: Tecnico criado com sucesso linha ${tecnico.linha}`, { 
          nome: tecnico.nome,
          email: tecnico.email // EMAIL REAL VISÍVEL
        });

      } catch (error) {
        resultado.erros.push({
          linha: tecnico.linha,
          campo: 'geral',
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
          valor: tecnico.email
        });
        
        // LOG DE ERRO COM DADOS REAIS PARA DEBUG
        logger.error(`❌ IMPORTAÇÃO: Erro ao criar tecnico linha ${tecnico.linha} (DEBUG)`, { 
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          dadosTecnico: {
            nome: tecnico.nome,
            email: tecnico.email, // EMAIL REAL PARA DEBUG
            telefone: tecnico.telefone,
            cpf: tecnico.cpf, // CPF REAL PARA DEBUG
            cidade: tecnico.cidade || '[VAZIO]',
            senha: tecnico.senha ? '[FORNECIDA]' : '[VAZIA]'
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

  private validarTecnico(tecnico: TecnicoImport): ValidationError[] {
    const erros: ValidationError[] = [];

    // Nome obrigatório
    if (!tecnico.nome || typeof tecnico.nome !== 'string' || !tecnico.nome.trim()) {
      erros.push({
        linha: tecnico.linha,
        campo: 'nome',
        erro: 'Nome é obrigatório e deve ser uma string válida',
        valor: tecnico.nome
      });
    } else if (tecnico.nome.trim().length < 3) {
      erros.push({
        linha: tecnico.linha,
        campo: 'nome',
        erro: 'Nome deve ter pelo menos 3 caracteres',
        valor: tecnico.nome
      });
    }

    // Email obrigatório e válido
    if (!tecnico.email || typeof tecnico.email !== 'string' || !tecnico.email.trim()) {
      erros.push({
        linha: tecnico.linha,
        campo: 'email',
        erro: 'Email é obrigatório e deve ser uma string válida',
        valor: tecnico.email
      });
    } else if (!this.validarEmail(tecnico.email)) {
      erros.push({
        linha: tecnico.linha,
        campo: 'email',
        erro: 'Email inválido',
        valor: tecnico.email
      });
    }

    // Telefone obrigatório
    if (!tecnico.telefone || typeof tecnico.telefone !== 'string' || !tecnico.telefone.trim()) {
      erros.push({
        linha: tecnico.linha,
        campo: 'telefone',
        erro: 'Telefone é obrigatório e deve ser uma string válida',
        valor: tecnico.telefone
      });
    } else if (!this.validarTelefone(tecnico.telefone)) {
      erros.push({
        linha: tecnico.linha,
        campo: 'telefone',
        erro: 'Telefone inválido (use formato: 11999999999)',
        valor: tecnico.telefone
      });
    }

    // CPF obrigatório e válido
    if (!tecnico.cpf || typeof tecnico.cpf !== 'string' || !tecnico.cpf.trim()) {
      erros.push({
        linha: tecnico.linha,
        campo: 'cpf',
        erro: 'CPF é obrigatório e deve ser uma string válida',
        valor: tecnico.cpf
      });
    } else if (!this.validarCPF(tecnico.cpf)) {
      erros.push({
        linha: tecnico.linha,
        campo: 'cpf',
        erro: 'CPF inválido',
        valor: tecnico.cpf
      });
    }

    // Cidade obrigatória - VALIDAÇÃO MELHORADA
    if (!tecnico.cidade || typeof tecnico.cidade !== 'string' || !tecnico.cidade.trim()) {
      erros.push({
        linha: tecnico.linha,
        campo: 'cidade',
        erro: 'Cidade é obrigatória e deve ser uma string válida',
        valor: tecnico.cidade
      });
    }

    // NOVO: Senha obrigatória
    if (!tecnico.senha || typeof tecnico.senha !== 'string' || !tecnico.senha.trim()) {
      erros.push({
        linha: tecnico.linha,
        campo: 'senha',
        erro: 'Senha é obrigatória e deve ser uma string válida',
        valor: tecnico.senha
      });
    } else if (tecnico.senha.trim().length < 6) {
      erros.push({
        linha: tecnico.linha,
        campo: 'senha',
        erro: 'Senha deve ter pelo menos 6 caracteres',
        valor: tecnico.senha
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
  parseExcelData(data: any[]): TecnicoImport[] {
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
