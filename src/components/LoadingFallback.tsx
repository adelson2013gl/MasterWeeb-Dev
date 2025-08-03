
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface LoadingFallbackProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingFallback({ 
  message = "Carregando...", 
  fullScreen = false 
}: LoadingFallbackProps) {
  const containerClasses = fullScreen 
    ? "min-h-screen flex items-center justify-center"
    : "flex items-center justify-center p-8";

  return (
    <div className={containerClasses}>
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground text-center">
            {message}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function PageLoadingFallback() {
  return <LoadingFallback message="Carregando página..." fullScreen />;
}

export function ComponentLoadingFallback() {
  return <LoadingFallback message="Carregando componente..." />;
}
