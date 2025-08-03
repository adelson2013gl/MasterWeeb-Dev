
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carregar variáveis de ambiente baseadas no mode
  const env = loadEnv(mode, process.cwd(), '');
  
  // Determinar o ambiente atual
  const isDevelopment = mode === 'development';
  const isStaging = mode === 'staging';
  const isProduction = mode === 'production';

  console.log(`🚀 Building for ${mode} environment`);
  console.log(`📊 Log level: ${env.VITE_LOG_LEVEL || 'info'}`);
  console.log(`🔒 Security: Console logs ${isProduction ? 'DISABLED' : 'ENABLED'}`);

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      isDevelopment && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      // Disponibilizar variáveis de ambiente globalmente
      __DEV__: isDevelopment,
      __STAGING__: isStaging,
      __PROD__: isProduction,
      __LOG_LEVEL__: JSON.stringify(env.VITE_LOG_LEVEL || 'info'),
      // Configurações específicas por ambiente
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    build: {
      // Otimizações baseadas no ambiente
      target: isProduction ? 'esnext' : 'es2015',
      minify: isProduction ? 'esbuild' : false,
      cssMinify: isProduction,
      sourcemap: !isProduction,
      rollupOptions: {
        output: {
          manualChunks: isProduction ? {
            // Separar vendor chunks apenas em produção
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
            supabase: ['@supabase/supabase-js'],
            query: ['@tanstack/react-query'],
          } : undefined,
        },
      },
      // Limite de warning baseado no ambiente
      chunkSizeWarningLimit: isProduction ? 500 : 1000,
    },
    // Otimizações de desenvolvimento
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@supabase/supabase-js',
        '@tanstack/react-query',
      ],
    },
    // Configurações específicas por ambiente
    ...(isDevelopment && {
      // Configurações específicas de desenvolvimento
      css: {
        devSourcemap: true
      }
    }),
    ...(isStaging && {
      // Configurações específicas de staging
      build: {
        ...{}, // configurações de staging se necessário
      }
    }),
    ...(isProduction && {
      // SEGURANÇA CRÍTICA: Configurações específicas de produção
      esbuild: {
        drop: ['console', 'debugger'], // Remove console.logs e debuggers
        legalComments: 'none', // Remove comentários que podem conter info sensível
      },
    })
  };
});
