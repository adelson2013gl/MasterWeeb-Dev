
import { useState } from "react";
import { motion } from "framer-motion";
import { AuthenticatedApp } from "@/components/AuthenticatedApp";
import { useAuth } from "@/hooks/useAuth";
import { FullScreenLayout } from "@/components/auth/FullScreenLayout";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center px-responsive safe-area">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground text-responsive-base">Carregando...</p>
        </motion.div>
      </div>
    );
  }

  if (user) {
    return <AuthenticatedApp />;
  }

  return <FullScreenLayout />;
};

export default Index;
