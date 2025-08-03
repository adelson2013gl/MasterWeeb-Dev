import { Download, Smartphone } from 'lucide-react';
import { Button } from './ui/button';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { cn } from '../lib/utils';

interface InstallButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
}

export const InstallButton = ({ 
  className, 
  variant = 'default', 
  size = 'default',
  showText = true 
}: InstallButtonProps) => {
  const { canInstall, isIOSDevice, handleInstall, isInstalled } = useInstallPrompt();

  // Não mostrar o botão se não puder instalar ou já estiver instalado
  if (!canInstall || isInstalled) {
    return null;
  }

  const buttonText = isIOSDevice 
    ? 'Adicionar à Tela Inicial'
    : 'Instalar App';

  const Icon = isIOSDevice ? Smartphone : Download;

  return (
    <Button
      onClick={handleInstall}
      variant={variant}
      size={size}
      className={cn(
        'install-button transition-all duration-200 hover:scale-105',
        className
      )}
      title={buttonText}
    >
      <Icon className="h-4 w-4" />
      {showText && size !== 'icon' && (
        <span className="ml-2">{buttonText}</span>
      )}
    </Button>
  );
};

export default InstallButton;