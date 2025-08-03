import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { importacaoService, EntregadorImport, ProcessamentoResult } from '@/services/importacaoService';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import * as XLSX from 'xlsx';

interface ImportacaoState {
  arquivoSelecionado: File | null;
  dadosPreview: EntregadorImport[];
  processando: boolean;
  resultado: ProcessamentoResult | null;
  progresso: number;
  etapaAtual: string;
}

export function useImportacaoEntregadores() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [state, setState] = useState<ImportacaoState>({
    arquivoSelecionado: null,
    dadosPreview: [],
    processando: false,
    resultado: null,
    progresso: 0,
    etapaAtual: ''
  });

  const selecionarArquivo = async (arquivo: File) => {
    try {
      setState(prev => ({ 
        ...prev, 
        arquivoSelecionado: arquivo, 
        etapaAtual: 'Processando arquivo...' 
      }));

      // Verificar tipo de arquivo
      const tiposPermitidos = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv' // .csv
      ];

      if (!tiposPermitidos.includes(arquivo.type) && !arquivo.name.match(/\.(xlsx|xls|csv)$/i)) {
        throw new Error('Tipo de arquivo não suportado. Use .xlsx, .xls ou .csv');
      }

      // Ler arquivo
      const buffer = await arquivo.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Converter para JSON
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Verificar se tem dados
      if (rawData.length < 2) {
        throw new Error('Arquivo deve conter pelo menos uma linha de cabeçalho e uma linha de dados');
      }

      // Converter para formato estruturado
      const headers = rawData[0] as string[];
      const rows = rawData.slice(1) as any[][];
      
      const dadosEstruturados = rows.map((row, index) => {
        const obj: any = {};
        headers.forEach((header, headerIndex) => {
          obj[header] = row[headerIndex] || '';
        });
        return obj;
      });

      // Processar dados
      const dadosProcessados = importacaoService.parseExcelData(dadosEstruturados);
      
      setState(prev => ({
        ...prev,
        dadosPreview: dadosProcessados.slice(0, 10), // Preview das primeiras 10 linhas
        etapaAtual: `Arquivo carregado: ${dadosProcessados.length} registros encontrados`
      }));

      logger.info('📄 Arquivo processado', {
        nome: arquivo.name,
        tamanho: arquivo.size,
        registros: dadosProcessados.length
      });

      toast({
        title: '✅ Arquivo carregado',
        description: `${dadosProcessados.length} registros encontrados. Visualize o preview antes de importar.`
      });

      return dadosProcessados;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setState(prev => ({
        ...prev,
        arquivoSelecionado: null,
        dadosPreview: [],
        etapaAtual: `Erro: ${errorMessage}`
      }));

      toast({
        title: '❌ Erro ao processar arquivo',
        description: errorMessage,
        variant: 'destructive'
      });

      logger.error('Erro ao processar arquivo', { error, arquivo: arquivo.name });
      throw error;
    }
  };

  const executarImportacao = async (
    dadosCompletos: EntregadorImport[], 
    empresaId: string,
    allowedEmpresaIds: string[]
  ) => {
    try {
      setState(prev => ({ 
        ...prev, 
        processando: true, 
        progresso: 0, 
        etapaAtual: 'Iniciando importação...' 
      }));

      // Simular progresso durante a importação
      const intervalProgresso = setInterval(() => {
        setState(prev => ({
          ...prev,
          progresso: Math.min(prev.progresso + Math.random() * 15, 90)
        }));
      }, 1000);

      const resultado = await importacaoService.processarLote(
        dadosCompletos, 
        empresaId, 
        allowedEmpresaIds
      );

      clearInterval(intervalProgresso);

      setState(prev => ({
        ...prev,
        processando: false,
        resultado,
        progresso: 100,
        etapaAtual: 'Importação concluída!'
      }));

      // Toast de resultado
      const totalProcessados = resultado.sucesso.length + resultado.erros.length + resultado.duplicados.length;
      
      if (resultado.sucesso.length === totalProcessados) {
        toast({
          title: '🎉 Importação bem-sucedida!',
          description: `${resultado.sucesso.length} entregadores importados com sucesso.`
        });
      } else {
        toast({
          title: '⚠️ Importação parcial',
          description: `${resultado.sucesso.length} sucessos, ${resultado.erros.length} erros, ${resultado.duplicados.length} duplicados.`
        });
      }

      logger.info('📊 Resultado da importação', {
        sucessos: resultado.sucesso.length,
        erros: resultado.erros.length,
        duplicados: resultado.duplicados.length,
        tempo: resultado.tempoProcessamento
      });

      return resultado;

    } catch (error) {
      setState(prev => ({
        ...prev,
        processando: false,
        progresso: 0,
        etapaAtual: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }));

      toast({
        title: '❌ Erro na importação',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });

      logger.error('Erro na importação', { error });
      throw error;
    }
  };

  const gerarTemplateExcel = () => {
    try {
      const template = [
        ['Nome', 'Email', 'Telefone', 'CPF', 'Cidade', 'Senha', 'Perfil', 'Status', 'Observacoes'],
        ['João Silva', 'joao@email.com', '11999999999', '12345678901', 'São Paulo', 'joao123456', 'entregador', 'pendente', 'Entregador experiente'],
        ['Maria Santos', 'maria@email.com', '11888888888', '98765432109', 'Rio de Janeiro', 'maria654321', 'entregador', 'pendente', '']
      ];

      const ws = XLSX.utils.aoa_to_sheet(template);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Entregadores');

      // Adicionar larguras das colunas
      ws['!cols'] = [
        { wch: 20 }, // Nome
        { wch: 25 }, // Email
        { wch: 15 }, // Telefone
        { wch: 15 }, // CPF
        { wch: 20 }, // Cidade
        { wch: 15 }, // Senha
        { wch: 12 }, // Perfil
        { wch: 12 }, // Status
        { wch: 30 }  // Observações
      ];

      XLSX.writeFile(wb, 'template-entregadores.xlsx');

      toast({
        title: '📥 Template baixado',
        description: 'Use este arquivo como modelo para importar entregadores. Agora inclui coluna de Senha.'
      });

      logger.info('📁 Template Excel gerado com coluna senha');

    } catch (error) {
      toast({
        title: '❌ Erro ao gerar template',
        description: 'Não foi possível gerar o arquivo template.',
        variant: 'destructive'
      });

      logger.error('Erro ao gerar template', { error });
    }
  };

  const limparState = () => {
    setState({
      arquivoSelecionado: null,
      dadosPreview: [],
      processando: false,
      resultado: null,
      progresso: 0,
      etapaAtual: ''
    });
  };

  const exportarRelatorio = (resultado: ProcessamentoResult) => {
    try {
      const sheets: { [key: string]: any[][] } = {};

      // Planilha de sucessos
      if (resultado.sucesso.length > 0) {
        sheets['Sucessos'] = [
          ['Linha', 'Nome', 'Email', 'Telefone', 'CPF', 'Cidade'],
          ...resultado.sucesso.map(item => [
            item.linha,
            item.nome,
            item.email,
            item.telefone,
            item.cpf,
            item.cidade
          ])
        ];
      }

      // Planilha de erros
      if (resultado.erros.length > 0) {
        sheets['Erros'] = [
          ['Linha', 'Campo', 'Erro', 'Valor'],
          ...resultado.erros.map(item => [
            item.linha,
            item.campo,
            item.erro,
            item.valor
          ])
        ];
      }

      // Planilha de duplicados
      if (resultado.duplicados.length > 0) {
        sheets['Duplicados'] = [
          ['Linha', 'Nome', 'Email', 'Motivo'],
          ...resultado.duplicados.map(item => [
            item.linha,
            item.nome,
            item.email,
            'Email já existe no sistema'
          ])
        ];
      }

      // Criar workbook
      const wb = XLSX.utils.book_new();
      Object.entries(sheets).forEach(([name, data]) => {
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, name);
      });

      const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
      XLSX.writeFile(wb, `relatorio-importacao-${timestamp}.xlsx`);

      toast({
        title: '📊 Relatório exportado',
        description: 'Relatório detalhado da importação foi baixado.'
      });

    } catch (error) {
      toast({
        title: '❌ Erro ao exportar relatório',
        description: 'Não foi possível gerar o relatório.',
        variant: 'destructive'
      });

      logger.error('Erro ao exportar relatório', { error });
    }
  };

  return {
    state,
    selecionarArquivo,
    executarImportacao,
    gerarTemplateExcel,
    limparState,
    exportarRelatorio
  };
}
