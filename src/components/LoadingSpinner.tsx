import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  text = "Chargement...", 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <Loader2 className={`${sizeClasses[size]} animate-spin`} />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
};

export default LoadingSpinner; 