
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarCheck } from "lucide-react";
import { RealLoginForm } from "@/components/RealLoginForm";
import { ModernLoginForm } from "@/components/auth/ModernLoginForm";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/types/database";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

type Empresa = Database['public']['Tables']['empresas']['Row'] & {
  plano: 'basico' | 'pro' | 'enterprise';
  status: 'ativo' | 'suspenso' | 'cancelado';
};

export default function AcessoEmpresa() {
  const { empresaSlug } = useParams<{ empresaSlug: string }>();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Função para normalizar texto (mesmo algoritmo usado na geração do slug)
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

  // Função para converter slug de volta para possíveis nomes
  const slugToSearchTerms = (slug: string): string[] => {
    // Converter hífens para espaços e gerar variações
    const baseSearch = slug.replace(/-/g, ' ');
    const variations = [
      baseSearch,
      baseSearch.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '), // Title Case
      baseSearch.toUpperCase(), // Upper Case
      slug, // Manter slug original também
    ];
    
    return [...new Set(variations)]; // Remove duplicatas
  };

  useEffect(() => {
    const buscarEmpresa = async () => {
      if (!empresaSlug) {
        logger.warn('Slug da empresa não fornecido', {}, 'ACESSO_EMPRESA');
        setNotFound(true);
        setLoading(false);
        return;
      }
      try {
        logger.info('Iniciando busca por empresa', { slug: empresaSlug, url: window.location.href }, 'ACESSO_EMPRESA');
        const { data, error } = await supabase
          .from('empresas')
          .select('*')
          .eq('slug', empresaSlug)
          .eq('ativa', true)
          .maybeSingle();
        if (error || !data) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setEmpresa({
          ...data,
          plano: data.plano as 'basico' | 'pro' | 'enterprise',
          status: data.status as 'ativo' | 'suspenso' | 'cancelado',
        });
        localStorage.setItem('empresa_acesso_id', data.id);
        setLoading(false);


      } catch (error) {
        console.error('Erro inesperado ao buscar empresa:', error);
        logger.error('Erro inesperado ao buscar empresa', { 
          error,
          slug: empresaSlug 
        }, 'ACESSO_EMPRESA');
        toast.error('Erro ao carregar página da empresa');
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    buscarEmpresa();
  }, [empresaSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center px-4">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </motion.div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center px-4">
        <motion.div 
          className="text-center max-w-md"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-red-100 dark:bg-red-900 p-6 rounded-lg">
            <h1 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-2">
              Empresa não encontrada
            </h1>
            <p className="text-red-600 dark:text-red-300">
              A empresa "{empresaSlug}" não foi encontrada ou está inativa.
            </p>
            <p className="text-sm text-red-500 dark:text-red-400 mt-2">
              Verifique o link fornecido ou entre em contato com o administrador.
            </p>
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs text-left">
              <p className="font-semibold mb-1">Debug Info:</p>
              <p>Slug recebido: {empresaSlug}</p>
              <p>Abra o console do navegador para mais detalhes</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      {/* Header */}
      <motion.header 
        className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2.5 rounded-xl shadow-lg">
                <CalendarCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {empresa?.nome}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sistema de Agendamento
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Login Section - Modern Design */}
      <div className="min-h-[calc(100vh-80px)]">
        <ModernLoginForm />
      </div>
    </div>
  );
}
