
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Mail, Phone, FileText } from 'lucide-react';
import { useEntregadorData } from '@/hooks/useEntregadorData';
import { maskCPF, formatPhone } from '@/lib/profileUtils';
import { Skeleton } from '@/components/ui/skeleton';

interface PerfilEntregadorProps {
  onBack: () => void;
}

export function PerfilEntregador({ onBack }: PerfilEntregadorProps) {
  const { entregador, loading, error } = useEntregadorData();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-3 mb-6">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !entregador) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-3 mb-6">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-500">
              <p>Erro ao carregar dados do perfil</p>
              <p className="text-sm text-gray-500 mt-2">
                Tente novamente mais tarde
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header com botão voltar */}
      <div className="flex items-center space-x-3 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="touch-target glass-card hover:glass-card-hover"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Meu Perfil
        </h1>
      </div>

      {/* Card principal com dados */}
      <Card className="glass-card border-glass">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                Dados Pessoais
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Suas informações cadastradas
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Nome */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nome Completo
              </p>
              <p className="text-gray-900 dark:text-gray-100 font-medium">
                {entregador.nome}
              </p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                E-mail
              </p>
              <p className="text-gray-900 dark:text-gray-100 font-medium">
                {entregador.email}
              </p>
            </div>
          </div>

          {/* Telefone */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Phone className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Telefone
              </p>
              <p className="text-gray-900 dark:text-gray-100 font-medium">
                {formatPhone(entregador.telefone || '')}
              </p>
            </div>
          </div>

          {/* CPF */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                CPF
              </p>
              <p className="text-gray-900 dark:text-gray-100 font-medium">
                {maskCPF(entregador.cpf)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informação de segurança */}
      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-[10px]">i</span>
        </div>
        <p>
          Seus dados são protegidos. O CPF é exibido parcialmente por segurança.
        </p>
      </div>
    </motion.div>
  );
}
