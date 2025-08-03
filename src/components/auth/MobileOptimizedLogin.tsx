import React from 'react';
import { motion } from 'framer-motion';
import { ModernLoginForm } from './ModernLoginForm';

export function MobileOptimizedLogin() {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900">
      {/* Mobile-specific optimizations */}
      <div className="safe-area-inset">
        {/* Status bar spacing */}
        <div className="h-safe-top" />
        
        {/* Main content with proper mobile spacing */}
        <div className="px-4 py-6">
          <ModernLoginForm />
        </div>
        
        {/* Bottom safe area */}
        <div className="h-safe-bottom" />
      </div>
    </div>
  );
}