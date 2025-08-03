
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, ExternalLink, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface URLAcessoEmpresaProps {
  nomeEmpresa: string;
}

export function URLAcessoEmpresa({ nomeEmpresa }: URLAcessoEmpresaProps) {
  const [copiado, setCopiado] = useState(false);
  
  // Função para normalizar texto (mesma usada na busca)
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplos
      .trim();
  };

  // Converter nome da empresa para slug (formato URL amigável)
  const empresaSlug = normalizeText(nomeEmpresa);
  const urlAcesso = `${window.location.origin}/acesso/${empresaSlug}`;

  const copiarURL = async () => {
    try {
      await navigator.clipboard.writeText(urlAcesso);
      setCopiado(true);
      toast.success('URL copiada para a área de transferência!');
      
      logger.info('URL de acesso copiada', { 
        empresa: nomeEmpresa,
        slug: empresaSlug,
        url: urlAcesso 
      }, 'URL_ACESSO');
      
      setTimeout(() => {
        setCopiado(false);
      }, 2000);
    } catch (error) {
      logger.error('Erro ao copiar URL', { error, url: urlAcesso }, 'URL_ACESSO');
      toast.error('Erro ao copiar URL');
    }
  };

  const abrirURL = () => {
    logger.info('Abrindo URL de acesso', { 
      empresa: nomeEmpresa,
      slug: empresaSlug,
      url: urlAcesso 
    }, 'URL_ACESSO');
    window.open(urlAcesso, '_blank');
  };

  const testarURL = async () => {
    try {
      logger.info('Testando URL de acesso', { url: urlAcesso }, 'URL_ACESSO');
      
      // Simular teste básico da URL
      const response = await fetch(urlAcesso, { method: 'HEAD' });
      if (response.ok) {
        toast.success('URL testada com sucesso!');
        logger.info('URL de acesso válida', { url: urlAcesso }, 'URL_ACESSO');
      } else {
        toast.warning('URL pode não estar funcionando corretamente');
        logger.warn('URL de acesso com problemas', { 
          url: urlAcesso, 
          status: response.status 
        }, 'URL_ACESSO');
      }
    } catch (error) {
      logger.error('Erro ao testar URL', { error, url: urlAcesso }, 'URL_ACESSO');
      toast.error('Erro ao testar URL');
    }
  };

  // Verificar se o slug pode causar problemas
  const isSlugProblematico = empresaSlug.length < 3 || empresaSlug.includes('--') || 
                             empresaSlug.startsWith('-') || empresaSlug.endsWith('-');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          URL de Acesso da Empresa
        </CardTitle>
        <CardDescription>
          Compartilhe este link com os usuários da empresa para que façam login diretamente no ambiente dela.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="url-acesso">URL de Acesso</Label>
          <div className="flex gap-2">
            <Input
              id="url-acesso"
              value={urlAcesso}
              readOnly
              className="flex-1 bg-gray-50 dark:bg-gray-800"
            />
            <Button
              onClick={copiarURL}
              variant="outline"
              size="icon"
              className="shrink-0"
              title="Copiar URL"
            >
              {copiado ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              onClick={abrirURL}
              variant="outline"
              size="icon"
              className="shrink-0"
              title="Abrir URL em nova aba"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              onClick={testarURL}
              variant="outline"
              size="sm"
              className="shrink-0"
              title="Testar URL"
            >
              Testar
            </Button>
          </div>
        </div>

        {isSlugProblematico && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                  Atenção: URL pode ser problemática
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  O nome da empresa "{nomeEmpresa}" gera um slug muito curto ou com caracteres problemáticos: "{empresaSlug}". 
                  Considere usar um nome mais descritivo para a empresa.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Como usar:
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Copie e compartilhe esta URL com os usuários da empresa</li>
            <li>• Eles acessarão diretamente o ambiente da {nomeEmpresa}</li>
            <li>• O login será direcionado automaticamente para esta empresa</li>
            <li>• Não é necessário selecionar empresa no login</li>
            <li>• Use o botão "Testar" para verificar se a URL está funcionando</li>
          </ul>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <strong>Slug gerado:</strong> {empresaSlug}
            <br />
            <strong>Nome original:</strong> {nomeEmpresa}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
