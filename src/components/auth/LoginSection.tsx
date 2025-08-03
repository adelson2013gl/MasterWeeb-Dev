
import React from 'react';
import { motion } from 'framer-motion';
import { SimpleLoginForm } from './SimpleLoginForm';
import { ModernLoginForm } from './ModernLoginForm';
import { CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarCheck } from 'lucide-react';

export function LoginSection() {
  // Use ModernLoginForm for enhanced experience
  const useModernDesign = true;
  
  if (useModernDesign) {
    return <ModernLoginForm />;
  }
  
  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20"
      >
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="bg-gradient-to-r from-primary to-primary/80 p-3 rounded-2xl shadow-lg">
              <CalendarCheck className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Slot Master
              </h1>
              <p className="text-muted-foreground text-sm">
                Sistema de Agendamento Inteligente
              </p>
            </div>
          </div>
          
          <CardTitle className="text-2xl font-bold mb-2">
            Entrar
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Entre com seu email e senha
          </CardDescription>
        </div>

        <SimpleLoginForm />
      </motion.div>
    </div>
  );
}
