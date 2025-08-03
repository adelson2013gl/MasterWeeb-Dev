import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Download, FileText, Upload, Users, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useImportacaoEntregadores } from '@/hooks/useImportacaoEntregadores';
import { useAuth } from '@/hooks/useAuth';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { EntregadorImport } from '@/services/importacaoService';

interface ImportacaoEntregadoresProps {
  empresaId: string;
  onImportacaoConcluida?: () => void;
}

export function ImportacaoEntregadores({ empresaId, onImportacaoConcluida }: ImportacaoEntregadoresProps) {
  const { user } = useAuth();
  const { permissions } = useAdminPermissions();
  const {
    state,
    selecionarArquivo,
    executarImportacao,
    gerarTemplateExcel,
    limparState,
    exportarRelatorio
  } = useImportacaoEntregadores();

  const [dadosCompletos, setDadosCompletos] = useState<EntregadorImport[]>([]);
  const [modalPreviewAberto, setModalPreviewAberto] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const arquivo = acceptedFiles[0];
      try {
        const dados = await selecionarArquivo(arquivo);
        setDadosCompletos(dados);
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
      }
    }
  }, [selecionarArquivo]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    disabled: state.processando
  });

  const handleImportar = async () => {
    if (!dadosCompletos.length || !permissions?.allowedEmpresaIds.length) return;

    try {
      await executarImportacao(dadosCompletos, empresaId, permissions.allowedEmpresaIds);
      onImportacaoConcluida?.();
    } catch (error) {
      console.error('Erro na importação:', error);
    }
  };

  const handleLimpar = () => {
    limparState();
    setDadosCompletos([]);
    setModalPreviewAberto(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Importação em Massa</h2>
          <p className="text-gray-600">Importe múltiplos entregadores usando planilha Excel ou CSV</p>
        </div>
        <Button
          onClick={gerarTemplateExcel}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download size={16} />
          Baixar Template
        </Button>
      </div>

      {/* Zona de Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload size={20} />
            Upload de Arquivo
          </CardTitle>
          <CardDescription>
            Arraste um arquivo Excel (.xlsx, .xls) ou CSV ou clique para selecionar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
              ${state.processando ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <FileText size={24} className="text-gray-600" />
              </div>
              
              {isDragActive ? (
                <p className="text-blue-600 font-medium">Solte o arquivo aqui...</p>
              ) : (
                <div>
                  <p className="text-gray-900 font-medium">
                    Clique para selecionar ou arraste um arquivo
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Formatos aceitos: .xlsx, .xls, .csv (máx. 10MB)
                  </p>
                </div>
              )}
            </div>

            {state.arquivoSelecionado && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-green-800 font-medium">
                      {state.arquivoSelecionado.name}
                    </span>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLimpar();
                    }}
                    variant="ghost"
                    size="sm"
                  >
                    <X size={16} />
                  </Button>
                </div>
                <p className="text-green-700 text-sm mt-1">{state.etapaAtual}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview dos Dados */}
      {state.dadosPreview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={20} />
              Preview dos Dados
              <Badge variant="secondary">{dadosCompletos.length} registros</Badge>
            </CardTitle>
            <CardDescription>
              Visualização das primeiras 10 linhas. 
              <Dialog open={modalPreviewAberto} onOpenChange={setModalPreviewAberto}>
                <DialogTrigger asChild>
                  <Button variant="link" className="p-0 h-auto">
                    Ver todos os dados
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Todos os Dados do Arquivo</DialogTitle>
                    <DialogDescription>
                      {dadosCompletos.length} registros encontrados
                    </DialogDescription>
                  </DialogHeader>
                  <PreviewTable dados={dadosCompletos} />
                </DialogContent>
              </Dialog>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PreviewTable dados={state.dadosPreview} />
            
            <div className="flex gap-3 mt-4">
              <Button
                onClick={handleImportar}
                disabled={state.processando || dadosCompletos.length === 0}
                className="flex items-center gap-2"
              >
                <Upload size={16} />
                {state.processando ? 'Importando...' : `Importar ${dadosCompletos.length} Entregadores`}
              </Button>
              
              <Button
                onClick={handleLimpar}
                variant="outline"
                disabled={state.processando}
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progresso da Importação */}
      {state.processando && (
        <Card>
          <CardHeader>
            <CardTitle>Importando Entregadores</CardTitle>
            <CardDescription>{state.etapaAtual}</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={state.progresso} className="w-full" />
            <p className="text-sm text-gray-600 mt-2">
              {state.progresso.toFixed(0)}% concluído
            </p>
          </CardContent>
        </Card>
      )}

      {/* Resultado da Importação */}
      {state.resultado && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle size={20} className="text-green-600" />
              Resultado da Importação
            </CardTitle>
            <CardDescription>
              Processamento concluído em {(state.resultado.tempoProcessamento / 1000).toFixed(1)}s
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="resumo" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="resumo">Resumo</TabsTrigger>
                <TabsTrigger value="sucessos" className="text-green-700">
                  Sucessos ({state.resultado.sucesso.length})
                </TabsTrigger>
                <TabsTrigger value="erros" className="text-red-700">
                  Erros ({state.resultado.erros.length})
                </TabsTrigger>
                <TabsTrigger value="duplicados" className="text-yellow-700">
                  Duplicados ({state.resultado.duplicados.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="resumo" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={20} className="text-green-600" />
                      <span className="font-medium text-green-800">Sucessos</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900 mt-1">
                      {state.resultado.sucesso.length}
                    </p>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={20} className="text-red-600" />
                      <span className="font-medium text-red-800">Erros</span>
                    </div>
                    <p className="text-2xl font-bold text-red-900 mt-1">
                      {state.resultado.erros.length}
                    </p>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={20} className="text-yellow-600" />
                      <span className="font-medium text-yellow-800">Duplicados</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-900 mt-1">
                      {state.resultado.duplicados.length}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => exportarRelatorio(state.resultado)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download size={16} />
                  Exportar Relatório Detalhado
                </Button>
              </TabsContent>

              <TabsContent value="sucessos">
                {state.resultado.sucesso.length > 0 ? (
                  <PreviewTable dados={state.resultado.sucesso} />
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Nenhum sucesso</AlertTitle>
                    <AlertDescription>
                      Nenhum entregador foi importado com sucesso.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="erros">
                {state.resultado.erros.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Linha</TableHead>
                        <TableHead>Campo</TableHead>
                        <TableHead>Erro</TableHead>
                        <TableHead>Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {state.resultado.erros.map((erro, index) => (
                        <TableRow key={index}>
                          <TableCell>{erro.linha}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{erro.campo}</Badge>
                          </TableCell>
                          <TableCell className="text-red-600">{erro.erro}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {erro.valor || '(vazio)'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Nenhum erro!</AlertTitle>
                    <AlertDescription>
                      Todos os registros foram processados sem erros.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="duplicados">
                {state.resultado.duplicados.length > 0 ? (
                  <PreviewTable dados={state.resultado.duplicados} />
                ) : (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Nenhum duplicado!</AlertTitle>
                    <AlertDescription>
                      Não foram encontrados emails duplicados.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>Instruções</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Colunas Obrigatórias:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• <strong>Nome:</strong> Nome completo do entregador</li>
                <li>• <strong>Email:</strong> Email válido e único</li>
                <li>• <strong>Telefone:</strong> Telefone com DDD</li>
                <li>• <strong>CPF:</strong> CPF válido</li>
                <li>• <strong>Cidade:</strong> Nome da cidade</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Colunas Opcionais:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• <strong>Perfil:</strong> entregador ou admin</li>
                <li>• <strong>Status:</strong> pendente ou aprovado</li>
                <li>• <strong>Observacoes:</strong> Notas adicionais</li>
              </ul>
            </div>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Dica</AlertTitle>
            <AlertDescription>
              Baixe o template Excel para ter a estrutura correta e exemplos de dados.
              Os entregadores serão criados com senhas temporárias que devem ser alteradas no primeiro acesso.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente auxiliar para preview de dados
function PreviewTable({ dados }: { dados: EntregadorImport[] }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Linha</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>CPF</TableHead>
            <TableHead>Cidade</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dados.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="font-mono text-sm">{item.linha}</TableCell>
              <TableCell className="font-medium">{item.nome}</TableCell>
              <TableCell>{item.email}</TableCell>
              <TableCell>{item.telefone}</TableCell>
              <TableCell className="font-mono">{item.cpf}</TableCell>
              <TableCell>{item.cidade}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 