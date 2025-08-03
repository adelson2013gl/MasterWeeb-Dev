
import { motion } from "framer-motion";
import { CalendarCheck, Shield, Users, Clock } from "lucide-react";

export function BrandingSection() {
  const features = [
    {
      icon: CalendarCheck,
      title: "Agendamento Inteligente",
      description: "Sistema automatizado para otimizar escalas de entregadores"
    },
    {
      icon: Shield,
      title: "Segurança Avançada",
      description: "Proteção de dados e controle de acesso completo"
    },
    {
      icon: Users,
      title: "Gestão Centralizada",
      description: "Controle total da sua equipe em uma plataforma"
    },
    {
      icon: Clock,
      title: "Eficiência 24/7",
      description: "Monitoramento e relatórios em tempo real"
    }
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-background">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative z-10 h-full flex flex-col justify-center p-8 lg:p-12 xl:p-16">
        {/* Logo and Main Title */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-gradient-to-r from-primary to-primary/80 p-3 rounded-2xl shadow-lg">
              <CalendarCheck className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl xl:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Slot Master
              </h1>
              <p className="text-muted-foreground text-lg">
                Sistema de Agendamento Inteligente
              </p>
            </div>
          </div>
          
          <motion.h2 
            className="text-2xl xl:text-3xl font-semibold text-foreground mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Revolucione a gestão dos seus entregadores
          </motion.h2>
          
          <motion.p 
            className="text-lg text-muted-foreground leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Plataforma completa para otimizar escalas, aumentar eficiência e 
            proporcionar melhor experiência para sua equipe de entregadores.
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          className="grid grid-cols-1 xl:grid-cols-2 gap-6"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="flex items-start space-x-4 p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 hover:bg-background/70 transition-all duration-300"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Stats */}
        <motion.div 
          className="mt-8 pt-8 border-t border-border/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Suporte</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">+500</div>
              <div className="text-sm text-muted-foreground">Empresas</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
